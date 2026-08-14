using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Services;
using BookKaroo.Domain.Entities;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Moq;

namespace BookKaroo.Tests;

public class CityServiceTests
{
    private static IMemoryCache CreateCache() => new MemoryCache(new MemoryCacheOptions());

    private static (CityService Service, Mock<ICityRepository> Repo) Create()
    {
        var repo = new Mock<ICityRepository>();
        var http = new Mock<System.Net.Http.IHttpClientFactory>();
        var svc = new CityService(repo.Object, http.Object, CreateCache());
        return (svc, repo);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsCitiesOrderedByName()
    {
        var (svc, repo) = Create();
        repo.Setup(r => r.GetActiveAsync(default)).ReturnsAsync(
        [
            new City { Id = Guid.NewGuid(), Name = "Mumbai",    Slug = "mumbai",    State = "Maharashtra", StateCode = "27" },
            new City { Id = Guid.NewGuid(), Name = "Ahmedabad", Slug = "ahmedabad", State = "Gujarat",     StateCode = "24" },
            new City { Id = Guid.NewGuid(), Name = "Bangalore", Slug = "bangalore", State = "Karnataka",   StateCode = "29" }
        ]);

        var result = (await svc.GetAllAsync()).ToList();

        result.Should().HaveCount(3);
        result[0].Name.Should().Be("Ahmedabad");
        result[1].Name.Should().Be("Bangalore");
        result[2].Name.Should().Be("Mumbai");
    }

    [Fact]
    public async Task DetectFromIp_ValidIp_ReturnsMatchingCity()
    {
        var (_, repo) = Create();
        var ahmedabad = new City { Id = Guid.NewGuid(), Name = "Ahmedabad", Slug = "ahmedabad", State = "Gujarat", StateCode = "24" };
        repo.Setup(r => r.FindByNameAsync("Ahmedabad", default)).ReturnsAsync(ahmedabad);

        // Use a mock HttpClientFactory that returns a handler with a fake response
        var handler = new FakeHttpMessageHandler(
            """{"status":"success","city":"Ahmedabad"}""");
        var httpClient = new System.Net.Http.HttpClient(handler);
        var httpFactory = new Mock<System.Net.Http.IHttpClientFactory>();
        httpFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(httpClient);

        var svc = new CityService(repo.Object, httpFactory.Object, CreateCache());
        var result = await svc.DetectFromIpAsync("1.2.3.4");

        result.Should().NotBeNull();
        result!.Name.Should().Be("Ahmedabad");
        result.StateCode.Should().Be("24");
    }

    [Fact]
    public async Task DetectFromIp_UnknownIp_ReturnsNull()
    {
        var (_, repo) = Create();
        repo.Setup(r => r.FindByNameAsync(It.IsAny<string>(), default)).ReturnsAsync((City?)null);

        var handler = new FakeHttpMessageHandler("""{"status":"fail"}""");
        var httpClient = new System.Net.Http.HttpClient(handler);
        var httpFactory = new Mock<System.Net.Http.IHttpClientFactory>();
        httpFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(httpClient);

        var svc = new CityService(repo.Object, httpFactory.Object, CreateCache());
        var result = await svc.DetectFromIpAsync("0.0.0.0");

        result.Should().BeNull();
    }
}

/// <summary>Test double for HttpMessageHandler.</summary>
internal class FakeHttpMessageHandler : System.Net.Http.HttpMessageHandler
{
    private readonly string _response;
    public FakeHttpMessageHandler(string response) => _response = response;

    protected override Task<System.Net.Http.HttpResponseMessage> SendAsync(
        System.Net.Http.HttpRequestMessage request, CancellationToken cancellationToken) =>
        Task.FromResult(new System.Net.Http.HttpResponseMessage(System.Net.HttpStatusCode.OK)
        {
            Content = new System.Net.Http.StringContent(_response)
        });
}
