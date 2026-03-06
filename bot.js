const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// ══════════════════════════════════════════
// CONFIG — دەسکاری بکە
// ══════════════════════════════════════════
const BOT_TOKEN = '8568781006:AAFXyGDRCbft-P0wigD4Y789w_D9RQ1lhio';
const ADMIN_ID  = '8096094298'; // ئایدی تۆ

// ══════════════════════════════════════════
// DATABASE (ساکارە — فایل)
// ══════════════════════════════════════════
const DB_FILE = './codes.json';

function loadCodes() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) {}
  return [];
}

function saveCodes(codes) {
  fs.writeFileSync(DB_FILE, JSON.stringify(codes, null, 2));
}

// ══════════════════════════════════════════
// GENERATE RANDOM CODE
// ══════════════════════════════════════════
function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let random = '';
  for (let i = 0; i < 8; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SADO-WOLF-Ai-1-${random}`;
}

// ══════════════════════════════════════════
// BOT START
// ══════════════════════════════════════════
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🐺 Wolf AI Bot started...');

// /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id.toString();
  const name   = msg.from.first_name || 'User';

  // ئایدی ئەدمین چەک بکە
  if (chatId === ADMIN_ID) {
    bot.sendMessage(chatId,
      `🐺 *Wolf AI Admin Panel*\n\n` +
      `سڵاو ${name}! تۆ ئەدمینی سایتی Wolf AI یت.\n\n` +
      `*/codes* — بینینی هەموو کۆدە چالاکەکان\n` +
      `*/stats* — ئامارەکان`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // بۆ بەکارهێنەری ئاسایی
  bot.sendMessage(chatId,
    `🐺 *خوش بێیت بۆ Wolf AI*\n\n` +
    `_Powered by SADO_\n\n` +
    `بەهێزترین هوش مەسنووعی — بەبێ سنوور.\n\n` +
    `کامە پلانت دەوێ؟`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🥈 ١ مانگ — $3',   callback_data: 'buy_1month' },
            { text: '👑 ١ ساڵ — $25',   callback_data: 'buy_1year'  }
          ],
          [
            { text: '🌐 بچۆ سایتەکەوە', url: 'https://wolf-ai.vercel.app' }
          ]
        ]
      }
    }
  );
});

// /codes — تەنیا بۆ ئەدمین
bot.onText(/\/codes/, (msg) => {
  const chatId = msg.chat.id.toString();
  if (chatId !== ADMIN_ID) return;
  const codes = loadCodes();
  if (codes.length === 0) {
    bot.sendMessage(chatId, '📭 هیچ کۆدێکی چالاک نییە.');
    return;
  }
  const list = codes.map((c, i) => `${i+1}. \`${c.code}\` — ${c.plan} — ${c.date}`).join('\n');
  bot.sendMessage(chatId, `📋 *کۆدە چالاکەکان:*\n\n${list}`, { parse_mode: 'Markdown' });
});

// /stats
bot.onText(/\/stats/, (msg) => {
  const chatId = msg.chat.id.toString();
  if (chatId !== ADMIN_ID) return;
  const codes = loadCodes();
  const monthly = codes.filter(c => c.plan === '1month').length;
  const yearly  = codes.filter(c => c.plan === '1year').length;
  bot.sendMessage(chatId,
    `📊 *ئامارەکان:*\n\n` +
    `🥈 مانگانە: ${monthly}\n` +
    `👑 ساڵانە: ${yearly}\n` +
    `📦 کۆی گشتی: ${codes.length}`,
    { parse_mode: 'Markdown' }
  );
});

// CALLBACK — کلیک کردن لەسەر دوگمەکان
bot.on('callback_query', async (query) => {
  const chatId  = query.message.chat.id.toString();
  const msgId   = query.message.message_id;
  const data    = query.data;
  const name    = query.from.first_name || 'User';

  await bot.answerCallbackQuery(query.id);

  if (data === 'buy_1month' || data === 'buy_1year') {
    const plan  = data === 'buy_1month' ? '1month' : '1year';
    const price = data === 'buy_1month' ? '$3'     : '$25';
    const label = data === 'buy_1month' ? '١ مانگ' : '١ ساڵ';

    // دروستکردنی کۆد
    const code = generateCode();
    const codes = loadCodes();
    codes.push({
      code,
      plan,
      userId: chatId,
      userName: name,
      date: new Date().toISOString().split('T')[0]
    });
    saveCodes(codes);

    // ناردن بۆ بەکارهێنەر
    await bot.sendMessage(chatId,
      `✅ *پلانی ${label} — ${price}*\n\n` +
      `کۆدی چالاككردنت:\n` +
      `\`${code}\`\n\n` +
      `📋 *چۆن بەکاری بهێنی:*\n` +
      `١. بچۆ سایتی Wolf AI\n` +
      `٢. بچۆ Pricing\n` +
      `٣. کۆدەکە بنووسە و کلیک لەسەر *ACTIVATE* بکە\n\n` +
      `⚠️ کۆدەکە تەنیا یەک جار بەکار دێت.\n` +
      `پشتیبانی: @ToOqenar`,
      { parse_mode: 'Markdown' }
    );

    // ئاگادارکردنەوەی ئەدمین
    await bot.sendMessage(ADMIN_ID,
      `💰 *فرۆشتنی نوێ!*\n\n` +
      `👤 بەکارهێنەر: ${name} (${chatId})\n` +
      `📦 پلان: ${label} — ${price}\n` +
      `🔑 کۆد: \`${code}\``,
      { parse_mode: 'Markdown' }
    );
  }
});

// هەڵە هەبوو
bot.on('polling_error', (err) => {
  console.error('Polling error:', err.message);
});
