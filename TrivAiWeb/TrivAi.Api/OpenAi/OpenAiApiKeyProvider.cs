using Microsoft.Extensions.Options;

namespace TrivAi.Api.OpenAi;

public sealed class OpenAiApiKeyProvider
{
    private readonly OpenAiOptions options;

    public OpenAiApiKeyProvider(IOptions<OpenAiOptions> options)
    {
        this.options = options.Value;
    }

    public string GetApiKey()
    {
        var apiKey = options.ApiKey;
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? string.Empty;
        }

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException(
                "OpenAI API key is missing. Set OPENAI_API_KEY or OpenAI:ApiKey in appsettings.Development.json.");
        }

        return apiKey;
    }
}
