// Shohruz — Telegram bot (webhook, tashqi kutubxonasiz, Node 18+).
// Muhit o'zgaruvchilari (Render → Environment):
//   BOT_TOKEN  — @BotFather bergan token (MAXFIY, kodga yozilmaydi)
//   ADMIN_ID   — arizalar keladigan Telegram chat ID (botga /id yozib bilib olasiz)
//   SLOTS_TAKEN — chegirmali band joylar soni (ixtiyoriy)
//   RENDER_EXTERNAL_URL — Render o'zi beradi; webhook shu manzilga o'rnatiladi

const http = require("node:http");
const crypto = require("node:crypto");
const C = require("./config");

const TOKEN = process.env.BOT_TOKEN || "";
const ADMIN_ID = process.env.ADMIN_ID || "";
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_URL = (process.env.RENDER_EXTERNAL_URL || "").replace(/\/$/, "");
const SECRET = TOKEN ? crypto.createHash("sha256").update(TOKEN).digest("hex").slice(0, 48) : "";
const HOOK_PATH = `/tg/${SECRET.slice(0, 16)}`;
const LEAD_COOLDOWN_MS = 60_000;
const SESSION_TTL_MS = 30 * 60_000;
const MAX_TEXT = 500;

const log = {
  info: (...a) => process.stdout.write(`[info] ${a.join(" ")}\n`),
  error: (...a) => process.stderr.write(`[error] ${a.join(" ")}\n`),
};

/* ---------------- helpers ---------------- */
const esc = (s) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
const D = C.discount;
const slotsLeft = () => Math.max(0, D.totalSlots - D.taken);
const discountActive = () => slotsLeft() > 0 && D.percent > 0;
const discounted = (v) => Math.round((v * (100 - D.percent)) / 100 / 5) * 5;
const money = (v, plus) => `$${v.toLocaleString("en-US")}${plus ? "+" : ""}`;
const priceText = (i) => (discountActive()
  ? `<s>${money(i.price, i.plus)}</s> <b>${money(discounted(i.price), i.plus)}</b>`
  : `<b>${money(i.price, i.plus)}</b>`);
const allItems = C.pricing.flatMap((l) => l.items.map((i) => ({ ...i, level: l.level })));
const clip = (s) => String(s || "").trim().slice(0, MAX_TEXT);

async function tg(method, body) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.ok) log.error(method, json.description);
    return json;
  } catch (err) {
    log.error(method, err instanceof Error ? err.message : "unknown");
    return { ok: false };
  }
}

const send = (chat_id, text, extra = {}) =>
  tg("sendMessage", { chat_id, text, parse_mode: "HTML", disable_web_page_preview: true, ...extra });

async function show(cb, text, keyboard) {
  const reply_markup = { inline_keyboard: keyboard };
  if (cb) {
    const r = await tg("editMessageText", {
      chat_id: cb.message.chat.id, message_id: cb.message.message_id, text,
      parse_mode: "HTML", disable_web_page_preview: true, reply_markup,
    });
    if (r.ok) return r;
  }
  const chatId = cb?.message?.chat?.id;
  return chatId ? send(chatId, text, { reply_markup }) : null;
}

/* ---------------- screens ---------------- */
const btn = (text, data) => ({ text, callback_data: data });
const back = [btn("⬅️ Menyu", "menu")];

function menuText() {
  const offer = discountActive()
    ? `\n\n🔥 <b>Ochilish chegirmasi:</b> birinchi ${D.totalSlots} mijozga −${D.percent}% (${slotsLeft()} ta joy qoldi)`
    : "";
  return `Assalomu alaykum! 👋\n\nMen <b>${esc(C.name)}</b> — AI yordamida sayt, onlayn do'kon va Telegram botlar yasayman. Tez, arzon va sifatli.${offer}\n\nQuyidagidan tanlang 👇`;
}
const menuKeyboard = () => [
  [btn("💰 Narxlar", "prices"), btn("🔥 Chegirma", "offer")],
  [btn("📝 Ariza qoldirish", "order")],
  [btn("❓ Savollar", "faq"), { text: "🌐 Sayt", url: C.site }],
  [{ text: "💬 Shohruzga yozish", url: `https://t.me/${C.telegram}` }],
];

