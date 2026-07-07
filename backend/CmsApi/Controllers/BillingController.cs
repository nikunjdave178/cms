using CmsApi.Data;
using CmsApi.Dtos;
using CmsApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BillingController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IEnumerable<InvoiceResponse>> GetAll(
        [FromQuery] int? patientId,
        [FromQuery] int? statusId)
    {
        var query = db.Invoices
            .Include(i => i.Patient)
            .Include(i => i.Status)
            .Include(i => i.PaymentMode)
            .Include(i => i.Items)
            .AsQueryable();

        if (patientId.HasValue) query = query.Where(i => i.PatientId == patientId);
        if (statusId.HasValue) query = query.Where(i => i.StatusId == statusId);

        return await query
            .OrderByDescending(i => i.IssuedAt)
            .Select(i => ToResponse(i))
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InvoiceResponse>> GetById(int id)
    {
        var i = await db.Invoices
            .Include(i => i.Patient)
            .Include(i => i.Status)
            .Include(i => i.PaymentMode)
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id);
        return i is null ? NotFound() : ToResponse(i);
    }

    [HttpPost]
    [Authorize(Roles = Roles.AdminReceptionist)]
    public async Task<ActionResult<InvoiceResponse>> Create(InvoiceRequest req)
    {
        if (req.Items == null || req.Items.Count == 0)
            return BadRequest("At least one line item is required.");

        var patient = await db.Patients.FindAsync(req.PatientId);
        if (patient is null) return BadRequest("Patient not found.");

        var subtotal = req.Items.Sum(item => item.Quantity * item.UnitPrice);
        var gstAmount = req.GstRate.HasValue ? Math.Round(subtotal * req.GstRate.Value / 100, 2) : 0m;
        var total = subtotal + gstAmount;

        var invoice = new Invoice
        {
            PatientId = req.PatientId,
            AppointmentId = req.AppointmentId,
            Description = req.Description,
            SubtotalAmount = subtotal,
            GstRate = req.GstRate,
            GstAmount = gstAmount,
            TotalAmount = total,
            PaymentModeId = req.PaymentModeId,
            PaymentReference = req.PaymentReference,
            Items = req.Items.Select(item => new InvoiceItem
            {
                Description = item.Description,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice
            }).ToList()
        };

        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();

        var loaded = await db.Invoices
            .Include(i => i.Patient)
            .Include(i => i.Status)
            .Include(i => i.PaymentMode)
            .Include(i => i.Items)
            .FirstAsync(i => i.Id == invoice.Id);
        return CreatedAtAction(nameof(GetById), new { id = invoice.Id }, ToResponse(loaded));
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = Roles.AdminReceptionist)]
    public async Task<ActionResult<InvoiceResponse>> UpdateStatus(int id, InvoiceUpdateStatusRequest req)
    {
        var invoice = await db.Invoices
            .Include(i => i.Patient)
            .Include(i => i.Status)
            .Include(i => i.PaymentMode)
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id);
        if (invoice is null) return NotFound();

        invoice.StatusId = req.StatusId;
        if (req.StatusId == StaticValueIds.InvoiceStatus.Paid)
        {
            invoice.PaidAt = DateTime.UtcNow;
            if (req.PaymentModeId.HasValue) invoice.PaymentModeId = req.PaymentModeId;
            if (req.PaymentReference != null) invoice.PaymentReference = req.PaymentReference;
        }

        await db.SaveChangesAsync();
        await db.Entry(invoice).Reference(i => i.Status).LoadAsync();
        if (invoice.PaymentModeId.HasValue)
            await db.Entry(invoice).Reference(i => i.PaymentMode).LoadAsync();

        return ToResponse(invoice);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.AdminReceptionist)]
    public async Task<IActionResult> Delete(int id)
    {
        var invoice = await db.Invoices.FindAsync(id);
        if (invoice is null) return NotFound();

        db.Invoices.Remove(invoice);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("summary")]
    public async Task<object> GetSummary()
    {
        var paidId = StaticValueIds.InvoiceStatus.Paid;
        var pendingId = StaticValueIds.InvoiceStatus.Pending;
        var invoices = await db.Invoices.ToListAsync();
        return new
        {
            TotalRevenue = invoices.Where(i => i.StatusId == paidId).Sum(i => i.TotalAmount),
            PendingAmount = invoices.Where(i => i.StatusId == pendingId).Sum(i => i.TotalAmount),
            PaidCount = invoices.Count(i => i.StatusId == paidId),
            PendingCount = invoices.Count(i => i.StatusId == pendingId)
        };
    }

    private static string FullName(string first, string? middle, string last) =>
        string.IsNullOrWhiteSpace(middle) ? $"{first} {last}" : $"{first} {middle} {last}";

    private static InvoiceResponse ToResponse(Invoice i) => new(
        i.Id,
        i.PatientId,
        FullName(i.Patient.FirstName, i.Patient.MiddleName, i.Patient.LastName),
        i.AppointmentId,
        i.Description,
        i.Items.Select(item => new InvoiceItemResponse(
            item.Id, item.Description, item.Quantity, item.UnitPrice,
            item.Quantity * item.UnitPrice)).ToList(),
        i.SubtotalAmount,
        i.GstRate,
        i.GstAmount,
        i.TotalAmount,
        i.StatusId,
        i.Status.DisplayValue,
        i.PaymentModeId,
        i.PaymentMode?.DisplayValue,
        i.PaymentReference,
        i.IssuedAt,
        i.PaidAt);
}
