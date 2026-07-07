namespace CmsApi.Models;

public static class Roles
{
    public const string Admin = "Admin";
    public const string Doctor = "Doctor";
    public const string Receptionist = "Receptionist";

    public static readonly string[] All = [Admin, Doctor, Receptionist];

    // Comma-separated combos for use in [Authorize(Roles = ...)]
    public const string AdminDoctor = "Admin,Doctor";
    public const string AdminReceptionist = "Admin,Receptionist";
}
