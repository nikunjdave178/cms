using System.ComponentModel.DataAnnotations;

namespace CmsApi.Dtos;

public record InvoiceItemRequest(
    [Required(AllowEmptyStrings = false)] [MaxLength(255)] string Description,
    [Range(1, 10000)] int Quantity,
    [Range(0, 10000000)] decimal UnitPrice
);

public record InvoiceItemResponse(
    Guid Id,
    string Description,
    int Quantity,
    decimal UnitPrice,
    decimal Amount
);

public record InvoiceRequest(
    [Required] Guid PatientId,
    Guid? AppointmentId,
    [MaxLength(255)] string? Description,
    List<InvoiceItemRequest> Items,
    [Range(0, 100)] decimal? GstRate,
    int? PaymentModeId,
    [MaxLength(100)] string? PaymentReference
);

public record InvoiceUpdateStatusRequest(
    [Required] int StatusId,
    int? PaymentModeId,
    [MaxLength(100)] string? PaymentReference
);

public record InvoiceResponse(
    Guid Id,
    Guid PatientId,
    string PatientName,
    Guid? AppointmentId,
    string? Description,
    List<InvoiceItemResponse> Items,
    decimal SubtotalAmount,
    decimal? GstRate,
    decimal GstAmount,
    decimal TotalAmount,
    int StatusId,
    string StatusDisplay,
    int? PaymentModeId,
    string? PaymentModeDisplay,
    string? PaymentReference,
    DateTime IssuedAt,
    DateTime? PaidAt
);
