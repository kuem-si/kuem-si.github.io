import { initTwin } from "./twin.js";
import { city } from "./city.js";
import { marina } from "./marina.js";

// One twin config per tab, keyed by the panel's data-twin-tab.
const twins = { city, marina };

// The address names a tab, and optionally one of its scenarios and a step:
// #marina opens the marina, #marina/high-tide plays that scenario from the
// start and #marina/high-tide/3 opens it held on step 3.
function readAddress() {
  const [twin, scenario, step] = decodeURIComponent(
    location.hash.slice(1),
  ).split("/");
  return {
    twin,
    scenario,
    step: step ? Math.max(1, parseInt(step, 10) || 1) : null,
  };
}

function initTwinTabs(page) {
  const tabs = [...page.querySelectorAll("[data-twin-tab-trigger]")];
  const started = new Map();
  const panelOf = (tab) =>
    page.querySelector(`#${tab.getAttribute("aria-controls")}`);
  const idOf = (tab) => panelOf(tab)?.dataset.twinTab;
  const setHash = (hash) =>
    history.replaceState(null, "", location.pathname + location.search + hash);
  function select(tab, focus) {
    tabs.forEach((other) => {
      const active = other === tab;
      other.setAttribute("aria-selected", String(active));
      other.tabIndex = active ? 0 : -1;
      const panel = panelOf(other);
      if (panel) panel.hidden = !active;
    });
    if (focus) tab.focus();
    const panel = panelOf(tab);
    const id = panel?.dataset.twinTab;
    // Each tab has its own intro above the tab list.
    page
      .querySelectorAll("[data-twin-intro]")
      .forEach((intro) => (intro.hidden = intro.dataset.twinIntro !== id));
    // Each twin starts the first time its tab is shown; hidden tabs pause
    // themselves through their own visibility observers.
    if (id && !started.has(id) && twins[id])
      started.set(id, initTwin(panel, twins[id]));
  }
  // Keep the open tab in the address, so a link opens the same maquette.
  const tabHash = (id) => (id === idOf(tabs[0]) ? "" : `#${id}`);
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => {
      select(tab);
      setHash(tabHash(idOf(tab)));
    });
    tab.addEventListener("keydown", (event) => {
      const target = {
        ArrowRight: i + 1,
        ArrowLeft: i - 1,
        Home: 0,
        End: tabs.length - 1,
      }[event.key];
      if (target === undefined) return;
      event.preventDefault();
      tabs[(target + tabs.length) % tabs.length].click();
      tabs[(target + tabs.length) % tabs.length].focus();
    });
  });
  // ...and the scenario and step playing in it.
  page.addEventListener("twin:scenario", (event) => {
    const { twin, scenario, step } = event.detail;
    // A scenario left running on a hidden tab does not take the address.
    if (event.target.closest("[data-twin-tab]")?.hidden) return;
    setHash(scenario ? `#${twin}/${scenario}/${step + 1}` : tabHash(twin));
  });

  // Opens what the address names. The first tab starts on page load, unless
  // the address names another.
  function follow() {
    const address = readAddress();
    const named = tabs.find((tab) => idOf(tab) === address.twin);
    // An address naming no tab keeps the open one (the first on page load).
    const open = tabs.find(
      (tab) => tab.getAttribute("aria-selected") === "true",
    );
    select(named ?? (started.size && open ? open : tabs[0]));
    const twin = started.get(address.twin);
    if (!named || !address.scenario || !twin) return;
    twin.ready.then(() => {
      if (
        !twin.scenarios?.open(
          address.scenario,
          (address.step ?? 1) - 1,
          address.step !== null,
        )
      )
        return;
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      panelOf(named)
        ?.querySelector(".twin-workspace")
        ?.scrollIntoView({
          block: "center",
          behavior: reduced ? "auto" : "smooth",
        });
    });
  }
  if (tabs.length) {
    follow();
    window.addEventListener("hashchange", follow);
  } else
    page
      .querySelectorAll("[data-twin-tab]")
      .forEach(
        (panel) =>
          twins[panel.dataset.twinTab] &&
          initTwin(panel, twins[panel.dataset.twinTab]),
      );
}

const page = document.querySelector("[data-twin-root]");
if (page) initTwinTabs(page);
