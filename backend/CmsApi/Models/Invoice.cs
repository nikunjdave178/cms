namespace CmsApi.Models;

public class Invoice
{
    public int Id { get; set; }
    public Guid PublicId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    public int? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }
    public string? Description { get; set; }
    public decimal SubtotalAmount { get; set; }
    public decimal? GstRate { get; set; }
    public decimal GstAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public int StatusId { get; set; } = StaticValueIds.InvoiceStatus.Pending;
    public StaticValue Status { get; set; } = null!;
    public int? PaymentModeId { get; set; }
    public StaticValue? PaymentMode { get; set; }
    public string? PaymentReference { get; set; }
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; set; }

    public ICollection<InvoiceItem> Items { get; set; } = [];
}
