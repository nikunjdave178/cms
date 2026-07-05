namespace CmsApi.Models;

public class StaticValue
{
    public int Id { get; set; }
    public int StaticTypeId { get; set; }
    public StaticType StaticType { get; set; } = null!;
    public string Code { get; set; } = string.Empty;
    public string DisplayValue { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
