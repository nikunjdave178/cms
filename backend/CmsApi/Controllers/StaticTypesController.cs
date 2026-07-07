using CmsApi.Data;
using CmsApi.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Controllers;

[ApiController]
[Route("api/static-types")]
[Authorize]
public class StaticTypesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IEnumerable<StaticTypeResponse>> GetAll()
    {
        var types = await db.StaticTypes
            .Include(t => t.Values.Where(v => v.IsActive).OrderBy(v => v.SortOrder))
            .OrderBy(t => t.Id)
            .ToListAsync();

        return types.Select(t => new StaticTypeResponse(
            t.Id, t.Code, t.Description,
            t.Values.Select(v => new StaticValueResponse(v.Id, v.Code, v.DisplayValue, v.SortOrder))));
    }

    [HttpGet("{code}/values")]
    public async Task<ActionResult<IEnumerable<StaticValueResponse>>> GetValues(string code)
    {
        var type = await db.StaticTypes
            .Include(t => t.Values.Where(v => v.IsActive).OrderBy(v => v.SortOrder))
            .FirstOrDefaultAsync(t => t.Code == code.ToUpper());

        if (type is null) return NotFound();

        return Ok(type.Values.Select(v => new StaticValueResponse(v.Id, v.Code, v.DisplayValue, v.SortOrder)));
    }
}
