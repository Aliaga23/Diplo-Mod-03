using Microsoft.EntityFrameworkCore;
using Orders.Domain;

namespace Orders.Infrastructure.Db;

public class OrdersDbContext(DbContextOptions<OrdersDbContext> options) : DbContext(options)
{
    public DbSet<Order> Orders => Set<Order>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<Order>(order =>
        {
            order.ToTable("orders");
            order.HasKey(o => o.Id);
            order.Property(o => o.UserId).HasMaxLength(64).IsRequired();
            order.Property(o => o.UserEmail).HasMaxLength(254).IsRequired();
            order.Property(o => o.UserName).HasMaxLength(120).IsRequired();
            order.Property(o => o.EventId).HasMaxLength(64).IsRequired();
            order.Property(o => o.SectorId).HasMaxLength(64).IsRequired();
            order.Property(o => o.EventName).HasMaxLength(200);
            order.Property(o => o.Venue).HasMaxLength(200);
            order.Property(o => o.SectorName).HasMaxLength(100);
            order.Property(o => o.UnitPrice).HasPrecision(10, 2);
            order.Property(o => o.Total).HasPrecision(10, 2);
            order.Property(o => o.Status).HasMaxLength(20).IsRequired();
            order.Property(o => o.Reason).HasMaxLength(200);
            order.ToTable(t => t.HasCheckConstraint("ck_orders_quantity", "quantity BETWEEN 1 AND 6"));

            order.HasIndex(o => o.UserId);
            order.HasIndex(o => new { o.EventId, o.Status });
        });
    }
}
