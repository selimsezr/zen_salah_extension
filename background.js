const API_BASE = "https://prayertimes.api.abdus.dev/api/diyanet";

const DEFAULT_SETTINGS = {
  country: "TÜRKİYE",
  region: "ANKARA",
  city: "ANKARA",
  locationId: 9206
};

function localToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function getSettings() {
  const { settings } = await browser.storage.local.get("settings");
  return { ...DEFAULT_SETTINGS, ...settings };
}
function getRemainingMinutes(vakitler) {
  const now = new Date();

  for (let i = 0; i < vakitler.length; i++) {
    const d = toDate(vakitler[i].time);
    if (now < d) {
      return Math.ceil((d - now) / 60000);
    }
  }
  const next = toDate(vakitler[0].time, 1);
  return Math.ceil((next - now) / 60000);
}

async function resolveLocationId(settings) {
  if (settings.locationId) return settings.locationId;

  const country =
    settings.country === "Turkey" ? "TÜRKİYE" : settings.country;
  const province = settings.region.toUpperCase();
  const res = await fetch(
    `${API_BASE}/locations?country=${encodeURIComponent(country)}&city=${encodeURIComponent(province)}`
  );
  const locations = await res.json();
  const target = settings.city.toUpperCase();
  const match = locations.find((l) => l.region === target);

  if (match) {
    const updated = {
      ...settings,
      country,
      region: province,
      city: match.region,
      locationId: match.id
    };
    await browser.storage.local.set({ settings: updated });
    return match.id;
  }

  return DEFAULT_SETTINGS.locationId;
}

async function fetchVakitler() {
  const today = localToday();
  const { vakitler, vakitDate } = await browser.storage.local.get([
    "vakitler",
    "vakitDate"
  ]);

  if (vakitler && vakitDate === today) return vakitler;

  const settings = await getSettings();
  const locationId = await resolveLocationId(settings);
  const res = await fetch(`${API_BASE}/prayertimes?location_id=${locationId}`);
  const data = await res.json();

  const todayData = data.find((d) => d.date.startsWith(today));
  if (!todayData) {
    throw new Error(browser.i18n.getMessage("errorNoPrayerTimes"));
  }

  const list = [
    { name: "fajr", time: todayData.fajr },
    { name: "dhuhr", time: todayData.dhuhr },
    { name: "asr", time: todayData.asr },
    { name: "maghrib", time: todayData.maghrib },
    { name: "isha", time: todayData.isha }
  ];

  await browser.storage.local.set({
    vakitler: list,
    vakitDate: today
  });

  return list;
}

function toDate(time, offset = 0) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(h, m, 0, 0);
  return d;
}

function getNextProgress(vakitler) {
  const now = new Date();

  for (let i = 0; i < vakitler.length; i++) {
    const next = toDate(vakitler[i].time);
    if (now < next) {
      const prev =
        i === 0
          ? toDate(vakitler.at(-1).time, -1)
          : toDate(vakitler[i - 1].time);

      return (now - prev) / (next - prev);
    }
  }

  const prev = toDate(vakitler.at(-1).time);
  const next = toDate(vakitler[0].time, 1);
  return (now - prev) / (next - prev);
}

function drawIcon(progress) {
  const size = 30;
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, size, size);

  const center = size / 2;
  const radius = size / 2 - 2;

  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "#888"; // ince, minimalist gri
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(200, 200, 200, 0)"; // hafif gri, şeffaf
  ctx.fill();

  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + progress * 2 * Math.PI;

  ctx.beginPath();
  ctx.moveTo(center, center);
  ctx.arc(center, center, radius, startAngle, endAngle);
  ctx.closePath();
  ctx.fillStyle = "rgba(120,120,120,0.6)";
  ctx.fill();

  return ctx.getImageData(0, 0, size, size);
}

async function updateIcon() {
  try {
    const vakitler = await fetchVakitler();
    const progress = getNextProgress(vakitler);
    const remainingMs = getRemainingMinutes(vakitler) * 60000;
    const tooltip = formatTooltip(remainingMs);

    await browser.action.setIcon({
      imageData: drawIcon(progress)
    });

    await browser.action.setTitle({
      title: tooltip
    });
  } catch (err) {
    console.error(browser.i18n.getMessage("errorUpdateFailed"), err);
  }
}

browser.runtime.onInstalled.addListener(() => {
  browser.alarms.create("tick", { periodInMinutes: 1 });
  updateIcon();
});

browser.runtime.onStartup.addListener(() => {
  browser.alarms.create("tick", { periodInMinutes: 1 });
  updateIcon();
});


browser.alarms.onAlarm.addListener((a) => {
  if (a.name === "tick") updateIcon();
});
browser.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "UPDATE") {
    updateIcon();
    return;
  }

  if (msg.type === "GET_VAKITLER") {
    fetchVakitler()
      .then((vakitler) => {
        sendResponse({
          vakitler,
          progress: getNextProgress(vakitler)
        });
      })
      .catch((err) => {
        sendResponse({ error: err.message });
      });
    return true;
  }
});
