using CmsApi.Data;
using CmsApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController(AppDbContext db) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<object> GetStats()
    {
        var now = DateTime.UtcNow;
        var todayStart = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc);
        var todayEnd   = todayStart.AddDays(1);
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var paidId = StaticValueIds.InvoiceStatus.Paid;
        var pendingId = StaticValueIds.InvoiceStatus.Pending;

        var totalPatients = await db.Patients.CountAsync();
        var totalDoctors = await db.Doctors.CountAsync();
        var todayAppointments = await db.Appointments
            .CountAsync(a => a.ScheduledAt >= todayStart && a.ScheduledAt < todayEnd);
        var pendingInvoices = await db.Invoices.CountAsync(i => i.StatusId == pendingId);
        var monthRevenue = await db.Invoices
            .Where(i => i.StatusId == paidId && i.PaidAt >= monthStart)
            .SumAsync(i => (decimal?)i.TotalAmount) ?? 0;

        var recentAppointments = await db.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
            .Include(a => a.Status)
            .OrderByDescending(a => a.ScheduledAt)
            .Take(5)
            .ToListAsync();

        return new
        {
            TotalPatients = totalPatients,
            TotalDoctors = totalDoctors,
            TodayAppointments = todayAppointments,
            PendingInvoices = pendingInvoices,
            MonthRevenue = monthRevenue,
            RecentAppointments = recentAppointments.Select(a => new
            {
                a.Id,
                PatientName = FullName(a.Patient.FirstName, a.Patient.MiddleName, a.Patient.LastName),
                DoctorName = $"Dr. {FullName(a.Doctor.FirstName, a.Doctor.MiddleName, a.Doctor.LastName)}",
                a.ScheduledAt,
                StatusDisplay = a.Status.DisplayValue,
                a.StatusId
            })
        };
    }

    private static string FullName(string first, string? middle, string last) =>
        string.IsNullOrWhiteSpace(middle) ? $"{first} {last}" : $"{first} {middle} {last}";
}
