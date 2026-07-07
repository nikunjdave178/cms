namespace CmsApi.Dtos;

public record LoginRequest(string Email, string Password);

public record LoginResponse(string Token, DateTime ExpiresAt, UserResponse User);

public record UserResponse(
    int Id,
    string FullName,
    string Email,
    string Role,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateUserRequest(string FullName, string Email, string Password, string Role);

public record UpdateUserRequest(string FullName, string Role, bool IsActive, string? Password);
