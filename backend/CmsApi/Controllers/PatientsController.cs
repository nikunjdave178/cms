using System.Text;
using ClosedXML.Excel;
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
public class PatientsController(AppDbContext db, NumberSequenceService numberSequences, DeleteGuardService deleteGuard) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResponse<PatientResponse>>> GetAll([FromQuery] PatientListQuery q)
    {
        var page = q.Page < 1 ? 1 : q.Page;
        var pageSize = q.PageSize is < 1 or > 100 ? 20 : q.PageSize;

        var query = BuildFilteredQuery(q);
        var totalCount = await query.CountAsync();

        var items = await ApplySort(query, q.Sort)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => ToResponse(p))
            .ToListAsync();

        return Ok(new PagedResponse<PatientResponse>(items, page, pageSize, totalCount));
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export([FromQuery] PatientListQuery q, [FromQuery] string format = "csv")
    {
        var query = ApplySort(BuildFilteredQuery(q), q.Sort);
        var patients = await query.Select(p => ToResponse(p)).ToListAsync();
        var fileName = $"patients-{DateTime.UtcNow:yyyyMMdd-HHmmss}";

        return format.ToLowerInvariant() switch
        {
            "xlsx" => File(ToXlsx(patients), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"{fileName}.xlsx"),
            "csv" => File(Encoding.UTF8.GetBytes(ToCsv(patients)), "text/csv", $"{fileName}.csv"),
            _ => BadRequest("Format must be 'csv' or 'xlsx'."),
        };
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

        var patientNumber = await numberSequences.GenerateNextAsync(NumberSequenceService.Patient);

        var patient = new Patient
        {
            PatientNumber = patientNumber,
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
            Country = NullIfBlank(req.Country),
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
        patient.Country = NullIfBlank(req.Country);
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

        var label = $"Patient {FullName(patient.FirstName, patient.MiddleName, patient.LastName)}";
        if (await deleteGuard.FindBlockingReferenceAsync(patient, label) is { } reason)
            return Conflict(reason);

        db.Patients.Remove(patient);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // Shared by GetAll and Export so both page over exactly the same rows.
    private IQueryable<Patient> BuildFilteredQuery(PatientListQuery q)
    {
        var query = db.Patients
            .Include(p => p.Gender)
            .Include(p => p.BloodGroup)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.ToLower();
            query = query.Where(p =>
                p.PatientNumber.ToLower().Contains(s) ||
                p.FirstName.ToLower().Contains(s) ||
                p.LastName.ToLower().Contains(s) ||
                (p.MiddleName != null && p.MiddleName.ToLower().Contains(s)) ||
                p.PhoneNumber.Contains(s));
        }

        if (q.GenderId.HasValue) query = query.Where(p => p.GenderId == q.GenderId);
        if (q.BloodGroupId.HasValue) query = query.Where(p => p.BloodGroupId == q.BloodGroupId);

        if (!string.IsNullOrWhiteSpace(q.City))
        {
            var city = q.City.ToLower();
            query = query.Where(p => p.City != null && p.City.ToLower().Contains(city));
        }
        if (!string.IsNullOrWhiteSpace(q.State))
        {
            var state = q.State.ToLower();
            query = query.Where(p => p.State != null && p.State.ToLower().Contains(state));
        }

        if (q.RegisteredFrom.HasValue)
        {
            var from = q.RegisteredFrom.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            query = query.Where(p => p.CreatedAt >= from);
        }
        if (q.RegisteredTo.HasValue)
        {
            var to = q.RegisteredTo.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            query = query.Where(p => p.CreatedAt <= to);
        }

        return query;
    }

    // sort is `field` / `-field` (leading '-' = descending); unrecognized/absent falls back to newest-first.
    private static IQueryable<Patient> ApplySort(IQueryable<Patient> query, string? sort)
    {
        var desc = sort is { Length: > 0 } && sort[0] == '-';
        var field = (desc ? sort![1..] : sort ?? string.Empty).ToLowerInvariant();

        return field switch
        {
            "patientnumber" => desc ? query.OrderByDescending(p => p.PatientNumber) : query.OrderBy(p => p.PatientNumber),
            "name" => desc
                ? query.OrderByDescending(p => p.FirstName).ThenByDescending(p => p.LastName)
                : query.OrderBy(p => p.FirstName).ThenBy(p => p.LastName),
            "dob" => desc ? query.OrderByDescending(p => p.DateOfBirth) : query.OrderBy(p => p.DateOfBirth),
            "gender" => desc ? query.OrderByDescending(p => p.Gender.DisplayValue) : query.OrderBy(p => p.Gender.DisplayValue),
            "mobile" => desc ? query.OrderByDescending(p => p.PhoneNumber) : query.OrderBy(p => p.PhoneNumber),
            "city" => desc ? query.OrderByDescending(p => p.City) : query.OrderBy(p => p.City),
            "state" => desc ? query.OrderByDescending(p => p.State) : query.OrderBy(p => p.State),
            "bloodgroup" => desc ? query.OrderByDescending(p => p.BloodGroup!.DisplayValue) : query.OrderBy(p => p.BloodGroup!.DisplayValue),
            "registered" => desc ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
            _ => query.OrderByDescending(p => p.CreatedAt),
        };
    }

    private static string[] ExportHeaders =>
        ["Patient No.", "First Name", "Middle Name", "Last Name", "Date of Birth", "Gender",
         "Country Code", "Mobile", "Email", "Address", "City", "State", "Pincode", "Country",
         "Blood Group", "Registered"];

    private static object?[] ExportRow(PatientResponse p) =>
        [p.PatientNumber, p.FirstName, p.MiddleName, p.LastName, p.DateOfBirth.ToString("yyyy-MM-dd"),
         p.GenderDisplay, p.CountryCode, p.PhoneNumber, p.Email, p.Address, p.City, p.State,
         p.Pincode, p.Country, p.BloodGroupDisplay, p.CreatedAt.ToString("yyyy-MM-dd")];

    private static string ToCsv(IEnumerable<PatientResponse> patients)
    {
        var sb = new StringBuilder();
        sb.AppendLine(string.Join(',', ExportHeaders.Select(CsvEscape)));
        foreach (var p in patients)
            sb.AppendLine(string.Join(',', ExportRow(p).Select(v => CsvEscape(v?.ToString() ?? string.Empty))));
        return sb.ToString();
    }

    private static string CsvEscape(string field) =>
        field.IndexOfAny([',', '"', '\n', '\r']) >= 0
            ? $"\"{field.Replace("\"", "\"\"")}\""
            : field;

    private static byte[] ToXlsx(IEnumerable<PatientResponse> patients)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Patients");

        for (var c = 0; c < ExportHeaders.Length; c++)
            sheet.Cell(1, c + 1).Value = ExportHeaders[c];
        sheet.Row(1).Style.Font.Bold = true;

        var row = 2;
        foreach (var p in patients)
        {
            var values = ExportRow(p);
            for (var c = 0; c < values.Length; c++)
                sheet.Cell(row, c + 1).Value = values[c]?.ToString() ?? string.Empty;
            row++;
        }

        sheet.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
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

    private static string FullName(string first, string? middle, string last) =>
        string.IsNullOrWhiteSpace(middle) ? $"{first} {last}" : $"{first} {middle} {last}";

    private static PatientResponse ToResponse(Patient p) => new(
        p.PublicId, p.PatientNumber, p.FirstName, p.MiddleName, p.LastName, p.DateOfBirth,
        p.GenderId, p.Gender.DisplayValue,
        p.CountryCode, p.PhoneNumber, p.Email,
        p.Address, p.City, p.State, p.Pincode, p.Country,
        p.BloodGroupId, p.BloodGroup?.DisplayValue,
        p.Notes, p.CreatedAt);
}
