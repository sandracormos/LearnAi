using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using TrivAi.Api.Contracts;
using TrivAi.Api.Services;
using TrivAi.Api.Validation;

namespace TrivAi.Api.OpenAi;

public sealed class OpenAiTriviaService : ITriviaQuestionService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient httpClient;
    private readonly OpenAiApiKeyProvider apiKeyProvider;
    private readonly OpenAiRequestBuilder requestBuilder;

    public OpenAiTriviaService(
        HttpClient httpClient,
        OpenAiApiKeyProvider apiKeyProvider,
        OpenAiRequestBuilder requestBuilder)
    {
        this.httpClient = httpClient;
        this.apiKeyProvider = apiKeyProvider;
        this.requestBuilder = requestBuilder;
    }

    public async Task<TriviaQuestionResponse> GenerateQuestionAsync(
        TriviaQuestionRequest request,
        CancellationToken cancellationToken)
    {
        using var message = CreateRequestMessage(request);
        using var response = await httpClient.SendAsync(message, cancellationToken);
        var responseText = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException($"{(int)response.StatusCode} {response.ReasonPhrase}: {responseText}");
        }

        var questionJson = OpenAiResponseParser.ExtractOutputText(responseText);
        var question = JsonSerializer.Deserialize<TriviaQuestionResponse>(questionJson, JsonOptions)
            ?? throw new InvalidOperationException("OpenAI returned an empty trivia question.");

        TriviaQuestionValidator.Validate(question);
        question.OpenAiPreviousResponseId = OpenAiResponseParser.ExtractResponseId(responseText);

        return question;
    }

    private HttpRequestMessage CreateRequestMessage(TriviaQuestionRequest request)
    {
        var payload = requestBuilder.BuildTriviaQuestionRequest(request);
        var message = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/responses");
        message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKeyProvider.GetApiKey());
        message.Content = new StringContent(payload.ToJsonString(), Encoding.UTF8, "application/json");

        return message;
    }
}
