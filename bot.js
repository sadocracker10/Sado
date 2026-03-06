const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const BOT_TOKEN = '8568781006:AAFXyGDRCbft-P0wigD4Y789w_D9RQ1lhio';
const ADMIN_ID  = '8096094298';
const SITE_URL  = 'https://wolfai-sado.netlify.app';
const DB_FILE   = './codes.json';

// ── DATABASE ──
function load() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return []; }
}
function save(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ── CODE GENERATOR ──
function genCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let r = '';
  for (let i = 0; i < 8; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return `SADO-WOLF-Ai-1-${r}`;
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log('🐺 Wolf AI Bot running...');

// ── /start ──
bot.onText(/\/start/, (msg) => {
  const id = msg.chat.id.toString();
  const name = msg.from.first_name || 'User';

  // ── ADMIN PANEL ──
  if (id === ADMIN_ID) {
    bot.sendMessage(id,
      `🐺 *Wolf AI — Admin Panel*\n\n` +
      `سڵاو ${name}!\n\n` +
      `*کەمانی بەکارهێنان:*\n` +
      `📋 /codes — بینینی هەموو کۆدەکان\n` +
      `📊 /stats — ئامارەکان\n` +
      `🗑 /delcode [کۆد] — سڕینەوەی کۆد\n\n` +
      `*دروستکردنی کۆد:*`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🥈 کۆدی 1 مانگ — $3',  callback_data: 'admin_1month' },
              { text: '👑 کۆدی 1 ساڵ — $25',  callback_data: 'admin_1year'  }
            ]
          ]
        }
      }
    );
    return;
  }

  // ── NORMAL USER — فەقەت بینینی سایت ──
  bot.sendMessage(id,
    `🐺 *خوش بێیت بۆ Wolf AI*\n\n` +
    `_Powered by SADO_\n\n` +
    `بۆ کرینی پلانی Gold و وەرگرتنی کۆدی چالاককردن، پەیوەندی بکە بە:\n` +
    `👤 @ToOqenar\n\n` +
    `🌐 سایتەکە: ${SITE_URL}`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🌐 بچۆ سایتەکەوە', url: SITE_URL }],
          [{ text: '💬 پەیوەندی بەرپرسەکە', url: 'https://t.me/ToOqenar' }]
        ]
      }
    }
  );
});

// ── /codes ── ADMIN ONLY
bot.onText(/\/codes/, (msg) => {
  const id = msg.chat.id.toString();
  if (id !== ADMIN_ID) { bot.sendMessage(id, '⛔ دەستگەیشتن نییە.'); return; }
  const codes = load();
  if (!codes.length) { bot.sendMessage(id, '📭 هیچ کۆدێک نییە.'); return; }
  const list = codes.map((c, i) =>
    `${i+1}. \`${c.code}\`\n   📦 ${c.plan} | 📅 ${c.date}`
  ).join('\n\n');
  bot.sendMessage(id, `📋 *کۆدە چالاکەکان (${codes.length}):*\n\n${list}`, { parse_mode: 'Markdown' });
});

// ── /stats ── ADMIN ONLY
bot.onText(/\/stats/, (msg) => {
  const id = msg.chat.id.toString();
  if (id !== ADMIN_ID) { bot.sendMessage(id, '⛔ دەستگەیشتن نییە.'); return; }
  const codes = load();
  const m = codes.filter(c => c.plan === '1month').length;
  const y = codes.filter(c => c.plan === '1year').length;
  bot.sendMessage(id,
    `📊 *ئامارەکان:*\n\n🥈 مانگانە: ${m}\n👑 ساڵانە: ${y}\n📦 کۆی گشتی: ${codes.length}`,
    { parse_mode: 'Markdown' }
  );
});

// ── /delcode ── ADMIN ONLY
bot.onText(/\/delcode (.+)/, (msg, match) => {
  const id = msg.chat.id.toString();
  if (id !== ADMIN_ID) { bot.sendMessage(id, '⛔ دەستگەیشتن نییە.'); return; }
  const code = match[1].trim();
  const codes = load();
  const idx = codes.findIndex(c => c.code === code);
  if (idx === -1) { bot.sendMessage(id, '❌ کۆدەکە نەدۆزرایەوە.'); return; }
  codes.splice(idx, 1);
  save(codes);
  bot.sendMessage(id, `✅ کۆدەکە سڕایەوە:\n\`${code}\``, { parse_mode: 'Markdown' });
});

// ── CALLBACKS — ADMIN ONLY ──
bot.on('callback_query', async (query) => {
  const id   = query.message.chat.id.toString();
  const data = query.data;

  await bot.answerCallbackQuery(query.id);

  // تەنیا Admin دەتوانێ کۆد دروست بکا
  if (id !== ADMIN_ID) {
    bot.sendMessage(id, '⛔ تەنیا ئەدمین دەتوانێ کۆد دروست بکا.');
    return;
  }

  if (data === 'admin_1month' || data === 'admin_1year') {
    const plan  = data === 'admin_1month' ? '1month' : '1year';
    const label = data === 'admin_1month' ? '1 مانگ — $3' : '1 ساڵ — $25';
    const code  = genCode();
    const codes = load();
    codes.push({
      code,
      plan,
      date: new Date().toISOString().split('T')[0],
      createdBy: 'admin'
    });
    save(codes);

    bot.sendMessage(id,
      `✅ *کۆدی نوێ دروست بوو!*\n\n` +
      `📦 پلان: ${label}\n` +
      `🔑 کۆد:\n\`${code}\`\n\n` +
      `📋 *چۆن بەکاری بهێنی:*\n` +
      `١. بچۆ ${SITE_URL}\n` +
      `٢. بچۆ Pricing → Gold\n` +
      `٣. کۆدەکە بنووسە → ACTIVATE\n\n` +
      `⚠️ کۆدەکە تەنیا یەک جار بەکار دێت.`,
      { parse_mode: 'Markdown' }
    );
  }
});

bot.on('polling_error', err => console.error('Polling error:', err.message));
