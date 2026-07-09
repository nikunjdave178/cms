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
public class AppointmentsController(AppDbContext db, DeleteGuardService deleteGuard) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AppointmentResponse>>> GetAll(
        [FromQuery] Guid? patientId,
        [FromQuery] Guid? doctorId,
        [FromQuery] int? statusId,
        [FromQuery] DateOnly? date)
    {
        var query = db.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
            .Include(a => a.Status)
            .Include(a => a.Vitals)
            .AsQueryable();

        // Resolve public UUIDs to internal int keys once, then filter on the int FK columns.
        if (patientId.HasValue)
        {
            var pid = await db.Patients.ResolveIdAsync(patientId.Value);
            if (pid is null) return Ok(Array.Empty<AppointmentResponse>());
            query = query.Where(a => a.PatientId == pid);
        }
        if (doctorId.HasValue)
        {
            var did = await db.Doctors.ResolveIdAsync(doctorId.Value);
            if (did is null) return Ok(Array.Empty<AppointmentResponse>());
            query = query.Where(a => a.DoctorId == did);
        }
        if (statusId.HasValue) query = query.Where(a => a.StatusId == statusId);
        if (date.HasValue)
            query = query.Where(a => DateOnly.FromDateTime(a.ScheduledAt) == date.Value);

        return Ok(await query
            .OrderByDescending(a => a.ScheduledAt)
            .Select(a => ToResponse(a))
            .ToListAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AppointmentResponse>> GetById(Guid id)
    {
        var a = await db.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
            .Include(a => a.Status)
            .Include(a => a.Vitals)
            .FirstOrDefaultAsync(a => a.PublicId == id);
        return a is null ? NotFound() : ToResponse(a);
    }

    [HttpPost]
    public async Task<ActionResult<AppointmentResponse>> Create(AppointmentRequest req)
    {
        var patientId = await db.Patients.ResolveIdAsync(req.PatientId);
        var doctorId = await db.Doctors.ResolveIdAsync(req.DoctorId);
        if (patientId is null) return BadRequest("Patient not found.");
        if (doctorId is null) return BadRequest("Doctor not found.");

        var appointment = new Appointment
        {
            PatientId = patientId.Value,
            DoctorId = doctorId.Value,
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
        return CreatedAtAction(nameof(GetById), new { id = loaded.PublicId }, ToResponse(loaded));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AppointmentResponse>> Update(Guid id, AppointmentUpdateRequest req)
    {
        var appointment = await db.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
            .Include(a => a.Status)
            .Include(a => a.Vitals)
            .FirstOrDefaultAsync(a => a.PublicId == id);
        if (appointment is null) return NotFound();

        var statusValid = await db.StaticValues.AnyAsync(v =>
            v.Id == req.StatusId && v.IsActive && v.StaticType.Code == "APPOINTMENT_STATUS");
        if (!statusValid) return BadRequest("Invalid appointment status.");

        appointment.ScheduledAt = req.ScheduledAt.ToUniversalTime();
        appointment.StatusId = req.StatusId;
        appointment.Reason = req.Reason;
        appointment.Notes = req.Notes;

        await db.SaveChangesAsync();

        await db.Entry(appointment).Reference(a => a.Status).LoadAsync();
        return ToResponse(appointment);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var appointment = await db.Appointments.FirstOrDefaultAsync(a => a.PublicId == id);
        if (appointment is null) return NotFound();

        if (await deleteGuard.FindBlockingReferenceAsync(appointment, "This appointment") is { } reason)
            return Conflict(reason);

        db.Appointments.Remove(appointment);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static string FullName(string first, string? middle, string last) =>
        string.IsNullOrWhiteSpace(middle) ? $"{first} {last}" : $"{first} {middle} {last}";

    private static AppointmentResponse ToResponse(Appointment a) => new(
        a.PublicId,
        a.Patient.PublicId,
        FullName(a.Patient.FirstName, a.Patient.MiddleName, a.Patient.LastName),
        a.Doctor.PublicId,
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
