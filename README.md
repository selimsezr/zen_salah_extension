# 🕌 Vakit Takibi – Firefox Eklentisi

**Vakit Takibi**, bulunduğunuz konuma göre namaz vakitlerini takip eden ve bir sonraki vakte kalan süreyi tarayıcı araç çubuğunda görsel olarak gösteren hafif ve modern bir Firefox eklentisidir.

Eklenti, arka planda sürekli çalışır ve dakika bazında otomatik olarak güncellenir.

---

## ✨ Özellikler

- ⏳ Bir sonraki namaz vaktine kalan süreyi anlık takip
- 🎨 Modern ve minimalist ikon (pasta/progress görünümü)
- 🔄 Dakikada bir otomatik güncelleme
- 🌍 Ülke / şehir / bölge bazlı hesaplama
- 💾 Günlük vakitleri cache’leyerek performanslı çalışma
- 💤 Popup açılmadan da arka planda çalışır

---

## 🧠 Nasıl Çalışır?

- Namaz vakitleri `prayertimes.api.abdus.dev` API’sinden alınır (Diyanet verisi)
- Günlük vakitler local storage’da saklanır
- Firefox `alarms` API ile her dakika güncellenir
- Kalan süreye göre ikon içindeki doluluk oranı hesaplanır
- Tooltip üzerinde **“X saat Y dk kaldı”** formatında bilgi gösterilir

---

## 🧩 Teknolojiler

- Firefox WebExtensions (Manifest V2)
- JavaScript (ES6+)
- `OffscreenCanvas` ile dinamik ikon çizimi
- `browser.storage.local`
- `browser.alarms`

---

## 📦 Kurulum (Geliştirici Modu)

1. Bu projeyi klonlayın:
   ```bash
   git clone https://github.com/kullanici-adi/vakit-takibi.git
