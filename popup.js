const API_BASE = "https://prayertimes.api.abdus.dev/api/diyanet";
const country = document.getElementById("country");
const region = document.getElementById("region");
const city = document.getElementById("city");
const canvas = document.getElementById("icon");
const context = canvas.getContext("2d");
const locationFields = document.getElementById("location-fields");
const changeLocation = document.getElementById("change-location");
const toggleTimes = document.getElementById("toggle-times");
const timesTable = document.getElementById("times-table");
const languageToggle = document.getElementById("language-toggle");

async function getJson(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

async function loadCountries() {
  country.replaceChildren(...(await getJson("/countries")).map((item) => new Option(item, item)));
}
async function loadRegions(selectedCountry) {
  region.replaceChildren(...(await getJson(`/countries/${encodeURIComponent(selectedCountry)}/cities`)).map((item) => new Option(item, item)));
}
async function loadCities(selectedCountry, selectedRegion) {
  city.replaceChildren(...(await getJson(`/locations?country=${encodeURIComponent(selectedCountry)}&city=${encodeURIComponent(selectedRegion)}`)).map((item) => new Option(item.region, item.id)));
}

async function initializeLocation() {
  const { settings } = await browser.storage.local.get("settings");
  setLanguage(settings?.language || (browser.i18n.getUILanguage().startsWith("tr") ? "tr" : "en"));
  applyStaticI18n();
  renderPrivacyNotice();
  updateLanguageButton();
  await loadCountries();
  const saved = settings || { country: "TÜRKİYE", region: "ANKARA", locationId: 9206 };
  country.value = saved.country === "Turkey" ? "TÜRKİYE" : saved.country;
  await loadRegions(country.value);
  region.value = saved.region.toUpperCase();
  await loadCities(country.value, region.value);
  if (saved.locationId) city.value = String(saved.locationId);
  if (settings?.locationId) {
    locationFields.classList.add("hidden");
    changeLocation.classList.remove("hidden");
  }
}

function updateLanguageButton() {
  languageToggle.textContent = getLanguage() === "tr" ? "English" : "Türkçe";
}

function renderPrivacyNotice() {
  document.getElementById("privacy-text").textContent = getMessage("privacyText");
}

function getNextVakit(vakitler) {
  const now = new Date();
  for (const vakit of vakitler) {
    const [hours, minutes] = vakit.time.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    if (now < date) return { ...vakit, date };
  }
  const first = vakitler[0];
  const [hours, minutes] = first.time.split(":").map(Number);
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hours, minutes, 0, 0);
  return { ...first, date };
}

function drawCountdown(progress, minutes) {
  const size = 112;
  const pixelRatio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = size * pixelRatio;
  canvas.height = size * pixelRatio;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, size, size);

  const styles = getComputedStyle(document.documentElement);
  const trackColor = styles.getPropertyValue("--ring-track").trim();
  const dialColor = styles.getPropertyValue("--dial").trim();
  const textColor = styles.getPropertyValue("--ink").trim();
  const accentColor = minutes <= 10 ? "#ef4444" : minutes <= 30 ? "#f59e0b" : "#0ea5e9";
  const center = size / 2;
  const radius = 45;
  const lineWidth = 10;
  const fill = Math.min(Math.max(progress, 0.015), 1);

  context.beginPath();
  context.arc(center, center, radius - lineWidth, 0, Math.PI * 2);
  context.fillStyle = dialColor;
  context.fill();

  context.beginPath();
  context.arc(center, center, radius, 0, Math.PI * 2);
  context.strokeStyle = trackColor;
  context.lineWidth = lineWidth;
  context.stroke();

  context.beginPath();
  context.arc(center, center, radius, -Math.PI / 2, -Math.PI / 2 + fill * Math.PI * 2);
  context.strokeStyle = accentColor;
  context.lineWidth = lineWidth;
  context.lineCap = "round";
  context.stroke();

  const value = minutes >= 1000 ? "999+" : String(minutes);
  context.fillStyle = textColor;
  context.font = `700 ${value.length > 3 ? 21 : 27}px system-ui`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(value, center, center - 7);

  context.fillStyle = accentColor;
  context.font = "700 11px system-ui";
  context.fillText(getLanguage() === "tr" ? "DAKİKA" : "MINUTES", center, center + 17);
}

function renderTimes(vakitler, nextName) {
  const body = timesTable.querySelector("tbody");
  body.replaceChildren(...vakitler.map((vakit) => {
    const row = document.createElement("tr");
    if (vakit.name === nextName) row.classList.add("next-prayer");
    const name = document.createElement("td");
    const time = document.createElement("td");
    name.textContent = getPrayerName(vakit.name);
    time.textContent = vakit.time;
    row.append(name, time);
    return row;
  }));
}

async function loadNextPrayer() {
  const response = await browser.runtime.sendMessage({ type: "GET_VAKITLER" });
  if (!response?.vakitler?.length) return;
  const next = getNextVakit(response.vakitler);
  const remaining = next.date - new Date();
  document.getElementById("next-name").textContent = getMessage("nextPrayerLabel", [getPrayerName(next.name)]);
  document.getElementById("next-time").textContent = getMessage("timeLabel", [next.time]);
  document.getElementById("remaining").textContent = getMessage("remainingLabel", [formatDuration(remaining)]);
  drawCountdown(response.progress, Math.ceil(remaining / 60000));
  renderTimes(response.vakitler, next.name);
}

country.addEventListener("change", async () => { await loadRegions(country.value); await loadCities(country.value, region.value); });
region.addEventListener("change", () => loadCities(country.value, region.value));
changeLocation.addEventListener("click", () => {
  locationFields.classList.remove("hidden");
  changeLocation.classList.add("hidden");
});
toggleTimes.addEventListener("click", () => {
  const isHidden = timesTable.classList.toggle("hidden");
  toggleTimes.textContent = getMessage(isHidden ? "showAllTimes" : "hideAllTimes");
});
languageToggle.addEventListener("click", async () => {
  const language = getLanguage() === "tr" ? "en" : "tr";
  setLanguage(language);
  const { settings = {} } = await browser.storage.local.get("settings");
  await browser.storage.local.set({ settings: { ...settings, language } });
  applyStaticI18n();
  renderPrivacyNotice();
  updateLanguageButton();
  toggleTimes.textContent = getMessage(timesTable.classList.contains("hidden") ? "showAllTimes" : "hideAllTimes");
  await loadNextPrayer();
});
document.getElementById("save").addEventListener("click", async () => {
  const locationId = Number(city.value); if (!locationId) return;
  const { settings = {} } = await browser.storage.local.get("settings");
  await browser.storage.local.set({ settings: { ...settings, country: country.value, region: region.value, city: city.selectedOptions[0].text, locationId } });
  await browser.storage.local.remove(["vakitler", "vakitDate"]);
  await browser.runtime.sendMessage({ type: "UPDATE" });
  await loadNextPrayer();
  locationFields.classList.add("hidden");
  changeLocation.classList.remove("hidden");
});

initializeLocation().then(loadNextPrayer).catch(console.error);