function pricesText() {
  const note = discountActive() ? `\n<i>Narxlar −${D.percent}% chegirma bilan (birinchi ${D.totalSlots} mijozga).</i>` : "";
  return `💰 <b>Narxlar</b> — qiyinchilikka qarab${note}\n\nDarajani tanlang:`;
}
const pricesKeyboard = () => [
  ...C.pricing.map((l) => [btn(`${l.emoji} ${l.level}`, `level:${l.key}`)]),
  back,
];

function levelText(key) {
  const l = C.pricing.find((x) => x.key === key);
  if (!l) return null;
  const rows = l.items.map((i) => `▫️ <b>${esc(i.name)}</b> — ${priceText(i)}\n   ${esc(i.desc)}\n   ⏱ ${esc(i.days)}`);
  return `${l.emoji} <b>${esc(l.level)}</b> — ${esc(l.note)}\n\n${rows.join("\n\n")}`;
}

function offerText() {
  if (!discountActive()) return "Hozircha chegirma tugagan. Lekin konsultatsiya doim bepul! 🙂";
  const boxes = Array.from({ length: D.totalSlots }, (_, i) => (i < D.taken ? "⬛️" : "🟩")).join("");
  return `🔥 <b>Ochilish taklifi: −${D.percent}%</b>\n\nFreelancer sifatida endi ochiq ishlay boshladim, shuning uchun birinchi ${D.totalSlots} ta mijozga barcha xizmatlarga −${D.percent}% chegirma beraman.\n\nJoylar: ${boxes}  (<b>${slotsLeft()} ta</b> qoldi)\n\n✓ ${C.terms.revisions} marta bepul tuzatish\n✓ ${C.terms.supportDays} kun bepul qo'llab-quvvatlash\n✓ ${esc(C.terms.payment)}\n\nEvaziga: halol fikr-mulohazangiz va loyihani portfolioga qo'shishga ruxsat.`;
}

const faqText = () => `❓ <b>Ko'p beriladigan savollar</b>\n\n${C.faq.map(([q, a]) => `<b>${esc(q)}</b>\n${esc(a)}`).join("\n\n")}`;

/* ---------------- lead flow ---------------- */
// chatId -> { step, data, at }
const sessions = new Map();
const lastLeadAt = new Map();

function getSession(chatId) {
  const s = sessions.get(chatId);
  if (s && Date.now() - s.at > SESSION_TTL_MS) { sessions.delete(chatId); return null; }
  return s || null;
}
const setSession = (chatId, step, data) => sessions.set(chatId, { step, data, at: Date.now() });

const removeKb = { remove_keyboard: true };
const cancelRow = [btn("✖️ Bekor qilish", "cancel")];

async function startOrder(chatId) {
  const wait = LEAD_COOLDOWN_MS - (Date.now() - (lastLeadAt.get(chatId) || 0));
  if (wait > 0) {
    return send(chatId, `Arizangiz qabul qilingan ✅ Yana bittasini ${Math.ceil(wait / 1000)} soniyadan keyin yuborishingiz mumkin.`);
  }
  setSession(chatId, "name", {});
  return send(chatId, "📝 <b>Ariza</b> — 4 ta qisqa savol.\n\n1/4. Ismingiz nima?", { reply_markup: { inline_keyboard: [cancelRow] } });
}

function serviceKeyboard() {
  const rows = allItems.map((i, idx) => [btn(`${i.name} — ${money(discountActive() ? discounted(i.price) : i.price, i.plus)}`, `svc:${idx}`)]);
  return [...rows, [btn("🤷 Hali bilmayman", "svc:-1")], cancelRow];
}

async function onOrderText(chatId, s, msg) {
  const text = clip(msg.text);
  if (s.step === "name") {
    if (text.length < 2) return send(chatId, "Iltimos, ismingizni yozing 🙂");
    setSession(chatId, "contact", { ...s.data, name: text });
    return send(chatId, "2/4. Siz bilan qanday bog'lanaylik? Pastdagi tugma bilan raqamingizni yuboring yoki telefon / @username yozing.", {
      reply_markup: { keyboard: [[{ text: "📱 Raqamni yuborish", request_contact: true }]], resize_keyboard: true, one_time_keyboard: true },
    });
  }
  if (s.step === "contact") {
    const ok = /^@?[a-zA-Z0-9_]{5,32}$/.test(text) || text.replace(/\D/g, "").length >= 9;
    if (!ok) return send(chatId, "Telefon raqam (masalan +998 90 123 45 67) yoki @username yozing.");
    return askService(chatId, s, text);
  }
  if (s.step === "about") {
    setSession(chatId, "confirm", { ...s.data, about: text });
    return askConfirm(chatId, getSession(chatId).data);
  }
  return null;
}

