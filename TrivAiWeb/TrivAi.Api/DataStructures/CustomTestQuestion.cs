namespace TrivAi.Api.DataStructures;

public sealed class CustomTestQuestion
{
    public string Prompt { get; set; } = string.Empty;
    public List<string> Answers { get; set; } = [];
    public int CorrectAnswer { get; set; }
}
