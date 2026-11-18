import { env } from "../../config/env.ts";
import { AppError } from "../../lib/errors.ts";
import { logger } from "../../lib/logger.ts";
import { transporter } from "../../lib/mailer.ts";
import type { OrderConfirmed } from "./notifications.schemas.ts";
import { renderOrderConfirmed } from "./order-confirmed.template.ts";

export const notificationsService = {
  /** Envía el correo de confirmación de compra con el enlace a las entradas. */
  async sendOrderConfirmed(data: OrderConfirmed) {
    const ticketsUrl = new URL("/mis-entradas", env.WEB_BASE_URL).toString();
    const { subject, text, html } = renderOrderConfirmed(data, ticketsUrl);
    try {
      const info = await transporter.sendMail({ from: env.MAIL_FROM, to: data.to, subject, text, html });
      logger.info({ orderId: data.orderId, to: data.to, messageId: info.messageId }, "Correo de confirmación enviado");
      return { sent: true as const, messageId: info.messageId };
    } catch (err) {
      logger.error({ err, orderId: data.orderId, to: data.to }, "Fallo al enviar el correo de confirmación");
      throw new AppError(502, "SMTP_ERROR", "No se pudo enviar el correo");
    }
  },
};
