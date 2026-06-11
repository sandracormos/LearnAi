using System.Text;
using System.Text.Json;

namespace TrivAi.Api.Firebase;

public static class FirebaseUserReader
{
    public static FirebaseUser? Read(HttpRequest request)
    {
        var authorization = request.Headers.Authorization.ToString();
        if (!authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var token = authorization["Bearer ".Length..].Trim();
        var parts = token.Split('.');
        if (parts.Length != 3)
        {
            return null;
        }

        try
        {
            var payload = parts[1].Replace('-', '+').Replace('_', '/');
            payload = payload.PadRight(payload.Length + (4 - payload.Length % 4) % 4, '=');
            using var json = JsonDocument.Parse(Encoding.UTF8.GetString(Convert.FromBase64String(payload)));
            var root = json.RootElement;
            var uid = root.TryGetProperty("sub", out var sub) ? sub.GetString() : null;
            if (string.IsNullOrWhiteSpace(uid))
            {
                return null;
            }

            var displayName = root.TryGetProperty("name", out var name) ? name.GetString() : null;
            var email = root.TryGetProperty("email", out var emailElement) ? emailElement.GetString() : null;
            displayName ??= email?.Split('@')[0] ?? "Player";

            return new FirebaseUser(token, uid, displayName);
        }
        catch (FormatException)
        {
            return null;
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
