using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CmsApi.Migrations
{
    /// <inheritdoc />
    public partial class AddPublicIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PublicId",
                table: "Vitals",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<Guid>(
                name: "PublicId",
                table: "Users",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<Guid>(
                name: "PublicId",
                table: "Patients",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<Guid>(
                name: "PublicId",
                table: "Invoices",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<Guid>(
                name: "PublicId",
                table: "InvoiceItems",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<Guid>(
                name: "PublicId",
                table: "Doctors",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<Guid>(
                name: "PublicId",
                table: "Appointments",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.CreateIndex(
                name: "IX_Vitals_PublicId",
                table: "Vitals",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_PublicId",
                table: "Users",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Patients_PublicId",
                table: "Patients",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_PublicId",
                table: "Invoices",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceItems_PublicId",
                table: "InvoiceItems",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Doctors_PublicId",
                table: "Doctors",
                column: "PublicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_PublicId",
                table: "Appointments",
                column: "PublicId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Vitals_PublicId",
                table: "Vitals");

            migrationBuilder.DropIndex(
                name: "IX_Users_PublicId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Patients_PublicId",
                table: "Patients");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_PublicId",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_InvoiceItems_PublicId",
                table: "InvoiceItems");

            migrationBuilder.DropIndex(
                name: "IX_Doctors_PublicId",
                table: "Doctors");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_PublicId",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "Vitals");

            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "InvoiceItems");

            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "Appointments");
        }
    }
}
