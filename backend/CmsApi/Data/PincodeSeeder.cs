using CmsApi.Models;

namespace CmsApi.Data;

public static class PincodeSeeder
{
    /// <summary>
    /// Loads the cleaned pincode directory CSV into the database on first run
    /// (skipped when the table is already populated).
    /// </summary>
    public static void Seed(AppDbContext db, string contentRootPath)
    {
        if (db.PincodeDirectory.Any()) return;

        var path = Path.Combine(contentRootPath, "Data", "Seed", "pincodes.csv");
        if (!File.Exists(path)) return;

        var batch = new List<PincodeEntry>(5000);
        foreach (var line in File.ReadLines(path).Skip(1))
        {
            var parts = line.Split(',');
            if (parts.Length != 3) continue;
            batch.Add(new PincodeEntry { Pincode = parts[0], City = parts[1], State = parts[2] });

            if (batch.Count == 5000)
            {
                db.PincodeDirectory.AddRange(batch);
                db.SaveChanges();
                db.ChangeTracker.Clear();
                batch.Clear();
            }
        }
        if (batch.Count > 0)
        {
            db.PincodeDirectory.AddRange(batch);
            db.SaveChanges();
            db.ChangeTracker.Clear();
        }
    }
}
