using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CmsApi.Migrations
{
    /// <inheritdoc />
    public partial class AddPatientCountry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Country",
                table: "Patients",
                type: "text",
                nullable: true);

            // Existing patients were registered with Indian addresses.
            migrationBuilder.Sql("UPDATE \"Patients\" SET \"Country\" = 'India';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Country",
                table: "Patients");
        }
    }
}
