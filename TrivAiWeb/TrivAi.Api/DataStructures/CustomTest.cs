namespace TrivAi.Api.DataStructures;

public sealed class CustomTest
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Visibility { get; set; } = "Private";
    public string Status { get; set; } = "draft";
    public List<CustomTestQuestion> Questions { get; set; } = [];
    public string? AuthorId { get; set; }
    public string? AuthorName { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public DateTimeOffset? PublishedAt { get; set; }
}
