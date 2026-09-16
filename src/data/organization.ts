/**
 * Central machine-readable entity data (schema.org JSON-LD sources).
 * Used by `SeoHead`/`JsonLd` components and by the generated `llms.txt`.
 */

const SITE = "https://www.kuem.si";
const ORG_ID = `${SITE}/#organization`;

export const organization = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "KUEM",
  url: `${SITE}/`,
  logo: `${SITE}/favicon.svg`,
  email: "info@kuem.si",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Kranj",
    addressCountry: "SI",
  },
  knowsAbout: [
    "Internet of Things",
    "LoRaWAN",
    "NB-IoT",
    "M2M",
    "SCADA",
    "remote meter reading",
    "smart metering",
    "infrastructure digitalization",
    "telemetry",
    "data platforms",
    "advanced analytics",
  ],
};

export const website = {
  "@type": "WebSite",
  "@id": `${SITE}/#website`,
  url: `${SITE}/`,
  name: "KUEM",
  publisher: { "@id": ORG_ID },
};

export const nexaviaSoftware = {
  "@type": "SoftwareApplication",
  "@id": `${SITE}/en/nexavia#software`,
  name: "Nexavia",
  alternateName: "Nexavia platform",
  url: `${SITE}/en/nexavia`,
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "IoT data platform",
  operatingSystem: "Web",
  inLanguage: ["sl-SI", "en-GB"],
  description:
    "Nexavia is a modular platform for collecting, processing, visualizing, alarming and integrating data from meters, sensors, devices and external systems.",
  keywords:
    "IoT platform, telemetry, remote monitoring, smart metering, alarms, dashboards, data integration, SCADA, GIS, analytics",
  featureList: [
    "Data collection from meters, sensors, devices and external systems",
    "Real-time dashboards, alarms and event management",
    "Role-based views for management, operations and IT",
    "Reports, period and location comparisons",
    "Integration with ERP, SCADA, GIS and public data sources",
    "KAI anomaly detection with understandable alerts and recommendations",
  ],
  about: [
    { "@type": "Thing", name: "Internet of Things" },
    { "@type": "Thing", name: "Infrastructure digitalization" },
    { "@type": "Thing", name: "Remote meter reading" },
    { "@type": "Thing", name: "Environmental monitoring" },
    { "@type": "Thing", name: "Data platforms" },
  ],
  audience: {
    "@type": "Audience",
    audienceType:
      "Utilities, municipalities, industry, mobility and public infrastructure operators",
  },
  manufacturer: { "@id": ORG_ID },
  publisher: { "@id": ORG_ID },
};

export const kaiSoftware = {
  "@type": "SoftwareApplication",
  "@id": `${SITE}/en/kai#software`,
  name: "KAI",
  url: `${SITE}/en/kai`,
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Operational AI assistant",
  operatingSystem: "Web",
  inLanguage: ["sl-SI", "en-GB"],
  description:
    "KAI is an operational assistant that understands infrastructure context, explains events, compares data and prepares the next step.",
  keywords:
    "anomaly detection, operational assistant, alarms, data analysis, recommendations",
  featureList: [
    "Detection of deviations in infrastructure data",
    "Understandable alerts with context",
    "Decision support and recommended next steps",
  ],
  manufacturer: { "@id": ORG_ID },
  publisher: { "@id": ORG_ID },
};
