using CmsApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CmsApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<StaticType> StaticTypes => Set<StaticType>();
    public DbSet<StaticValue> StaticValues => Set<StaticValue>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<Vitals> Vitals => Set<Vitals>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Business entities carry a UUID PublicId for external identity (API surface)
        // while keeping sequential int PKs internally for cheap FK joins.
        ConfigurePublicId<Patient>(modelBuilder);
        ConfigurePublicId<Doctor>(modelBuilder);
        ConfigurePublicId<Appointment>(modelBuilder);
        ConfigurePublicId<Invoice>(modelBuilder);
        ConfigurePublicId<InvoiceItem>(modelBuilder);
        ConfigurePublicId<Vitals>(modelBuilder);
        ConfigurePublicId<User>(modelBuilder);

        // Patient → Gender (StaticValue)
        modelBuilder.Entity<Patient>()
            .HasOne(p => p.Gender)
            .WithMany()
            .HasForeignKey(p => p.GenderId)
            .OnDelete(DeleteBehavior.Restrict);

        // Patient → BloodGroup (StaticValue, nullable)
        modelBuilder.Entity<Patient>()
            .HasOne(p => p.BloodGroup)
            .WithMany()
            .HasForeignKey(p => p.BloodGroupId)
            .OnDelete(DeleteBehavior.Restrict);

        // Appointment → Status (StaticValue)
        modelBuilder.Entity<Appointment>()
            .HasOne(a => a.Status)
            .WithMany()
            .HasForeignKey(a => a.StatusId)
            .OnDelete(DeleteBehavior.Restrict);

        // Appointment → Vitals (one-to-one)
        modelBuilder.Entity<Appointment>()
            .HasOne(a => a.Vitals)
            .WithOne(v => v.Appointment)
            .HasForeignKey<Vitals>(v => v.AppointmentId)
            .OnDelete(DeleteBehavior.Cascade);

        // Invoice → Status (StaticValue)
        modelBuilder.Entity<Invoice>()
            .HasOne(i => i.Status)
            .WithMany()
            .HasForeignKey(i => i.StatusId)
            .OnDelete(DeleteBehavior.Restrict);

        // Invoice → PaymentMode (StaticValue, nullable)
        modelBuilder.Entity<Invoice>()
            .HasOne(i => i.PaymentMode)
            .WithMany()
            .HasForeignKey(i => i.PaymentModeId)
            .OnDelete(DeleteBehavior.Restrict);

        // Invoice → Appointment (one-to-one, optional)
        modelBuilder.Entity<Invoice>()
            .HasOne(i => i.Appointment)
            .WithOne(a => a.Invoice)
            .HasForeignKey<Invoice>(i => i.AppointmentId)
            .OnDelete(DeleteBehavior.SetNull);

        // Invoice → InvoiceItems
        modelBuilder.Entity<Invoice>()
            .HasMany(i => i.Items)
            .WithOne(item => item.Invoice)
            .HasForeignKey(item => item.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);

        // User → unique email
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Decimal precision
        modelBuilder.Entity<Invoice>().Property(i => i.SubtotalAmount).HasPrecision(18, 2);
        modelBuilder.Entity<Invoice>().Property(i => i.GstAmount).HasPrecision(18, 2);
        modelBuilder.Entity<Invoice>().Property(i => i.TotalAmount).HasPrecision(18, 2);
        modelBuilder.Entity<Invoice>().Property(i => i.GstRate).HasPrecision(5, 2);
        modelBuilder.Entity<InvoiceItem>().Property(i => i.UnitPrice).HasPrecision(18, 2);
        modelBuilder.Entity<Vitals>().Property(v => v.BloodPressureSystolic).HasPrecision(5, 1);
        modelBuilder.Entity<Vitals>().Property(v => v.BloodPressureDiastolic).HasPrecision(5, 1);
        modelBuilder.Entity<Vitals>().Property(v => v.PulseRate).HasPrecision(5, 1);
        modelBuilder.Entity<Vitals>().Property(v => v.Temperature).HasPrecision(4, 1);
        modelBuilder.Entity<Vitals>().Property(v => v.WeightKg).HasPrecision(5, 2);
        modelBuilder.Entity<Vitals>().Property(v => v.HeightCm).HasPrecision(5, 1);
        modelBuilder.Entity<Vitals>().Property(v => v.OxygenSaturation).HasPrecision(4, 1);

        // Seed StaticTypes
        modelBuilder.Entity<StaticType>().HasData(
            new StaticType { Id = 1, Code = "GENDER", Description = "Patient Gender" },
            new StaticType { Id = 2, Code = "BLOOD_GROUP", Description = "Blood Group" },
            new StaticType { Id = 3, Code = "APPOINTMENT_STATUS", Description = "Appointment Status" },
            new StaticType { Id = 4, Code = "INVOICE_STATUS", Description = "Invoice Status" },
            new StaticType { Id = 5, Code = "PAYMENT_MODE", Description = "Payment Mode" }
        );

        // Seed StaticValues
        modelBuilder.Entity<StaticValue>().HasData(
            // Gender
            new StaticValue { Id = 1, StaticTypeId = 1, Code = "MALE", DisplayValue = "Male", SortOrder = 1 },
            new StaticValue { Id = 2, StaticTypeId = 1, Code = "FEMALE", DisplayValue = "Female", SortOrder = 2 },
            new StaticValue { Id = 3, StaticTypeId = 1, Code = "OTHER", DisplayValue = "Other", SortOrder = 3 },
            // Blood Group
            new StaticValue { Id = 4, StaticTypeId = 2, Code = "A_PLUS", DisplayValue = "A+", SortOrder = 1 },
            new StaticValue { Id = 5, StaticTypeId = 2, Code = "A_MINUS", DisplayValue = "A-", SortOrder = 2 },
            new StaticValue { Id = 6, StaticTypeId = 2, Code = "B_PLUS", DisplayValue = "B+", SortOrder = 3 },
            new StaticValue { Id = 7, StaticTypeId = 2, Code = "B_MINUS", DisplayValue = "B-", SortOrder = 4 },
            new StaticValue { Id = 8, StaticTypeId = 2, Code = "AB_PLUS", DisplayValue = "AB+", SortOrder = 5 },
            new StaticValue { Id = 9, StaticTypeId = 2, Code = "AB_MINUS", DisplayValue = "AB-", SortOrder = 6 },
            new StaticValue { Id = 10, StaticTypeId = 2, Code = "O_PLUS", DisplayValue = "O+", SortOrder = 7 },
            new StaticValue { Id = 11, StaticTypeId = 2, Code = "O_MINUS", DisplayValue = "O-", SortOrder = 8 },
            // Appointment Status
            new StaticValue { Id = 12, StaticTypeId = 3, Code = "SCHEDULED", DisplayValue = "Scheduled", SortOrder = 1 },
            new StaticValue { Id = 13, StaticTypeId = 3, Code = "COMPLETED", DisplayValue = "Completed", SortOrder = 2 },
            new StaticValue { Id = 14, StaticTypeId = 3, Code = "CANCELLED", DisplayValue = "Cancelled", SortOrder = 3 },
            new StaticValue { Id = 15, StaticTypeId = 3, Code = "NO_SHOW", DisplayValue = "No Show", SortOrder = 4 },
            // Invoice Status
            new StaticValue { Id = 16, StaticTypeId = 4, Code = "PENDING", DisplayValue = "Pending", SortOrder = 1 },
            new StaticValue { Id = 17, StaticTypeId = 4, Code = "PAID", DisplayValue = "Paid", SortOrder = 2 },
            new StaticValue { Id = 18, StaticTypeId = 4, Code = "CANCELLED", DisplayValue = "Cancelled", SortOrder = 3 },
            // Payment Mode
            new StaticValue { Id = 19, StaticTypeId = 5, Code = "CASH", DisplayValue = "Cash", SortOrder = 1 },
            new StaticValue { Id = 20, StaticTypeId = 5, Code = "UPI", DisplayValue = "UPI", SortOrder = 2 },
            new StaticValue { Id = 21, StaticTypeId = 5, Code = "CARD", DisplayValue = "Card", SortOrder = 3 },
            new StaticValue { Id = 22, StaticTypeId = 5, Code = "NET_BANKING", DisplayValue = "Net Banking", SortOrder = 4 },
            new StaticValue { Id = 23, StaticTypeId = 5, Code = "INSURANCE", DisplayValue = "Insurance", SortOrder = 5 }
        );
    }

    private static void ConfigurePublicId<TEntity>(ModelBuilder modelBuilder) where TEntity : class
    {
        modelBuilder.Entity<TEntity>()
            .Property<Guid>("PublicId")
            .HasDefaultValueSql("gen_random_uuid()");
        modelBuilder.Entity<TEntity>()
            .HasIndex("PublicId")
            .IsUnique();
    }
}
