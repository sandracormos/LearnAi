using TrivAi.Api.DataStructures;

namespace TrivAi.Api.Contracts;

public sealed class TriviaQuestionResponse : Question
{
    public string? OpenAiPreviousResponseId { get; set; }
}
