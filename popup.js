const country = document.getElementById("country");
const region = document.getElementById("region");
const city = document.getElementById("city");
const save = document.getElementById("save");
const canvas = document.getElementById("icon");
const ctx = canvas.getContext("2d");

async function loadCountries() {
  const res = await fetch("https://vakit.vercel.app/api/countries");
  const data = await res.json();

  country.innerHTML = "";
  data.forEach((c) => {
    country.add(new Option(c.name, c.name));
  });
}

async function loadRegions(c) {
  region.innerHTML = "";
  const res = await fetch(
    `https://vakit.vercel.app/api/regions?country=${encodeURIComponent(c)}`
  );
  const data = await res.json();
  data.forEach((r) => region.add(new Option(r, r)));
}

async function loadCities(c, r) {
  city.innerHTML = "";
  const res = await fetch(
    `https://vakit.vercel.app/api/cities?country=${encodeURIComponent(
      c
    )}&region=${encodeURIComponent(r)}`
  );
  const data = await res.json();
  data.forEach((x) => city.add(new Option(x, x)));
}

async function init() {
  await loadCountries();

  const { settings } = await browser.storage.local.get("settings");
  if (settings) {
    country.value = settings.country;
    await loadRegions(settings.country);
    region.value = settings.region;
    await loadCities(settings.country, settings.region);
    city.value = settings.city;
  } else {
    await loadRegions(country.value);
    await loadCities(country.value, region.value);
  }
}

country.onchange = async () => {
  await loadRegions(country.value);
  await loadCities(country.value, region.value);
};

region.onchange = async () => {
  await loadCities(country.value, region.value);
};

save.onclick = async () => {
  await browser.storage.local.set({
    settings: {
      country: country.value,
      region: region.value,
      city: city.value,
      days: 1,
      timezoneOffset: 180,
      calculationMethod: "Turkey",
    },
  });

  await browser.storage.local.remove(["vakitler", "vakitDate"]);
  window.close();
};
const nextName = document.getElementById("next-name");
const nextTime = document.getElementById("next-time");
const remaining = document.getElementById("remaining");

function toDate(time, offset = 0) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(h, m, 0, 0);
  return d;
}

function formatRemaining(ms) {
  const totalMinutes = Math.ceil(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h > 0 && m > 0) return `${h} saat ${m} dk`;
  if (h > 0) return `${h} saat`;
  return `${m} dk`;
}


async function loadNextVakit() {
  const { vakitler } = await browser.storage.local.get("vakitler");
  if (!vakitler || !vakitler.length) return;

  const now = new Date();
  let next = null;
  let nextDate = null;

  for (let i = 0; i < vakitler.length; i++) {
    const d = toDate(vakitler[i].time);
    if (now < d) {
      next = vakitler[i];
      nextDate = d;
      break;
    }
  }

  if (!next) {
    next = vakitler[0];
    nextDate = toDate(next.time, 1);
  }

  const diff = nextDate - now;

  nextName.textContent = `Sonraki vakit: ${next.name}`;
  nextTime.textContent = `Saat: ${next.time}`;
  remaining.textContent = `Kalan süre: ${formatRemaining(diff)}`;
}

function drawBigIcon(progress, minutes) {
  const size = 96;
  ctx.clearRect(0, 0, size, size);

  ctx.fillStyle = "#020617";
  ctx.beginPath();
  ctx.arc(48, 48, 46, 0, Math.PI * 2);
  ctx.fill();

  const p = Math.max(progress, 0.02);
  ctx.fillStyle = p > 0.5 ? "#22c55e" : p > 0.25 ? "#facc15" : "#ef4444";

  ctx.beginPath();
  ctx.moveTo(48, 48);
  ctx.arc(48, 48, 46, -Math.PI / 2, p * 2 * Math.PI - Math.PI / 2);
  ctx.fill();

  ctx.fillStyle = "#e5e7eb";
  ctx.font = "bold 24px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(minutes, 48, 48);
}
function getNextVakit(vakitler) {
  const now = new Date();

  for (let i = 0; i < vakitler.length; i++) {
    const [h, m] = vakitler[i].time.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);

    if (now < d) {
      return { ...vakitler[i], date: d };
    }
  }

  // Yatsı geçtiyse yarının ilk vakti
  const first = vakitler[0];
  const [h, m] = first.time.split(":").map(Number);
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(h, m, 0, 0);

  return { ...first, date: d };
}

function formatRemaining(ms) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h} saat ${m} dk` : `${m} dk`;
}
async function loadNext() {
  const bg = browser.runtime.getBackgroundPage
    ? await browser.runtime.getBackgroundPage()
    : null;

  if (!bg) return;

  const vakitler = await bg.fetchVakitler();
  const next = getNextVakit(vakitler);

  document.getElementById("next-name").textContent = next.name;
  document.getElementById("next-time").textContent = next.time;

  const remainingMs = next.date - new Date();
  document.getElementById("remaining").textContent =
    formatRemaining(remainingMs);

  const progress = bg.getNextProgress(vakitler);
  const minutes = Math.ceil(remainingMs / 60000);

  drawBigIcon(progress, minutes);
}

loadNext();
loadNextVakit();
init();
