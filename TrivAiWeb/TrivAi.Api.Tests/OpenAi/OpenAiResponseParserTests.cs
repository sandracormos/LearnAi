using TrivAi.Api.OpenAi;

namespace TrivAi.Api.Tests.OpenAi;

public class OpenAiResponseParserTests
{
    [Fact]
    public void ExtractOutputText_ReturnsFirstOutputText()
    {
        const string response = """
            {
              "output": [{
                "content": [{
                  "type": "output_text",
                  "text": "{\"questionName\":\"Test question\"}"
                }]
              }]
            }
            """;

        var result = OpenAiResponseParser.ExtractOutputText(response);

        Assert.Equal("{\"questionName\":\"Test question\"}", result);
    }

    [Fact]
    public void ExtractOutputText_WithoutOutputText_ThrowsException()
    {
        const string response = """{"output":[]}""";

        var exception = Assert.Throws<InvalidOperationException>(
            () => OpenAiResponseParser.ExtractOutputText(response));

        Assert.Equal("OpenAI response did not contain output text.", exception.Message);
    }

    [Fact]
    public void ExtractResponseId_ReturnsId()
    {
        const string response = """{"id":"response-123"}""";

        var result = OpenAiResponseParser.ExtractResponseId(response);

        Assert.Equal("response-123", result);
    }
}
