const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const sgMail = require("@sendgrid/mail");

const sendgridApiKey = defineSecret("SENDGRID_KEY");

const MAIL_TO = "team@vs-venturesllc.com";
const MAIL_FROM = "team@tailgate-time.com";

const allowedOrigins = new Set([
  "https://vs-venturesllc.com",
  "https://www.vs-venturesllc.com",
  "http://127.0.0.1:5500",
]);

const normalizeOrigin = (origin) => String(origin || "").replace(/\/$/, "");

const allowCors = (req, res) => {
  const origin = normalizeOrigin(req.headers.origin);
  const isAllowed = !origin || allowedOrigins.has(origin);

  if (isAllowed && origin) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
  }

  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    if (!isAllowed) {
      res.status(403).json({ ok: false, error: "Origin not allowed." });
      return true;
    }
    res.status(204).send("");
    return true;
  }

  if (!isAllowed) {
    res.status(403).json({ ok: false, error: "Origin not allowed." });
    return true;
  }

  return false;
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

exports.vsVenturesContactEmail = onRequest(
  {
    secrets: [sendgridApiKey],
  },
  async (req, res) => {
    if (allowCors(req, res)) {
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Method not allowed." });
      return;
    }

    let payload = req.body;

    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch (error) {
        res.status(400).json({ ok: false, error: "Invalid JSON payload." });
        return;
      }
    }

    const data = payload || {};
    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim();
    const company = String(data.company || "").trim();
    const projectType = String(data.projectType || "").trim();
    const budget = String(data.budget || "").trim();
    const message = String(data.message || "").trim();

    const emailPattern = /^(?!\s)[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || !email || !projectType || !message) {
      res.status(400).json({ ok: false, error: "Missing required fields." });
      return;
    }

    if (!emailPattern.test(email)) {
      res.status(400).json({ ok: false, error: "Invalid email address." });
      return;
    }

    sgMail.setApiKey(sendgridApiKey.value());

    const textBody = [
      `Name: ${name}`,
      `Email: ${email}`,
      company ? `Company: ${company}` : null,
      projectType ? `Project Type: ${projectType}` : null,
      budget ? `Budget: ${budget}` : null,
      "",
      "Message:",
      message,
    ]
      .filter(Boolean)
      .join("\n");

    const htmlBody = `
      <h2>New Project Inquiry</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${company ? `<p><strong>Company:</strong> ${escapeHtml(company)}</p>` : ""}
      ${projectType ? `<p><strong>Project Type:</strong> ${escapeHtml(projectType)}</p>` : ""}
      ${budget ? `<p><strong>Budget:</strong> ${escapeHtml(budget)}</p>` : ""}
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\\n/g, "<br />")}</p>
    `;

    try {
      await sgMail.send({
        to: MAIL_TO,
        from: MAIL_FROM,
        replyTo: email,
        subject: `New project inquiry from ${name}`,
        text: textBody,
        html: htmlBody,
      });

      res.status(200).json({ ok: true });
    } catch (error) {
      console.error("Email send failed", error);
      res.status(500).json({ ok: false, error: "Failed to send email." });
    }
  }
);
