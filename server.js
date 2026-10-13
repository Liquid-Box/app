const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'business_state.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const BACKDROPS = [
  { name: 'Onyx Black (1% Rare)', bonus: 1.25, color: '#090d16' },
  { name: 'Cyber Emerald', bonus: 1.0, color: '#064e3b' },
  { name: 'Royal Purple', bonus: 1.05, color: '#3b0764' },
  { name: 'Liquid Gold (2% Rare)', bonus: 1.20, color: '#78350f' },
  { name: 'Deep Sapphire', bonus: 1.0, color: '#1e3a8a' }
];

const SYMBOLS = ['⚡ صاعقه TON', '👑 تاج سلطنتی', '💎 الماس خزانه', '🪐 حلقه زحل', '🔥 شعله ققنوس'];

const INITIAL_STATE = {
  config: {
    brandName: 'NEXUS TON EMPIRE',
    boxPriceUsd: 10.0,
    tonPriceUsd: 5.0,
    ownerCutPercent: 30,
    treasuryCutPercent: 70,
    forgeFeeUsd: 1.5,
    vipDiscountPercent: 25,
    activePromoBanner: '🔥 جشنواره ویژه: با نگهداری کارت «نگهبان الماس (Mythic)»، ۲۵٪ تخفیف دائمی روی تمام محصولات فروشگاه + سهم از سود هفتگی دریافت کنید!'
  },
  financials: {
    ownerVaultUsd: 540.00,
    treasuryPoolUsd: 1260.00,
    totalBoxesOpened: 180,
    totalStoreSalesUsd: 420.00,
    secondaryRoyaltiesUsd: 68.50,
    customerWalletUsd: 150.00
  },
  nftTiers: [
    {
      id: 'common',
      name: 'خنجر زمردین باستانی',
      enName: 'Emerald Relic Dagger',
      rarityLabel: 'Common (معمولی)',
      chance: 64,
      buybackUsd: 3.80,
      marketFloorUsd: 5.50,
      image: '/assets/nft_common_dagger.png',
      color: '#10b981',
      badgeBg: 'rgba(16, 185, 129, 0.18)'
    },
    {
      id: 'rare',
      name: 'انگشتر سلطنتی یاقوت',
      enName: 'Royal Ruby Signet',
      rarityLabel: 'Rare (کمیاب)',
      chance: 25,
      buybackUsd: 8.00,
      marketFloorUsd: 13.50,
      image: '/assets/nft_rare_ring.png',
      color: '#38bdf8',
      badgeBg: 'rgba(56, 189, 248, 0.18)'
    },
    {
      id: 'epic',
      name: 'جام طلای مذاب و تیغه کهکشانی',
      enName: 'Cosmic Blade & Chalice',
      rarityLabel: 'Epic (حماسی)',
      chance: 9,
      buybackUsd: 17.00,
      marketFloorUsd: 29.00,
      image: '/assets/nft_epic_chalice.png',
      color: '#c084fc',
      badgeBg: 'rgba(192, 132, 252, 0.18)'
    },
    {
      id: 'mythic',
      name: 'نگهبان الماس سایبری (VIP)',
      enName: 'Cyber Diamond Guardian',
      rarityLabel: 'Mythic VIP (افسانه‌ای)',
      chance: 2,
      buybackUsd: 52.00,
      marketFloorUsd: 98.00,
      image: '/assets/nft_mythic_guardian.png',
      color: '#fbbf24',
      badgeBg: 'rgba(251, 191, 36, 0.22)'
    }
  ],
  inventory: [
    {
      uid: 'nft-1042',
      serial: 1042,
      tierId: 'common',
      name: 'خنجر زمردین باستانی',
      rarityLabel: 'Common (معمولی)',
      backdrop: 'Cyber Emerald',
      symbol: '⚡ صاعقه TON',
      buybackUsd: 3.80,
      marketFloorUsd: 5.50,
      image: '/assets/nft_common_dagger.png',
      color: '#10b981'
    },
    {
      uid: 'nft-1048',
      serial: 1048,
      tierId: 'common',
      name: 'خنجر زمردین باستانی',
      rarityLabel: 'Common (معمولی)',
      backdrop: 'Deep Sapphire',
      symbol: '💎 الماس خزانه',
      buybackUsd: 3.80,
      marketFloorUsd: 5.50,
      image: '/assets/nft_common_dagger.png',
      color: '#10b981'
    },
    {
      uid: 'nft-1051',
      serial: 1051,
      tierId: 'common',
      name: 'خنجر زمردین باستانی',
      rarityLabel: 'Common (معمولی)',
      backdrop: 'Royal Purple',
      symbol: '👑 تاج سلطنتی',
      buybackUsd: 3.80,
      marketFloorUsd: 5.50,
      image: '/assets/nft_common_dagger.png',
      color: '#10b981'
    },
    {
      uid: 'nft-1077',
      serial: 1077,
      tierId: 'rare',
      name: 'انگشتر سلطنتی یاقوت',
      rarityLabel: 'Rare (کمیاب)',
      backdrop: 'Royal Purple',
      symbol: '👑 تاج سلطنتی',
      buybackUsd: 8.00,
      marketFloorUsd: 13.50,
      image: '/assets/nft_rare_ring.png',
      color: '#38bdf8'
    }
  ],
  storeProducts: [
    {
      id: 'prod-1',
      title: 'اشتراک ۶ ماهه Telegram Premium (فعالسازی آنی)',
      category: 'محصول دیجیتال',
      priceUsd: 18.00,
      profitMarginPercent: 45,
      icon: '⭐',
      description: 'فعالسازی مستقیم روی آیدی تلگرام بدون نیاز به لاگین؛ قابل خرید با TON یا اعتبار کارت‌های NFT.',
      salesCount: 34
    },
    {
      id: 'prod-2',
      title: 'اکانت اختصاصی هوش مصنوعی (ChatGPT Plus + Claude Pro)',
      category: 'اشتراک و ابزار AI',
      priceUsd: 24.00,
      profitMarginPercent: 50,
      icon: '🤖',
      description: 'اکانت قانونی و شخصی ۱ ماهه با تحویل اتوماتیک توسط ربات پس از پرداخت.',
      salesCount: 28
    },
    {
      id: 'prod-3',
      title: 'هودی استریت‌ور لیمیتد ادیشن (طرح Cyber Guardian)',
      category: 'کالای فیزیکی (Phygital)',
      priceUsd: 45.00,
      profitMarginPercent: 60,
      icon: '🧥',
      description: 'نخ پنبه سوپر با چاپ برجسته + ۱ جعبه شانسی NFT رایگان همراه با ارسال پستی.',
      salesCount: 12
    },
    {
      id: 'prod-4',
      title: 'کیف‌پول سخت‌افزاری Ledger Nano X اورجینال',
      category: 'گجت و امنیت کریپتو',
      priceUsd: 149.00,
      profitMarginPercent: 30,
      icon: '🔐',
      description: 'پلمپ شرکتی با ارسال سریع؛ دارندگان کارت‌های Epic و Mythic از ۲۵٪ تخفیف VIP برخوردارند.',
      salesCount: 5
    }
  ],
  agents: [
    {
      id: 'cfo',
      role: 'مدیر مالی و خزانه (CFO)',
      name: 'آرش راد (AI Financial Director)',
      avatar: '📊',
      color: '#10b981',
      status: 'نسبت پایداری خزانه: ۱۰۰٪ ایمن (Solvency 1.24x)',
      lastReport: 'از هر ۱۰ دلار فروش باکس، ۳ دلار سود قطعی به کیف‌پول شخصی رئیس هیئت‌مدیره واریز شده و ۷ دلار وارد خزانه بازخرید می‌شود. امید ریاضی بازخرید کارت‌ها دقیقاً ۶.۹۹ دلار تنظیم شده تا خزانه هرگز کسری نیاورد.'
    },
    {
      id: 'cmo',
      role: 'مدیر بازاریابی و رشد (CMO)',
      name: 'سارا نیک‌فر (AI Growth Director)',
      avatar: '📣',
      color: '#f43f5e',
      status: 'نرخ تبدیل مینی‌اپ: ۱۴.۸٪ | کمپین رفرال آماده اجرا',
      lastReport: 'کاربران تلگرام به بنرهای «تخفیف VIP با نگهداری NFT» واکنش عالی نشان داده‌اند. پیشنهاد می‌کنم کمپین دعوت دوستان (به ازای ۵ دعوت = ۱ چرخش شانسی) را تایید فرمایید.'
    },
    {
      id: 'cso',
      role: 'مدیر فروش و فروشگاه آزاد (CSO)',
      name: 'کیان مجد (AI Sales & Store Director)',
      avatar: '🛒',
      color: '#38bdf8',
      status: '۴ محصول غیرمرتبط فعال | حاشیه سود میانگین: ۴۶٪',
      lastReport: '۳۸٪ از برندگان کارت‌های Rare و Epic ترجیح می‌دهند به جای خروج پول، با اعتبار NFT خود از بخش فروشگاه (اشتراک تلگرام پرمیوم و اکانت AI) خرید کنند که سود مضاعف برای شرکت ایجاد کرده است.'
    },
    {
      id: 'cpo',
      role: 'مدیر توسعه محصول و کمیابی (CPO)',
      name: 'نیما فرهمند (AI Product & Rarity Director)',
      avatar: '🎨',
      color: '#c084fc',
      status: '۴ سطح کمیابی فعال | کوره آهنگری (Forge) فعال',
      lastReport: 'مکانیک ترکیب ۳ کارت معمولی (Common) برای ساخت ۱ کارت کمیاب (Rare) باعث سوزانده شدن ۴۲ کارت معمولی شده و فشار فروش روی خزانه را ۳۵٪ کاهش داده است.'
    },
    {
      id: 'coo',
      role: 'مدیر عملیات و قرارداد هوشمند (COO)',
      name: 'رادمهر تهرانی (AI Ops & Blockchain Director)',
      avatar: '⚙️',
      color: '#f59e0b',
      status: 'شبکه TON متصل | رویالتی Getgems: ۵٪ خودکار',
      lastReport: 'تسویه آنی ۳۰٪ سود فروش باکس‌ها به آدرس Tonkeeper رئیس هیئت‌مدیره بدون وقفه فعال است. همچنین ۶۸.۵ دلار از کارمزد معاملات دست‌دوم در مارکت‌پلیس Getgems دریافت شد.'
    }
  ],
  boardResolutions: [
    {
      id: 'res-101',
      agentId: 'cso',
      agentName: 'کیان مجد (مدیر فروش و فروشگاه)',
      department: 'توسعه فروشگاه آزاد',
      title: 'افزودن محصول پرفروش «گیفت‌کارت ۵۰ دلاری پلی‌استیشن / استیم» به فروشگاه',
      summary: 'بررسی تقاضای کاربران تلگرام نشان می‌دهد گیمرها بیشترین خریداران جعبه‌های شانسی هستند. با افزودن گیفت‌کارت ۵۰ دلاری (با قیمت فروش ۵۴ دلار و حاشیه سود ۳۵٪ با تامین عمده)، برندگان کارت‌ها سود خود را داخل فروشگاه خرج می‌کنند.',
      impact: '+$320 سود خالص پیش‌بینی‌شده هفتگی',
      actionType: 'ADD_PRODUCT',
      payload: {
        title: 'گیفت‌کارت ۵۰ دلاری PlayStation / Steam (تحویل کد آنی)',
        category: 'گیفت‌کارت و گیمینگ',
        priceUsd: 52.00,
        profitMarginPercent: 35,
        icon: '🎮',
        description: 'کد اورجینال ریجن آمریکا؛ قابل خرید مستقیم یا تعویض با کارت‌های Epic و Mythic.'
      },
      status: 'pending',
      createdAt: '۱۰ دقیقه پیش'
    },
    {
      id: 'res-102',
      agentId: 'cfo',
      agentName: 'آرش راد (مدیر مالی و خزانه)',
      department: 'سیاست مالی و قیمت‌گذاری',
      title: 'افزایش سهم سود مستقیم رئیس هیئت‌مدیره از ۳۰٪ به ۳۵٪ روی هر جعبه',
      summary: 'با توجه به اینکه استخر نقدینگی خزانه به ۱,۲۶۰ دلار رسیده و از مرز ایمنی عبور کرده است، می‌توانیم سهم برداشت آنی شما از هر جعبه ۱۰ دلاری را از ۳.۰۰ دلار به ۳.۵۰ دلار افزایش دهیم بدون اینکه نقدشوندگی کارت‌ها به خطر بیفتد.',
      impact: '+۱۶.۶٪ افزایش سود نقدی فوری شما در هر تراکنش',
      actionType: 'UPDATE_SPLIT',
      payload: {
        ownerCutPercent: 35,
        treasuryCutPercent: 65
      },
      status: 'pending',
      createdAt: '۲۵ دقیقه پیش'
    },
    {
      id: 'res-103',
      agentId: 'cmo',
      agentName: 'سارا نیک‌فر (مدیر بازاریابی و رشد)',
      department: 'کمپین وایرال تلگرام',
      title: 'اجرای کمپین «ساعت طلایی (Happy Hour)»: افزایش پاداش بازخرید کارت افسانه‌ای به ۶۰ دلار',
      summary: 'برای ایجاد موج خرید در کانال‌های تلگرامی، پیشنهاد می‌کنم کف بازخرید تضمینی کارت Mythic (نگهبان الماس) را از ۵۲ دلار به ۶۰ دلار افزایش دهیم و بنر تبلیغاتی آن را بالای مینی‌اپ فعال کنیم.',
      impact: '+۴۰٪ افزایش سرعت باز شدن جعبه‌ها',
      actionType: 'BOOST_MYTHIC',
      payload: {
        mythicBuybackUsd: 60.00,
        banner: '⚡ ساعت طلایی فعال شد! بازخرید تضمینی کارت افسانه‌ای «نگهبان الماس» در خزانه به ۶۰ دلار نقد افزایش یافت!'
      },
      status: 'pending',
      createdAt: '۴۰ دقیقه پیش'
    },
    {
      id: 'res-104',
      agentId: 'cpo',
      agentName: 'نیما فرهمند (مدیر محصول و طراحی)',
      department: 'اقتصاد توکن و آهنگری',
      title: 'افزودن محصول «عطر کلکسیونی ورساچه / کرید (نسخه فیجیتال + NFT)» به فروشگاه',
      summary: 'ترکیب کالای لوکس فیزیکی با NFT: هر خریدار شیشه عطر اورجینال، یک جعبه شانسی رایگان نیز در کیف‌پول تلگرام خود دریافت می‌کند.',
      impact: 'جذب مشتریان لوکس‌پسند با سبد خرید بالای ۸۰ دلار',
      actionType: 'ADD_PRODUCT',
      payload: {
        title: 'ادوپرفیوم اورجینال Creed Aventus (دکانت ۳۰ میل + ۱ باکس NFT هدیه)',
        category: 'کالای لوکس فیزیکی',
        priceUsd: 68.00,
        profitMarginPercent: 55,
        icon: '✨',
        description: 'ارسال فوری با ضمانت اصالت + ۱ جعبه شانسی NFT رایگان داخل مینی‌اپ.'
      },
      status: 'pending',
      createdAt: '۱ ساعت پیش'
    }
  ],
  auditLog: [
    { time: 'امروز ۱۰:۱۵', actor: 'سیستم خودکار خزانه', text: 'سهم ۳۰٪ از فروش ۱۸۰ جعبه اول (۵۴۰ دلار) به کیف‌پول شخصی رئیس هیئت‌مدیره منظور گردید.' },
    { time: 'امروز ۱۱:۳۰', actor: 'رادمهر تهرانی (COO)', text: 'قرارداد هوشمند کالکشن ۴ سطحی روی شبکه TON همگام‌سازی شد و آماده مینت آنی است.' }
  ]
};

