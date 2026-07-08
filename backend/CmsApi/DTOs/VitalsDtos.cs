using System.ComponentModel.DataAnnotations;

namespace CmsApi.Dtos;

public record VitalsRequest(
    [Range(0, 400)] decimal? BloodPressureSystolic,
    [Range(0, 300)] decimal? BloodPressureDiastolic,
    [Range(0, 400)] decimal? PulseRate,
    [Range(25, 46)] decimal? Temperature,
    [Range(0, 500)] decimal? WeightKg,
    [Range(0, 300)] decimal? HeightCm,
    [Range(0, 100)] decimal? OxygenSaturation,
    [MaxLength(2000)] string? Notes
);

public record VitalsResponse(
    Guid Id,
    Guid AppointmentId,
    decimal? BloodPressureSystolic,
    decimal? BloodPressureDiastolic,
    decimal? PulseRate,
    decimal? Temperature,
    decimal? WeightKg,
    decimal? HeightCm,
    decimal? OxygenSaturation,
    string? Notes,
    DateTime RecordedAt
);
