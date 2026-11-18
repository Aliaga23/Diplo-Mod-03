import { Router } from "express";
import { requireInternalToken } from "../../middleware/internal-token.ts";
import { OrderConfirmedBody } from "./notifications.schemas.ts";
import { notificationsService } from "./notifications.service.ts";

export const notificationsRouter = Router();

// Servicio interno: todas sus rutas están bajo /internal y exigen X-Internal-Token.
notificationsRouter.use("/internal", requireInternalToken);

notificationsRouter.post("/internal/notifications/order-confirmed", async (req, res) => {
  const body = OrderConfirmedBody.parse(req.body);
  res.status(202).json(await notificationsService.sendOrderConfirmed(body));
});
