// ===== Instellingen =====
// WhatsApp-nummer in internationaal formaat, zonder +, spaties of 0 vooraan (bv. 31612345678).
const WHATSAPP_NUMBER = "31600000000";

const waUrl = (text) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

// ===== WhatsApp-knoppen =====
document.querySelectorAll(".js-wa").forEach((el) => {
  el.href = waUrl(el.dataset.msg || "Hoi Taxi VI!");
  el.target = "_blank";
  el.rel = "noopener";
});

// ===== Header =====
const topbar = document.getElementById("topbar");
const onScroll = () => topbar.classList.toggle("is-scrolled", window.scrollY > 20);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const burger = document.getElementById("burger");
const nav = document.getElementById("nav");
burger.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", open ? "Menu sluiten" : "Menu openen");
});
nav.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  })
);

document.getElementById("jaar").textContent = new Date().getFullYear();

// ===== Offerteformulier =====
const form = document.getElementById("offerte");
const errorBox = document.getElementById("form-error");
const datum = document.getElementById("datum");
datum.min = new Date().toISOString().slice(0, 10);

// Labels en placeholders per soort rit
const TYPE_TEXT = {
  Leerlingenvervoer: { naar: "Naam en adres school", ph: "bv. De Regenboog, Utrecht", datum: "Startdatum", tijd: "Ophaaltijd" },
  Luchthaven: { naar: "Luchthaven", ph: "bv. Schiphol Airport", datum: "Datum", tijd: "Ophaaltijd" },
  Evenement: { naar: "Locatie evenement", ph: "Naam en adres locatie", datum: "Datum", tijd: "Ophaaltijd" },
  Zakelijk: { naar: "Bestemming", ph: "Adres of bedrijfsnaam", datum: "Datum", tijd: "Ophaaltijd" },
  Groep: { naar: "Bestemming", ph: "Adres of plaats", datum: "Datum", tijd: "Ophaaltijd" },
};

const naar = document.getElementById("naar");
const currentType = () => form.querySelector('input[name="type"]:checked').value;

function applyType() {
  const type = currentType();
  const t = TYPE_TEXT[type];
  document.getElementById("naar-label").textContent = t.naar;
  naar.placeholder = t.ph;
  document.getElementById("datum-label").textContent = t.datum;
  document.getElementById("tijd-label").textContent = t.tijd;
  // Luchthavensuggesties alleen tonen bij luchthavenritten
  if (type === "Luchthaven") naar.setAttribute("list", "luchthavens");
  else naar.removeAttribute("list");
  form.querySelectorAll(".extra").forEach((el) => (el.hidden = el.dataset.for !== type));
}
form.querySelectorAll('input[name="type"]').forEach((r) => r.addEventListener("change", applyType));
applyType();

// Links in de dienstkaarten zetten meteen de juiste soort rit aan
document.querySelectorAll(".js-pick").forEach((a) =>
  a.addEventListener("click", () => {
    const radio = document.getElementById(a.dataset.type);
    if (radio) {
      radio.checked = true;
      applyType();
      goTo(1);
    }
  })
);

// Stappen
const panels = form.querySelectorAll("[data-step]");
const indicators = form.querySelectorAll("[data-step-ind]");
const stepCount = document.getElementById("stepcount");

function goTo(step) {
  panels.forEach((p) => (p.hidden = p.dataset.step !== String(step)));
  indicators.forEach((li) => {
    const n = Number(li.dataset.stepInd);
    li.classList.toggle("is-active", n === step);
    li.classList.toggle("is-done", n < step);
  });
  stepCount.textContent = `Stap ${step} van 2`;
  hideError();
}

function validate(panel) {
  const missing = [];
  panel.querySelectorAll("[required]").forEach((input) => {
    const field = input.closest(".field");
    const ok = input.value.trim() !== "";
    field.classList.toggle("is-invalid", !ok);
    if (!ok) missing.push(field.querySelector("label").textContent.trim().toLowerCase());
  });
  if (missing.length) {
    showError(`Vul nog in: ${missing.join(", ")}.`);
    panel.querySelector(".is-invalid input, .is-invalid select")?.focus();
    return false;
  }
  hideError();
  return true;
}

function showError(msg) { errorBox.textContent = msg; errorBox.hidden = false; }
function hideError() { errorBox.hidden = true; }

form.addEventListener("input", (e) => {
  const field = e.target.closest(".field");
  if (field && e.target.value.trim()) field.classList.remove("is-invalid");
});

document.getElementById("next").addEventListener("click", () => {
  if (validate(panels[0])) {
    goTo(2);
    document.getElementById("naam").focus();
  }
});
document.getElementById("back").addEventListener("click", () => goTo(1));

const formatDate = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
};

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!panels[1].hidden) {
    if (!validate(panels[1])) return;
  } else {
    if (!validate(panels[0])) return;
    goTo(2);
    return;
  }

  const v = (id) => document.getElementById(id).value.trim();
  const type = currentType();
  const lines = [
    "Hoi Taxi VI, ik wil graag een offerte.",
    "",
    `Soort rit: ${type}`,
    `Ophalen: ${v("van")}`,
    `${TYPE_TEXT[type].naar}: ${v("naar")}`,
    `${TYPE_TEXT[type].datum}: ${formatDate(v("datum"))}`,
    `Tijd: ${v("tijd")}`,
    `Personen: ${v("personen")}`,
    `Retour: ${document.getElementById("retour").checked ? "ja" : "nee"}`,
  ];
  if (type === "Leerlingenvervoer") lines.push(`Hoe vaak: ${v("frequentie")}`);
  if (type === "Luchthaven") {
    if (v("vlucht")) lines.push(`Vluchtnummer: ${v("vlucht")}`);
    lines.push(`Koffers: ${v("koffers")}`);
  }
  if (type === "Evenement") lines.push(`Evenement: ${v("evenement")}`);
  lines.push("", `Naam: ${v("naam")}`);
  if (v("email")) lines.push(`E-mail: ${v("email")}`);
  if (v("opmerking")) lines.push(`Opmerking: ${v("opmerking")}`);

  window.open(waUrl(lines.join("\n")), "_blank", "noopener");
});
