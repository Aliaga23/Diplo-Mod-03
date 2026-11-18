import { z } from "zod";

// Cuerpo de POST /internal/notifications/order-confirmed (docs/contratos-api.md §4.6).
export const OrderConfirmedBody = z.object({
  to: z.email(),
  name: z.string().min(1),
  orderId: z.string().min(1),
  eventName: z.string().min(1),
  eventDate: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Fecha ISO-8601 inválida"),
  venue: z.string().min(1),
  sectorName: z.string().min(1),
  quantity: z.number().int().min(1).max(6),
  total: z.number().nonnegative(),
  ticketCodes: z.array(z.string().min(1)).min(1),
});

export type OrderConfirmed = z.infer<typeof OrderConfirmedBody>;
