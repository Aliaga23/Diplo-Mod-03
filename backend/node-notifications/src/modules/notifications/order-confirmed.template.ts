import type { OrderConfirmed } from "./notifications.schemas.ts";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("es", { dateStyle: "full", timeStyle: "short", timeZone: "UTC" }).format(new Date(iso)) +
  " (UTC)";

const fmtMoney = (n: number) => n.toFixed(2);

/** Correo de confirmación de compra: asunto, texto plano y HTML sobrio. */
export function renderOrderConfirmed(data: OrderConfirmed, ticketsUrl: string) {
  const subject = `Tu compra para ${data.eventName} está confirmada`;

  const text = [
    `Hola ${data.name},`,
    "",
    `Tu compra ${data.orderId} fue confirmada.`,
    `Evento: ${data.eventName}`,
    `Fecha: ${fmtDate(data.eventDate)}`,
    `Lugar: ${data.venue}`,
    `Sector: ${data.sectorName} · ${data.quantity} entrada(s) · Total ${fmtMoney(data.total)}`,
    "",
    "Códigos de tus entradas:",
    ...data.ticketCodes.map((c) => `  - ${c}`),
    "",
    `Descarga tus entradas (PDF con QR) en: ${ticketsUrl}`,
    "",
    "EntradasYa",
  ].join("\n");

  const e = escapeHtml;
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 0;color:#5b6475;width:90px">${k}</td><td style="padding:6px 0;color:#141a26">${v}</td></tr>`;

  const html = `<!doctype html>
<html lang="es"><body style="margin:0;background:#f7f8fa;font-family:Segoe UI,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e3e6ec;border-radius:8px">
        <tr><td style="padding:20px 28px;border-bottom:1px solid #e3e6ec;font-size:15px;font-weight:600;color:#141a26">EntradasYa</td></tr>
        <tr><td style="padding:24px 28px;font-size:14px;line-height:1.5;color:#141a26">
          <p style="margin:0 0 12px">Hola ${e(data.name)},</p>
          <p style="margin:0 0 16px">Tu compra <strong>${e(data.orderId)}</strong> fue confirmada.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:16px">
            ${row("Evento", e(data.eventName))}
            ${row("Fecha", e(fmtDate(data.eventDate)))}
            ${row("Lugar", e(data.venue))}
            ${row("Sector", `${e(data.sectorName)} · ${data.quantity} entrada(s)`)}
            ${row("Total", fmtMoney(data.total))}
          </table>
          <p style="margin:0 0 8px;color:#5b6475">Códigos de tus entradas:</p>
          <p style="margin:0 0 20px;font-family:Consolas,monospace">${data.ticketCodes.map(e).join("<br>")}</p>
          <a href="${e(ticketsUrl)}" style="display:inline-block;background:#2b59d9;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;font-weight:600">Ver y descargar mis entradas</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}
