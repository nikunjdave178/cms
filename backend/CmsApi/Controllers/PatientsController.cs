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

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PatientResponse>> GetById(Guid id)
    {
        var p = await db.Patients
            .Include(p => p.Gender)
            .Include(p => p.BloodGroup)
            .FirstOrDefaultAsync(p => p.PublicId == id);
        return p is null ? NotFound() : ToResponse(p);
    }

    [HttpPost]
    public async Task<ActionResult<PatientResponse>> Create(PatientRequest req)
    {
        if (await ValidateBusinessRules(req) is { } problem) return problem;

        var patient = new Patient
        {
            FirstName = req.FirstName.Trim(),
            MiddleName = NullIfBlank(req.MiddleName),
            LastName = req.LastName.Trim(),
            DateOfBirth = req.DateOfBirth,
            GenderId = req.GenderId,
            CountryCode = req.CountryCode,
            PhoneNumber = req.PhoneNumber,
            Email = NullIfBlank(req.Email),
            Address = NullIfBlank(req.Address),
            City = NullIfBlank(req.City),
            State = NullIfBlank(req.State),
            Pincode = NullIfBlank(req.Pincode),
            BloodGroupId = req.BloodGroupId,
            Notes = NullIfBlank(req.Notes)
        };

        db.Patients.Add(patient);
        await db.SaveChangesAsync();

        var loaded = await db.Patients
            .Include(p => p.Gender)
            .Include(p => p.BloodGroup)
            .FirstAsync(p => p.Id == patient.Id);
        return CreatedAtAction(nameof(GetById), new { id = loaded.PublicId }, ToResponse(loaded));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<PatientResponse>> Update(Guid id, PatientRequest req)
    {
        var patient = await db.Patients
            .Include(p => p.Gender)
            .Include(p => p.BloodGroup)
            .FirstOrDefaultAsync(p => p.PublicId == id);
        if (patient is null) return NotFound();

        if (await ValidateBusinessRules(req) is { } problem) return problem;

        patient.FirstName = req.FirstName.Trim();
        patient.MiddleName = NullIfBlank(req.MiddleName);
        patient.LastName = req.LastName.Trim();
        patient.DateOfBirth = req.DateOfBirth;
        patient.GenderId = req.GenderId;
        patient.CountryCode = req.CountryCode;
        patient.PhoneNumber = req.PhoneNumber;
        patient.Email = NullIfBlank(req.Email);
        patient.Address = NullIfBlank(req.Address);
        patient.City = NullIfBlank(req.City);
        patient.State = NullIfBlank(req.State);
        patient.Pincode = NullIfBlank(req.Pincode);
        patient.BloodGroupId = req.BloodGroupId;
        patient.Notes = NullIfBlank(req.Notes);

        await db.SaveChangesAsync();

        await db.Entry(patient).Reference(p => p.Gender).LoadAsync();
        if (patient.BloodGroupId.HasValue)
            await db.Entry(patient).Reference(p => p.BloodGroup).LoadAsync();

        return ToResponse(patient);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var patient = await db.Patients.FirstOrDefaultAsync(p => p.PublicId == id);
        if (patient is null) return NotFound();

        db.Patients.Remove(patient);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // Cross-field / referential rules that data annotations can't express.
    private async Task<ActionResult?> ValidateBusinessRules(PatientRequest req)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (req.DateOfBirth > today)
            ModelState.AddModelError(nameof(req.DateOfBirth), "Date of birth cannot be in the future.");
        if (req.DateOfBirth.Year < 1900)
            ModelState.AddModelError(nameof(req.DateOfBirth), "Date of birth year must be 1900 or later.");

        var genderValid = await db.StaticValues.AnyAsync(v =>
            v.Id == req.GenderId && v.IsActive && v.StaticType.Code == "GENDER");
        if (!genderValid)
            ModelState.AddModelError(nameof(req.GenderId), "Gender is not a valid option.");

        if (req.BloodGroupId.HasValue)
        {
            var bgValid = await db.StaticValues.AnyAsync(v =>
                v.Id == req.BloodGroupId && v.IsActive && v.StaticType.Code == "BLOOD_GROUP");
            if (!bgValid)
                ModelState.AddModelError(nameof(req.BloodGroupId), "Blood group is not a valid option.");
        }

        return ModelState.IsValid ? null : ValidationProblem(ModelState);
    }

    private static string? NullIfBlank(string? s) =>
        string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    private static PatientResponse ToResponse(Patient p) => new(
        p.PublicId, p.FirstName, p.MiddleName, p.LastName, p.DateOfBirth,
        p.GenderId, p.Gender.DisplayValue,
        p.CountryCode, p.PhoneNumber, p.Email,
        p.Address, p.City, p.State, p.Pincode,
        p.BloodGroupId, p.BloodGroup?.DisplayValue,
        p.Notes, p.CreatedAt);
}
