using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.DataProtection;
using TrivAi.Api.Contracts;
using TrivAi.Api.DataStructures;
using TrivAi.Api.Services;

namespace TrivAi.Api.Firebase;

public sealed class FirestoreCustomTestService : ICustomTestService
{
    private readonly HttpClient httpClient;
    private readonly string documentsUrl;
    private readonly IDataProtector answerProtector;

    public FirestoreCustomTestService(
        HttpClient httpClient,
        IOptions<FirebaseOptions> options,
        IDataProtectionProvider dataProtectionProvider)
    {
        this.httpClient = httpClient;
        documentsUrl = $"https://firestore.googleapis.com/v1/projects/{options.Value.ProjectId}/databases/(default)/documents";
        answerProtector = dataProtectionProvider.CreateProtector("TrivAi.CustomTestAnswers.v1");
    }

    public async Task<CustomTest> SaveAsync(FirebaseUser user, CustomTest test, CancellationToken cancellationToken)
    {
        test.Id = string.IsNullOrWhiteSpace(test.Id) ? Guid.NewGuid().ToString("N") : test.Id;
        test.Status = test.Status == "published" ? "published" : "draft";
        test.AuthorId = user.Uid;
        test.AuthorName = user.DisplayName;
        test.UpdatedAt = DateTimeOffset.UtcNow;
        if (test.Status == "published")
        {
            test.PublishedAt ??= test.UpdatedAt;
        }

        await PutDocumentAsync(user, $"users/{user.Uid}/customTests/{test.Id}", test, false, cancellationToken);

        if (test.Status == "published")
        {
            await PutPublishedDocumentAsync(user, test, cancellationToken);
        }
        else
        {
            await DeleteDocumentAsync(user, $"publishedTests/{test.Id}", true, cancellationToken);
        }

        return test;
    }

    public Task<IReadOnlyList<CustomTest>> GetOwnedAsync(FirebaseUser user, CancellationToken cancellationToken) =>
        ListDocumentsAsync(user, $"users/{user.Uid}/customTests", cancellationToken);

    public async Task<IReadOnlyList<PublishedCustomTest>> GetPublishedAsync(FirebaseUser user, CancellationToken cancellationToken)
    {
        var publicTests = await RunPublishedQueryAsync(user, "visibility", "Public", cancellationToken);
        var ownTests = await RunPublishedQueryAsync(user, "authorId", user.Uid, cancellationToken);

        return publicTests
            .Concat(ownTests)
            .GroupBy(test => test.Id)
            .Select(group => group.First())
            .OrderByDescending(test => test.UpdatedAt)
            .ToArray();
    }

    public async Task<CustomTestAnswerResult> CheckAnswerAsync(
        FirebaseUser user,
        string testId,
        CustomTestAnswerRequest answer,
        CancellationToken cancellationToken)
    {
        using var request = CreateRequest(user, HttpMethod.Get, $"{documentsUrl}/publishedTests/{testId}");
        using var response = await httpClient.SendAsync(request, cancellationToken);
        await EnsureSuccessAsync(response, cancellationToken);
        var document = JsonNode.Parse(await response.Content.ReadAsStringAsync(cancellationToken))!;
        var fields = document["fields"]!;
        var protectedAnswerKey = GetString(fields, "answerKey");
        var answerKey = JsonSerializer.Deserialize<int[]>(answerProtector.Unprotect(protectedAnswerKey)) ?? [];

        if (answer.QuestionIndex >= answerKey.Length)
        {
            throw new InvalidOperationException("Question index is outside the published test.");
        }

        return new CustomTestAnswerResult(answerKey[answer.QuestionIndex] == answer.AnswerIndex);
    }

    public async Task DeleteAsync(FirebaseUser user, string testId, CancellationToken cancellationToken)
    {
        await DeleteDocumentAsync(user, $"users/{user.Uid}/customTests/{testId}", false, cancellationToken);
        await DeleteDocumentAsync(user, $"publishedTests/{testId}", true, cancellationToken);
    }

    private async Task PutDocumentAsync(
        FirebaseUser user,
        string path,
        CustomTest test,
        bool includeAuthor,
        CancellationToken cancellationToken)
    {
        using var request = CreateRequest(user, HttpMethod.Patch, $"{documentsUrl}/{path}");
        request.Content = JsonContent.Create(ToDocument(test, includeAuthor));
        using var response = await httpClient.SendAsync(request, cancellationToken);
        await EnsureSuccessAsync(response, cancellationToken);
    }

