namespace CmsApi.Dtos;

public record StaticValueResponse(int Id, string Code, string DisplayValue, int SortOrder);
public record StaticTypeResponse(int Id, string Code, string Description, IEnumerable<StaticValueResponse> Values);