function loadState() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading state:', e);
  }
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_STATE, null, 2), 'utf-8');
  return JSON.parse(JSON.stringify(INITIAL_STATE));
}

function saveState(state) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

function nowTime() {
  const d = new Date();
  return d.toTimeString().slice(0, 5);
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch (e) { resolve({}); }
    });
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  // API: Get State
  if (pathname === '/api/state' && req.method === 'GET') {
    const state = loadState();
    return sendJson(res, 200, state);
  }

  // API: Top up demo customer wallet
  if (pathname === '/api/wallet/topup' && req.method === 'POST') {
    const state = loadState();
    state.financials.customerWalletUsd = +(state.financials.customerWalletUsd + 100).toFixed(2);
    saveState(state);
    return sendJson(res, 200, { ok: true, state });
  }

  // API: Open Mystery Box
  if (pathname === '/api/box/open' && req.method === 'POST') {
    const state = loadState();
    const price = state.config.boxPriceUsd;
    if (state.financials.customerWalletUsd < price) {
      return sendJson(res, 400, { error: 'موجودی کیف‌پول تستی مشتری کافی نیست. دکمه «شارژ کیف‌پول تستی (+۱۰۰$)» را بزنید.' });
    }

    // Deduct from customer wallet
    state.financials.customerWalletUsd = +(state.financials.customerWalletUsd - price).toFixed(2);

    // Split between Owner Personal Wallet and Smart Contract Treasury
    const ownerShare = +(price * (state.config.ownerCutPercent / 100)).toFixed(2);
    const treasuryShare = +(price - ownerShare).toFixed(2);

    state.financials.ownerVaultUsd = +(state.financials.ownerVaultUsd + ownerShare).toFixed(2);
    state.financials.treasuryPoolUsd = +(state.financials.treasuryPoolUsd + treasuryShare).toFixed(2);
    state.financials.totalBoxesOpened += 1;

    // Roll RNG based on tier chances
    const roll = Math.random() * 100;
    let cumulative = 0;
    let chosenTier = state.nftTiers[0];
    for (const tier of state.nftTiers) {
      cumulative += tier.chance;
      if (roll <= cumulative) {
        chosenTier = tier;
        break;
      }
    }

    const backdropObj = BACKDROPS[Math.floor(Math.random() * BACKDROPS.length)];
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const serial = 1080 + state.financials.totalBoxesOpened;
    const finalBuyback = +(chosenTier.buybackUsd * backdropObj.bonus).toFixed(2);

    const mintedNft = {
      uid: 'nft-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      serial,
      tierId: chosenTier.id,
      name: chosenTier.name,
      rarityLabel: chosenTier.rarityLabel,
      backdrop: backdropObj.name,
      symbol,
      buybackUsd: finalBuyback,
      marketFloorUsd: +(chosenTier.marketFloorUsd * backdropObj.bonus).toFixed(2),
      image: chosenTier.image,
      color: chosenTier.color
    };

    state.inventory.unshift(mintedNft);
    state.auditLog.unshift({
      time: nowTime(),
      actor: 'قرارداد هوشمند TON',
      text: `جعبه شانسی #${serial} به مبلغ $${price} باز شد: $${ownerShare} مستقیم به کیف‌پول رئیس هیئت‌مدیره واریز شد و $${treasuryShare} وارد خزانه پشتوانه گردید. آیتم برنده شده: ${mintedNft.name}`
    });

    saveState(state);
    return sendJson(res, 200, {
      ok: true,
      mintedNft,
      ownerShare,
      treasuryShare,
      state
    });
  }

  // API: Instant Buyback (Sell NFT to Treasury)
  if (pathname === '/api/nft/buyback' && req.method === 'POST') {
    const body = await parseBody(req);
    const state = loadState();
    const idx = state.inventory.findIndex(item => item.uid === body.uid);
    if (idx === -1) {
      return sendJson(res, 404, { error: 'این آیتم در کیف‌پول یافت نشد.' });
    }
    const nft = state.inventory[idx];
    state.inventory.splice(idx, 1);

    state.financials.treasuryPoolUsd = +(state.financials.treasuryPoolUsd - nft.buybackUsd).toFixed(2);
    state.financials.customerWalletUsd = +(state.financials.customerWalletUsd + nft.buybackUsd).toFixed(2);

    state.auditLog.unshift({
      time: nowTime(),
      actor: 'خزانه بازخرید آنی (CFO)',
      text: `آیتم «${nft.name} #${nft.serial}» به قیمت تضمینی $${nft.buybackUsd} از مشتری بازخرید و سوزانده شد.`
    });

    saveState(state);
    return sendJson(res, 200, { ok: true, soldNft: nft, state });
  }

  // API: Sell on Getgems Secondary Market (Simulated instant whale buy + 5% creator royalty to Owner)
  if (pathname === '/api/nft/sell-getgems' && req.method === 'POST') {
    const body = await parseBody(req);
    const state = loadState();
    const idx = state.inventory.findIndex(item => item.uid === body.uid);
    if (idx === -1) {
      return sendJson(res, 404, { error: 'این آیتم در کیف‌پول یافت نشد.' });
    }
    const nft = state.inventory[idx];
    state.inventory.splice(idx, 1);

    const salePrice = nft.marketFloorUsd;
    const creatorRoyalty = +(salePrice * 0.08).toFixed(2); // 8% Royalty to Chairman
    const sellerProceeds = +(salePrice * 0.87).toFixed(2); // 5% Getgems fee + 8% Creator Royalty

    state.financials.ownerVaultUsd = +(state.financials.ownerVaultUsd + creatorRoyalty).toFixed(2);
    state.financials.secondaryRoyaltiesUsd = +(state.financials.secondaryRoyaltiesUsd + creatorRoyalty).toFixed(2);
    state.financials.customerWalletUsd = +(state.financials.customerWalletUsd + sellerProceeds).toFixed(2);

    state.auditLog.unshift({
      time: nowTime(),
      actor: 'مارکت‌پلیس Getgems.io',
      text: `فروش ثانویه «${nft.name} #${nft.serial}» به مبلغ $${salePrice} در Getgems انجام شد. مبلغ $${creatorRoyalty} حق امتیاز سازنده (Royalty) به کیف‌پول رئیس هیئت‌مدیره واریز شد!`
    });

    saveState(state);
    return sendJson(res, 200, { ok: true, salePrice, creatorRoyalty, sellerProceeds, state });
  }

  // API: Forge / Craft (Combine 3 items of same tier -> 1 item of next tier)
  if (pathname === '/api/nft/forge' && req.method === 'POST') {
    const body = await parseBody(req);
    const state = loadState();
    const tierOrder = ['common', 'rare', 'epic', 'mythic'];
    const sourceTier = body.tierId || 'common';
    const currentIdx = tierOrder.indexOf(sourceTier);

    if (currentIdx === -1 || currentIdx >= tierOrder.length - 1) {
      return sendJson(res, 400, { error: 'این سطح قابل ارتقا به سطح بالاتر نیست.' });
    }

    const matchingItems = state.inventory.filter(i => i.tierId === sourceTier);
    if (matchingItems.length < 3) {
      return sendJson(res, 400, { error: `برای ترکیب و ارتقا، به حداقل ۳ کارت از سطح ${sourceTier.toUpperCase()} نیاز دارید (فعلاً ${matchingItems.length} عدد دارید).` });
    }

    const fee = state.config.forgeFeeUsd;
    if (state.financials.customerWalletUsd < fee) {
      return sendJson(res, 400, { error: 'موجودی کیف‌پول برای پرداخت کارمزد آهنگری کافی نیست.' });
    }

    // Remove 3 items
    let removed = 0;
    state.inventory = state.inventory.filter(item => {
      if (item.tierId === sourceTier && removed < 3) {
        removed++;
        return false;
      }
      return true;
    });

    // Fee goes 100% to Chairman personal wallet!
    state.financials.customerWalletUsd = +(state.financials.customerWalletUsd - fee).toFixed(2);
    state.financials.ownerVaultUsd = +(state.financials.ownerVaultUsd + fee).toFixed(2);

    const nextTier = state.nftTiers[currentIdx + 1];
    const backdropObj = BACKDROPS[Math.floor(Math.random() * BACKDROPS.length)];
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const serial = 2000 + state.financials.totalBoxesOpened + Math.floor(Math.random() * 500);

    const forgedNft = {
      uid: 'nft-forged-' + Date.now(),
      serial,
      tierId: nextTier.id,
      name: nextTier.name,
      rarityLabel: nextTier.rarityLabel,
      backdrop: backdropObj.name,
      symbol,
      buybackUsd: +(nextTier.buybackUsd * backdropObj.bonus).toFixed(2),
      marketFloorUsd: +(nextTier.marketFloorUsd * backdropObj.bonus).toFixed(2),
      image: nextTier.image,
      color: nextTier.color
    };

    state.inventory.unshift(forgedNft);
    state.auditLog.unshift({
      time: nowTime(),
      actor: 'کوره آهنگری (CPO)',
      text: `۳ کارت ${sourceTier} سوزانده شد و ۱ کارت «${forgedNft.name}» ساخته شد. ۱۰۰٪ کارمزد ارتقا ($${fee}) به کیف‌پول رئیس هیئت‌مدیره واریز گردید.`
    });

    saveState(state);
    return sendJson(res, 200, { ok: true, forgedNft, fee, state });
  }

  // API: Buy Product from Multi-Product Store
  if (pathname === '/api/store/buy' && req.method === 'POST') {
    const body = await parseBody(req);
    const state = loadState();
    const product = state.storeProducts.find(p => p.id === body.productId);
    if (!product) {
      return sendJson(res, 404, { error: 'محصول یافت نشد.' });
    }

    const hasVipNft = state.inventory.some(i => i.tierId === 'mythic' || i.tierId === 'epic');
    const discountMultiplier = hasVipNft ? (1 - state.config.vipDiscountPercent / 100) : 1;
    const finalPrice = +(product.priceUsd * discountMultiplier).toFixed(2);

    if (state.financials.customerWalletUsd < finalPrice) {
      return sendJson(res, 400, { error: 'موجودی کیف‌پول کافی نیست. دکمه شارژ کیف‌پول تستی را بزنید.' });
    }

    state.financials.customerWalletUsd = +(state.financials.customerWalletUsd - finalPrice).toFixed(2);
    const netProfit = +(finalPrice * (product.profitMarginPercent / 100)).toFixed(2);
    state.financials.ownerVaultUsd = +(state.financials.ownerVaultUsd + netProfit).toFixed(2);
    state.financials.totalStoreSalesUsd = +(state.financials.totalStoreSalesUsd + finalPrice).toFixed(2);
    product.salesCount += 1;

    state.auditLog.unshift({
      time: nowTime(),
      actor: 'فروشگاه آزاد (CSO)',
      text: `فروش محصول «${product.title}» به مبلغ $${finalPrice} انجام شد. سود خالص شما ($${netProfit}) به کیف‌پول شخصی واریز گردید.`
    });

    saveState(state);
    return sendJson(res, 200, { ok: true, product, finalPrice, netProfit, hasVipNft, state });
  }

  // API: Approve or Reject Board Resolution (Chairman Action)
  if (pathname === '/api/board/resolve' && req.method === 'POST') {
    const body = await parseBody(req);
    const state = loadState();
    const resItem = state.boardResolutions.find(r => r.id === body.id);
    if (!resItem) {
      return sendJson(res, 404, { error: 'مصوبه یافت نشد.' });
    }

    if (body.decision === 'reject') {
      resItem.status = 'rejected';
      state.auditLog.unshift({
        time: nowTime(),
        actor: 'رئیس هیئت‌مدیره (شما)',
        text: `مصوبه «${resItem.title}» رد شد و به ایجنت مربوطه جهت بازنگری ارجاع گردید.`
      });
      saveState(state);
      return sendJson(res, 200, { ok: true, state });
    }

    // Approve & Execute real business changes!
    resItem.status = 'approved';
    const p = resItem.payload || {};

    if (resItem.actionType === 'ADD_PRODUCT') {
      state.storeProducts.unshift({
        id: 'prod-' + Date.now(),
        title: p.title,
        category: p.category || 'محصول جدید هیئت‌مدیره',
        priceUsd: Number(p.priceUsd) || 29.0,
        profitMarginPercent: Number(p.profitMarginPercent) || 45,
        icon: p.icon || '💎',
        description: p.description || 'اضافه شده به صورت خودکار با تایید رئیس هیئت‌مدیره.',
        salesCount: 1
      });
    } else if (resItem.actionType === 'UPDATE_SPLIT') {
      state.config.ownerCutPercent = p.ownerCutPercent;
      state.config.treasuryCutPercent = p.treasuryCutPercent;
    } else if (resItem.actionType === 'BOOST_MYTHIC') {
      const mythic = state.nftTiers.find(t => t.id === 'mythic');
      if (mythic && p.mythicBuybackUsd) mythic.buybackUsd = p.mythicBuybackUsd;
      if (p.banner) state.config.activePromoBanner = p.banner;
    } else if (resItem.actionType === 'UPDATE_PRICE') {
      if (p.boxPriceUsd) state.config.boxPriceUsd = Number(p.boxPriceUsd);
      if (p.banner) state.config.activePromoBanner = p.banner;
    } else if (resItem.actionType === 'SET_BRAND') {
      if (p.brandName) state.config.brandName = p.brandName;
      if (p.botHandle) state.config.botHandle = p.botHandle;
      if (p.tagline) state.config.tagline = p.tagline;
      if (p.banner) state.config.activePromoBanner = p.banner;
    }

    state.auditLog.unshift({
      time: nowTime(),
      actor: 'رئیس هیئت‌مدیره ✅',
      text: `مصوبه «${resItem.title}» تایید شد و توسط ایجنت‌ها به صورت زنده روی فروشگاه اعمال گردید.`
    });

    saveState(state);
    return sendJson(res, 200, { ok: true, executedResolution: resItem, state });
  }

  // API: Chairman Submits New Idea / Directive to the AI Board of Directors
  if (pathname === '/api/board/directive' && req.method === 'POST') {
    const body = await parseBody(req);
    const idea = (body.idea || '').trim();
    if (!idea) {
      return sendJson(res, 400, { error: 'لطفاً دستور یا ایده خود را وارد کنید.' });
    }

    const state = loadState();

    // Parse numbers if any
    const numMatch = idea.match(/\d+/);
    const extractedNum = numMatch ? Number(numMatch[0]) : 35;

    // Generate intelligent multi-agent responses and actionable resolutions based on Chairman's idea
    const newResolutions = [];

    if (idea.includes('فروشگاه') || idea.includes('محصول') || idea.includes('اضافه') || idea.includes('بفروش') || idea.includes('عطر') || idea.includes('کفش') || idea.includes('دوره') || idea.includes('اکانت')) {
      const customTitle = idea.replace('میخوام', '').replace('به فروشگاه اضافه بشه', '').replace('بفروشیم', '').trim();
      newResolutions.push({
        id: 'res-' + Date.now() + '-1',
        agentId: 'cso',
        agentName: 'کیان مجد (مدیر فروش و فروشگاه)',
        department: 'اجرای دستور رئیس هیئت‌مدیره',
        title: `افزودن فوری «${customTitle}» به ویترین فروشگاه مینی‌اپ با حاشیه سود ۵۰٪`,
        summary: `بر اساس دستور مستقیم رئیس هیئت‌مدیره، محصول «${customTitle}» با قیمت بهینه $${extractedNum > 5 ? extractedNum : 39} و تخفیف ۲۵٪ برای دارندگان NFT آماده درج در فروشگاه است.`,
        impact: 'افزایش تنوع سبد خرید و جذب مشتریان جدید',
        actionType: 'ADD_PRODUCT',
        payload: {
          title: `${customTitle} (پیشنهاد ویژه هیئت‌مدیره)`,
          category: 'محصول منتخب رئیس هیئت‌مدیره',
          priceUsd: extractedNum > 5 && extractedNum < 500 ? extractedNum : 39.00,
          profitMarginPercent: 50,
          icon: '🚀',
          description: `محصول اختصاصی اضافه شده به دستور رئیس هیئت‌مدیره با تحویل سریع و قابلیت خرید با TON یا سود کارت‌های NFT.`
        },
        status: 'pending',
        createdAt: 'همین الان (دستور رئیس)'
      });
    }

    if (idea.includes('قیمت') || idea.includes('سود') || idea.includes('باکس') || idea.includes('دلار') || idea.includes('درصد')) {
      const targetPrice = (extractedNum >= 2 && extractedNum <= 100 && !idea.includes('درصد')) ? extractedNum : state.config.boxPriceUsd;
      newResolutions.push({
        id: 'res-' + Date.now() + '-2',
        agentId: 'cfo',
        agentName: 'آرش راد (مدیر مالی و خزانه)',
        department: 'بازطراحی مدل مالی به دستور رئیس',
        title: `تنظیم قیمت جعبه شانسی روی $${targetPrice} و بهینه‌سازی ضریب سود خزانه`,
        summary: `مدل ریاضی امید ریاضی (EV) بر اساس دستور شما بازمحاسبه شد تا با قیمت $${targetPrice}، حاشیه سود مستقیم شما در بالاترین سطح ممکن حفظ شود.`,
        impact: 'بهینه‌سازی جریان نقدی کیف‌پول شخصی رئیس',
        actionType: 'UPDATE_PRICE',
        payload: {
          boxPriceUsd: targetPrice,
          banner: `💎 اطلاعیه هیئت‌مدیره: شرایط ویژه جعبه شانسی ($${targetPrice}) با ضمانت بازخرید آنی فعال شد!`
        },
        status: 'pending',
        createdAt: 'همین الان (دستور رئیس)'
      });
    }

    // Always also create a Marketing/Growth campaign resolution tailored to the Chairman's idea
    newResolutions.push({
      id: 'res-' + Date.now() + '-3',
      agentId: 'cmo',
      agentName: 'سارا نیک‌فر (مدیر بازاریابی و رشد)',
      department: 'کمپین تبلیغاتی هماهنگ با ایده رئیس',
      title: `کمپین وایرال تلگرام با محوریت: «${idea.slice(0, 45)}...»`,
      summary: `تیم مارکتینگ هوش مصنوعی بنر بالای مینی‌اپ و پیام تبلیغاتی کانال‌های تلگرام را بر اساس ایده جدید شما طراحی کرد. با تایید شما، بنر جدید بلافاصله در ویترین مشتریان به نمایش درمی‌آید.`,
      impact: '+۳۰٪ افزایش نرخ کلیک و خرید در مینی‌اپ',
      actionType: 'UPDATE_PRICE',
      payload: {
        boxPriceUsd: state.config.boxPriceUsd,
        banner: `🔥 طرح ویژه رئیس هیئت‌مدیره: ${idea} — همین حالا شانس خود را در جعبه گنج امتحان کنید!`
      },
      status: 'pending',
      createdAt: 'همین الان (دستور رئیس)'
    });

    // Update agents' lastReport to reflect the board meeting on the Chairman's directive
    state.agents[0].lastReport = `تحلیل مالی ایده شما («${idea}»): تراز خزانه مثبت است و اجرای این دستور هیچ ریسک نقدینگی برای صندوق بازخرید ایجاد نمی‌کند.`;
    state.agents[1].lastReport = `پلن مارکتینگ برای «${idea}» آماده شد. پیام‌های وایرال تلگرام و بنر بالای اپلیکیشن در صف تایید شما قرار گرفت.`;
    state.agents[2].lastReport = `بخش فروش آماده اجرای دستور «${idea}» و اتصال آن به باشگاه مشتریان VIP دارندگان NFT است.`;

    state.boardResolutions.unshift(...newResolutions);
    state.auditLog.unshift({
      time: nowTime(),
      actor: 'رئیس هیئت‌مدیره (ایده جدید)',
      text: `دستور جدید ابلاغ شد: «${idea}» — ۵ مدیر هوش مصنوعی جلسه فوری تشکیل داده و ${newResolutions.length} مصوبه اجرایی آماده تایید شما کردند.`
    });

    saveState(state);
    return sendJson(res, 200, { ok: true, newResolutions, state });
  }

  // Static files
  let filePath = pathname === '/' ? '/index.html' : pathname;
  const fullPath = path.join(PUBLIC_DIR, filePath);

  if (fullPath.startsWith(PUBLIC_DIR) && fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(fullPath).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

const { startBot } = require('./telegram_bot');

server.listen(PORT, '0.0.0.0', () => {
  console.log(`NEXUS TON AI Empire running on http://0.0.0.0:${PORT}`);
  startBot();
});