    private async Task PutPublishedDocumentAsync(
        FirebaseUser user,
        CustomTest test,
        CancellationToken cancellationToken)
    {
        using var request = CreateRequest(user, HttpMethod.Patch, $"{documentsUrl}/publishedTests/{test.Id}");
        request.Content = JsonContent.Create(ToPublishedDocument(test));
        using var response = await httpClient.SendAsync(request, cancellationToken);
        await EnsureSuccessAsync(response, cancellationToken);
    }

    private async Task<IReadOnlyList<CustomTest>> ListDocumentsAsync(
        FirebaseUser user,
        string path,
        CancellationToken cancellationToken)
    {
        using var request = CreateRequest(user, HttpMethod.Get, $"{documentsUrl}/{path}?orderBy=updatedAt%20desc");
        using var response = await httpClient.SendAsync(request, cancellationToken);
        await EnsureSuccessAsync(response, cancellationToken);
        var root = JsonNode.Parse(await response.Content.ReadAsStringAsync(cancellationToken));

        return root?["documents"]?.AsArray()
            .Select(node => FromDocument(node!))
            .ToArray() ?? [];
    }

    private async Task<IReadOnlyList<PublishedCustomTest>> RunPublishedQueryAsync(
        FirebaseUser user,
        string field,
        string value,
        CancellationToken cancellationToken)
    {
        var query = new JsonObject
        {
            ["structuredQuery"] = new JsonObject
            {
                ["from"] = new JsonArray(new JsonObject { ["collectionId"] = "publishedTests" }),
                ["where"] = new JsonObject
                {
                    ["fieldFilter"] = new JsonObject
                    {
                        ["field"] = new JsonObject { ["fieldPath"] = field },
                        ["op"] = "EQUAL",
                        ["value"] = StringValue(value)
                    }
                }
            }
        };

        using var request = CreateRequest(user, HttpMethod.Post, $"{documentsUrl}:runQuery");
        request.Content = JsonContent.Create(query);
        using var response = await httpClient.SendAsync(request, cancellationToken);
        await EnsureSuccessAsync(response, cancellationToken);
        var root = JsonNode.Parse(await response.Content.ReadAsStringAsync(cancellationToken))?.AsArray();

        return root?
            .Where(item => item?["document"] is not null)
            .Select(item => FromPublishedDocument(item!["document"]!))
            .ToArray() ?? [];
    }

    private async Task DeleteDocumentAsync(
        FirebaseUser user,
        string path,
        bool ignoreNotFound,
        CancellationToken cancellationToken)
    {
        using var request = CreateRequest(user, HttpMethod.Delete, $"{documentsUrl}/{path}");
        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (ignoreNotFound && response.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return;
        }

        await EnsureSuccessAsync(response, cancellationToken);
    }

