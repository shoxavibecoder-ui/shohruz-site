// Oddiy test: Telegram API soxtalashtiriladi, to'liq ariza jarayoni tekshiriladi.
// Ishga tushirish: node bot/test.js
const assert = require("node:assert/strict");

process.env.BOT_TOKEN = "TEST:TOKEN";
process.env.ADMIN_ID = "999";

const calls = [];
global.fetch = async (url, opts) => {
  const method = url.split("/").pop();
  calls.push({ method, body: JSON.parse(opts.body) });
  return { json: async () => ({ ok: true, result: {} }) };
};

const { handleUpdate } = require("./index");
const USER = { id: 42, username: "aziz_uz" };
const chat = { id: 42, type: "private" };
let n = 0;
const msg = (extra) => handleUpdate({ message: { message_id: ++n, chat, from: USER, ...extra } });
const tap = (data) => handleUpdate({ callback_query: { id: String(++n), from: USER, data, message: { message_id: 1, chat } } });
const last = () => calls[calls.length - 1];
const sentTo = (id) => calls.filter((c) => c.method === "sendMessage" && String(c.body.chat_id) === String(id));

(async () => {
  // Arrange & Act: /start shows menu
  await msg({ text: "/start" });
  assert.match(last().body.text, /Ochilish chegirmasi/);
  assert.equal(last().body.reply_markup.inline_keyboard[1][0].callback_data, "order");

  // Prices screen edits message and lists discounted price
  await tap("level:easy");
  assert.equal(last().method, "editMessageText");
  assert.match(last().body.text, /<s>\$250<\/s> <b>\$175<\/b>/);

  // Lead flow: invalid name, then valid
  await tap("order");
  await msg({ text: "A" });
  assert.match(last().body.text, /ismingizni/i);
  await msg({ text: "Aziz <b>" });
  assert.ok(last().body.reply_markup.keyboard[0][0].request_contact);

  // Invalid contact rejected, shared contact accepted
  await msg({ text: "123" });
  assert.match(last().body.text, /Telefon raqam/);
  await msg({ contact: { phone_number: "+998901234567" } });
  assert.match(last().body.text, /Qaysi xizmat/);

  // Out-of-range service ignored, valid one accepted
  const before = calls.length;
  await tap("svc:999");
  assert.equal(calls.filter((c) => c.method === "sendMessage").length, calls.slice(0, before).filter((c) => c.method === "sendMessage").length);
  await tap("svc:1");
  await msg({ text: "Stomatologiya klinikasi" });
  assert.match(last().body.text, /Tekshiring/);
  assert.match(last().body.text, /Aziz &lt;b&gt;/, "user input must be HTML-escaped");

  // Confirm -> admin receives lead, user thanked
  await tap("confirm");
  const admin = sentTo(999).pop();
  assert.ok(admin, "admin must receive the lead");
  assert.match(admin.body.text, /Landing sahifa \(Oson\) — \$175 \(−30%\)/);
  assert.match(admin.body.text, /\+998901234567/);
  assert.match(admin.body.text, /@aziz_uz/);
  assert.match(last().body.text, /yuborildi/);

  // Cooldown prevents immediate second lead
  await tap("order");
  assert.match(last().body.text, /soniyadan keyin/);

  // Stale button after flow ends
  await tap("confirm");
  assert.match(last().body.text, /eskirgan/);

  // Group chats are ignored
  const c0 = calls.length;
  await handleUpdate({ message: { message_id: 1, chat: { id: -5, type: "group" }, from: USER, text: "/start" } });
  assert.equal(calls.length, c0);

  process.stdout.write("All bot tests passed ✅\n");
})().catch((e) => { process.stderr.write(`${e.stack}\n`); process.exit(1); });
