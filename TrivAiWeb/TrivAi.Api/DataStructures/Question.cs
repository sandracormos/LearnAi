namespace TrivAi.Api.DataStructures;

public class Question
{
    public int Id { get; set; }
    public string QuestionName { get; set; } = string.Empty;
    public List<Answer> Answers { get; set; } = [];
    public string TipForAnsweringQuestion { get; set; } = string.Empty;

    public override bool Equals(object? obj)
    {
        if (obj is not Question other)
        {
            return false;
        }

        return string.Equals(QuestionName, other.QuestionName, StringComparison.Ordinal);
    }

    public override int GetHashCode()
    {
        return QuestionName?.GetHashCode(StringComparison.Ordinal) ?? 0;
    }
}
