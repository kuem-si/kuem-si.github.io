import { initTwin } from "./twin.js";
import { city } from "./city.js";
import { marina } from "./marina.js";

// One twin config per tab, keyed by the panel's data-twin-tab.
const twins = { city, marina };

function initTwinTabs(page) {
  const tabs = [...page.querySelectorAll("[data-twin-tab-trigger]")];
  const started = new Set();
  const panelOf = (tab) => page.querySelector(`#${tab.getAttribute("aria-controls")}`);
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
    page.querySelectorAll("[data-twin-intro]").forEach((intro) => (intro.hidden = intro.dataset.twinIntro !== id));
    // Each twin starts the first time its tab is shown; hidden tabs pause
    // themselves through their own visibility observers.
    if (id && !started.has(id)) {
      started.add(id);
      if (twins[id]) initTwin(panel, twins[id]);
    }
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => {
      select(tab);
      // Keep the open tab in the address, so a link opens the same maquette.
      history.replaceState(null, "", i === 0 ? location.pathname + location.search : `#${panelOf(tab)?.dataset.twinTab}`);
    });
    tab.addEventListener("keydown", (event) => {
      const target = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[event.key];
      if (target === undefined) return;
      event.preventDefault();
      tabs[(target + tabs.length) % tabs.length].click();
      tabs[(target + tabs.length) % tabs.length].focus();
    });
  });
  // The first tab starts on page load, unless the address names another.
  const named = tabs.find((tab) => `#${panelOf(tab)?.dataset.twinTab}` === location.hash);
  if (tabs.length) select(named ?? tabs[0]);
  else page.querySelectorAll("[data-twin-tab]").forEach((panel) => twins[panel.dataset.twinTab] && initTwin(panel, twins[panel.dataset.twinTab]));
}

const page = document.querySelector("[data-twin-root]");
if (page) initTwinTabs(page);
