# Shohruz — sayt

AI yordamida sayt, onlayn do'kon va Telegram botlar xizmati sayti.

- Barcha matn, narx va chegirma sozlamalari `index.html` ichidagi `PROFILE` blokida.
- Yangi mijoz kelganda `discount.taken` sonini 1 ga oshiring.
- `main` branch'ga yuklangan har bir o'zgarish Render'da avtomatik chiqadi.

## Telegram bot (`bot/`)

Render'da alohida web service sifatida ishlaydi (`node bot/index.js`). Render → Environment:
- `BOT_TOKEN` — @BotFather tokeni (maxfiy, kodga yozilmaydi)
- `ADMIN_ID` — arizalar keladigan chat ID (botga `/id` yozing)
- `SLOTS_TAKEN` — chegirmali band joylar soni (ixtiyoriy)

Test: `node bot/test.js`
