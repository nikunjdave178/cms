namespace CmsApi.Dtos;

public record PatientRequest(
    string FirstName,
    string? MiddleName,
    string LastName,
    DateOnly DateOfBirth,
    int GenderId,
    string CountryCode,
    string PhoneNumber,
    string? Email,
    string? Address,
    string? City,
    string? State,
    string? Pincode,
    int? BloodGroupId,
    string? Notes
);

public record PatientResponse(
    int Id,
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
    int? BloodGroupId,
    string? BloodGroupDisplay,
    string? Notes,
    DateTime CreatedAt
);
