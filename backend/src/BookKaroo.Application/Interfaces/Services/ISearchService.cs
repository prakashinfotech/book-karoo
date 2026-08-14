using BookKaroo.Application.DTOs.Search;

namespace BookKaroo.Application.Interfaces.Services;

public interface ISearchService
{
    Task<SearchResponse> SearchAsync(string query, Guid? cityId, CancellationToken ct = default);
}