async function askService(chatId, s, contact) {
  setSession(chatId, "service", { ...s.data, contact });
  await send(chatId, "Rahmat! ✅", { reply_markup: removeKb });
  return send(chatId, "3/4. Qaysi xizmat kerak?", { reply_markup: { inline_keyboard: serviceKeyboard() } });
}

function leadSummary(d) {
  const item = d.serviceIdx >= 0 ? allItems[d.serviceIdx] : null;
  const service = item
    ? `${esc(item.name)} (${esc(item.level)}) — ${money(discountActive() ? discounted(item.price) : item.price, item.plus)}${discountActive() ? ` (−${D.percent}%)` : ""}`
    : "hali aniq emas";
  return `👤 Ism: <b>${esc(d.name)}</b>\n📞 Aloqa: <b>${esc(d.contact)}</b>\n🛠 Xizmat: ${service}\n📝 Izoh: ${esc(d.about || "—")}`;
}

function askConfirm(chatId, d) {
  return send(chatId, `4/4 ✅ Tekshiring:\n\n${leadSummary(d)}\n\nYuboraymi?`, {
    reply_markup: { inline_keyboard: [[btn("✅ Yuborish", "confirm")], [btn("🔄 Qaytadan", "order"), btn("✖️ Bekor", "cancel")]] },
  });
}

async function submitLead(chatId, from, d) {
  sessions.delete(chatId);
  const who = from.username ? `@${esc(from.username)}` : `<a href="tg://user?id=${from.id}">profil</a>`;
  const adminText = `🆕 <b>Yangi ariza (bot)</b>\n\n${leadSummary(d)}\n🔗 Telegram: ${who}`;
  const delivered = ADMIN_ID ? (await send(ADMIN_ID, adminText)).ok : false;
  if (delivered) {
    lastLeadAt.set(chatId, Date.now());
    return send(chatId, "🎉 Arizangiz yuborildi! Tez orada siz bilan bog'lanaman.\n\nShoshilinch bo'lsa, to'g'ridan-to'g'ri yozing:", {
      reply_markup: { inline_keyboard: [[{ text: "💬 Shohruzga yozish", url: `https://t.me/${C.telegram}` }], back] },
    });
  }
  log.error("lead not delivered (ADMIN_ID missing or send failed)");
  return send(chatId, `Kechirasiz, arizani avtomatik yuborib bo'lmadi. Iltimos, quyidagi matnni @${C.telegram} ga yuboring:\n\n${leadSummary(d)}`, {
    reply_markup: { inline_keyboard: [[{ text: "💬 Shohruzga yozish", url: `https://t.me/${C.telegram}` }]] },
  });
}

/* ---------------- update router ---------------- */
async function onMessage(msg) {
  const chatId = msg.chat.id;
  if (msg.chat.type !== "private") return null;
  const text = (msg.text || "").trim();
  const s = getSession(chatId);

  if (msg.contact && s?.step === "contact") return askService(chatId, s, msg.contact.phone_number);
  if (text === "/start" || text === "/menu") { sessions.delete(chatId); return send(chatId, menuText(), { reply_markup: { inline_keyboard: menuKeyboard() } }); }
  if (text === "/narxlar") return send(chatId, pricesText(), { reply_markup: { inline_keyboard: pricesKeyboard() } });
  if (text === "/chegirma") return send(chatId, offerText(), { reply_markup: { inline_keyboard: [[btn("📝 Ariza qoldirish", "order")], back] } });
  if (text === "/ariza") return startOrder(chatId);
  if (text === "/id") return send(chatId, `Sizning chat ID: <code>${chatId}</code>`);
  if (s && text) return onOrderText(chatId, s, msg);
  return send(chatId, "Menyudan tanlang 👇", { reply_markup: { inline_keyboard: menuKeyboard() } });
}

