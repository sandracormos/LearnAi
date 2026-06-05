using System.Text.Json.Nodes;

namespace TrivAi.Api.OpenAi;

public static class OpenAiResponseParser
{
    public static string ExtractOutputText(string responseText)
    {
        var root = JsonNode.Parse(responseText)
            ?? throw new InvalidOperationException("OpenAI returned invalid JSON.");

        var textNodes = root["output"]?.AsArray()
            .SelectMany(output => output?["content"]?.AsArray() ?? [])
            .Where(content => string.Equals(content?["type"]?.GetValue<string>(), "output_text", StringComparison.Ordinal))
            .Select(content => content?["text"]?.GetValue<string>())
            .Where(text => !string.IsNullOrWhiteSpace(text))
            .ToList();

        return textNodes is { Count: > 0 }
            ? textNodes[0]!
            : throw new InvalidOperationException("OpenAI response did not contain output text.");
    }

    public static string ExtractResponseId(string responseText)
    {
        var root = JsonNode.Parse(responseText)
            ?? throw new InvalidOperationException("OpenAI returned invalid JSON.");

        return root["id"]?.GetValue<string>()
            ?? throw new InvalidOperationException("OpenAI response did not contain a response id.");
    }
}
