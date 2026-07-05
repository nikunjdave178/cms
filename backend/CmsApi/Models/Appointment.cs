namespace CmsApi.Models;

public class Appointment
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;
    public DateTime ScheduledAt { get; set; }
    public int StatusId { get; set; } = StaticValueIds.AppointmentStatus.Scheduled;
    public StaticValue Status { get; set; } = null!;
    public string? Reason { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Vitals? Vitals { get; set; }
    public Invoice? Invoice { get; set; }
}
