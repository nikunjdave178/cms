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
public class DoctorsController(AppDbContext db, DeleteGuardService deleteGuard) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResponse<DoctorResponse>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        var query = db.Doctors.OrderBy(d => d.LastName);
        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => ToResponse(d))
            .ToListAsync();

        return Ok(new PagedResponse<DoctorResponse>(items, page, pageSize, totalCount));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DoctorResponse>> GetById(Guid id)
    {
        var d = await db.Doctors.FirstOrDefaultAsync(d => d.PublicId == id);
        return d is null ? NotFound() : ToResponse(d);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<DoctorResponse>> Create(DoctorRequest req)
    {
        var doctor = new Doctor
        {
            FirstName = req.FirstName.Trim(),
            MiddleName = string.IsNullOrWhiteSpace(req.MiddleName) ? null : req.MiddleName.Trim(),
            LastName = req.LastName.Trim(),
            Specialization = req.Specialization.Trim(),
            CountryCode = req.CountryCode,
            PhoneNumber = req.PhoneNumber,
            Email = string.IsNullOrWhiteSpace(req.Email) ? null : req.Email.Trim()
        };

        db.Doctors.Add(doctor);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = doctor.PublicId }, ToResponse(doctor));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<DoctorResponse>> Update(Guid id, DoctorRequest req)
    {
        var doctor = await db.Doctors.FirstOrDefaultAsync(d => d.PublicId == id);
        if (doctor is null) return NotFound();

        doctor.FirstName = req.FirstName.Trim();
        doctor.MiddleName = string.IsNullOrWhiteSpace(req.MiddleName) ? null : req.MiddleName.Trim();
        doctor.LastName = req.LastName.Trim();
        doctor.Specialization = req.Specialization.Trim();
        doctor.CountryCode = req.CountryCode;
        doctor.PhoneNumber = req.PhoneNumber;
        doctor.Email = string.IsNullOrWhiteSpace(req.Email) ? null : req.Email.Trim();

        await db.SaveChangesAsync();
        return ToResponse(doctor);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var doctor = await db.Doctors.FirstOrDefaultAsync(d => d.PublicId == id);
        if (doctor is null) return NotFound();

        var label = $"Dr. {FullName(doctor.FirstName, doctor.MiddleName, doctor.LastName)}";
        if (await deleteGuard.FindBlockingReferenceAsync(doctor, label) is { } reason)
            return Conflict(reason);

        db.Doctors.Remove(doctor);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static string FullName(string first, string? middle, string last) =>
        string.IsNullOrWhiteSpace(middle) ? $"{first} {last}" : $"{first} {middle} {last}";

    private static DoctorResponse ToResponse(Doctor d) => new(
        d.PublicId, d.FirstName, d.MiddleName, d.LastName,
        d.Specialization, d.CountryCode, d.PhoneNumber, d.Email);
}
