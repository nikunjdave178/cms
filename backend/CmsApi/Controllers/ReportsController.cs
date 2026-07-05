using CmsApi.Data;
using CmsApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController(AppDbContext db) : ControllerBase
{
    [HttpGet("revenue")]
    public async Task<IEnumerable<object>> GetRevenue([FromQuery] int months = 6)
    {
        var now = DateTime.UtcNow;
        var startDate = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-(months - 1));
        var paidId = StaticValueIds.InvoiceStatus.Paid;

        var invoices = await db.Invoices
            .Where(i => i.StatusId == paidId && i.PaidAt >= startDate)
            .ToListAsync();

        return Enumerable.Range(0, months)
            .Select(i => startDate.AddMonths(i))
            .Select(d => (object)new
            {
                Year = d.Year,
                Month = d.Month,
                MonthName = d.ToString("MMM yyyy"),
                Revenue = invoices
                    .Where(inv => inv.PaidAt!.Value.Year == d.Year && inv.PaidAt.Value.Month == d.Month)
                    .Sum(inv => inv.TotalAmount)
            });
    }

    [HttpGet("appointments-by-status")]
    public async Task<IEnumerable<object>> GetAppointmentsByStatus()
    {
        var data = await db.Appointments
            .GroupBy(a => a.StatusId)
            .Select(g => new { StatusId = g.Key, Count = g.Count() })
            .ToListAsync();

        var statusIds = data.Select(d => d.StatusId).ToList();
        var statuses = await db.StaticValues
            .Where(sv => statusIds.Contains(sv.Id))
            .ToDictionaryAsync(sv => sv.Id, sv => sv.DisplayValue);

        return data.Select(d => (object)new
        {
            d.StatusId,
            Status = statuses.GetValueOrDefault(d.StatusId, "Unknown"),
            d.Count
        });
    }

    [HttpGet("patient-growth")]
    public async Task<IEnumerable<object>> GetPatientGrowth([FromQuery] int months = 6)
    {
        var now = DateTime.UtcNow;
        var startDate = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-(months - 1));

        var patients = await db.Patients
            .Where(p => p.CreatedAt >= startDate)
            .ToListAsync();

        return Enumerable.Range(0, months)
            .Select(i => startDate.AddMonths(i))
            .Select(d => (object)new
            {
                Year = d.Year,
                Month = d.Month,
                MonthName = d.ToString("MMM yyyy"),
                Count = patients.Count(p => p.CreatedAt.Year == d.Year && p.CreatedAt.Month == d.Month)
            });
    }

    [HttpGet("payment-modes")]
    public async Task<IEnumerable<object>> GetPaymentModes()
    {
        var paidId = StaticValueIds.InvoiceStatus.Paid;

        var data = await db.Invoices
            .Where(i => i.StatusId == paidId && i.PaymentModeId.HasValue)
            .GroupBy(i => i.PaymentModeId!.Value)
            .Select(g => new { PaymentModeId = g.Key, Amount = g.Sum(i => i.TotalAmount), Count = g.Count() })
            .ToListAsync();

        var modeIds = data.Select(d => d.PaymentModeId).ToList();
        var modes = await db.StaticValues
            .Where(sv => modeIds.Contains(sv.Id))
            .ToDictionaryAsync(sv => sv.Id, sv => sv.DisplayValue);

        return data.Select(d => (object)new
        {
            d.PaymentModeId,
            Mode = modes.GetValueOrDefault(d.PaymentModeId, "Unknown"),
            d.Amount,
            d.Count
        });
    }
}
