namespace CmsApi.Dtos;

public record AppointmentRequest(
    int PatientId,
    int DoctorId,
    DateTime ScheduledAt,
    string? Reason,
    string? Notes
);

public record AppointmentUpdateRequest(
    DateTime ScheduledAt,
    int StatusId,
    string? Reason,
    string? Notes
);

public record AppointmentResponse(
    int Id,
    int PatientId,
    string PatientName,
    int DoctorId,
    string DoctorName,
    string DoctorSpecialization,
    DateTime ScheduledAt,
    int StatusId,
    string StatusDisplay,
    string? Reason,
    string? Notes,
    DateTime CreatedAt,
    bool HasVitals
);
