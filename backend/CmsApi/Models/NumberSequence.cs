namespace CmsApi.Models;

/// <summary>
/// Configurable auto-number scheme for a business entity (e.g. "PATIENT",
/// "INVOICE") — one row per entity type, admin-managed via the setup screen.
/// int PK only: this is fixed, small, admin-managed config data, not a
/// business object requiring UUID protection (see docs/backend-standards.md).
/// </summary>
public class NumberSequence
{
    public int Id { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Prefix { get; set; }
    public string? Suffix { get; set; }
    public long CurrentValue { get; set; }
    public int PaddingWidth { get; set; } = 4;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
