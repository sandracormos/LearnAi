namespace TrivAi.Api.DataStructures;

public sealed class PublishedCustomTestQuestion
{
    public string Prompt { get; set; } = string.Empty;
    public List<string> Answers { get; set; } = [];
}
