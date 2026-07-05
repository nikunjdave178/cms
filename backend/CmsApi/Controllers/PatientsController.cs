using CmsApi.Data;
using CmsApi.Dtos;
using CmsApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PatientsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IEnumerable<PatientResponse>> GetAll([FromQuery] string? search)
    {
        var query = db.Patients
            .Include(p => p.Gender)
            .Include(p => p.BloodGroup)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(p =>
                p.FirstName.ToLower().Contains(s) ||
                p.LastName.ToLower().Contains(s) ||
                (p.MiddleName != null && p.MiddleName.ToLower().Contains(s)) ||
                p.PhoneNumber.Contains(s));
        }

        return await query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => ToResponse(p))
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PatientResponse>> GetById(int id)
    {
        var p = await db.Patients
            .Include(p => p.Gender)
            .Include(p => p.BloodGroup)
            .FirstOrDefaultAsync(p => p.Id == id);
        return p is null ? NotFound() : ToResponse(p);
    }

    [HttpPost]
    public async Task<ActionResult<PatientResponse>> Create(PatientRequest req)
    {
        var patient = new Patient
        {
            FirstName = req.FirstName,
            MiddleName = req.MiddleName,
            LastName = req.LastName,
            DateOfBirth = req.DateOfBirth,
            GenderId = req.GenderId,
            CountryCode = req.CountryCode,
            PhoneNumber = req.PhoneNumber,
            Email = req.Email,
            Address = req.Address,
            City = req.City,
            State = req.State,
            Pincode = req.Pincode,
            BloodGroupId = req.BloodGroupId,
            Notes = req.Notes
        };

        db.Patients.Add(patient);
        await db.SaveChangesAsync();

        var loaded = await db.Patients
            .Include(p => p.Gender)
            .Include(p => p.BloodGroup)
            .FirstAsync(p => p.Id == patient.Id);
        return CreatedAtAction(nameof(GetById), new { id = patient.Id }, ToResponse(loaded));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<PatientResponse>> Update(int id, PatientRequest req)
    {
        var patient = await db.Patients
            .Include(p => p.Gender)
            .Include(p => p.BloodGroup)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (patient is null) return NotFound();

        patient.FirstName = req.FirstName;
        patient.MiddleName = req.MiddleName;
        patient.LastName = req.LastName;
        patient.DateOfBirth = req.DateOfBirth;
        patient.GenderId = req.GenderId;
        patient.CountryCode = req.CountryCode;
        patient.PhoneNumber = req.PhoneNumber;
        patient.Email = req.Email;
        patient.Address = req.Address;
        patient.City = req.City;
        patient.State = req.State;
        patient.Pincode = req.Pincode;
        patient.BloodGroupId = req.BloodGroupId;
        patient.Notes = req.Notes;

        await db.SaveChangesAsync();

        await db.Entry(patient).Reference(p => p.Gender).LoadAsync();
        if (patient.BloodGroupId.HasValue)
            await db.Entry(patient).Reference(p => p.BloodGroup).LoadAsync();

        return ToResponse(patient);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var patient = await db.Patients.FindAsync(id);
        if (patient is null) return NotFound();

        db.Patients.Remove(patient);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static PatientResponse ToResponse(Patient p) => new(
        p.Id, p.FirstName, p.MiddleName, p.LastName, p.DateOfBirth,
        p.GenderId, p.Gender.DisplayValue,
        p.CountryCode, p.PhoneNumber, p.Email,
        p.Address, p.City, p.State, p.Pincode,
        p.BloodGroupId, p.BloodGroup?.DisplayValue,
        p.Notes, p.CreatedAt);
}
