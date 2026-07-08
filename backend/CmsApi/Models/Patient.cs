namespace CmsApi.Models;

public class Patient
{
    public int Id { get; set; }
    public Guid PublicId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public DateOnly DateOfBirth { get; set; }
    public int GenderId { get; set; }
    public StaticValue Gender { get; set; } = null!;
    public string CountryCode { get; set; } = "+91";
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Pincode { get; set; }
    public string? Country { get; set; }
    public int? BloodGroupId { get; set; }
    public StaticValue? BloodGroup { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Appointment> Appointments { get; set; } = [];
    public ICollection<Invoice> Invoices { get; set; } = [];
}