async function onCallback(cb) {
  const chatId = cb.message?.chat?.id;
  const data = cb.data || "";
  await tg("answerCallbackQuery", { callback_query_id: cb.id });
  if (!chatId) return null;

  if (data === "menu") { sessions.delete(chatId); return show(cb, menuText(), menuKeyboard()); }
  if (data === "prices") return show(cb, pricesText(), pricesKeyboard());
  if (data.startsWith("level:")) {
    const t = levelText(data.slice(6));
    return t && show(cb, t, [[btn("📝 Ariza qoldirish", "order")], [btn("⬅️ Darajalar", "prices"), ...back]]);
  }
  if (data === "offer") return show(cb, offerText(), [[btn("📝 Joyni band qilish", "order")], back]);
  if (data === "faq") return show(cb, faqText(), [[btn("📝 Ariza qoldirish", "order")], back]);
  if (data === "order") return startOrder(chatId);
  if (data === "cancel") {
    sessions.delete(chatId);
    await send(chatId, "Bekor qilindi.", { reply_markup: removeKb });
    return send(chatId, menuText(), { reply_markup: { inline_keyboard: menuKeyboard() } });
  }

  const s = getSession(chatId);
  if (data.startsWith("svc:") && s?.step === "service") {
    const idx = Number(data.slice(4));
    if (!Number.isInteger(idx) || idx < -1 || idx >= allItems.length) return null;
    setSession(chatId, "about", { ...s.data, serviceIdx: idx });
    return send(chatId, "Biznesingiz haqida qisqacha yozing: nima bilan shug'ullanasiz va saytdan nimani kutasiz?", {
      reply_markup: { inline_keyboard: [[btn("⏭ O'tkazib yuborish", "skip")], cancelRow] },
    });
  }
  if (data === "skip" && s?.step === "about") {
    setSession(chatId, "confirm", { ...s.data, about: "" });
    return askConfirm(chatId, getSession(chatId).data);
  }
  if (data === "confirm" && s?.step === "confirm") return submitLead(chatId, cb.from, s.data);
  return send(chatId, "Bu tugma eskirgan. Menyudan qayta boshlang 👇", { reply_markup: { inline_keyboard: menuKeyboard() } });
}

async function handleUpdate(update) {
  if (update.message) return onMessage(update.message);
  if (update.callback_query) return onCallback(update.callback_query);
  return null;
}

/* ---------------- server ---------------- */
function readBody(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", (c) => { size += c.length; if (size > limit) { reject(new Error("too large")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function startServer() {
  const server = http.createServer(async (req, res) => {
    if (req.method === "POST" && TOKEN && req.url === HOOK_PATH) {
      if (req.headers["x-telegram-bot-api-secret-token"] !== SECRET) { res.writeHead(401).end(); return; }
      try {
        const update = JSON.parse(await readBody(req));
        res.writeHead(200).end("ok");
        await handleUpdate(update);
      } catch (err) {
        log.error("update", err instanceof Error ? err.message : "unknown");
        if (!res.headersSent) res.writeHead(400).end();
      }
      return;
    }
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end(TOKEN ? "Shohruz bot ishlayapti ✅" : "BOT_TOKEN o'rnatilmagan — Render → Environment bo'limiga qo'shing.");
  });

  server.listen(PORT, async () => {
    log.info(`listening on ${PORT}`);
    if (!TOKEN) { log.error("BOT_TOKEN missing"); return; }
    if (!ADMIN_ID) log.error("ADMIN_ID missing — leads will not be delivered; send /id to the bot to get it");
    if (PUBLIC_URL) {
      await tg("setWebhook", { url: `${PUBLIC_URL}${HOOK_PATH}`, secret_token: SECRET, allowed_updates: ["message", "callback_query"] });
    }
    await tg("setMyCommands", { commands: [
      { command: "start", description: "Bosh menyu" },
      { command: "narxlar", description: "Narxlar" },
      { command: "chegirma", description: "Ochilish chegirmasi" },
      { command: "ariza", description: "Ariza qoldirish" },
    ] });
  });
}

if (require.main === module) startServer();
module.exports = { handleUpdate, sessions, lastLeadAt };
