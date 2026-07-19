const PRAYER_KEYS = {
  fajr: "fajr", dhuhr: "dhuhr", asr: "asr", maghrib: "maghrib", isha: "isha",
  İmsak: "fajr", Öğle: "dhuhr", İkindi: "asr", Akşam: "maghrib", Yatsı: "isha",
  Fajr: "fajr", Dhuhr: "dhuhr", Asr: "asr", Maghrib: "maghrib", Isha: "isha"
};

const POPUP_MESSAGES = {
  tr: {
    save: "Kaydet", showAllTimes: "Tüm Vakitleri Göster", hideAllTimes: "Tüm Vakitleri Gizle", changeLocation: "Konumu Değiştir", prayerColumn: "Vakit", timeColumn: "Saat",
    nextPrayerLabel: "Sonraki vakit: $1", timeLabel: "Saat: $1", remainingLabel: "Kalan süre: $1",
    prayer_fajr: "İmsak", prayer_dhuhr: "Öğle", prayer_asr: "İkindi", prayer_maghrib: "Akşam", prayer_isha: "Yatsı",
    durationHoursMinutes: "$1 saat $2 dk", durationHours: "$1 saat", durationMinutes: "$1 dk", tooltipHoursMinutes: "$1 saat $2 dk kaldı", tooltipMinutes: "$1 dk kaldı",
    privacyTitle: "Gizlilik", privacyText: "Konum seçiminiz ve dil tercihiniz yalnızca cihazınızda saklanır. Vakitleri almak için seçtiğiniz konum bilgisi güvenli bağlantıyla namaz vakti hizmetine gönderilir. Tarama geçmişi, hesap bilgisi veya analiz verisi toplanmaz.",
    notificationTitle: "Namaz Vakti Yaklaşıyor", notificationBody: "$1 vaktine $2 dakika kaldı.", urgentTooltip: "$1 vaktine $2 dakika kaldı"
  },
  en: {
    save: "Save", showAllTimes: "Show All Times", hideAllTimes: "Hide All Times", changeLocation: "Change Location", prayerColumn: "Prayer", timeColumn: "Time",
    nextPrayerLabel: "Next prayer: $1", timeLabel: "Time: $1", remainingLabel: "Remaining: $1",
    prayer_fajr: "Fajr", prayer_dhuhr: "Dhuhr", prayer_asr: "Asr", prayer_maghrib: "Maghrib", prayer_isha: "Isha",
    durationHoursMinutes: "$1 h $2 min", durationHours: "$1 h", durationMinutes: "$1 min", tooltipHoursMinutes: "$1 h $2 min left", tooltipMinutes: "$1 min left",
    privacyTitle: "Privacy", privacyText: "Your selected location and language preference are stored only on your device. Your selected location is sent over a secure connection to the prayer-times service to retrieve times. No browsing history, account information, or analytics data is collected.",
    notificationTitle: "Prayer Time Is Near", notificationBody: "$2 minutes until $1.", urgentTooltip: "$2 minutes until $1"
  }
};

let selectedLanguage;

function setLanguage(language) {
  selectedLanguage = language === "tr" ? "tr" : "en";
}

function getLanguage() {
  return selectedLanguage || (browser.i18n.getUILanguage().toLowerCase().startsWith("tr") ? "tr" : "en");
}

function getMessage(key, substitutions = []) {
  const message = POPUP_MESSAGES[selectedLanguage]?.[key] || browser.i18n.getMessage(key, substitutions);
  return substitutions.reduce((text, value, index) => text.replaceAll(`$${index + 1}`, value), message);
}

function getPrayerName(nameOrKey) {
  const key = PRAYER_KEYS[nameOrKey] || nameOrKey;
  return getMessage(`prayer_${key}`) || nameOrKey;
}

function formatDuration(milliseconds) {
  const totalMinutes = Math.ceil(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) return getMessage("durationHoursMinutes", [String(hours), String(minutes)]);
  if (hours) return getMessage("durationHours", [String(hours)]);
  return getMessage("durationMinutes", [String(minutes)]);
}

function formatTooltip(milliseconds) {
  const totalMinutes = Math.ceil(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? getMessage("tooltipHoursMinutes", [String(hours), String(minutes)]) : getMessage("tooltipMinutes", [String(minutes)]);
}

function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = getMessage(element.dataset.i18n);
  });
  document.documentElement.lang = getLanguage();
}
