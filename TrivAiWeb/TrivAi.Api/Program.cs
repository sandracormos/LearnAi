using TrivAi.Api.Endpoints;
using TrivAi.Api.Firebase;
using TrivAi.Api.OpenAi;
using TrivAi.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<OpenAiOptions>(builder.Configuration.GetSection("OpenAI"));
builder.Services.Configure<FirebaseOptions>(builder.Configuration.GetSection("Firebase"));
builder.Services.AddSingleton<OpenAiApiKeyProvider>();
builder.Services.AddSingleton<OpenAiRequestBuilder>();
builder.Services.AddDataProtection();
builder.Services.AddHttpClient<ITriviaQuestionService, OpenAiTriviaService>();
builder.Services.AddHttpClient<ICustomTestService, FirestoreCustomTestService>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("ClientApp", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("ClientApp");

app.MapHealthEndpoints();
app.MapTriviaEndpoints();
app.MapCustomTestEndpoints();

app.Run();
