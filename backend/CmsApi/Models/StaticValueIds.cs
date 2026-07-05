namespace CmsApi.Models;

public static class StaticValueIds
{
    public static class Gender
    {
        public const int Male = 1;
        public const int Female = 2;
        public const int Other = 3;
    }

    public static class BloodGroup
    {
        public const int APlus = 4;
        public const int AMinus = 5;
        public const int BPlus = 6;
        public const int BMinus = 7;
        public const int ABPlus = 8;
        public const int ABMinus = 9;
        public const int OPlus = 10;
        public const int OMinus = 11;
    }

    public static class AppointmentStatus
    {
        public const int Scheduled = 12;
        public const int Completed = 13;
        public const int Cancelled = 14;
        public const int NoShow = 15;
    }

    public static class InvoiceStatus
    {
        public const int Pending = 16;
        public const int Paid = 17;
        public const int Cancelled = 18;
    }

    public static class PaymentMode
    {
        public const int Cash = 19;
        public const int Upi = 20;
        public const int Card = 21;
        public const int NetBanking = 22;
        public const int Insurance = 23;
    }
}
