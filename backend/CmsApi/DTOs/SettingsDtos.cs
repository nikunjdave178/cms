using System.ComponentModel.DataAnnotations;

namespace CmsApi.Dtos;

public record NumberSequenceResponse(
    string EntityType,
    string DisplayName,
    string? Prefix,
    string? Suffix,
    long CurrentValue,
    int PaddingWidth,
    string NextPreview,
    DateTime UpdatedAt
);

public record NumberSequenceUpdateRequest(
    [MaxLength(20, ErrorMessage = "Prefix cannot exceed 20 characters.")]
    string? Prefix,

    [MaxLength(20, ErrorMessage = "Suffix cannot exceed 20 characters.")]
    string? Suffix,

    [Range(1, 10, ErrorMessage = "Padding must be between 1 and 10 digits.")]
    int PaddingWidth,

    [Range(0, long.MaxValue, ErrorMessage = "Current value cannot be negative.")]
    long CurrentValue
);
