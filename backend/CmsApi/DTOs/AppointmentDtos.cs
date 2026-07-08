using System.ComponentModel.DataAnnotations;

namespace CmsApi.Dtos;

public record AppointmentRequest(
    [Required] Guid PatientId,
    [Required] Guid DoctorId,
    [Required] DateTime ScheduledAt,
    [MaxLength(255)] string? Reason,
    [MaxLength(2000)] string? Notes
);

public record AppointmentUpdateRequest(
    [Required] DateTime ScheduledAt,
    [Required] int StatusId,
    [MaxLength(255)] string? Reason,
    [MaxLength(2000)] string? Notes
);

public record AppointmentResponse(
    Guid Id,
    Guid PatientId,
    string PatientName,
    Guid DoctorId,
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
