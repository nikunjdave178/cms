using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace CmsApi.Migrations
{
    /// <inheritdoc />
    public partial class AddNumberSequences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PatientNumber",
                table: "Patients",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "InvoiceNumber",
                table: "Invoices",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            // Backfill existing rows with sequential reference numbers, in
            // creation order, before the unique indexes below are created.
            migrationBuilder.Sql("""
                UPDATE "Patients" p
                SET "PatientNumber" = sub.num
                FROM (
                    SELECT "Id", 'PAT-' || LPAD(ROW_NUMBER() OVER (ORDER BY "CreatedAt")::text, 4, '0') AS num
                    FROM "Patients"
                ) sub
                WHERE p."Id" = sub."Id";
                """);

            migrationBuilder.Sql("""
                UPDATE "Invoices" i
                SET "InvoiceNumber" = sub.num
                FROM (
                    SELECT "Id", 'INV-' || LPAD(ROW_NUMBER() OVER (ORDER BY "IssuedAt")::text, 5, '0') AS num
                    FROM "Invoices"
                ) sub
                WHERE i."Id" = sub."Id";
                """);

            migrationBuilder.CreateTable(
                name: "NumberSequences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EntityType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Prefix = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Suffix = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CurrentValue = table.Column<long>(type: "bigint", nullable: false),
                    PaddingWidth = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NumberSequences", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "NumberSequences",
                columns: new[] { "Id", "CurrentValue", "DisplayName", "EntityType", "PaddingWidth", "Prefix", "Suffix", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, 0L, "Patient Number", "PATIENT", 4, "PAT-", null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 2, 0L, "Invoice Number", "INVOICE", 5, "INV-", null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Patients_PatientNumber",
                table: "Patients",
                column: "PatientNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_InvoiceNumber",
                table: "Invoices",
                column: "InvoiceNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NumberSequences_EntityType",
                table: "NumberSequences",
                column: "EntityType",
                unique: true);

            // Sync each sequence's CurrentValue to the count just backfilled,
            // so the next generated number continues on from there.
            migrationBuilder.Sql("""
                UPDATE "NumberSequences" SET "CurrentValue" = (SELECT COUNT(*) FROM "Patients") WHERE "EntityType" = 'PATIENT';
                UPDATE "NumberSequences" SET "CurrentValue" = (SELECT COUNT(*) FROM "Invoices") WHERE "EntityType" = 'INVOICE';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NumberSequences");

            migrationBuilder.DropIndex(
                name: "IX_Patients_PatientNumber",
                table: "Patients");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_InvoiceNumber",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "PatientNumber",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "InvoiceNumber",
                table: "Invoices");
        }
    }
}
