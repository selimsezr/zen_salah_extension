const PRAYER_KEYS = {
  fajr: "fajr",
  dhuhr: "dhuhr",
  asr: "asr",
  maghrib: "maghrib",
  isha: "isha",
  İmsak: "fajr",
  Öğle: "dhuhr",
  İkindi: "asr",
  Akşam: "maghrib",
  Yatsı: "isha",
  Fajr: "fajr",
  Dhuhr: "dhuhr",
  Asr: "asr",
  Maghrib: "maghrib",
  Isha: "isha"
};

function getPrayerKey(nameOrKey) {
  return PRAYER_KEYS[nameOrKey] || nameOrKey;
}

function getPrayerName(nameOrKey) {
  const key = getPrayerKey(nameOrKey);
  return browser.i18n.getMessage(`prayer_${key}`) || nameOrKey;
}

function formatDuration(ms) {
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return browser.i18n.getMessage("durationHoursMinutes", [
      String(hours),
      String(minutes)
    ]);
  }
  if (hours > 0) {
    return browser.i18n.getMessage("durationHours", [String(hours)]);
  }
  return browser.i18n.getMessage("durationMinutes", [String(minutes)]);
}

function formatTooltip(ms) {
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return browser.i18n.getMessage("tooltipHoursMinutes", [
      String(hours),
      String(minutes)
    ]);
  }
  return browser.i18n.getMessage("tooltipMinutes", [String(minutes)]);
}

function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const message = browser.i18n.getMessage(el.dataset.i18n);
    if (message) el.textContent = message;
  });

  const lang = browser.i18n.getUILanguage().split("-")[0];
  document.documentElement.lang = lang;
}
