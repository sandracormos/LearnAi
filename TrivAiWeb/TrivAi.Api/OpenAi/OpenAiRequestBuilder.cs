using System.Text.Json.Nodes;
using Microsoft.Extensions.Options;
using TrivAi.Api.Contracts;

namespace TrivAi.Api.OpenAi;

public sealed class OpenAiRequestBuilder
{
    private readonly OpenAiOptions options;

    public OpenAiRequestBuilder(IOptions<OpenAiOptions> options)
    {
        this.options = options.Value;
    }

    public JsonObject BuildTriviaQuestionRequest(TriviaQuestionRequest request)
    {
        var previous = request.PreviousQuestions is { Count: > 0 }
            ? string.Join("\n", request.PreviousQuestions.Take(10).Select(q => $"- {q}"))
            : "No previous questions.";

        var userPrompt = $"""
            Create exactly one trivia question in English.
            Categories: {request.Categories}
            Difficulty: {request.Difficulty}
            Already used questions:
            {previous}

            Rules:
            - exactly 4 answers
            - exactly one correct answer
            - avoid duplicate questions or questions too similar to the already used ones
            - also avoid questions already produced earlier in this OpenAI response chain
            - include a short hint without directly revealing the answer
            """;

        var payload = new JsonObject
        {
            ["model"] = options.Model,
            ["input"] = new JsonArray
            {
                new JsonObject
                {
                    ["role"] = "system",
                    ["content"] = "You are the question engine for TrivAI. Reply only with JSON that matches the schema."
                },
                new JsonObject
                {
                    ["role"] = "user",
                    ["content"] = userPrompt
                }
            },
            ["text"] = CreateJsonSchemaFormat()
        };

        if (!string.IsNullOrWhiteSpace(request.OpenAiPreviousResponseId))
        {
            payload["previous_response_id"] = request.OpenAiPreviousResponseId;
        }

        return payload;
    }

    private static JsonObject CreateJsonSchemaFormat()
    {
        return new JsonObject
        {
            ["format"] = new JsonObject
            {
                ["type"] = "json_schema",
                ["name"] = "trivia_question",
                ["strict"] = true,
                ["schema"] = new JsonObject
                {
                    ["type"] = "object",
                    ["additionalProperties"] = false,
                    ["required"] = new JsonArray
                    {
                        "questionName",
                        "answers",
                        "tipForAnsweringQuestion"
                    },
                    ["properties"] = new JsonObject
                    {
                        ["questionName"] = new JsonObject { ["type"] = "string" },
                        ["tipForAnsweringQuestion"] = new JsonObject { ["type"] = "string" },
                        ["answers"] = new JsonObject
                        {
                            ["type"] = "array",
                            ["minItems"] = 4,
                            ["maxItems"] = 4,
                            ["items"] = new JsonObject
                            {
                                ["type"] = "object",
                                ["additionalProperties"] = false,
                                ["required"] = new JsonArray { "text", "isCorrect" },
                                ["properties"] = new JsonObject
                                {
                                    ["text"] = new JsonObject { ["type"] = "string" },
                                    ["isCorrect"] = new JsonObject { ["type"] = "boolean" }
                                }
                            }
                        }
                    }
                }
            }
        };
    }
}
