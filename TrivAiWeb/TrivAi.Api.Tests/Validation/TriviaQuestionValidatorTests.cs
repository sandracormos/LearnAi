using TrivAi.Api.DataStructures;
using TrivAi.Api.Validation;

namespace TrivAi.Api.Tests.Validation;

public class TriviaQuestionValidatorTests
{
    [Fact]
    public void Validate_WithValidQuestion_DoesNotThrow()
    {
        var question = CreateValidQuestion();

        TriviaQuestionValidator.Validate(question);
    }

    [Fact]
    public void Validate_WithoutQuestionText_ThrowsException()
    {
        var question = CreateValidQuestion();
        question.QuestionName = " ";

        var exception = Assert.Throws<InvalidOperationException>(
            () => TriviaQuestionValidator.Validate(question));

        Assert.Equal("OpenAI returned a question without text.", exception.Message);
    }

    [Fact]
    public void Validate_WithoutExactlyFourAnswers_ThrowsException()
    {
        var question = CreateValidQuestion();
        question.Answers.RemoveAt(0);

        var exception = Assert.Throws<InvalidOperationException>(
            () => TriviaQuestionValidator.Validate(question));

        Assert.Equal("OpenAI returned a question without exactly 4 answers.", exception.Message);
    }

    [Fact]
    public void Validate_WithMultipleCorrectAnswers_ThrowsException()
    {
        var question = CreateValidQuestion();
        question.Answers[1].IsCorrect = true;

        var exception = Assert.Throws<InvalidOperationException>(
            () => TriviaQuestionValidator.Validate(question));

        Assert.Equal("OpenAI returned a question without exactly one correct answer.", exception.Message);
    }

    private static Question CreateValidQuestion()
    {
        return new Question
        {
            QuestionName = "What is the capital of Romania?",
            Answers =
            [
                new Answer { Text = "Bucharest", IsCorrect = true },
                new Answer { Text = "Paris" },
                new Answer { Text = "London" },
                new Answer { Text = "Madrid" }
            ]
        };
    }
}
