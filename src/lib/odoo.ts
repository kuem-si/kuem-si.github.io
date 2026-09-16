export type LeadPayload = {
  firstName: string;
  lastName: string;
  email: string;
  subject: "partnership" | "demo" | "inquiry" | "custom";
  customSubject?: string;
  country?: string;
  message: string;
  consent: boolean;
  sourcePage?: string;
};

type OdooConfig = {
  url: string;
  db: string;
  username: string;
  apiKey: string;
};

const env = {
  url: import.meta.env.ODOO_URL,
  db: import.meta.env.ODOO_DB,
  username: import.meta.env.ODOO_USERNAME,
  apiKey: import.meta.env.ODOO_API_KEY
};

export function getOdooConfig(): OdooConfig | null {
  if (!env.url || !env.db || !env.username || !env.apiKey) return null;
  return {
    url: env.url,
    db: env.db,
    username: env.username,
    apiKey: env.apiKey
  };
}

async function jsonRpc(url: string, method: string, params: unknown): Promise<any> {
  const response = await fetch(`${url}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method,
        args: params
      },
      id: Date.now()
    })
  });

  if (!response.ok) {
    throw new Error(`Odoo JSON-RPC failed with status ${response.status}`);
  }

  const result = await response.json();
  if (result.error) {
    throw new Error(result.error?.data?.message ?? "Unknown Odoo error");
  }

  return result.result;
}

async function authenticate(config: OdooConfig): Promise<number> {
  const response = await fetch(`${config.url}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "common",
        method: "authenticate",
        args: [config.db, config.username, config.apiKey, {}]
      },
      id: Date.now()
    })
  });

  if (!response.ok) {
    throw new Error(`Odoo authentication failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (payload.error || typeof payload.result !== "number") {
    throw new Error(payload.error?.data?.message ?? "Invalid Odoo authentication response");
  }

  return payload.result;
}

export async function createOdooLead(payload: LeadPayload): Promise<number> {
  const config = getOdooConfig();
  if (!config) {
    throw new Error("Missing Odoo configuration");
  }

  const uid = await authenticate(config);
  const subjectLabels: Record<LeadPayload["subject"], string> = {
    partnership: "Partnership",
    demo: "Demo",
    inquiry: "Inquiry",
    custom: payload.customSubject?.trim() || "Custom"
  };
  const fullName = `${payload.firstName} ${payload.lastName}`.trim();
  const leadLabel = subjectLabels[payload.subject];

  const leadValues = {
    name: `${leadLabel} - ${fullName}`,
    contact_name: fullName,
    email_from: payload.email,
    phone: "",
    partner_name: "",
    description: [
      `Subject: ${leadLabel}`,
      payload.country ? `Country: ${payload.country}` : "",
      payload.sourcePage ? `Source Page: ${payload.sourcePage}` : "",
      "",
      payload.message
    ]
      .filter(Boolean)
      .join("\n")
  };

  const leadId = await jsonRpc(config.url, "execute_kw", [
    config.db,
    uid,
    config.apiKey,
    "crm.lead",
    "create",
    [leadValues]
  ]);

  return leadId;
}
