using System.ComponentModel.DataAnnotations;

namespace CmsApi.Dtos;

public record PatientRequest(
    [Required(AllowEmptyStrings = false, ErrorMessage = "First name is required.")]
    [MaxLength(100, ErrorMessage = "First name cannot exceed 100 characters.")]
    string FirstName,

    [MaxLength(100, ErrorMessage = "Middle name cannot exceed 100 characters.")]
    string? MiddleName,

    [Required(AllowEmptyStrings = false, ErrorMessage = "Last name is required.")]
    [MaxLength(100, ErrorMessage = "Last name cannot exceed 100 characters.")]
    string LastName,

    [Required(ErrorMessage = "Date of birth is required.")]
    DateOnly DateOfBirth,

    [Required(ErrorMessage = "Gender is required.")]
    int GenderId,

    [Required(ErrorMessage = "Country code is required.")]
    [RegularExpression(@"^\+\d{1,4}$", ErrorMessage = "Country code must look like +91.")]
    string CountryCode,

    [Required(AllowEmptyStrings = false, ErrorMessage = "Mobile number is required.")]
    [RegularExpression(@"^\d{6,15}$", ErrorMessage = "Mobile number must be 6–15 digits (numbers only).")]
    string PhoneNumber,

    [EmailAddress(ErrorMessage = "Email address is not valid.")]
    [MaxLength(255, ErrorMessage = "Email cannot exceed 255 characters.")]
    string? Email,

    [MaxLength(255, ErrorMessage = "Address cannot exceed 255 characters.")]
    string? Address,

    [MaxLength(100, ErrorMessage = "City cannot exceed 100 characters.")]
    string? City,

    [MaxLength(100, ErrorMessage = "State cannot exceed 100 characters.")]
    string? State,

    [RegularExpression(@"^[A-Za-z0-9][A-Za-z0-9 \-]{2,9}$", ErrorMessage = "Pincode / ZIP must be 3–10 letters, digits, spaces or hyphens.")]
    string? Pincode,

    [MaxLength(100, ErrorMessage = "Country cannot exceed 100 characters.")]
    string? Country,

    int? BloodGroupId,

    [MaxLength(2000, ErrorMessage = "Notes cannot exceed 2000 characters.")]
    string? Notes
);

public record PatientListQuery(
    string? Search,
    int? GenderId,
    int? BloodGroupId,
    string? City,
    string? State,
    DateOnly? RegisteredFrom,
    DateOnly? RegisteredTo,
    string? Sort,
    int Page = 1,
    int PageSize = 20
);

public record PatientResponse(
    Guid Id,
    string PatientNumber,
    string FirstName,
    string? MiddleName,
    string LastName,
    DateOnly DateOfBirth,
    int GenderId,
    string GenderDisplay,
    string CountryCode,
    string PhoneNumber,
    string? Email,
    string? Address,
    string? City,
    string? State,
    string? Pincode,
    string? Country,
    int? BloodGroupId,
    string? BloodGroupDisplay,
    string? Notes,
    DateTime CreatedAt
);
