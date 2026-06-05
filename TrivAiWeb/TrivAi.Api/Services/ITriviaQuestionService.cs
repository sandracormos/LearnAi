using TrivAi.Api.Contracts;

namespace TrivAi.Api.Services;

public interface ITriviaQuestionService
{
    Task<TriviaQuestionResponse> GenerateQuestionAsync(
        TriviaQuestionRequest request,
        CancellationToken cancellationToken);
}
