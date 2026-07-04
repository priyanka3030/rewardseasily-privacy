// RewardsEasily — Credit Card Database
// Reward rates stored as cashback % equivalent per $1 spent.
// For points cards, we use standard valuations:
//   Chase Ultimate Rewards: 1.5¢/pt (via travel portal)
//   Amex Membership Rewards: 1.5¢/pt
//   Capital One Miles: 1¢/pt
//   Citi ThankYou Points: 1¢/pt
//
// Categories: dining, groceries, gas, travel, online, other

export const CATEGORIES = [
  { id: 'dining',    label: 'Dining',          icon: '🍽️',  description: 'Restaurants, cafes, takeout' },
  { id: 'groceries', label: 'Groceries',        icon: '🛒',  description: 'Supermarkets & grocery stores' },
  { id: 'gas',       label: 'Gas',              icon: '⛽',  description: 'Gas stations' },
  { id: 'travel',    label: 'Travel',           icon: '✈️',  description: 'Flights, hotels, rideshare' },
  { id: 'online',    label: 'Online Shopping',  icon: '🛍️', description: 'Amazon & general e-commerce' },
  { id: 'other',     label: 'Everything Else',  icon: '💳',  description: 'All other purchases' },
];

// Each card has:
//   id, name, issuer, network, color (hex for UI), rewards (% per category)
//   notes: any important caveats
export const ALL_CARDS = [
  {
    id: 'chase_sapphire_preferred',
    name: 'Sapphire Preferred',
    issuer: 'Chase',
    network: 'Visa',
    color: '#1A3C5E',
    annualFee: 95,
    rewards: {
      dining:    4.5,  // 3x UR @ 1.5¢
      groceries: 1.5,  // 1x
      gas:       1.5,
      travel:    4.5,  // 3x UR @ 1.5¢
      online:    1.5,
      other:     1.5,
    },
    notes: 'Earn 3x on dining & travel. Points worth 1.5¢ via Chase travel portal.',
  },
  {
    id: 'chase_sapphire_reserve',
    name: 'Sapphire Reserve',
    issuer: 'Chase',
    network: 'Visa',
    color: '#1A3C5E',
    annualFee: 550,
    rewards: {
      dining:    7.5,  // 5x UR via portal; 3x otherwise @ 1.5¢ = 4.5¢. Using standard 3x dining
      groceries: 1.5,
      gas:       1.5,
      travel:    7.5,  // 3x UR @ 1.5¢ = 4.5¢, but 10x on hotels/cars via portal
      online:    1.5,
      other:     1.5,
    },
    notes: '3x on dining & travel. $300 travel credit offsets annual fee. Points worth 1.5¢ via portal.',
  },
  {
    id: 'chase_freedom_unlimited',
    name: 'Freedom Unlimited',
    issuer: 'Chase',
    network: 'Visa',
    color: '#2D6A4F',
    annualFee: 0,
    rewards: {
      dining:    4.5,  // 3x UR @ 1.5¢
      groceries: 1.5,
      gas:       1.5,
      travel:    4.5,  // 5x via Chase travel — using 3x standard travel
      online:    1.5,
      other:     2.25, // 1.5x UR @ 1.5¢
    },
    notes: 'No annual fee. 3% on dining, 1.5% on everything else. Great catch-all card.',
  },
  {
    id: 'chase_freedom_flex',
    name: 'Freedom Flex',
    issuer: 'Chase',
    network: 'Mastercard',
    color: '#2D6A4F',
    annualFee: 0,
    rewards: {
      dining:    4.5,  // 3x UR @ 1.5¢
      groceries: 1.5,
      gas:       1.5,
      travel:    1.5,
      online:    1.5,
      other:     1.5,  // Note: 5% rotating categories not included (varies quarterly)
    },
    notes: 'No annual fee. 3% on dining. 5% rotating quarterly categories (varies — check Chase app).',
  },
  {
    id: 'amex_gold',
    name: 'Gold Card',
    issuer: 'American Express',
    network: 'Amex',
    color: '#C9A84C',
    annualFee: 250,
    rewards: {
      dining:    6.0,  // 4x MR @ 1.5¢
      groceries: 6.0,  // 4x MR @ 1.5¢ (US supermarkets, up to $25k/yr)
      gas:       1.5,
      travel:    4.5,  // 3x on flights @ 1.5¢
      online:    1.5,
      other:     1.5,
    },
    notes: '4x on dining & US supermarkets, 3x on flights. $120 dining credit + $120 Uber Cash annually.',
  },
  {
    id: 'amex_platinum',
    name: 'Platinum Card',
    issuer: 'American Express',
    network: 'Amex',
    color: '#808080',
    annualFee: 695,
    rewards: {
      dining:    1.5,
      groceries: 1.5,
      gas:       1.5,
      travel:    7.5,  // 5x on flights & prepaid hotels @ 1.5¢
      online:    1.5,
      other:     1.5,
    },
    notes: '5x on flights & prepaid hotels booked via Amex Travel. Loaded with travel perks & credits.',
  },
  {
    id: 'amex_blue_cash_preferred',
    name: 'Blue Cash Preferred',
    issuer: 'American Express',
    network: 'Amex',
    color: '#007BC1',
    annualFee: 95,
    rewards: {
      dining:    1.0,
      groceries: 6.0,  // 6% at US supermarkets (up to $6k/yr)
      gas:       3.0,  // 3% at US gas stations & transit
      travel:    3.0,
      online:    1.0,
      other:     1.0,
    },
    notes: '6% at US supermarkets (up to $6k/yr), 3% at gas stations & transit. Pure cashback.',
  },
  {
    id: 'amex_blue_cash_everyday',
    name: 'Blue Cash Everyday',
    issuer: 'American Express',
    network: 'Amex',
    color: '#007BC1',
    annualFee: 0,
    rewards: {
      dining:    1.0,
      groceries: 3.0,  // 3% at US supermarkets (up to $6k/yr)
      gas:       3.0,  // 3% at US gas stations
      travel:    1.0,
      online:    3.0,  // 3% on US online retail
      other:     1.0,
    },
    notes: 'No annual fee. 3% on groceries, gas, and online retail. Pure cashback.',
  },
  {
    id: 'citi_double_cash',
    name: 'Double Cash',
    issuer: 'Citi',
    network: 'Mastercard',
    color: '#003B70',
    annualFee: 0,
    rewards: {
      dining:    2.0,
      groceries: 2.0,
      gas:       2.0,
      travel:    2.0,
      online:    2.0,
      other:     2.0,
    },
    notes: 'No annual fee. 2% on everything (1% when you buy + 1% when you pay). Simplest card out there.',
  },
  {
    id: 'citi_custom_cash',
    name: 'Custom Cash',
    issuer: 'Citi',
    network: 'Mastercard',
    color: '#003B70',
    annualFee: 0,
    rewards: {
      dining:    5.0,  // 5% on top category (up to $500/mo), but user should set their top category
      groceries: 5.0,
      gas:       5.0,
      travel:    5.0,
      online:    5.0,
      other:     1.0,
    },
    notes: '5% on your top spend category each billing cycle (up to $500/mo). 1% on all else. No annual fee.',
  },
  {
    id: 'capital_one_venture',
    name: 'Venture Rewards',
    issuer: 'Capital One',
    network: 'Visa',
    color: '#D03027',
    annualFee: 95,
    rewards: {
      dining:    2.0,
      groceries: 2.0,
      gas:       2.0,
      travel:    5.0,  // 5x on hotels & car rentals via Capital One Travel
      online:    2.0,
      other:     2.0,
    },
    notes: '2x miles on everything (worth 1¢/mile). 5x on Capital One Travel bookings.',
  },
  {
    id: 'capital_one_savor',
    name: 'Savor Cash Rewards',
    issuer: 'Capital One',
    network: 'Mastercard',
    color: '#D03027',
    annualFee: 0,
    rewards: {
      dining:    3.0,
      groceries: 3.0,  // 3% at grocery stores
      gas:       1.0,
      travel:    1.0,
      online:    3.0,  // 3% on popular streaming & entertainment
      other:     1.0,
    },
    notes: 'No annual fee. 3% on dining, groceries, entertainment & streaming.',
  },
  {
    id: 'discover_it',
    name: 'Discover it Cash Back',
    issuer: 'Discover',
    network: 'Discover',
    color: '#FF6600',
    annualFee: 0,
    rewards: {
      dining:    1.0,
      groceries: 1.0,
      gas:       1.0,
      travel:    1.0,
      online:    1.0,
      other:     1.0,  // 5% rotating — not predictable, stored as 1% base
    },
    notes: 'No annual fee. 5% rotating quarterly categories (e.g. groceries, gas, restaurants — check Discover). Cashback matched first year.',
  },
  {
    id: 'wells_fargo_active_cash',
    name: 'Active Cash',
    issuer: 'Wells Fargo',
    network: 'Visa',
    color: '#C0392B',
    annualFee: 0,
    rewards: {
      dining:    2.0,
      groceries: 2.0,
      gas:       2.0,
      travel:    2.0,
      online:    2.0,
      other:     2.0,
    },
    notes: 'No annual fee. Flat 2% cashback on everything. Great simple card.',
  },
  {
    id: 'bank_of_america_premium',
    name: 'Premium Rewards',
    issuer: 'Bank of America',
    network: 'Visa',
    color: '#E31837',
    annualFee: 95,
    rewards: {
      dining:    2.0,
      groceries: 2.0,
      gas:       2.0,
      travel:    3.0,  // 3% on travel & dining with Preferred Rewards
      online:    1.5,
      other:     1.5,
    },
    notes: '2x on travel & dining, 1.5x on everything else. Rewards boosted up to 75% with Preferred Rewards.',
  },
];
