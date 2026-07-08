namespace CmsApi.Models;

public class Doctor
{
    public int Id { get; set; }
    public Guid PublicId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string CountryCode { get; set; } = "+91";
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }

    public ICollection<Appointment> Appointments { get; set; } = [];
}
