using System.Linq.Expressions;
using System.Reflection;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Data;

/// <summary>
/// Blocks deleting an entity that other rows still depend on, with a friendly
/// message, instead of letting the database's raw FK-violation surface to the
/// user. A foreign key is "guarded" simply by being left at the EF default —
/// i.e. configured (or left) as <see cref="DeleteBehavior.Restrict"/> in
/// <see cref="AppDbContext.OnModelCreating"/>. Relationships that should NOT
/// block a delete (children that should cascade, or FKs that should null out)
/// are the explicit opt-out: configure them as Cascade/SetNull there instead —
/// this service only checks Restrict-configured foreign keys.
/// </summary>
public class DeleteGuardService(AppDbContext db)
{
    private static readonly MethodInfo AnyReferencingGenericMethod = typeof(DeleteGuardService)
        .GetMethods(BindingFlags.Instance | BindingFlags.NonPublic)
        .Single(m => m.Name == nameof(AnyReferencingAsync) && m.IsGenericMethodDefinition);

    private static readonly Dictionary<Type, string> DependentDisplayNames = new()
    {
        [typeof(Models.Appointment)] = "appointments",
        [typeof(Models.Invoice)] = "invoices",
    };

    /// <summary>
    /// Checks whether <paramref name="entity"/> is still referenced by another
    /// row through a Restrict-configured foreign key. Returns a friendly
    /// "{label} cannot be deleted as it has been used in {things}." message if
    /// so, otherwise null (safe to delete).
    /// </summary>
    public async Task<string?> FindBlockingReferenceAsync<TEntity>(TEntity entity, string label) where TEntity : class
    {
        var principalType = db.Model.FindEntityType(typeof(TEntity))
            ?? throw new InvalidOperationException($"{typeof(TEntity).Name} is not part of the EF model.");
        var id = db.Entry(entity).Property<int>("Id").CurrentValue;

        var guardedForeignKeys = db.Model.GetEntityTypes()
            .SelectMany(et => et.GetForeignKeys())
            .Where(fk => fk.PrincipalEntityType == principalType
                      && fk.DeleteBehavior == DeleteBehavior.Restrict
                      && fk.Properties.Count == 1);

        foreach (var fk in guardedForeignKeys)
        {
            var dependentType = fk.DeclaringEntityType.ClrType;
            var method = AnyReferencingGenericMethod.MakeGenericMethod(dependentType);
            var hasAny = await (Task<bool>)method.Invoke(this, [fk.Properties[0].Name, id])!;
            if (hasAny)
                return $"{label} cannot be deleted as it has been used in {DisplayName(dependentType)}.";
        }

        return null;
    }

    private async Task<bool> AnyReferencingAsync<TDependent>(string fkProperty, int id) where TDependent : class
    {
        var param = Expression.Parameter(typeof(TDependent), "e");
        var fkValue = Expression.Convert(Expression.Property(param, fkProperty), typeof(int?));
        var predicate = Expression.Lambda<Func<TDependent, bool>>(
            Expression.Equal(fkValue, Expression.Constant((int?)id, typeof(int?))), param);

        return await db.Set<TDependent>().AnyAsync(predicate);
    }

    private static string DisplayName(Type dependentType) =>
        DependentDisplayNames.TryGetValue(dependentType, out var name) ? name : dependentType.Name.ToLowerInvariant() + "s";
}
