using Microsoft.EntityFrameworkCore;

namespace CmsApi.Data;

public static class PublicIdExtensions
{
    /// <summary>
    /// Resolves an external UUID to the internal sequential int key so subsequent
    /// queries filter/join on the int FK columns instead of joining on uuid.
    /// </summary>
    public static Task<int?> ResolveIdAsync<T>(this DbSet<T> set, Guid publicId) where T : class =>
        set.Where(e => EF.Property<Guid>(e, "PublicId") == publicId)
           .Select(e => (int?)EF.Property<int>(e, "Id"))
           .FirstOrDefaultAsync();
}