    private static HttpRequestMessage CreateRequest(FirebaseUser user, HttpMethod method, string url)
    {
        var request = new HttpRequestMessage(method, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", user.IdToken);
        return request;
    }

    private static JsonObject ToDocument(CustomTest test, bool includeAuthor)
    {
        var fields = new JsonObject
        {
            ["title"] = StringValue(test.Title),
            ["description"] = StringValue(test.Description),
            ["category"] = StringValue(test.Category),
            ["visibility"] = StringValue(test.Visibility),
            ["status"] = StringValue(test.Status),
            ["questions"] = new JsonObject
            {
                ["arrayValue"] = new JsonObject
                {
                    ["values"] = new JsonArray(test.Questions.Select(question =>
                        new JsonObject
                        {
                            ["mapValue"] = new JsonObject
                            {
                                ["fields"] = new JsonObject
                                {
                                    ["prompt"] = StringValue(question.Prompt),
                                    ["answers"] = new JsonObject
                                    {
                                        ["arrayValue"] = new JsonObject
                                        {
                                            ["values"] = new JsonArray(question.Answers.Select(StringValue).ToArray())
                                        }
                                    },
                                    ["correctAnswer"] = new JsonObject { ["integerValue"] = question.CorrectAnswer.ToString() }
                                }
                            }
                        }).ToArray())
                }
            },
            ["updatedAt"] = TimestampValue(test.UpdatedAt!.Value)
        };

        if (test.PublishedAt is not null)
        {
            fields["publishedAt"] = TimestampValue(test.PublishedAt.Value);
        }

        if (includeAuthor)
        {
            fields["authorId"] = StringValue(test.AuthorId ?? string.Empty);
            fields["authorName"] = StringValue(test.AuthorName ?? "Player");
        }

        return new JsonObject { ["fields"] = fields };
    }

    private JsonObject ToPublishedDocument(CustomTest test)
    {
        var document = ToDocument(test, true);
        var fields = document["fields"]!.AsObject();
        var questionValues = fields["questions"]!["arrayValue"]!["values"]!.AsArray();

        foreach (var value in questionValues)
        {
            value!["mapValue"]!["fields"]!.AsObject().Remove("correctAnswer");
        }

        var answerKey = test.Questions.Select(question => question.CorrectAnswer).ToArray();
        fields["answerKey"] = StringValue(answerProtector.Protect(JsonSerializer.Serialize(answerKey)));
        return document;
    }

    private static CustomTest FromDocument(JsonNode document)
    {
        var fields = document["fields"]!;
        var name = document["name"]?.GetValue<string>() ?? string.Empty;
        var questions = fields["questions"]?["arrayValue"]?["values"]?.AsArray()
            .Select(value =>
            {
                var questionFields = value!["mapValue"]!["fields"]!;
                return new CustomTestQuestion
                {
                    Prompt = GetString(questionFields, "prompt"),
                    Answers = questionFields["answers"]?["arrayValue"]?["values"]?.AsArray()
                        .Select(answer => answer?["stringValue"]?.GetValue<string>() ?? string.Empty)
                        .ToList() ?? [],
                    CorrectAnswer = int.TryParse(
                        questionFields["correctAnswer"]?["integerValue"]?.GetValue<string>(),
                        out var correctAnswer) ? correctAnswer : 0
                };
            })
            .ToList() ?? [];

        return new CustomTest
        {
            Id = name.Split('/').LastOrDefault() ?? string.Empty,
            Title = GetString(fields, "title"),
            Description = GetString(fields, "description"),
            Category = GetString(fields, "category"),
            Visibility = GetString(fields, "visibility", "Private"),
            Status = GetString(fields, "status", "draft"),
            Questions = questions,
            AuthorId = GetString(fields, "authorId"),
            AuthorName = GetString(fields, "authorName", "Player"),
            UpdatedAt = GetTimestamp(fields, "updatedAt"),
            PublishedAt = GetTimestamp(fields, "publishedAt")
        };
    }

    private static PublishedCustomTest FromPublishedDocument(JsonNode document)
    {
        var fields = document["fields"]!;
        var name = document["name"]?.GetValue<string>() ?? string.Empty;
        var questions = fields["questions"]?["arrayValue"]?["values"]?.AsArray()
            .Select(value =>
            {
                var questionFields = value!["mapValue"]!["fields"]!;
                return new PublishedCustomTestQuestion
                {
                    Prompt = GetString(questionFields, "prompt"),
                    Answers = questionFields["answers"]?["arrayValue"]?["values"]?.AsArray()
                        .Select(answer => answer?["stringValue"]?.GetValue<string>() ?? string.Empty)
                        .ToList() ?? []
                };
            })
            .ToList() ?? [];

        return new PublishedCustomTest
        {
            Id = name.Split('/').LastOrDefault() ?? string.Empty,
            Title = GetString(fields, "title"),
            Description = GetString(fields, "description"),
            Category = GetString(fields, "category"),
            Visibility = GetString(fields, "visibility", "Private"),
            Questions = questions,
            AuthorId = GetString(fields, "authorId"),
            AuthorName = GetString(fields, "authorName", "Player"),
            UpdatedAt = GetTimestamp(fields, "updatedAt"),
            PublishedAt = GetTimestamp(fields, "publishedAt")
        };
    }

    private static JsonObject StringValue(string value) => new() { ["stringValue"] = value };
    private static JsonObject TimestampValue(DateTimeOffset value) => new() { ["timestampValue"] = value.UtcDateTime };

    private static string GetString(JsonNode fields, string name, string fallback = "") =>
        fields[name]?["stringValue"]?.GetValue<string>() ?? fallback;

    private static DateTimeOffset? GetTimestamp(JsonNode fields, string name) =>
        DateTimeOffset.TryParse(fields[name]?["timestampValue"]?.GetValue<string>(), out var value) ? value : null;

    private static async Task EnsureSuccessAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        throw new HttpRequestException($"Firestore request failed ({(int)response.StatusCode}): {body}");
    }
}
