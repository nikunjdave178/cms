namespace CmsApi.Models;

/// <summary>
/// One row per Indian PIN code (cleaned data.gov.in All-India Pincode Directory).
/// Factory lookup data — int PK only, no PublicId, seeded at startup.
/// </summary>
public class PincodeEntry
{
    public int Id { get; set; }
    public string Pincode { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
}
