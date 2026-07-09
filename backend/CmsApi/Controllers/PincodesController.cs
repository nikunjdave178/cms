using CmsApi.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Controllers;

public record PincodeResponse(string Pincode, string City, string State);

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PincodesController(AppDbContext db) : ControllerBase
{
    /// <summary>Exact lookup of a 6-digit PIN → city/state.</summary>
    [HttpGet("{pin}")]
    public async Task<ActionResult<PincodeResponse>> Lookup(string pin)
    {
        if (pin.Length != 6 || !pin.All(char.IsAsciiDigit))
            return BadRequest("PIN must be exactly 6 digits.");

        var entry = await db.PincodeDirectory
            .Where(p => p.Pincode == pin)
            .Select(p => new PincodeResponse(p.Pincode, p.City, p.State))
            .FirstOrDefaultAsync();
        return entry is null ? NotFound() : entry;
    }

    /// <summary>Prefix suggestions for the zip datalist (2–6 digits).</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PincodeResponse>>> Suggest(
        [FromQuery] string prefix, [FromQuery] int limit = 10)
    {
        if (string.IsNullOrEmpty(prefix) || prefix.Length < 2 || prefix.Length > 6 || !prefix.All(char.IsAsciiDigit))
            return Ok(Array.Empty<PincodeResponse>());

        limit = Math.Clamp(limit, 1, 20);
        return Ok(await db.PincodeDirectory
            .Where(p => p.Pincode.StartsWith(prefix))
            .OrderBy(p => p.Pincode)
            .Take(limit)
            .Select(p => new PincodeResponse(p.Pincode, p.City, p.State))
            .ToListAsync());
    }
}
