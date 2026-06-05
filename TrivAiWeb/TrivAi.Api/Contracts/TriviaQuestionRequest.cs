namespace TrivAi.Api.Contracts;

public sealed record TriviaQuestionRequest(
    string Categories,
    string Difficulty,
    IReadOnlyList<string>? PreviousQuestions = null,
    string? OpenAiPreviousResponseId = null);
