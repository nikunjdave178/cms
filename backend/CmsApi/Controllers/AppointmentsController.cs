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
public class AppointmentsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IEnumerable<AppointmentResponse>> GetAll(
        [FromQuery] int? patientId,
        [FromQuery] int? doctorId,
        [FromQuery] int? statusId,
        [FromQuery] DateOnly? date)
    {
        var query = db.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
            .Include(a => a.Status)
            .Include(a => a.Vitals)
            .AsQueryable();

        if (patientId.HasValue) query = query.Where(a => a.PatientId == patientId);
        if (doctorId.HasValue) query = query.Where(a => a.DoctorId == doctorId);
        if (statusId.HasValue) query = query.Where(a => a.StatusId == statusId);
        if (date.HasValue)
            query = query.Where(a => DateOnly.FromDateTime(a.ScheduledAt) == date.Value);

        return await query
            .OrderByDescending(a => a.ScheduledAt)
            .Select(a => ToResponse(a))
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AppointmentResponse>> GetById(int id)
    {
        var a = await db.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
            .Include(a => a.Status)
            .Include(a => a.Vitals)
            .FirstOrDefaultAsync(a => a.Id == id);
        return a is null ? NotFound() : ToResponse(a);
    }

    [HttpPost]
    public async Task<ActionResult<AppointmentResponse>> Create(AppointmentRequest req)
    {
        var patient = await db.Patients.FindAsync(req.PatientId);
        var doctor = await db.Doctors.FindAsync(req.DoctorId);
        if (patient is null) return BadRequest("Patient not found.");
        if (doctor is null) return BadRequest("Doctor not found.");

        var appointment = new Appointment
        {
            PatientId = req.PatientId,
            DoctorId = req.DoctorId,
            ScheduledAt = req.ScheduledAt.ToUniversalTime(),
            Reason = req.Reason,
            Notes = req.Notes
        };

        db.Appointments.Add(appointment);
        await db.SaveChangesAsync();

        var loaded = await db.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
            .Include(a => a.Status)
            .Include(a => a.Vitals)
            .FirstAsync(a => a.Id == appointment.Id);
        return CreatedAtAction(nameof(GetById), new { id = appointment.Id }, ToResponse(loaded));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AppointmentResponse>> Update(int id, AppointmentUpdateRequest req)
    {
        var appointment = await db.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
            .Include(a => a.Status)
            .Include(a => a.Vitals)
            .FirstOrDefaultAsync(a => a.Id == id);
        if (appointment is null) return NotFound();

        appointment.ScheduledAt = req.ScheduledAt.ToUniversalTime();
        appointment.StatusId = req.StatusId;
        appointment.Reason = req.Reason;
        appointment.Notes = req.Notes;

        await db.SaveChangesAsync();

        await db.Entry(appointment).Reference(a => a.Status).LoadAsync();
        return ToResponse(appointment);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var appointment = await db.Appointments.FindAsync(id);
        if (appointment is null) return NotFound();

        db.Appointments.Remove(appointment);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static string FullName(string first, string? middle, string last) =>
        string.IsNullOrWhiteSpace(middle) ? $"{first} {last}" : $"{first} {middle} {last}";

    private static AppointmentResponse ToResponse(Appointment a) => new(
        a.Id,
        a.PatientId,
        FullName(a.Patient.FirstName, a.Patient.MiddleName, a.Patient.LastName),
        a.DoctorId,
        $"Dr. {FullName(a.Doctor.FirstName, a.Doctor.MiddleName, a.Doctor.LastName)}",
        a.Doctor.Specialization,
        a.ScheduledAt,
        a.StatusId,
        a.Status.DisplayValue,
        a.Reason,
        a.Notes,
        a.CreatedAt,
        a.Vitals is not null);
}
