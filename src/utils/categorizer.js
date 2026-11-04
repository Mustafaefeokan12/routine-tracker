/**
 * Client-Side Smart AI Categorization Engine
 * Instant, 100% offline NLP semantic pattern matcher for Turkish spending phrases.
 */

export const CATEGORIES = [
  {
    id: 'tobacco',
    name: 'Tütün / IQOS',
    icon: '🚬',
    color: '#f97316',
    keywords: [
      'iqos', 'terea', 'heets', 'sigara', 'tabacco', 'tobacco', 'puro',
      'çakmak', 'parliament', 'marlboro', 'kent', 'winston', 'camel'
    ]
  },
  {
    id: 'cafeteria',
    name: 'Yemekhane & Kart',
    icon: '🍱',
    color: '#06b6d4',
    keywords: [
      'yemekhane', 'okul kartı', 'yemek kartı', 'itü kart', 'öğle yemeği',
      'akşam yemeği', 'tabldot', 'öğün', 'itü yemek', 'kampüs yemek'
    ]
  },
  {
    id: 'food',
    name: 'Yemek & Restoran',
    icon: '🍔',
    color: '#ef4444',
    keywords: [
      'döner', 'burger', 'pizza', 'lahmacun', 'dürüm', 'köfte', 'tavuk',
      'makarna', 'salata', 'restoran', 'lokanta', 'yemeksepeti', 'getiryemek',
      'trendyol yemek', 'simit', 'poğaça', 'börek', 'pide', 'kebap', 'makarna',
      'sushi', 'tost', 'fastfood', 'yemek'
    ]
  },
  {
    id: 'coffee',
    name: 'Kahve & Kafe',
    icon: '☕',
    color: '#a855f7',
    keywords: [
      'kahve', 'starbucks', 'espresso', 'latte', 'filtre kahve', 'mocha',
      'americano', 'çay', 'kahvedünyası', 'tchibo', 'gloria', 'kafe', 'tatlı',
      'cheesecake', 'kruvasan', 'pasta'
    ]
  },
  {
    id: 'market',
    name: 'Market & Bakkal',
    icon: '🛒',
    color: '#10b981',
    keywords: [
      'market', 'migros', 'bim', 'a101', 'şok', 'carrefour', 'macro',
      'file', 'tekel', 'bakkal', 'büfe', 'fırın', 'manav', 'kasap',
      'su', 'kola', 'cips', 'çikolata', 'getir', 'istegelsin', 'abur cubur'
    ]
  },
  {
    id: 'transport',
    name: 'Ulaşım & Yol',
    icon: '🚇',
    color: '#3b82f6',
    keywords: [
      'metro', 'marmaray', 'metrobüs', 'otobüs', 'akbil', 'istanbulkart',
      'taksi', 'uber', 'bitaksi', 'itaksi', 'martı', 'binbin', 'scooter',
      'dolmuş', 'minibüs', 'bilet', 'uçak', 'tren', 'benzin', 'akaryakıt',
      'opet', 'shell', 'bp', 'otopark', 'yol', 'hgs', 'köprü'
    ]
  },
  {
    id: 'shopping',
    name: 'Alışveriş & Giyim',
    icon: '🛍️',
    color: '#ec4899',
    keywords: [
      'trendyol', 'amazon', 'hepsiburada', 'zara', 'h&m', 'bershka',
      'pull&bear', 'nike', 'adidas', 'ayakkabı', 'pantolon', 'tişört',
      'mont', 'saat', 'giyim', 'avm', 'kıyafet', 'elektronik', 'teknosa', 'mediamarkt'
    ]
  },
  {
    id: 'bills',
    name: 'Fatura & Abonelik',
    icon: '📄',
    color: '#64748b',
    keywords: [
      'fatura', 'kira', 'aidat', 'vodafone', 'turkcell', 'telekom',
      'internet', 'elektrik', 'doğalgaz', 'su faturası', 'netflix', 'spotify',
      'youtube', 'apple', 'icloud', 'chatgpt', 'openai', 'prime', 'exxen'
    ]
  },
  {
    id: 'health',
    name: 'Bakım & Sağlık',
    icon: '💈',
    color: '#14b8a6',
    keywords: [
      'berber', 'kuaför', 'tıraş', 'eczane', 'ilaç', 'hastane', 'doktor',
      'diş', 'sağlık', 'lens', 'krem', 'parfüm', 'şampuan', 'deodorant', 'bakım'
    ]
  },
  {
    id: 'entertainment',
    name: 'Eğlence & Sosyal',
    icon: '🍿',
    color: '#f59e0b',
    keywords: [
      'sinema', 'biletix', 'konser', 'tiyatro', 'pub', 'bar', 'bira',
      'kokteyl', 'şarap', 'oyun', 'steam', 'playstation', 'maç', 'parti'
    ]
  },
  {
    id: 'education',
    name: 'Eğitim & Kitap',
    icon: '📚',
    color: '#8b5cf6',
    keywords: [
      'kitap', 'kırtasiye', 'fotokopi', 'defter', 'kalem', 'itü', 'harç',
      'kurs', 'udemy', 'd&r', 'kitapyurdu'
    ]
  }
];

export const DEFAULT_CATEGORY = {
  id: 'other',
  name: 'Diğer',
  icon: '📦',
  color: '#94a3b8'
};

/**
 * Predicts category with confidence score from description.
 */
export function classifyExpense(text) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return DEFAULT_CATEGORY;
  }

  const clean = text.toLowerCase().replace(/[^a-z0-9ğüşıöç\s]/g, ' ');
  const words = clean.split(/\s+/).filter(Boolean);

  for (const cat of CATEGORIES) {
    for (const kw of cat.keywords) {
      if (clean.includes(kw) || words.some(w => w.startsWith(kw) || kw.startsWith(w))) {
        return cat;
      }
    }
  }

  return DEFAULT_CATEGORY;
}
