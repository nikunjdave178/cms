namespace CmsApi.Dtos;

public record DoctorRequest(
    string FirstName,
    string? MiddleName,
    string LastName,
    string Specialization,
    string CountryCode,
    string PhoneNumber,
    string? Email
);

public record DoctorResponse(
    int Id,
    string FirstName,
    string? MiddleName,
    string LastName,
    string Specialization,
    string CountryCode,
    string PhoneNumber,
    string? Email
);
