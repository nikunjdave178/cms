using CmsApi.Data;
using CmsApi.Dtos;
using CmsApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DoctorsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IEnumerable<DoctorResponse>> GetAll() =>
        await db.Doctors
            .OrderBy(d => d.LastName)
            .Select(d => ToResponse(d))
            .ToListAsync();

    [HttpGet("{id}")]
    public async Task<ActionResult<DoctorResponse>> GetById(int id)
    {
        var d = await db.Doctors.FindAsync(id);
        return d is null ? NotFound() : ToResponse(d);
    }

    [HttpPost]
    public async Task<ActionResult<DoctorResponse>> Create(DoctorRequest req)
    {
        var doctor = new Doctor
        {
            FirstName = req.FirstName,
            MiddleName = req.MiddleName,
            LastName = req.LastName,
            Specialization = req.Specialization,
            CountryCode = req.CountryCode,
            PhoneNumber = req.PhoneNumber,
            Email = req.Email
        };

        db.Doctors.Add(doctor);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = doctor.Id }, ToResponse(doctor));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<DoctorResponse>> Update(int id, DoctorRequest req)
    {
        var doctor = await db.Doctors.FindAsync(id);
        if (doctor is null) return NotFound();

        doctor.FirstName = req.FirstName;
        doctor.MiddleName = req.MiddleName;
        doctor.LastName = req.LastName;
        doctor.Specialization = req.Specialization;
        doctor.CountryCode = req.CountryCode;
        doctor.PhoneNumber = req.PhoneNumber;
        doctor.Email = req.Email;

        await db.SaveChangesAsync();
        return ToResponse(doctor);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var doctor = await db.Doctors.FindAsync(id);
        if (doctor is null) return NotFound();

        db.Doctors.Remove(doctor);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static DoctorResponse ToResponse(Doctor d) => new(
        d.Id, d.FirstName, d.MiddleName, d.LastName,
        d.Specialization, d.CountryCode, d.PhoneNumber, d.Email);
}
