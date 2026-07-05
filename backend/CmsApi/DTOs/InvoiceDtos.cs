namespace CmsApi.Dtos;

public record InvoiceItemRequest(
    string Description,
    int Quantity,
    decimal UnitPrice
);

public record InvoiceItemResponse(
    int Id,
    string Description,
    int Quantity,
    decimal UnitPrice,
    decimal Amount
);

public record InvoiceRequest(
    int PatientId,
    int? AppointmentId,
    string? Description,
    List<InvoiceItemRequest> Items,
    decimal? GstRate,
    int? PaymentModeId,
    string? PaymentReference
);

public record InvoiceUpdateStatusRequest(
    int StatusId,
    int? PaymentModeId,
    string? PaymentReference
);

public record InvoiceResponse(
    int Id,
    int PatientId,
    string PatientName,
    int? AppointmentId,
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
