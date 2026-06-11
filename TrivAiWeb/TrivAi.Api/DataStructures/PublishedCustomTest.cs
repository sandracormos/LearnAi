namespace TrivAi.Api.DataStructures;

public sealed class PublishedCustomTest
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Visibility { get; set; } = "Private";
    public string Status { get; set; } = "published";
    public List<PublishedCustomTestQuestion> Questions { get; set; } = [];
    public string AuthorId { get; set; } = string.Empty;
    public string AuthorName { get; set; } = "Player";
    public DateTimeOffset? UpdatedAt { get; set; }
    public DateTimeOffset? PublishedAt { get; set; }
}
