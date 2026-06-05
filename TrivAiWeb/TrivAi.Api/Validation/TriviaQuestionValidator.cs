using TrivAi.Api.DataStructures;

namespace TrivAi.Api.Validation;

public static class TriviaQuestionValidator
{
    public static void Validate(Question question)
    {
        if (string.IsNullOrWhiteSpace(question.QuestionName))
        {
            throw new InvalidOperationException("OpenAI returned a question without text.");
        }

        if (question.Answers.Count != 4)
        {
            throw new InvalidOperationException("OpenAI returned a question without exactly 4 answers.");
        }

        if (question.Answers.Count(answer => answer.IsCorrect) != 1)
        {
            throw new InvalidOperationException("OpenAI returned a question without exactly one correct answer.");
        }
    }
}
