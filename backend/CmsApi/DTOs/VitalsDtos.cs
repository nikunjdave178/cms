namespace CmsApi.Dtos;

public record VitalsRequest(
    decimal? BloodPressureSystolic,
    decimal? BloodPressureDiastolic,
    decimal? PulseRate,
    decimal? Temperature,
    decimal? WeightKg,
    decimal? HeightCm,
    decimal? OxygenSaturation,
    string? Notes
);

public record VitalsResponse(
    int Id,
    int AppointmentId,
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
