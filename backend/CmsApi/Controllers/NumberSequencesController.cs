using CmsApi.Data;
using CmsApi.Dtos;
using CmsApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Controllers;

/// <summary>
/// Auto-number setup: lets an Admin configure the prefix, suffix, padding,
/// and current value used to generate reference numbers (Patient Number,
/// Invoice Number, …) for each entity type.
/// </summary>
[ApiController]
[Route("api/settings/number-sequences")]
[Authorize(Roles = Roles.Admin)]
public class NumberSequencesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IEnumerable<NumberSequenceResponse>> GetAll()
    {
        var sequences = await db.NumberSequences.OrderBy(s => s.DisplayName).ToListAsync();
        return sequences.Select(ToResponse);
    }

    [HttpPut("{entityType}")]
    public async Task<ActionResult<NumberSequenceResponse>> Update(string entityType, NumberSequenceUpdateRequest req)
    {
        var seq = await db.NumberSequences.FirstOrDefaultAsync(s => s.EntityType == entityType.ToUpper());
        if (seq is null) return NotFound();

        seq.Prefix = string.IsNullOrWhiteSpace(req.Prefix) ? null : req.Prefix.Trim();
        seq.Suffix = string.IsNullOrWhiteSpace(req.Suffix) ? null : req.Suffix.Trim();
        seq.PaddingWidth = req.PaddingWidth;
        seq.CurrentValue = req.CurrentValue;
        seq.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return ToResponse(seq);
    }

    private static NumberSequenceResponse ToResponse(NumberSequence s) => new(
        s.EntityType, s.DisplayName, s.Prefix, s.Suffix, s.CurrentValue, s.PaddingWidth,
        NumberSequenceService.Format(s, s.CurrentValue + 1), s.UpdatedAt);
}
