namespace CmsApi.Models;

public class StaticType
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ICollection<StaticValue> Values { get; set; } = [];
}
