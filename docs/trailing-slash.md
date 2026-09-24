# Zaključne poševnice

Preverjeno 22. 9. 2026. Spremembe so lokalne; v tem opravilu ni bilo objave.

## Okolje in vzrok

Projekt uporablja Astro 7, `output: "static"`, ročno lokalizirane poti in GitHub Pages. `.github/workflows/deploy-pages.yml` gradi `dist`, ohrani `.nojekyll` in objavi artefakt z `actions/deploy-pages`. `public/CNAME` vsebuje `www.kuem.si`; DNS CNAME kaže na `kuem-si.github.io`, produkcijski HTTP odgovori vsebujejo `Server: GitHub.com`. Konfiguracij za Netlify, Vercel, Next, Jekyll ali drug strežnik ni.

Prijavljenega produkcijskega 404 na trenutnih podstraneh ni bilo mogoče ponoviti: vseh 49 nekorenskih trenutnih poti že vrača `301 → URL s poševnico → 200`. Korenski `/` vrne `200`. Zato ni dokazov za trditev, da trenutni GitHub Pages ne podpira zahtevanega obnašanja.

Lokalni 404 je ponovljiv: Astro pri `trailingSlash: "always"` pred obstoječo Vite middleware vstavi svojo kontrolo poševnic. Ta vrne 404, preden se izvede dotedanja preusmeritev 302. Popravek postavi trajno preusmeritev pred Astro kontrolo, po končani registraciji middleware.

Poleg tega so generirani jezikovni URL-ji, povezave in nekateri podatki JSON-LD uporabljali poti brez poševnic. Produkcija ima ob meritvi napačen canonical na `/resitve/` in `/en/solutions/`.

## Rešitev

- Izrecni `build.format: "directory"` ohranja izhod `pot/index.html`. Na GitHub Pages to sproži izvorni strežniški HTTP 301, tudi za globlje poti. Ni novih kopij vsebine, pravil za drugo gostovanje ali JavaScript preusmeritve prek 404.
- Lokalni Vite post hook se izvede po Astro hooku in vstavi HTTP 301 pred kontrolo poševnic. Query ostane v `Location`; fragment ohrani brskalnik, saj ga HTTP zahteva ne pošlje strežniku.
- Astro middleware med prerenderiranjem poenoti notranje URL-je v HTML atributih in JSON-LD. Vidno besedilo, CSS in izvršljivi skripti se ne spreminjajo. `alternatePath` vrne poševnico tudi za sitemap.
- `/`, obstoječe poševnice, datotečne končnice in zunanje povezave ostanejo nespremenjeni. Kontrole v obeh workflowih zavrnejo build z nedoslednimi canonical, hreflang, sitemap ali notranjimi povezavami.

Astro sam pojasnjuje, da poševnice na statično generiranih straneh ureja gostovanje: [Astro trailingSlash](https://docs.astro.build/en/reference/configuration-reference/#trailingslash). Lokalni popravek ne predstavlja strežniške konfiguracije GitHub Pages; produkcijsko preusmeritev smo potrdili neposredno prek HTTP.

## Spremenjene datoteke v tem opravilu

- `astro.config.mjs`: izrecni imeniki in pravilen vrstni red lokalnega HTTP 301.
- `src/lib/page-urls.ts`: skupna normalizacija URL-jev v generiranem HTML in JSON-LD.
- `src/middleware.ts`: uporaba normalizacije med generiranjem in lokalnim streženjem.
- `src/lib/i18n.ts`: zaključne poševnice jezikovnih povezav.
- `scripts/check-page-urls.mjs`: pregled artefakta in HTTP pregled vseh poti, izvoz poročila.
- `package.json`: ukaz `check:urls`.
- `.github/workflows/deploy-pages.yml` in `.github/workflows/verify.yml`: pregled URL-jev po buildu.
- `docs/trailing-slash.md`, `docs/trailing-slash-local-audit.md`, `docs/trailing-slash-production-audit.md`: dokumentacija in meritve.

Ob začetku je delovna kopija že vsebovala druge spremembe, vključno s 57 starimi URL vzdevki. Ti niso bili uvedeni v tem opravilu.

## Rezultati

Celoten seznam poti, začetni HTTP status, končni URL/status, canonical, query in odsotnost zanke:

- [Lokalni pregled vseh 50 trenutnih strani](trailing-slash-local-audit.md): 25 SL + 25 EN, od tega 30 globljih strani rešitev. Vseh 49 nekorenskih poti `301 → 200`; `/` ostane `200`; vsi canonical pravilni; brez zank; query ohranjen.
- [Produkcijski pregled 107 poti](trailing-slash-production-audit.md): istih 50 trenutnih strani ter dodatnih 57 starih vzdevkov iz delovne kopije. Trenutne strani imajo pravilne HTTP preusmeritve; dva canonical še nimata poševnice. Neobjavljeni stari vzdevki vračajo 404, nekateri obstoječi imajo še prejšnjo vsebino. Poročilo ohranja dejanske neuspehe in jih ne šteje za uspešno objavo popravka.

Potrjeno z dejanskim Chromiumom (Chrome): vseh 50 neposrednih vnosov pri izključenem JavaScriptu, status 301/200, canonical in ohranjen `?source=browser&value=a%2Fb#slash-test`. Z vključenim JavaScriptom so uspešni kliki glavne in mobilne navigacije ter preklopi SL ↔ EN na rešitvah pri širini 1440 in 390 px. Statični pregled dodatno pregleda vse povezave obeh menijev na vseh straneh in povratno preslikavo vsakega jezikovnega para.

HTTP GET za razpoložljive CSS, JS, slike, SVG, pisave, robots.txt in llms.txt ostane 200 brez preusmeritve lokalno in v produkciji; produkcijski sitemap XML prav tako. Manjkajoči PDF, ICO, JS in neobstoječe strani ostanejo 404. HEAD za SL/EN osnovne in globlje poti vrne 301 z ohranjenim queryjem. Sitemap se generira šele ob buildu, zato v Astro dev ni na voljo; lokalni sitemap je preverjen neposredno v `dist`.

`npm run check`: 0 napak, 0 opozoril, 4 obstoječi namigi. `npm run build`, `npm run check:urls` in `npm run verify`: uspešno, vključno z notranjimi povezavami in fragmenti, canonical, hreflang, JSON-LD in sitemap.

Stari `/sl/.../` vzdevki imajo v Astro dev zaradi obstoječe i18n middleware status 404, čeprav se HTML izdela v `dist`; to ni struktura trenutnih slovenskih strani (te so brez `/sl`). Lokalni HTTP pregled trenutnih strani zato uporablja `--current-only`. Obstoječi stari vzdevki uporabljajo HTML refresh do druge poti; to ni HTTP 301 do nove vsebine. Njihova obstoječa implementacija ni bila spremenjena.

## Ponovitev

```sh
npm run build
npm run check:urls
npm run verify
node scripts/check-page-urls.mjs --base http://localhost:4321 --current-only --report docs/trailing-slash-local-audit.md
node scripts/check-page-urls.mjs --base https://www.kuem.si --http-only --report docs/trailing-slash-production-audit.md
```

Lokalni HTTP ukaz zaženite proti sveže zagnanemu `astro dev` s tem popravkom. Že zagnani starejši strežnik ali `astro preview` ni dokaz obnašanja GitHub Pages. Po objavi ponovite produkcijski pregled, da se potrdita popravljena canonical in objavljeni artefakt.
