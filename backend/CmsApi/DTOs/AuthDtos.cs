using System.ComponentModel.DataAnnotations;

namespace CmsApi.Dtos;

public record LoginRequest(
    [Required] [EmailAddress] string Email,
    [Required] string Password
);

public record LoginResponse(string Token, DateTime ExpiresAt, UserResponse User);

public record UserResponse(
    Guid Id,
    string FullName,
    string Email,
    string Role,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateUserRequest(
    [Required(AllowEmptyStrings = false)] [MaxLength(150)] string FullName,
    [Required] [EmailAddress] [MaxLength(255)] string Email,
    [Required] [MinLength(8, ErrorMessage = "Password must be at least 8 characters.")] string Password,
    [Required] string Role
);

public record UpdateUserRequest(
    [Required(AllowEmptyStrings = false)] [MaxLength(150)] string FullName,
    [Required] string Role,
    bool IsActive,
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters.")] string? Password
);
