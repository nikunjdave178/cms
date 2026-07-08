using System.ComponentModel.DataAnnotations;

namespace CmsApi.Dtos;

public record DoctorRequest(
    [Required(AllowEmptyStrings = false)] [MaxLength(100)] string FirstName,
    [MaxLength(100)] string? MiddleName,
    [Required(AllowEmptyStrings = false)] [MaxLength(100)] string LastName,
    [Required(AllowEmptyStrings = false)] [MaxLength(100)] string Specialization,
    [Required] [RegularExpression(@"^\+\d{1,4}$", ErrorMessage = "Country code must look like +91.")] string CountryCode,
    [Required(AllowEmptyStrings = false)] [RegularExpression(@"^\d{6,15}$", ErrorMessage = "Mobile number must be 6-15 digits (numbers only).")] string PhoneNumber,
    [EmailAddress] [MaxLength(255)] string? Email
);

public record DoctorResponse(
    Guid Id,
    string FirstName,
    string? MiddleName,
    string LastName,
    string Specialization,
    string CountryCode,
    string PhoneNumber,
    string? Email
);
