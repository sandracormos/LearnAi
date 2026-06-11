using TrivAi.Api.Contracts;
using TrivAi.Api.DataStructures;
using TrivAi.Api.Firebase;
using TrivAi.Api.Services;

namespace TrivAi.Api.Endpoints;

public static class CustomTestEndpoints
{
    public static IEndpointRouteBuilder MapCustomTestEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/custom-tests");
        group.MapGet("/", GetOwnedAsync);
        group.MapGet("/published", GetPublishedAsync);
        group.MapPost("/published/{testId}/answers", CheckAnswerAsync);
        group.MapPost("/", SaveAsync);
        group.MapDelete("/{testId}", DeleteAsync);

        return app;
    }

    private static async Task<IResult> SaveAsync(
        HttpRequest request,
        CustomTest test,
        ICustomTestService service,
        CancellationToken cancellationToken)
    {
        var user = FirebaseUserReader.Read(request);
        if (user is null)
        {
            return Results.Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(test.Title))
        {
            return Results.BadRequest(new ApiError("A custom test title is required."));
        }

        if (test.Questions.Count == 0)
        {
            return Results.BadRequest(new ApiError("A custom test must contain at least one question."));
        }

        if (test.Status == "published" && test.Questions.Any(question =>
                string.IsNullOrWhiteSpace(question.Prompt) ||
                question.Answers.Count == 0 ||
                question.Answers.Any(string.IsNullOrWhiteSpace) ||
                question.CorrectAnswer < 0 ||
                question.CorrectAnswer >= question.Answers.Count))
        {
            return Results.BadRequest(new ApiError("Every published question must have a prompt, answers, and a valid correct answer."));
        }

        return await ExecuteAsync(() => service.SaveAsync(user, test, cancellationToken));
    }

    private static async Task<IResult> GetOwnedAsync(
        HttpRequest request,
        ICustomTestService service,
        CancellationToken cancellationToken)
    {
        var user = FirebaseUserReader.Read(request);
        return user is null
            ? Results.Unauthorized()
            : await ExecuteAsync(() => service.GetOwnedAsync(user, cancellationToken));
    }

    private static async Task<IResult> GetPublishedAsync(
        HttpRequest request,
        ICustomTestService service,
        CancellationToken cancellationToken)
    {
        var user = FirebaseUserReader.Read(request);
        return user is null
            ? Results.Unauthorized()
            : await ExecuteAsync(() => service.GetPublishedAsync(user, cancellationToken));
    }

    private static async Task<IResult> DeleteAsync(
        HttpRequest request,
        string testId,
        ICustomTestService service,
        CancellationToken cancellationToken)
    {
        var user = FirebaseUserReader.Read(request);
        if (user is null)
        {
            return Results.Unauthorized();
        }

        try
        {
            await service.DeleteAsync(user, testId, cancellationToken);
            return Results.NoContent();
        }
        catch (HttpRequestException ex)
        {
            return Results.Problem(ex.Message, statusCode: StatusCodes.Status502BadGateway);
        }
    }

    private static async Task<IResult> CheckAnswerAsync(
        HttpRequest request,
        string testId,
        CustomTestAnswerRequest answer,
        ICustomTestService service,
        CancellationToken cancellationToken)
    {
        var user = FirebaseUserReader.Read(request);
        if (user is null)
        {
            return Results.Unauthorized();
        }

        if (answer.QuestionIndex < 0 || answer.AnswerIndex < 0)
        {
            return Results.BadRequest(new ApiError("Question and answer indexes must be valid."));
        }

        return await ExecuteAsync(() => service.CheckAnswerAsync(user, testId, answer, cancellationToken));
    }

    private static async Task<IResult> ExecuteAsync<T>(Func<Task<T>> action)
    {
        try
        {
            return Results.Ok(await action());
        }
        catch (HttpRequestException ex)
        {
            return Results.Problem(ex.Message, statusCode: StatusCodes.Status502BadGateway);
        }
    }
}
