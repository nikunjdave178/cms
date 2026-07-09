using CmsApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Data;

/// <summary>
/// Generates the next auto-number for a configured entity type
/// (<see cref="NumberSequence"/>), formatted as Prefix + zero-padded value + Suffix.
/// </summary>
public class NumberSequenceService(AppDbContext db)
{
    public const string Patient = "PATIENT";
    public const string Invoice = "INVOICE";

    /// <summary>
    /// Atomically increments the named sequence and returns the formatted
    /// number. Concurrency-safe: `SELECT ... FOR UPDATE` takes a row lock so
    /// concurrent callers serialize on the increment — no two callers can
    /// ever receive the same value. If the caller's insert subsequently
    /// fails, the number is simply skipped (a gap), matching standard
    /// invoice/document numbering behaviour — numbers are never reused.
    /// </summary>
    public async Task<string> GenerateNextAsync(string entityType)
    {
        await using var tx = await db.Database.BeginTransactionAsync();

        var seq = await db.NumberSequences
            .FromSqlInterpolated($"""SELECT * FROM "NumberSequences" WHERE "EntityType" = {entityType} FOR UPDATE""")
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException($"No number sequence configured for '{entityType}'.");

        seq.CurrentValue++;
        seq.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        await tx.CommitAsync();

        return Format(seq, seq.CurrentValue);
    }

    public static string Format(NumberSequence seq, long value) =>
        $"{seq.Prefix}{value.ToString().PadLeft(seq.PaddingWidth, '0')}{seq.Suffix}";
}
