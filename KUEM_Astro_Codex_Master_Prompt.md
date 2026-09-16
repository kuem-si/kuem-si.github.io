# KUEM Astro Website — Codex Master Prompt

Use this prompt in Codex inside Visual Studio Code. Open the root folder of the KUEM Astro project, place `KUEM_CGP_Complete_Package.zip` or the extracted CGP assets in the repository, and then paste the prompt below into Codex.

---

You are working inside the repository for the new KUEM corporate website.

Your task is to inspect the existing project and then design, implement, test, and document a complete production-ready multilingual website using [Astro](https://astro.build/).

Do not stop after creating a plan. After the plan, implement the complete website and verify the result.

# 1. First inspect the project

Before changing anything:

1. Read `AGENTS.md`, `README.md`, `package.json`, `astro.config.*`, the TypeScript configuration, and the current project structure.
2. Inspect Git status and preserve all unrelated user changes.
3. Search recursively for the following brand files:

   - `KUEM_CGP_Complete_Package.zip`
   - `KUEM_CGP_Core.pdf`
   - `KUEM_CGP_Light.pdf`
   - `KUEM_CGP_Core_Master.ai`
   - `KUEM_CGP_Core_Master.svg`
   - `KUEM_Official_Wordmark.svg`
   - Space Grotesk font files
   - Source Sans 3 font files
   - Nexavia logo assets
   - KAI logo assets

4. If the CGP is provided as an archive, extract only the assets required for the website into `src/assets/brand/`. Do not expose or serve the source PDFs, Illustrator files, or ZIP archive as public web assets.
5. Use the official KUEM wordmark exactly as supplied. Do not redraw, distort, recolor outside the approved variants, modify, or invent a replacement symbol.
6. If the official KUEM logo is missing, stop and ask for it instead of fabricating one.
7. If the repository is empty, scaffold a stable Astro project with strict TypeScript. Do not introduce React, Vue, Svelte, Tailwind, or another framework unless it already exists in the project or is genuinely necessary.

After inspection, provide a concise implementation plan, state any assumptions, and then proceed with implementation without waiting for another confirmation unless a critical brand asset or business fact is missing.

# 2. Main objective

Create a modern corporate website that positions KUEM as a cross-industry digitalization and operational technology partner, not merely as a utility-sector supplier.

KUEM collects, transfers, integrates, processes, and analyzes data across different industries, protocols, systems, and manufacturers.

Use this central brand promise exactly:

> **Od naprave do odločitve.**

English:

> **From device to decision.**

Use this Slovenian positioning statement exactly where appropriate:

> Visoka stopnja avtomatizacije in robusten prenos podatkov od zajema na napravi do napredne analitike v skoraj realnem času.

Use this English adaptation:

> High automation and robust data transfer, from device-level acquisition to advanced analytics with near-real-time insight.

Do not promise strict real-time operation unless evidence in the repository explicitly supports it. Prefer **skoraj v realnem času** and **near-real-time**.

# 3. Brand architecture

## KUEM

KUEM is the parent brand. Its areas are:

- digitalization;
- infrastructure and operational management;
- reliable data acquisition and transfer;
- connectivity and system integration;
- automation;
- advanced analytics;
- implementation and managed services.

Use the official KUEM wordmark and the supplied KUEM CGP.

## Nexavia

Nexavia is KUEM's operational data platform. Use the supplied Nexavia assets only on relevant product pages and components.

Position it as:

> A platform that connects field data, communication networks, external systems, operational processes and advanced analytics into one manageable environment.

Nexavia must not be presented as a platform exclusively for utilities.

## KAI

KAI is KUEM's operational assistant. Use the supplied KAI brand assets.

KAI should:

- analyze available context and data;
- explain events and probable causes;
- compare signals and historical behavior;
- show supporting evidence;
- recommend the next step;
- require confirmation before consequential actions.

Do not portray KAI as magical or fully autonomous artificial intelligence.

Use the ownership and integration relationships clearly:

- **KAI by KUEM**
- **Works with Nexavia**

KAI and Nexavia are related products, but they are not the same product.

# 4. KUEM visual system

Use these exact core design tokens:

```css
:root {
  --kuem-carbon: #161A1D;
  --kuem-concrete: #E8E6E1;
  --kuem-copper: #F06432;
  --kuem-petrol: #156B75;
  --kuem-white: #FFFFFF;
}
```

Typography:

- **Space Grotesk** for headings, strong statements, large figures, and KPI-style content;
- **Source Sans 3** for body copy, user interface text, captions, and technical information;
- self-host both typefaces;
- do not load fonts from a public CDN.

Primary visual motif:

- thin petrol and copper data paths;
- precise square nodes;
- a modular technical grid;
- generous negative space;
- strong typography;
- restrained use of brand colors;
- credible images of real infrastructure, devices, teams, environments, and operational contexts.

Meaning of the accents:

- copper represents an active point, event, decision, or intervention;
- petrol represents a reliable and continuous data path.

Avoid:

- generic Wi-Fi and cloud symbols;
- robots, AI brains, and network globes;
- holograms and neon cyberpunk effects;
- decorative circuit-board patterns;
- generic laptop stock photography;
- generic “smart city” visuals;
- aggressive diagonal racing graphics;
- fake dashboards and invented metrics.

The overall feel must be precise, mature, confident, premium, modular, credible, calm, and modern. It must not look like a generic IoT startup template.

# 5. Theme and visual rhythm

Use the Core/Dark identity as the dominant visual language, with a deliberate page rhythm:

1. dark hero;
2. light editorial or capability section;
3. dark technical section;
4. light product, industry, or reference section;
5. dark CTA and footer.

Do not add a public light/dark theme toggle unless the existing project already requires one. The Light CGP variant is a controlled brand application, not necessarily a user-selectable website theme.

Motion may be used for subtle data paths, nodes, cards, and section reveals. It must be restrained, useful, and respect `prefers-reduced-motion`. Avoid constant looping movement and distracting decorative animation.

# 6. Languages and routing

Build a complete bilingual website:

- Slovenian is the default language;
- English uses the `/en/` prefix;
- the language switcher should preserve the corresponding current page whenever possible;
- every page must have the correct canonical URL and `hreflang` alternates;
- use typed translation data or another maintainable compile-time localization approach;
- do not use runtime machine translation.

Create these Slovenian routes:

- `/`
- `/resitve`
- `/resitve/zajem-podatkov`
- `/resitve/povezljivost`
- `/resitve/integracije`
- `/resitve/napredna-analitika`
- `/resitve/upravljane-storitve`
- `/nexavia`
- `/kai`
- `/panoge`
- `/reference`
- `/vpogledi`
- `/o-podjetju`
- `/kontakt`
- `/zasebnost`

Create equivalent English routes:

- `/en/`
- `/en/solutions`
- `/en/solutions/data-acquisition`
- `/en/solutions/connectivity`
- `/en/solutions/integrations`
- `/en/solutions/advanced-analytics`
- `/en/solutions/managed-services`
- `/en/nexavia`
- `/en/kai`
- `/en/industries`
- `/en/references`
- `/en/insights`
- `/en/company`
- `/en/contact`
- `/en/privacy`

Create a polished bilingual 404 page that follows the KUEM identity.

# 7. Primary navigation

Use this navigation:

- Rešitve / Solutions
- Nexavia
- KAI
- Panoge / Industries
- Reference / References
- Vpogledi / Insights
- O podjetju / Company
- Kontakt / Contact

Requirements:

- use an accessible Solutions dropdown;
- place the official KUEM wordmark in the header;
- allow the header to be transparent over the hero and become solid after scrolling if this can be done without unnecessary complexity;
- provide visible keyboard focus states;
- include a clear language selector;
- include a Contact CTA;
- make the mobile navigation fully accessible by keyboard and screen reader.

# 8. Homepage

## 8.1 Hero

Use this Slovenian H1 exactly:

> Od naprave do odločitve.

Supporting copy:

> Povezujemo naprave, komunikacijska omrežja, podatkovne platforme, integracije in napredno analitiko v enoten operativni sistem – ne glede na panogo, protokol ali proizvajalca.

Additional copy:

> Z visoko stopnjo avtomatizacije in robustnim prenosom podatkov skrbimo za celotno pot od zajema na napravi do napredne analitike v skoraj realnem času.

Primary CTA:

> Poglejte naše zmogljivosti

Secondary CTA:

> Dogovorite se za pogovor

English H1:

> From device to decision.

English supporting copy:

> We connect devices, communication networks, data platforms, integrations and advanced analytics into one operational system – across industries, protocols and manufacturers.

Use an abstract vector-based data-path composition in the hero. Do not rely on generic stock imagery.

## 8.2 Trust and proof

Create a concise proof strip or proof section covering:

- multiple technologies and protocols;
- on-premises and cloud deployment;
- integration with existing systems;
- field implementation and support;
- one accountable path from data acquisition to insight.

Do not invent numbers, awards, certifications, partners, or service guarantees.

## 8.3 Cross-industry positioning

Create a section titled:

> Ena podatkovna pot. Več poslovnih okolij.

Show how the same KUEM capabilities apply across:

- utilities and energy;
- industry and manufacturing;
- buildings, retail, and logistics;
- cities and environmental monitoring;
- tourism, camps, and marinas;
- distributed and remote infrastructure.

## 8.4 Interactive data path

Create a six-step progressive-enhancement pipeline:

1. Acquisition
2. Connectivity
3. Transfer and processing
4. Integrations
5. Advanced analytics
6. Decision and action

The full content must remain available without JavaScript. Enhancement may add restrained transitions, focus states, or step highlighting.

## 8.5 Core capability cards

Create six clear capability cards:

1. Data acquisition
2. Connectivity and networks
3. Nexavia operational platform
4. Integrations and automation
5. Advanced analytics
6. NOC and managed services

Each card should communicate the problem solved, KUEM's role, and the operational outcome. Avoid vague buzzwords.

## 8.6 Nexavia section

Show Nexavia as the unified operational layer for:

- overview and operational control;
- dashboards and KPIs;
- alarms and events;
- maps of devices and gateways;
- consumption and infrastructure analytics;
- reports and exports;
- mobile and field workflows;
- APIs and external integrations;
- on-premises and cloud deployment;
- multi-tenant environments where applicable.

Include a clear CTA to the Nexavia page.

## 8.7 KAI section

Use this copy exactly:

> KAI poveže vprašanje z razpoložljivimi podatki, dokumentacijo in operativnim kontekstom. Pojasni dogodek, pokaže podporne informacije in predlaga naslednji korak.

Structure the section around:

- Analyze
- Explain
- Recommend

Show evidence, distinguish observations from inferences, and communicate that consequential actions require confirmation. Include **Works with Nexavia**. Do not use robot or brain imagery.

Include a clear CTA to the KAI page.

## 8.8 Industries grid

For every industry card show:

- a credible operational challenge;
- relevant KUEM capabilities;
- the intended outcome.

Do not allow utilities to dominate the entire composition.

## 8.9 References

Create references through an Astro content collection.

Potential public references may include Domplan, Adria Mobil, JKP Brezovica, Sombor, Tropic, and Gradiška, but use a named organization only if it can be verified from approved source material or has explicit publication approval. Otherwise create a draft, anonymized case study, or omit it.

Never invent project results, measured savings, customer quotes, technologies, or project scope.

## 8.10 Delivery process

Show a practical six-stage process:

1. Understand the operational problem
2. Define the architecture
3. Establish acquisition and connectivity
4. Integrate systems and data
5. Deploy and verify
6. Manage and improve

## 8.11 Final CTA

Use this Slovenian content exactly:

> **Povežimo podatke z odločitvami.**

> Povejte nam, kaj želite spremljati, povezati ali izboljšati. Skupaj bomo določili smiselno podatkovno pot in izvedbeni model.

CTA:

> Začnimo pogovor

Create an equivalent, natural English version.

# 9. Solution pages

Every solution page should include:

- an outcome-led hero;
- the operational problem;
- KUEM's approach;
- concrete capabilities;
- relevant technology;
- an understandable architecture or data-path explanation;
- integrations;
- at least three credible cross-industry use cases;
- related references when approved data exists;
- a contextual CTA.

Relevant technology may include:

- LoRaWAN;
- NB-IoT;
- wM-Bus;
- MQTT;
- REST APIs;
- Modbus TCP;
- SCADA;
- ERP;
- billing systems;
- on-premises and cloud environments.

Protocols and acronyms may support the explanation, but they must not become the primary marketing message.

# 10. Nexavia page

Create a complete product page with:

- an outcome-oriented hero;
- platform overview;
- modules and capabilities;
- architecture;
- deployment options;
- security and access concepts based only on verified facts;
- field workflows;
- dashboards and reporting;
- integrations;
- final CTA.

Preferred Slovenian positioning:

> Nexavia je operativna podatkovna platforma, ki poveže teren, sisteme in uporabnike v enoten pregled.

Do not use **IoT platform** as the main headline.

# 11. KAI page

Build the KAI page around:

> Ask. Understand. Act.

Cover:

- Analyze, Explain, and Recommend;
- a realistic operational example;
- evidence and source visibility;
- the distinction between observation and inference;
- confirmation before action;
- Nexavia integration and independent integrations where supported;
- governance and permissions without inventing security claims;
- a demo or consultation CTA.

Use this Slovenian positioning exactly:

> KAI je operativni pomočnik, ki razume kontekst infrastrukture, pojasni dogodke, primerja podatke in pripravi naslednji korak.

Avoid inflated AI claims, anthropomorphic promises, and autonomous-action language.

# 12. Industries page

Create a filterable, progressively enhanced industries page for:

- utilities and energy;
- industry and manufacturing;
- buildings, retail, and logistics;
- cities and environment;
- tourism, camps, and marinas;
- distributed and remote infrastructure.

All content must remain accessible without JavaScript. Cross-link each industry to relevant solutions, Nexavia, KAI, and approved references.

# 13. References and insights

Use Astro content collections.

Suggested case-study schema:

- `title`
- `customer` or `category`
- `country`
- `industry`
- `challenge`
- `solution`
- `technologies`
- `results`
- `hero`
- `logo`
- `featured`
- `draft`
- `publicationApproval`

Suggested insight schema:

- `title`
- `summary`
- `date`
- `author`
- `categories`
- `hero`
- `seo`
- `draft`

Create polished listing and detail pages. Publish only grounded claims. Draft or omit anything that depends on missing facts.

# 14. Company page

Position KUEM as a technology and implementation partner that:

- covers the full data path;
- is independent of a single vendor or protocol;
- combines field work, platforms, integration, analytics, and support;
- focuses on measurable operational value.

Include:

- who KUEM is;
- how KUEM works;
- core competencies;
- geographic operating context, if verified;
- quality, security, support, and partnership information, but only when supported by available evidence.

Do not invent certifications, memberships, history, office locations, team size, or credentials.

# 15. Contact page

Use only verified contact information. Include:

- email;
- telephone;
- address;
- map or directions when appropriate;
- a clear contact form;
- inquiry-topic selection;
- privacy consent;
- accessible success and error states.

If network access is available, inspect `www.kuem.si` only for verifiable business facts and approved public references. Do not copy its old design.

Contact form requirements:

- client-side and server-side validation where the architecture supports it;
- accessible inline errors and status messages;
- a honeypot field;
- a documented anti-spam approach;
- configurable submission endpoint through environment variables;
- no fake success response.

If no backend or form provider is configured, create a production-ready configurable integration point and document it in `.env.example` and `README.md`. Do not introduce a paid third-party service without approval.

# 16. Minimum component system

Create or adapt reusable components such as:

- `SiteHeader`
- `MobileNavigation`
- `LanguageSwitcher`
- `SiteFooter`
- `Hero`
- `SectionHeading`
- `DataPath`
- `CapabilityCard`
- `IndustryCard`
- `CaseStudyCard`
- `ProductFeature`
- `NexaviaFeature`
- `KAIFeature`
- `MetricOrProof`
- `CTASection`
- `ContactForm`
- `SEOHead`
- `Breadcrumbs`

Keep components focused. Avoid one oversized component containing the whole website.

# 17. Suggested project structure

Use or adapt this structure if the current project does not already have a coherent convention:

```text
src/
  assets/
    brand/
    images/
  components/
    layout/
    navigation/
    sections/
    ui/
  content/
    case-studies/
    insights/
  data/
    navigation.ts
    industries.ts
    solutions.ts
    translations.ts
  layouts/
    BaseLayout.astro
    ContentLayout.astro
  pages/
    ...
  styles/
    tokens.css
    global.css
    typography.css
  utils/
    i18n.ts
    seo.ts
public/
  favicon.svg
  robots.txt
```

Adapt this proposal to the existing repository rather than forcing a duplicate architecture.

# 18. Astro implementation requirements

- Prefer server-first and static-first Astro architecture.
- Use strict TypeScript.
- Use semantic HTML and Astro components.
- Keep client-side JavaScript minimal.
- Use framework islands only where interactivity genuinely needs them.
- Use Astro's image tooling, such as `Image` or `Picture`, for optimized images.
- Use content collections for references and insights.
- Configure a sitemap and the production site URL.
- Generate correct canonical URLs.
- Use responsive images and appropriate dimensions to avoid layout shift.
- Add structured metadata using verified data only.
- Do not add unnecessary dependencies.

Use static output by default unless the existing deployment environment clearly requires server rendering. Do not add an SSR adapter merely to support the contact form before checking the intended host.

# 19. SEO

Every indexable page needs:

- a unique title;
- a unique meta description;
- a canonical URL;
- Open Graph metadata;
- social-sharing metadata;
- the correct language declaration;
- alternate-language links.

Add appropriate JSON-LD where the data is verified:

- `Organization` for KUEM;
- `Product` or `SoftwareApplication` for Nexavia and KAI when semantically appropriate;
- `BreadcrumbList`;
- `Article` for insights;
- `Service` for solution pages.

Also create:

- sitemap;
- `robots.txt`;
- a branded social-sharing image;
- meaningful page titles and readable URLs.

# 20. Accessibility

Target WCAG 2.2 AA.

Requirements:

- full keyboard navigation;
- visible focus states;
- skip link;
- correct heading hierarchy;
- accessible menus and dropdowns;
- accessible forms and validation feedback;
- sufficient color contrast;
- information must not depend on color alone;
- meaningful alternative text;
- reduced-motion support;
- route announcements if a client-side router is used;
- adequate touch targets;
- no autoplaying carousel.

# 21. Performance

Target Lighthouse scores of at least:

- 90 Performance on mobile;
- 95 Performance on desktop;
- 95 Accessibility;
- 95 Best Practices;
- 95 SEO.

Also:

- avoid cumulative layout shift;
- optimize and size all imagery;
- preload only genuinely critical fonts;
- use `font-display: swap`;
- minimize client-side JavaScript;
- lazy-load non-critical media;
- do not use autoplaying video;
- do not ship large uncompressed assets;
- avoid third-party scripts unless already approved;
- do not add analytics unless a valid configuration exists;
- do not display a fake cookie banner when no non-essential cookies are used.

# 22. Content rules

Write complete Slovenian and English copy. Do not use lorem ipsum.

Tone:

- clear;
- technically competent;
- business-focused;
- calm;
- confident;
- specific;
- evidence-based.

Prefer:

- digitalization;
- operational management;
- connectivity;
- interoperability explained in plain language;
- automation;
- operational overview;
- advanced analytics;
- near-real-time insight;
- the complete path from device to decision;
- independence from a single vendor or protocol.

Avoid overusing:

- IoT;
- AI;
- smart;
- big data;
- digital twin;
- mission-critical;
- end-to-end;
- cutting-edge;
- revolutionary;
- next-generation.

Technical terms are allowed when they describe a real function and help the reader make a decision.

Do not invent:

- customers;
- certifications;
- project counts;
- office locations;
- partner relationships;
- measured performance;
- security guarantees.

Create `CONTENT_TODO.md` for missing business facts, approved customer references, contact details, legal text, translations requiring review, and unresolved claims. Do not expose visible TODO text on the public website.

# 23. Testing and quality assurance

Before considering the work complete:

1. Install dependencies using the repository's existing package manager and lockfile.
2. Run formatting.
3. Run Astro and TypeScript checks.
4. Run linting if configured.
5. Run the production build.
6. Run existing tests.
7. Add practical smoke tests when the project already has a compatible test setup.
8. Check internal links and both language trees.
9. Test mobile navigation with keyboard interaction.
10. Test contact-form validation and accessible error states.
11. Start the local preview and inspect representative pages at:

    - `1440 × 900`
    - `1024 × 768`
    - `390 × 844`

12. Visually inspect at minimum:

    - homepage;
    - Nexavia;
    - KAI;
    - a solution detail page;
    - contact page.

13. Fix overflow, broken layouts, contrast problems, missing assets, incorrect language links, and console errors.
14. Review the final Git diff and ensure unrelated changes were preserved.

Do not claim the implementation is complete if the production build or critical checks fail.

# 24. Definition of done

The task is complete only when:

- all requested routes exist;
- Slovenian and English navigation works;
- the KUEM CGP is applied consistently;
- the official wordmark is used correctly;
- Nexavia and KAI retain their distinct but connected identities;
- the experience is responsive and accessible;
- mobile navigation works;
- there are no visible placeholders or lorem ipsum;
- SEO metadata, sitemap, and robots configuration are present;
- references and insights use content collections;
- the project builds successfully;
- key pages have been visually inspected;
- setup, content, contact-form, and deployment requirements are documented.

# 25. Final response

At the end, report:

1. a concise summary of what was implemented;
2. the full route list;
3. the most important created or changed files;
4. every validation command run and its result;
5. unresolved items from `CONTENT_TODO.md`;
6. required environment variables;
7. the command for starting the development server;
8. any deployment decision that still requires approval.

Do not deploy, publish, register a domain, purchase a service, or modify an external system unless explicitly authorized.

Begin now: inspect the repository, plan briefly, implement the complete site, validate it, and review the final result.
