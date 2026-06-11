using TrivAi.Api.DataStructures;
using TrivAi.Api.Firebase;
using TrivAi.Api.Contracts;

namespace TrivAi.Api.Services;

public interface ICustomTestService
{
    Task<CustomTest> SaveAsync(FirebaseUser user, CustomTest test, CancellationToken cancellationToken);
    Task<IReadOnlyList<CustomTest>> GetOwnedAsync(FirebaseUser user, CancellationToken cancellationToken);
    Task<IReadOnlyList<PublishedCustomTest>> GetPublishedAsync(FirebaseUser user, CancellationToken cancellationToken);
    Task<CustomTestAnswerResult> CheckAnswerAsync(
        FirebaseUser user,
        string testId,
        CustomTestAnswerRequest answer,
        CancellationToken cancellationToken);
    Task DeleteAsync(FirebaseUser user, string testId, CancellationToken cancellationToken);
}
