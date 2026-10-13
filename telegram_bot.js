/**
 * LIQUID BOX (@LiquidBoxTonBot) — Full Telegram Bot, Mini-App Launcher & AI Boardroom
 * Live Token connected for @LiquidBoxTonBot
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN || '8945937193:AAGl_CEbPkMGjVaLFACIiyBDgI1zK91TyUA';
const SANDBOX_ID = process.env.E2B_SANDBOX_ID || 'it0el5n3aho3b1ukdhjex';
const PUBLIC_APP_URL = process.env.PUBLIC_APP_URL || `https://litter.catbox.moe/bupxfd.html`;
const DATA_FILE = path.join(__dirname, 'data', 'business_state.json');

const BACKDROPS = [
  { name: 'Onyx Black (1% Rare)', bonus: 1.25 },
  { name: 'Cyber Emerald', bonus: 1.0 },
  { name: 'Royal Purple', bonus: 1.05 },
  { name: 'Liquid Gold (2% Rare)', bonus: 1.20 },
  { name: 'Deep Sapphire', bonus: 1.0 }
];
const SYMBOLS = ['⚡ صاعقه TON', '👑 تاج سلطنتی', '💎 الماس خزانه', '🪐 حلقه زحل', '🔥 شعله ققنوس'];

function loadState() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function saveState(state) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

function callTelegram(method, payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { resolve({}); }
      });
    });
    req.on('error', (err) => {
      console.error('TG API Error:', err.message);
      resolve({});
    });
    req.write(data);
    req.end();
  });
}

function sendTelegramPhoto(chatId, filePath, caption, replyMarkup) {
  return new Promise((resolve) => {
    if (!fs.existsSync(filePath)) {
      return resolve(callTelegram('sendMessage', { chat_id: chatId, text: caption, reply_markup: replyMarkup }));
    }
    const boundary = '----LiquidBoxBoundary' + Date.now();
    const fileData = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    const parts = [];
    const addField = (name, val) => {
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${val}\r\n`, 'utf-8'));
    };

    addField('chat_id', String(chatId));
    addField('caption', caption);
    if (replyMarkup) {
      addField('reply_markup', JSON.stringify(replyMarkup));
    }

    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="${fileName}"\r\nContent-Type: image/png\r\n\r\n`,
      'utf-8'
    ));
    parts.push(fileData);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8'));

    const bodyBuffer = Buffer.concat(parts);

    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/sendPhoto`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuffer.length
      }
    }, (res) => {
      let resp = '';
      res.on('data', c => resp += c);
      res.on('end', () => {
        try { resolve(JSON.parse(resp)); } catch (e) { resolve({}); }
      });
    });
    req.on('error', () => resolve({}));
    req.write(bodyBuffer);
    req.end();
  });
}

function getMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '👑 ورود به اتاق فرمان رئیس هیئت‌مدیره (۲۴ ساعته)', web_app: { url: PUBLIC_APP_URL + '#boardroom' } }],
      [{ text: '🎁 ورود به جعبه شانسی و آهنگری LIQUID BOX', web_app: { url: PUBLIC_APP_URL + '#miniapp' } }],
      [{ text: '🛍️ ورود به فروشگاه دیجیتال (پرمیوم، AI، گیفت‌کارت)', web_app: { url: PUBLIC_APP_URL + '#store' } }],
      [
        { text: '🔓 باز کردن سریع جعبه در چت ($10)', callback_data: 'action_open_box' },
        { text: '📊 گزارش متنی در چت', callback_data: 'menu_report' }
      ]
    ]
  };
}

async function handleStart(chatId) {
  const state = loadState();
  // Force refresh the bottom-left blue Menu Button for this specific user chatId
  await callTelegram('setChatMenuButton', {
    chat_id: chatId,
    menu_button: {
      type: 'web_app',
      text: '🎁 ورود به LIQUID BOX',
      web_app: { url: PUBLIC_APP_URL }
    }
  });

  const text =
    `💵 به ربات رسمی «${state.config.brandName}» خوش آمدید!\n` +
    `✨ شعار ما: جعبه‌ای که همیشه پول نقد است! (نسخه متصل به سرور ۲۴ ساعته ✅)\n\n` +
    `💰 کیف‌پول سود خالص رئیس هیئت‌مدیره: $${state.financials.ownerVaultUsd.toFixed(2)}\n` +
    `🏦 موجودی خزانه پشتوانه بازخرید: $${state.financials.treasuryPoolUsd.toFixed(2)}\n\n` +
    `👇 روی هر کدام از دکمه‌های زیر کلیک کنید تا بدون ارور باز شود:`;

  const resp = await callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    reply_markup: getMainMenuKeyboard()
  });
  console.log('handleStart sendMessage result:', JSON.stringify(resp));
}

async function handleReport(chatId) {
  const state = loadState();
  const pending = state.boardResolutions.filter(r => r.status === 'pending');
  let text =
    `📊 گزارش لحظه‌ای ۵ مدیر هوش مصنوعی LIQUID BOX به جناب رئیس:\n\n` +
    `💰 سود خالص انباشته شما (۳۵٪ هر باکس + فروشگاه): $${state.financials.ownerVaultUsd.toFixed(2)}\n` +
    `🏦 موجودی خزانه بازخرید آنی (Smart Contract): $${state.financials.treasuryPoolUsd.toFixed(2)}\n` +
    `📦 تعداد کل جعبه‌های بازشده: ${state.financials.totalBoxesOpened} عدد\n` +
    `🛍️ فروش محصولات دیجیتال (پکیج ۱ و ۲): $${state.financials.totalStoreSalesUsd.toFixed(2)}\n` +
    `💎 رویالتی دریافتی از Getgems: $${state.financials.secondaryRoyaltiesUsd.toFixed(2)}\n\n` +
    `🤖 وضعیت مدیران ارشد:\n`;

  for (const ag of state.agents) {
    text += `${ag.avatar} ${ag.role}: ${ag.status}\n`;
  }

  text += `\n📋 مصوبات منتظر تایید شما: ${pending.length} مورد`;

  await callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    reply_markup: {
      inline_keyboard: [
        [{ text: '📋 مشاهده و تایید/رد مصوبات هیئت‌مدیره', callback_data: 'menu_board' }],
        [{ text: '🎁 باز کردن مینی‌اپ کامل', web_app: { url: PUBLIC_APP_URL } }],
        [{ text: '🔙 بازگشت به منوی اصلی', callback_data: 'menu_main' }]
      ]
    }
  });
}

async function handleBoard(chatId) {
  const state = loadState();
  const pending = state.boardResolutions.filter(r => r.status === 'pending');

  if (pending.length === 0) {
    return callTelegram('sendMessage', {
      chat_id: chatId,
      text:
        `👑 اتاق فرمان رئیس هیئت‌مدیره:\n\n` +
        `✅ تمام مصوبات قبلی تایید و اجرا شده‌اند!\n\n` +
        `💡 برای دادن ایده یا دستور جدید به ۵ مدیر هوش مصنوعی، کافی است دستور خود را همین‌جا در چت بنویسید و ارسال کنید (مثلاً بنویسید: «میخوام اشتراک کانوا ۱۵ دلاری به فروشگاه اضافه بشه»).`,
      reply_markup: getMainMenuKeyboard()
    });
  }

  for (const resItem of pending.slice(0, 3)) {
    const text =
      `📋 مصوبه هیئت‌مدیره (${resItem.department})\n` +
      `👤 پیشنهاددهنده: ${resItem.agentName}\n\n` +
      `📌 عنوان: ${resItem.title}\n` +
      `📝 توضیح: ${resItem.summary}\n` +
      `📈 اثر مالی: ${resItem.impact}`;

    await callTelegram('sendMessage', {
      chat_id: chatId,
      text,
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ تایید رئیس و اجرای خودکار', callback_data: `approve_${resItem.id}` },
            { text: '❌ رد مصوبه', callback_data: `reject_${resItem.id}` }
          ]
        ]
      }
    });
  }
}

async function handleOpenBoxInChat(chatId) {
  const state = loadState();
  const price = state.config.boxPriceUsd;
  if (state.financials.customerWalletUsd < price) {
    state.financials.customerWalletUsd += 100; // Auto top-up demo wallet
  }

  state.financials.customerWalletUsd = +(state.financials.customerWalletUsd - price).toFixed(2);
  const ownerShare = +(price * (state.config.ownerCutPercent / 100)).toFixed(2);
  const treasuryShare = +(price - ownerShare).toFixed(2);

  state.financials.ownerVaultUsd = +(state.financials.ownerVaultUsd + ownerShare).toFixed(2);
  state.financials.treasuryPoolUsd = +(state.financials.treasuryPoolUsd + treasuryShare).toFixed(2);
  state.financials.totalBoxesOpened += 1;

  const roll = Math.random() * 100;
  let cum = 0;
  let chosenTier = state.nftTiers[0];
  for (const t of state.nftTiers) {
    cum += t.chance;
    if (roll <= cum) { chosenTier = t; break; }
  }

  const bd = BACKDROPS[Math.floor(Math.random() * BACKDROPS.length)];
  const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  const serial = 1080 + state.financials.totalBoxesOpened;
  const finalBuyback = +(chosenTier.buybackUsd * bd.bonus).toFixed(2);

  const minted = {
    uid: 'nft-' + Date.now(),
    serial,
    tierId: chosenTier.id,
    name: chosenTier.name,
    rarityLabel: chosenTier.rarityLabel,
    backdrop: bd.name,
    symbol: sym,
    buybackUsd: finalBuyback,
    marketFloorUsd: +(chosenTier.marketFloorUsd * bd.bonus).toFixed(2),
    image: chosenTier.image,
    color: chosenTier.color
  };

  state.inventory.unshift(minted);
  saveState(state);

  const imgFile = path.join(__dirname, 'public', chosenTier.image);
  const caption =
    `🎉 جعبه شانسی #${serial} باز شد!\n\n` +
    `🏆 آیتم برنده شده: ${minted.name}\n` +
    `✨ درجه کمیابی: ${minted.rarityLabel}\n` +
    `🎨 پس‌زمینه: ${minted.backdrop}\n` +
    `🔮 نماد: ${minted.symbol}\n\n` +
    `💵 قیمت بازخرید نقدی آنی از خزانه: $${minted.buybackUsd}\n` +
    `💎 کف قیمت فروش در Getgems: $${minted.marketFloorUsd}\n` +
    `──────────────────\n` +
    `💰 گزارش به رئیس: مبلغ $${ownerShare} (۳۵٪) درجا به کیف‌پول شخصی شما اضافه شد! (موجودی جدید شما: $${state.financials.ownerVaultUsd.toFixed(2)})`;

  await sendTelegramPhoto(chatId, imgFile, caption, {
    inline_keyboard: [
      [
        { text: `💵 فروش آنی به خزانه ($${minted.buybackUsd})`, callback_data: `buyback_${minted.uid}` },
        { text: `💎 فروش در Getgems ($${minted.marketFloorUsd})`, callback_data: `getgems_${minted.uid}` }
      ],
      [
        { text: '🔓 باز کردن یک جعبه دیگر ($10)', callback_data: 'action_open_box' },
        { text: '🛍️ تبدیل به گیفت‌کارت / پرمیوم', callback_data: 'menu_shop' }
      ],
      [{ text: '🔙 منوی اصلی', callback_data: 'menu_main' }]
    ]
  });
}

async function handleShopMenu(chatId) {
  const state = loadState();
  const hasVip = state.inventory.some(i => i.tierId === 'mythic' || i.tierId === 'epic');

  let text =
    `🛍️ فروشگاه ۱۰۰٪ دیجیتال LIQUID BOX (تحویل کد در ۳ ثانیه توسط ایجنت):\n` +
    (hasVip ? `🎉 تخفیف ۲۵٪ VIP به خاطر داشتن کارت رده‌بالا برای شما فعال است!\n\n` : `💡 با داشتن کارت Epic یا Mythic، ۲۵٪ تخفیف VIP می‌گیرید!\n\n`);

  const buttons = [];
  for (const p of state.storeProducts) {
    const finalPrice = +(p.priceUsd * (hasVip ? 0.75 : 1)).toFixed(2);
    text += `${p.icon} ${p.title}\n   قیمت: $${finalPrice} | سود خالص رئیس: ${p.profitMarginPercent}%\n\n`;
    buttons.push([{ text: `🛒 خرید ${p.icon} ${p.title.slice(0, 28)} ($${finalPrice})`, callback_data: `buyprod_${p.id}` }]);
  }
  buttons.push([{ text: '🔙 بازگشت به منوی اصلی', callback_data: 'menu_main' }]);

  await callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    reply_markup: { inline_keyboard: buttons }
  });
}

async function startBot() {
  console.log('🤖 Connecting to @LiquidBoxTonBot...');

  await callTelegram('setMyCommands', {
    commands: [
      { command: 'start', description: '🎁 منوی اصلی LIQUID BOX و جعبه گنج' },
      { command: 'board', description: '👑 اتاق فرمان رئیس هیئت‌مدیره (مصوبات ایجنت‌ها)' },
      { command: 'report', description: '📊 گزارش مالی لحظه‌ای ۵ مدیر هوش مصنوعی' },
      { command: 'open', description: '🔓 باز کردن فوری جعبه شانسی ($10)' },
      { command: 'shop', description: '🛍️ فروشگاه دیجیتال (پرمیوم، AI، گیفت‌کارت)' }
    ]
  });

  await callTelegram('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: '🎁 ورود به LIQUID BOX',
      web_app: { url: PUBLIC_APP_URL }
    }
  });

  console.log('✅ @LiquidBoxTonBot is LIVE with Mini-App URL:', PUBLIC_APP_URL);

  let offset = 0;
  let polling = false;

  setInterval(async () => {
    if (polling) return;
    polling = true;
    try {
      const res = await callTelegram('getUpdates', { offset, timeout: 5 });
      if (res && res.ok && Array.isArray(res.result)) {
        for (const upd of res.result) {
          offset = upd.update_id + 1;

          if (upd.message && upd.message.text) {
            const chatId = upd.message.chat.id;
            try { const st = loadState(); st.config.chairmanChatId = chatId; saveState(st); } catch(e) {}
            const txt = upd.message.text.trim();

            if (txt.startsWith('/start') || txt === '/menu') {
              await handleStart(chatId);
            } else if (txt === '/report') {
              await handleReport(chatId);
            } else if (txt === '/board') {
              await handleBoard(chatId);
            } else if (txt === '/open') {
              await handleOpenBoxInChat(chatId);
            } else if (txt === '/shop') {
              await handleShopMenu(chatId);
            } else {
              // Treat any custom text message as a Chairman Directive to the 5 AI Agents!
              const state = loadState();
              const numMatch = txt.match(/\d+/);
              const num = numMatch ? Number(numMatch[0]) : 25;
              const newResId = 'tg-' + Date.now();
              const newRes = {
                id: newResId,
                agentId: 'cso',
                agentName: 'کیان مجد (CSO) + آرش راد (CFO)',
                department: 'مصوبه فوری تلگرامی رئیس هیئت‌مدیره',
                title: `اجرای دستور: «${txt}»`,
                summary: `۵ مدیر هوش مصنوعی دستور شما را بررسی کردند. قیمت بهینه $${num} با حاشیه سود ۴۵٪ آماده اعمال در فروشگاه است.`,
                impact: 'افزایش مستقیم درآمد کیف‌پول رئیس هیئت‌مدیره',
                actionType: txt.includes('جعبه') ? 'UPDATE_PRICE' : 'ADD_PRODUCT',
                payload: {
                  title: txt.replace('میخوام', '').replace('به فروشگاه اضافه بشه', '').trim(),
                  category: 'منتخب رئیس هیئت‌مدیره',
                  priceUsd: num,
                  boxPriceUsd: num,
                  profitMarginPercent: 45,
                  icon: '🚀',
                  description: 'اضافه شده با دستور مستقیم رئیس هیئت‌مدیره در تلگرام.'
                },
                status: 'pending',
                createdAt: 'همین الان در تلگرام'
              };
              state.boardResolutions.unshift(newRes);
              saveState(state);

              await callTelegram('sendMessage', {
                chat_id: chatId,
                text:
                  `👑 جناب رئیس هیئت‌مدیره، دستور شما دریافت شد:\n«${txt}»\n\n` +
                  `🤖 هر ۵ مدیر هوش مصنوعی جلسه فوری تشکیل دادند و مصوبه اجرایی آن را آماده کردند:\n` +
                  `📌 عنوان مصوبه: ${newRes.title}\n` +
                  `💵 قیمت/ارزش تنظیمی: $${num} (حاشیه سود شما: ۴۵٪)\n\n` +
                  `آیا دستور اجرای خودکار آن را صادر می‌فرمایید؟`,
                reply_markup: {
                  inline_keyboard: [
                    [
                      { text: '✅ بله، تایید و اجرا شود', callback_data: `approve_${newResId}` },
                      { text: '❌ خیر، لغو شود', callback_data: `reject_${newResId}` }
                    ],
                    [{ text: '🔙 منوی اصلی', callback_data: 'menu_main' }]
                  ]
                }
              });
            }
          } else if (upd.callback_query) {
            const cb = upd.callback_query;
            const chatId = cb.message.chat.id;
            callTelegram('setChatMenuButton', {
              chat_id: chatId,
              menu_button: {
                type: 'web_app',
                text: '🎁 ورود به LIQUID BOX',
                web_app: { url: PUBLIC_APP_URL }
              }
            });
            const data = cb.data || '';

            await callTelegram('answerCallbackQuery', { callback_query_id: cb.id });

            if (data === 'menu_main') {
              await handleStart(chatId);
            } else if (data === 'menu_report') {
              await handleReport(chatId);
            } else if (data === 'menu_board') {
              await handleBoard(chatId);
            } else if (data === 'action_open_box') {
              await handleOpenBoxInChat(chatId);
            } else if (data === 'menu_shop') {
              await handleShopMenu(chatId);
            } else if (data === 'menu_inventory') {
              const state = loadState();
              if (state.inventory.length === 0) {
                await callTelegram('sendMessage', {
                  chat_id: chatId,
                  text: '🎒 کیف‌پول فعلاً خالی است. یک جعبه شانسی باز کنید!',
                  reply_markup: getMainMenuKeyboard()
                });
              } else {
                const buttons = state.inventory.slice(0, 5).map(item => ([
                  { text: `💵 فروش آنی ${item.name} (#${item.serial}) — $${item.buybackUsd}`, callback_data: `buyback_${item.uid}` }
                ]));
                buttons.push([{ text: '🔙 منوی اصلی', callback_data: 'menu_main' }]);
                await callTelegram('sendMessage', {
                  chat_id: chatId,
                  text: `🎒 کارت‌های موجود در کیف‌پول (${state.inventory.length} عدد):\nروی هر کارت کلیک کنید تا در ۱ ثانیه به خزانه فروخته و پول نقد دریافت شود:`,
                  reply_markup: { inline_keyboard: buttons }
                });
              }
            } else if (data.startsWith('buyback_')) {
              const uid = data.replace('buyback_', '');
              const state = loadState();
              const idx = state.inventory.findIndex(i => i.uid === uid);
              if (idx !== -1) {
                const nft = state.inventory[idx];
                state.inventory.splice(idx, 1);
                state.financials.treasuryPoolUsd = +(state.financials.treasuryPoolUsd - nft.buybackUsd).toFixed(2);
                state.financials.customerWalletUsd = +(state.financials.customerWalletUsd + nft.buybackUsd).toFixed(2);
                saveState(state);
                await callTelegram('sendMessage', {
                  chat_id: chatId,
                  text: `💵 بازخرید آنی انجام شد!\nکارت «${nft.name} #${nft.serial}» به مبلغ تضمینی $${nft.buybackUsd} توسط خزانه هوشمند خریداری شد و وجه نقد به کیف‌پول نشست.`,
                  reply_markup: getMainMenuKeyboard()
                });
              }
            } else if (data.startsWith('getgems_')) {
              const uid = data.replace('getgems_', '');
              const state = loadState();
              const idx = state.inventory.findIndex(i => i.uid === uid);
              if (idx !== -1) {
                const nft = state.inventory[idx];
                state.inventory.splice(idx, 1);
                const royalty = +(nft.marketFloorUsd * 0.08).toFixed(2);
                state.financials.ownerVaultUsd = +(state.financials.ownerVaultUsd + royalty).toFixed(2);
                state.financials.secondaryRoyaltiesUsd = +(state.financials.secondaryRoyaltiesUsd + royalty).toFixed(2);
                saveState(state);
                await callTelegram('sendMessage', {
                  chat_id: chatId,
                  text: `💎 فروش در مارکت‌پلیس Getgems انجام شد!\nکارت «${nft.name}» به قیمت $${nft.marketFloorUsd} به کلکسیونرها فروخته شد و مبلغ $${royalty} (۸٪ حق سازنده) مستقیم به کیف‌پول رئیس هیئت‌مدیره اضافه گردید!`,
                  reply_markup: getMainMenuKeyboard()
                });
              }
            } else if (data === 'action_forge_common') {
              const state = loadState();
              const commons = state.inventory.filter(i => i.tierId === 'common');
              if (commons.length < 3) {
                await callTelegram('sendMessage', {
                  chat_id: chatId,
                  text: `⚠️ برای ترکیب در کوره آهنگری به ۳ کارت معمولی نیاز دارید (فعلاً ${commons.length} عدد در کیف‌پول است). ابتدا یک جعبه شانسی باز کنید!`,
                  reply_markup: getMainMenuKeyboard()
                });
              } else {
                let rem = 0;
                state.inventory = state.inventory.filter(i => {
                  if (i.tierId === 'common' && rem < 3) { rem++; return false; }
                  return true;
                });
                const fee = state.config.forgeFeeUsd;
                state.financials.ownerVaultUsd = +(state.financials.ownerVaultUsd + fee).toFixed(2);
                const rareTier = state.nftTiers[1];
                const forged = {
                  uid: 'nft-forged-' + Date.now(),
                  serial: 2100 + Math.floor(Math.random() * 500),
                  tierId: rareTier.id,
                  name: rareTier.name,
                  rarityLabel: rareTier.rarityLabel,
                  backdrop: 'Liquid Gold',
                  symbol: '👑 تاج سلطنتی',
                  buybackUsd: rareTier.buybackUsd,
                  marketFloorUsd: rareTier.marketFloorUsd,
                  image: rareTier.image,
                  color: rareTier.color
                };
                state.inventory.unshift(forged);
                saveState(state);
                const imgFile = path.join(__dirname, 'public', rareTier.image);
                await sendTelegramPhoto(
                  chatId,
                  imgFile,
                  `🔥 آهنگری موفقیت‌آمیز بود!\n۳ خنجر معمولی سوزانده شد و ۱ «${forged.name}» (با بازخرید نقدی $${forged.buybackUsd}) ساخته شد!\n💰 ۱۰۰٪ کارمزد آهنگری ($${fee}) به کیف‌پول رئیس هیئت‌مدیره واریز شد.`,
                  getMainMenuKeyboard()
                );
              }
            } else if (data.startsWith('buyprod_')) {
              const prodId = data.replace('buyprod_', '');
              const state = loadState();
              const prod = state.storeProducts.find(p => p.id === prodId);
              if (prod) {
                const hasVip = state.inventory.some(i => i.tierId === 'mythic' || i.tierId === 'epic');
                const finalPrice = +(prod.priceUsd * (hasVip ? 0.75 : 1)).toFixed(2);
                const netProfit = +(finalPrice * (prod.profitMarginPercent / 100)).toFixed(2);
                state.financials.ownerVaultUsd = +(state.financials.ownerVaultUsd + netProfit).toFixed(2);
                state.financials.totalStoreSalesUsd = +(state.financials.totalStoreSalesUsd + finalPrice).toFixed(2);
                prod.salesCount += 1;
                saveState(state);

                const code = 'LQBOX-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
                await callTelegram('sendMessage', {
                  chat_id: chatId,
                  text:
                    `✅ خرید و تحویل آنی انجام شد!\n\n` +
                    `🛍️ محصول: ${prod.title}\n` +
                    `💵 مبلغ پرداختی: $${finalPrice}\n` +
                    `🔑 کد تحویل اتوماتیک شما: \`${code}\`\n` +
                    `──────────────────\n` +
                    `💰 گزارش به رئیس: مبلغ $${netProfit} سود خالص این فروش درجا به کیف‌پول شخصی شما اضافه شد!`,
                  parse_mode: 'Markdown',
                  reply_markup: getMainMenuKeyboard()
                });
              }
            } else if (data.startsWith('approve_') || data.startsWith('reject_')) {
              const isApprove = data.startsWith('approve_');
              const resId = data.replace('approve_', '').replace('reject_', '');
              const state = loadState();
              const resItem = state.boardResolutions.find(r => r.id === resId);
              if (resItem) {
                resItem.status = isApprove ? 'approved' : 'rejected';
                if (isApprove && resItem.actionType === 'ADD_PRODUCT' && resItem.payload) {
                  state.storeProducts.unshift({
                    id: 'prod-' + Date.now(),
                    title: resItem.payload.title,
                    category: resItem.payload.category || 'پکیج ۱ و ۲: دیجیتال',
                    priceUsd: Number(resItem.payload.priceUsd) || 19,
                    profitMarginPercent: Number(resItem.payload.profitMarginPercent) || 45,
                    icon: resItem.payload.icon || '⚡',
                    description: resItem.payload.description || 'تحویل آنی در تلگرام',
                    salesCount: 1
                  });
                } else if (isApprove && resItem.actionType === 'UPDATE_PRICE' && resItem.payload) {
                  state.config.boxPriceUsd = Number(resItem.payload.boxPriceUsd) || state.config.boxPriceUsd;
                }
                saveState(state);
                await callTelegram('sendMessage', {
                  chat_id: chatId,
                  text: isApprove
                    ? `✅ مصوبه «${resItem.title}» توسط شما تایید شد و ایجنت‌ها آن را به صورت خودکار روی فروشگاه اعمال کردند!`
                    : `❌ مصوبه «${resItem.title}» توسط شما رد شد.`,
                  reply_markup: getMainMenuKeyboard()
                });
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Bot polling error:', e.message);
    } finally {
      polling = false;
    }
  }, 1500);
}

if (require.main === module) {
  startBot();
}

module.exports = { startBot };
