namespace TrivAi.Api.DataStructures;

public sealed class Answer
{
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}
