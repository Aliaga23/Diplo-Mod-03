using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Orders.Infrastructure.Db.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "orders",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    user_email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                    user_name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    event_id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    sector_id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    event_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    event_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    venue = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    sector_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    total = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    reason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    email_sent = table.Column<bool>(type: "boolean", nullable: false),
                    ticket_codes = table.Column<List<string>>(type: "text[]", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_orders", x => x.id);
                    table.CheckConstraint("ck_orders_quantity", "quantity BETWEEN 1 AND 6");
                });

            migrationBuilder.CreateIndex(
                name: "ix_orders_event_id_status",
                table: "orders",
                columns: new[] { "event_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_orders_user_id",
                table: "orders",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "orders");
        }
    }
}
