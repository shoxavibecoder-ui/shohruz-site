// Bot sozlamalari — matn, narx va chegirmani shu yerda o'zgartiring.
// Narxlar saytdagi (index.html → PROFILE.pricing) bilan bir xil bo'lishi kerak.

module.exports = {
  name: "Shohruz",
  telegram: "wakho701",
  site: "https://shohruz-site.onrender.com",

  discount: {
    percent: 30,
    totalSlots: 5,
    // Band joylar sonini kodga tegmasdan Render'dagi SLOTS_TAKEN o'zgaruvchisi bilan ham yangilash mumkin.
    taken: Number(process.env.SLOTS_TAKEN || 0),
  },

  terms: {
    payment: "50% oldindan, 50% — natijani ko'rib, rozi bo'lganingizdan keyin",
    revisions: 2,
    supportDays: 14,
  },

  pricing: [
    { level: "Oson", key: "easy", emoji: "🟢", note: "Tez start uchun — bir necha kunda tayyor",
      items: [
        { name: "Sayt-vizitka", desc: "1 sahifa: siz haqingizda, xizmatlar, aloqa", days: "2–3 kun", price: 150 },
        { name: "Landing sahifa", desc: "Mahsulot yoki xizmatni sotadigan sahifa + ariza formasi", days: "3–5 kun", price: 250 },
        { name: "Oddiy Telegram bot", desc: "Menyu, ma'lumot, ariza qabul qilish", days: "2–3 kun", price: 120 },
        { name: "Saytni yangilash", desc: "Eski saytni zamonaviy dizayn va tezlikka o'tkazish", days: "3–5 kun", price: 200 },
      ] },
    { level: "O'rta", key: "mid", emoji: "🔵", note: "Ko'proq mijoz va avtomatlashtirish uchun",
      items: [
        { name: "Korporativ sayt", desc: "5–7 sahifa, animatsiyali premium dizayn, SEO", days: "7–10 kun", price: 500 },
        { name: "Portfolio / blog", desc: "Ishlar galereyasi yoki maqolalar bilan sayt", days: "5–7 kun", price: 350 },
        { name: "Telegram bot + admin", desc: "Buyurtmalar, baza, admin panel, xabar yuborish", days: "5–10 kun", price: 400 },
        { name: "AI chat-bot", desc: "Mijozlarga javob beruvchi AI yordamchi", days: "5–7 kun", price: 450 },
      ] },
    { level: "Murakkab", key: "hard", emoji: "🟠", note: "To'liq biznes tizimlari",
      items: [
        { name: "Onlayn do'kon", desc: "Katalog, savat, Payme/Click to'lovlari, admin panel", days: "2–3 hafta", price: 1000 },
        { name: "Telegram Mini App", desc: "Telegram ichidagi do'kon yoki xizmat ilovasi", days: "2–3 hafta", price: 900 },
        { name: "Veb-ilova / CRM", desc: "Kabinetlar, rollar, hisobotlar — biznesingizga moslab", days: "3–6 hafta", price: 1500, plus: true },
      ] },
  ],

  faq: [
    ["Sayt qancha vaqtda tayyor bo'ladi?", "Qiyinchilikka bog'liq: oddiy ishlar 2–5 kun, o'rtacha 1–2 hafta, murakkab tizimlar 2–6 hafta."],
    ["To'lov qanday?", "50% oldindan, 50% — natijani ko'rib, rozi bo'lganingizdan keyin."],
    ["Dizayn yoqmasa-chi?", "2 marta bepul qayta ishlayman. Siz tasdiqlamaguningizcha keyingi bosqichga o'tmaymiz."],
    ["AI bilan qilingan sayt sifatli bo'ladimi?", "Ha. Sayt keng tarqalgan texnologiyalarda yoziladi, telefon va kompyuterda tekshiriladi va siz tasdiqlamaguningizcha topshirilmaydi."],
    ["Domen va kod kimniki bo'ladi?", "Hammasi sizniki — kodi va kirish ma'lumotlari bilan topshiriladi."],
  ],
};
