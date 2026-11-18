import nodemailer from "nodemailer";
import { env } from "../config/env.ts";

// Cliente SMTP. En v1 apunta a Mailpit, que muestra los correos sin enviarlos de verdad.
export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  connectionTimeout: env.SMTP_TIMEOUT_MS,
  greetingTimeout: env.SMTP_TIMEOUT_MS,
  socketTimeout: env.SMTP_TIMEOUT_MS,
});

export async function smtpReachable(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}
