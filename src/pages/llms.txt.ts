import type { APIRoute } from "astro";
import {
  positioning,
  nexaviaPositioning,
  solutions,
} from "../data/solutions";

const SITE = "https://www.kuem.si";

const kai = {
  en: "KAI is an operational assistant that understands infrastructure context, explains events, compares data and prepares the next step.",
  sl: "KAI je operativni pomočnik, ki razume kontekst infrastrukture, pojasni dogodke, primerja podatke in pripravi naslednji korak.",
};

export const GET: APIRoute = () => {
  const lines = [
    "# KUEM",
    "",
    "> KUEM connects field devices, existing systems and data in the Nexavia platform – from device to decision.",
    "",
    positioning.en,
    "",
    "## Products",
    `- [Nexavia](${SITE}/en/nexavia/): ${nexaviaPositioning.en}`,
    `- [KAI](${SITE}/en/kai/): ${kai.en}`,
    `- [Nexavia (slovensko)](${SITE}/nexavia/): ${nexaviaPositioning.sl}`,
    `- [KAI (slovensko)](${SITE}/kai/): ${kai.sl}`,
    "",
    "## Solutions (English)",
    ...solutions.en.map(
      ({ title, href }) => `- [${title}](${SITE}${href}/)`,
    ),
    "",
    "## Rešitve (slovenščina)",
    ...solutions.sl.map(
      ({ title, href }) => `- [${title}](${SITE}${href}/)`,
    ),
    "",
    "## Company (English)",
    `- [Company](${SITE}/en/company/): KUEM is a company for digitalization of infrastructure, field data, remote reading, monitoring and integrations.`,
    `- [Industries](${SITE}/en/industries/): Utilities, industry, municipalities, mobility, tourism and public infrastructure.`,
    `- [References](${SITE}/en/references/): Documented project examples from municipal and industrial environments.`,
    `- [Contact](${SITE}/en/contact/): Email info@kuem.si.`,
    "",
    "## Podjetje (slovenščina)",
    `- [O podjetju](${SITE}/o-nas/): KUEM digitalizira infrastrukturo, terenske podatke, daljinsko odčitavanje, nadzor in integracije.`,
    `- [Panoge](${SITE}/panoge/): Komunala, industrija, občine, mobilnost, turizem in javna infrastruktura.`,
    `- [Reference](${SITE}/reference/): Dokumentirani primeri izvedb iz komunalnih in industrijskih okolij.`,
    `- [Kontakt](${SITE}/kontakt/): E-pošta info@kuem.si.`,
  ];

  return new Response(lines.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
