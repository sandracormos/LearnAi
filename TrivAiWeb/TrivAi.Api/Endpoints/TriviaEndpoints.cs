using TrivAi.Api.Contracts;
using TrivAi.Api.Services;

namespace TrivAi.Api.Endpoints;

public static class TriviaEndpoints
{
    public static IEndpointRouteBuilder MapTriviaEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/trivia/question", GenerateTriviaQuestionAsync);

        return app;
    }

    private static async Task<IResult> GenerateTriviaQuestionAsync(
        TriviaQuestionRequest request,
        ITriviaQuestionService trivia,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Categories))
        {
            return Results.BadRequest(new ApiError("Choose or enter at least one category."));
        }

        if (string.IsNullOrWhiteSpace(request.Difficulty))
        {
            return Results.BadRequest(new ApiError("Choose a difficulty."));
        }

        try
        {
            var question = await trivia.GenerateQuestionAsync(request, cancellationToken);
            return Results.Ok(question);
        }
        catch (InvalidOperationException ex)
        {
            return Results.Problem(ex.Message, statusCode: StatusCodes.Status500InternalServerError);
        }
        catch (HttpRequestException ex)
        {
            return Results.Problem($"OpenAI request failed: {ex.Message}", statusCode: StatusCodes.Status502BadGateway);
        }
    }
}
