using CmsApi.Data;
using CmsApi.Dtos;
using CmsApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Controllers;

[ApiController]
[Route("api/appointments/{appointmentId:guid}/vitals")]
[Authorize]
public class VitalsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<VitalsResponse>> Get(Guid appointmentId)
    {
        var vitals = await db.Vitals.FirstOrDefaultAsync(v => v.Appointment.PublicId == appointmentId);
        return vitals is null ? NotFound() : ToResponse(vitals, appointmentId);
    }

    [HttpPost]
    [Authorize(Roles = Roles.AdminDoctor)]
    public async Task<ActionResult<VitalsResponse>> Create(Guid appointmentId, VitalsRequest req)
    {
        var apptId = await db.Appointments.ResolveIdAsync(appointmentId);
        if (apptId is null) return BadRequest("Appointment not found.");

        if (await db.Vitals.AnyAsync(v => v.AppointmentId == apptId))
            return Conflict("Vitals already recorded. Use PUT to update.");

        var vitals = new Vitals
        {
            AppointmentId = apptId.Value,
            BloodPressureSystolic = req.BloodPressureSystolic,
            BloodPressureDiastolic = req.BloodPressureDiastolic,
            PulseRate = req.PulseRate,
            Temperature = req.Temperature,
            WeightKg = req.WeightKg,
            HeightCm = req.HeightCm,
            OxygenSaturation = req.OxygenSaturation,
            Notes = req.Notes
        };

        db.Vitals.Add(vitals);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { appointmentId }, ToResponse(vitals, appointmentId));
    }

    [HttpPut]
    [Authorize(Roles = Roles.AdminDoctor)]
    public async Task<ActionResult<VitalsResponse>> Update(Guid appointmentId, VitalsRequest req)
    {
        var vitals = await db.Vitals.FirstOrDefaultAsync(v => v.Appointment.PublicId == appointmentId);
        if (vitals is null) return NotFound();

        vitals.BloodPressureSystolic = req.BloodPressureSystolic;
        vitals.BloodPressureDiastolic = req.BloodPressureDiastolic;
        vitals.PulseRate = req.PulseRate;
        vitals.Temperature = req.Temperature;
        vitals.WeightKg = req.WeightKg;
        vitals.HeightCm = req.HeightCm;
        vitals.OxygenSaturation = req.OxygenSaturation;
        vitals.Notes = req.Notes;
        vitals.RecordedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return ToResponse(vitals, appointmentId);
    }

    private static VitalsResponse ToResponse(Vitals v, Guid appointmentPublicId) => new(
        v.PublicId, appointmentPublicId,
        v.BloodPressureSystolic, v.BloodPressureDiastolic,
        v.PulseRate, v.Temperature, v.WeightKg, v.HeightCm,
        v.OxygenSaturation, v.Notes, v.RecordedAt);
}
