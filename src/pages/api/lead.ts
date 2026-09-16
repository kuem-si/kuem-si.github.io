import type { APIRoute } from "astro";
import { createOdooLead, getOdooConfig } from "../../lib/odoo";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function badRequest(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "Content-Type": "application/json" }
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const subject = typeof body.subject === "string" ? body.subject.trim().toLowerCase() : "";

    if (!body.consent) return badRequest("Consent is required.");

    const requiredFields = ["firstName", "lastName", "email", "message"];
    for (const key of requiredFields) {
      if (typeof body[key] !== "string" || !body[key].trim()) {
        return badRequest(`Missing required field: ${key}`);
      }
    }

    if (!["partnership", "demo", "inquiry", "custom"].includes(subject)) {
      return badRequest("Missing or invalid required field: subject");
    }

    const customSubject = typeof body.customSubject === "string" ? body.customSubject.trim() : "";
    if (subject === "custom" && !customSubject) {
      return badRequest("Missing required field: customSubject");
    }

    if (!emailPattern.test(body.email)) {
      return badRequest("Invalid email address.");
    }

    const payload = {
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      email: body.email.trim(),
      subject,
      customSubject,
      country: typeof body.country === "string" ? body.country.trim() : "",
      message: body.message.trim(),
      consent: true,
      sourcePage: typeof body.sourcePage === "string" ? body.sourcePage : "unknown"
    } as const;

    const config = getOdooConfig();
    if (!config) {
      return new Response(
        JSON.stringify({ ok: true, mode: "local", note: "Lead received but Odoo is not configured." }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const leadId = await createOdooLead(payload);

    return new Response(JSON.stringify({ ok: true, leadId }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Lead submission failed", error);
    return new Response(JSON.stringify({ error: "Submission failed." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
