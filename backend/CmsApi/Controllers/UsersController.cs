using CmsApi.Data;
using CmsApi.Dtos;
using CmsApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = Roles.Admin)]
public class UsersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResponse<UserResponse>>> GetAll(
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        var desc = sort is { Length: > 0 } && sort[0] == '-';
        var query = desc ? db.Users.OrderByDescending(u => u.FullName) : db.Users.OrderBy(u => u.FullName);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => ToResponse(u))
            .ToListAsync();

        return Ok(new PagedResponse<UserResponse>(items, page, pageSize, totalCount));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserResponse>> GetById(Guid id)
    {
        var u = await db.Users.FirstOrDefaultAsync(u => u.PublicId == id);
        return u is null ? NotFound() : ToResponse(u);
    }

    [HttpPost]
    public async Task<ActionResult<UserResponse>> Create(CreateUserRequest req)
    {
        if (!Roles.All.Contains(req.Role))
            return BadRequest("Invalid role.");

        if (await db.Users.AnyAsync(u => u.Email.ToLower() == req.Email.ToLower()))
            return Conflict("A user with this email already exists.");

        var user = new User
        {
            FullName = req.FullName,
            Email = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = req.Role,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = user.PublicId }, ToResponse(user));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UserResponse>> Update(Guid id, UpdateUserRequest req)
    {
        if (!Roles.All.Contains(req.Role))
            return BadRequest("Invalid role.");

        var user = await db.Users.FirstOrDefaultAsync(u => u.PublicId == id);
        if (user is null) return NotFound();

        if (user is { Role: Roles.Admin, IsActive: true } && (req.Role != Roles.Admin || !req.IsActive)
            && await db.Users.CountAsync(u => u.Role == Roles.Admin && u.IsActive) <= 1)
            return BadRequest("Cannot remove the last active admin.");

        user.FullName = req.FullName;
        user.Role = req.Role;
        user.IsActive = req.IsActive;
        if (!string.IsNullOrWhiteSpace(req.Password))
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);

        await db.SaveChangesAsync();
        return ToResponse(user);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.PublicId == id);
        if (user is null) return NotFound();

        if (user is { Role: Roles.Admin, IsActive: true }
            && await db.Users.CountAsync(u => u.Role == Roles.Admin && u.IsActive) <= 1)
            return BadRequest("Cannot delete the last active admin.");

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static UserResponse ToResponse(User u) =>
        new(u.PublicId, u.FullName, u.Email, u.Role, u.IsActive, u.CreatedAt);
}
