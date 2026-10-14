import type { APIRoute } from "astro";
import { positioning, nexaviaPositioning, solutions } from "../data/solutions";
import { COMPANY_EMAIL } from "../data/company";
import { kaiContent } from "../data/kai";

const SITE = "https://www.kuem.si";

// The curated part of llms.txt. After the build, .tools/llms.mjs adds each
// listed page's description and appends every indexable page not listed here.
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
    `- [KAI](${SITE}/en/kai/): ${kaiContent.en.description}`,
    `- [Nexavia (slovensko)](${SITE}/nexavia/): ${nexaviaPositioning.sl}`,
    `- [KAI (slovensko)](${SITE}/kai/): ${kaiContent.sl.description}`,
    `- [Nexavia (Deutsch)](${SITE}/de/nexavia/): ${nexaviaPositioning.de}`,
    `- [KAI (Deutsch)](${SITE}/de/kai/): ${kaiContent.de.description}`,
    "",
    "## Solutions (English)",
    ...solutions.en.map(({ title, href }) => `- [${title}](${SITE}${href}/)`),
    "",
    "## Rešitve (slovenščina)",
    ...solutions.sl.map(({ title, href }) => `- [${title}](${SITE}${href}/)`),
    "",
    "## Lösungen (Deutsch)",
    ...solutions.de.map(({ title, href }) => `- [${title}](${SITE}${href}/)`),
    "",
    "## Company (English)",
    `- [Company](${SITE}/en/company/): KUEM is a company for digitalization of infrastructure, field data, remote reading, monitoring and integrations.`,
    `- [Industries](${SITE}/en/industries/): Utilities, industry, municipalities, mobility, tourism and public infrastructure.`,
    `- [References](${SITE}/en/references/): Documented project examples from municipal and industrial environments.`,
    `- [Contact](${SITE}/en/contact/): Email ${COMPANY_EMAIL}.`,
    "",
    "## Podjetje (slovenščina)",
    `- [O podjetju](${SITE}/o-nas/): KUEM digitalizira infrastrukturo, terenske podatke, daljinsko odčitavanje, nadzor in integracije.`,
    `- [Panoge](${SITE}/panoge/): Komunala, industrija, občine, mobilnost, turizem in javna infrastruktura.`,
    `- [Reference](${SITE}/reference/): Dokumentirani primeri izvedb iz komunalnih in industrijskih okolij.`,
    `- [Kontakt](${SITE}/kontakt/): E-pošta ${COMPANY_EMAIL}.`,
    "",
    "## Unternehmen (Deutsch)",
    `- [Über uns](${SITE}/de/unternehmen/): KUEM digitalisiert Infrastruktur, Felddaten, Fernauslesung, Überwachung und Integrationen.`,
    `- [Branchen](${SITE}/de/branchen/): Versorgung, Industrie, Gemeinden, Mobilität, Tourismus und öffentliche Infrastruktur.`,
    `- [Referenzen](${SITE}/de/referenzen/): Dokumentierte Projektbeispiele aus kommunalen und industriellen Umgebungen.`,
    `- [Kontakt](${SITE}/de/kontakt/): E-Mail ${COMPANY_EMAIL}.`,
  ];

  return new Response(lines.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
