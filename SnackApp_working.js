import React, { useState, useCallback, useEffect, useContext, createContext, useRef } from 'react';
import {
  View, Text, FlatList, SectionList, TouchableOpacity,
  TextInput, StyleSheet, SafeAreaView, ActivityIndicator,
  Alert, KeyboardAvoidingView, Platform, ScrollView, Modal,
  useColorScheme, Image, Linking, Switch,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';
import * as StoreReview from 'expo-store-review';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// ─── AD UNIT ID ──────────────────────────────────────────────────────────────
const AD_UNIT_ID = __DEV__ ? TestIds.BANNER : 'ca-app-pub-3157191634373945/9444408030';

// ─── LOGO ────────────────────────────────────────────────────────────────────

const LOGO_URI = require('./assets/logo.png');

// ─── DATA ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'dining',    label: 'Dining',         icon: '🍽️',  description: 'Restaurants, cafes, takeout' },
  { id: 'groceries', label: 'Groceries',       icon: '🛒',  description: 'Supermarkets & grocery stores' },
  { id: 'gas',       label: 'Gas',             icon: '⛽',  description: 'Gas stations' },
  { id: 'travel',    label: 'Travel',          icon: '✈️',  description: 'Flights, hotels, rideshare' },
  { id: 'online',    label: 'Online Shopping', icon: '🛍️', description: 'Amazon & general e-commerce' },
  { id: 'other',     label: 'Everything Else', icon: '💳',  description: 'All other purchases' },
];

// ─── MERCHANT → CATEGORY MAP ─────────────────────────────────────────────────
// Maps merchant name keywords (lowercase) to a category id.
// Used in HomeScreen merchant search to auto-select the right category.
const MERCHANT_MAP = [
  // Dining
  { keywords: ['starbucks', 'mcdonald', 'chipotle', 'chick-fil-a', 'chick fil a', 'domino', 'subway', 'dunkin', 'taco bell', 'wendy', 'burger king', 'panera', 'olive garden', 'applebee', 'restaurant', 'cafe', 'pizza', 'sushi', 'diner', 'bistro', 'grill', 'bar & grill', 'doordash', 'uber eats', 'grubhub', 'seamless', 'instacart restaurant'], category: 'dining' },
  // Groceries
  { keywords: ['whole foods', 'trader joe', 'kroger', 'safeway', 'publix', 'aldi', 'costco', 'sam\'s club', 'target grocery', 'walmart grocery', 'sprouts', 'wegmans', 'stop & shop', 'giant', 'meijer', 'h-e-b', 'heb', 'food lion', 'instacart', 'shipt', 'grocery'], category: 'groceries' },
  // Gas
  { keywords: ['shell', 'exxon', 'chevron', 'bp', 'mobil', 'sunoco', 'valero', 'speedway', 'circle k', 'wawa', 'kwik trip', 'casey\'s', 'gas station', 'fuel', 'pilot', 'flying j'], category: 'gas' },
  // Travel
  { keywords: ['united', 'delta', 'american airlines', 'southwest', 'jetblue', 'alaska airlines', 'spirit', 'frontier', 'lufthansa', 'british airways', 'marriott', 'hilton', 'hyatt', 'ihg', 'airbnb', 'vrbo', 'expedia', 'kayak', 'priceline', 'booking.com', 'hotels.com', 'uber', 'lyft', 'hertz', 'enterprise', 'avis', 'national car', 'airport', 'hotel', 'flight', 'airline', 'amtrak', 'cruise', 'carnival', 'royal caribbean'], category: 'travel' },
  // Online Shopping
  { keywords: ['amazon', 'ebay', 'etsy', 'walmart.com', 'target.com', 'bestbuy', 'best buy', 'newegg', 'chewy', 'wayfair', 'overstock', 'zappos', 'nordstrom', 'apple store', 'google store', 'paypal', 'shopify', 'online'], category: 'online' },
];

function merchantToCategory(query) {
  const q = query.toLowerCase().trim();
  for (const entry of MERCHANT_MAP) {
    if (entry.keywords.some(k => q.includes(k))) return entry.category;
  }
  return null;
}

// ─── CARD IDS ─────────────────────────────────────────────────────────────────
// Single source of truth for every card ID in the database.
// All code that references a specific card must use these constants —
// never a raw string like 'chase_sapphire_preferred'.

const CARD_IDS = {
  // ── Chase ──────────────────────────────────────────────────────────────────
  CHASE_SAPPHIRE_PREFERRED:       'chase_sapphire_preferred',
  CHASE_SAPPHIRE_RESERVE:         'chase_sapphire_reserve',
  CHASE_FREEDOM_UNLIMITED:        'chase_freedom_unlimited',
  CHASE_FREEDOM_FLEX:             'chase_freedom_flex',
  CHASE_INK_PREFERRED:            'chase_ink_preferred',

  // ── American Express ───────────────────────────────────────────────────────
  AMEX_GOLD:                      'amex_gold',
  AMEX_PLATINUM:                  'amex_platinum',
  AMEX_BLUE_CASH_PREFERRED:       'amex_blue_cash_preferred',
  AMEX_BLUE_CASH_EVERYDAY:        'amex_blue_cash_everyday',
  AMEX_GREEN:                     'amex_green',
  AMEX_DELTA_BLUE:                'amex_delta_blue',
  AMEX_DELTA_GOLD:                'amex_delta_gold',
  AMEX_HILTON_HONORS:             'amex_hilton_honors',
  AMEX_HILTON_HONORS_SURPASS:     'amex_hilton_honors_surpass',
  AMEX_HILTON_HONORS_ASPIRE:      'amex_hilton_honors_aspire',
  AMEX_MARRIOTT_BONVOY_BEVY:      'amex_marriott_bonvoy_bevy',
  AMEX_MARRIOTT_BONVOY_BRILLIANT: 'amex_marriott_bonvoy_brilliant',

  // ── Citi ───────────────────────────────────────────────────────────────────
  CITI_DOUBLE_CASH:               'citi_double_cash',
  CITI_CUSTOM_CASH:               'citi_custom_cash',
  CITI_STRATA_PREMIER:            'citi_strata_premier',
  CITI_STRATA_ELITE:              'citi_strata_elite',
  COSTCO_ANYWHERE_VISA:           'costco_anywhere_visa',

  // ── Capital One ────────────────────────────────────────────────────────────
  CAPITAL_ONE_VENTURE:            'capital_one_venture',
  CAPITAL_ONE_VENTURE_ONE:        'capital_one_venture_one',
  CAPITAL_ONE_VENTURE_X:          'capital_one_venture_x',
  CAPITAL_ONE_SAVOR:              'capital_one_savor',
  CAPITAL_ONE_SAVORONE:           'capital_one_savorone',
  CAPITAL_ONE_QUICKSILVER:        'capital_one_quicksilver',

  // ── Discover ───────────────────────────────────────────────────────────────
  DISCOVER_IT:                    'discover_it',

  // ── Wells Fargo ────────────────────────────────────────────────────────────
  WELLS_FARGO_ACTIVE_CASH:        'wells_fargo_active_cash',
  WELLS_FARGO_AUTOGRAPH:          'wells_fargo_autograph',
  WELLS_FARGO_AUTOGRAPH_JOURNEY:  'wells_fargo_autograph_journey',

  // ── Bank of America ────────────────────────────────────────────────────────
  BANK_OF_AMERICA_PREMIUM:        'bank_of_america_premium',
  BANK_OF_AMERICA_UNLIMITED_CASH: 'bank_of_america_unlimited_cash',
  BANK_OF_AMERICA_CUSTOMIZED_CASH:'bank_of_america_customized_cash',
  BANK_OF_AMERICA_TRAVEL_REWARDS: 'bank_of_america_travel_rewards',

  // ── U.S. Bank ──────────────────────────────────────────────────────────────
  US_BANK_ALTITUDE_RESERVE:       'us_bank_altitude_reserve',
  US_BANK_ALTITUDE_CONNECT:       'us_bank_altitude_connect',
  US_BANK_CASH_PLUS:              'us_bank_cash_plus',
  US_BANK_SMARTLY:                'us_bank_smartly',

  // ── Apple / Goldman Sachs ──────────────────────────────────────────────────
  APPLE_CARD:                     'apple_card',

  // ── Navy Federal CU ────────────────────────────────────────────────────────
  NAVY_FEDERAL_FLAGSHIP:          'navy_federal_flagship',
  NAVY_FEDERAL_CASH_REWARDS:      'navy_federal_cash_rewards',

  // ── PenFed CU ──────────────────────────────────────────────────────────────
  PENFED_PLATINUM_REWARDS:        'penfed_platinum_rewards',
  PENFED_POWER_CASH:              'penfed_power_cash',

  CHASE_FREEDOM_RISE:             'chase_freedom_rise',
  CHASE_WORLD_OF_HYATT:           'chase_world_of_hyatt',
  CHASE_MARRIOTT_BONVOY_BOUNDLESS:'chase_marriott_bonvoy_boundless',

  // ── Amazon / Chase ─────────────────────────────────────────────────────────
  AMAZON_PRIME_VISA:              'amazon_prime_visa',

  // ── Bilt ───────────────────────────────────────────────────────────────────
  BILT_OBSIDIAN:                  'bilt_obsidian',

  // ── PayPal / Synchrony ─────────────────────────────────────────────────────
  PAYPAL_CASHBACK:                'paypal_cashback',

  // ── Fidelity / Elan ────────────────────────────────────────────────────────
  FIDELITY_REWARDS_VISA:          'fidelity_rewards_visa',
};

// ─── ISSUER TIER PROGRAMS ─────────────────────────────────────────────────────
// Generic config for bank loyalty programs that boost card reward rates.
// multiplier applies to the card's base rate (not to special offer bonuses).
// Add new issuers here as programs are identified.

const ISSUER_TIERS = {
  // Key is used as the prefs storage key — keep stable even if program name changes.
  'Bank of America': {
    programName: 'BofA Rewards',  // renamed from Preferred Rewards on May 27, 2026
    cardIds: [
      CARD_IDS.BANK_OF_AMERICA_PREMIUM,
      CARD_IDS.BANK_OF_AMERICA_UNLIMITED_CASH,
      CARD_IDS.BANK_OF_AMERICA_CUSTOMIZED_CASH,
      CARD_IDS.BANK_OF_AMERICA_TRAVEL_REWARDS,
    ],
    tiers: [
      { id: 'none',             label: 'None',           detail: 'No membership',  multiplier: 1.00 },
      { id: 'gold',             label: 'Gold',           detail: '$20K–$50K',      multiplier: 1.25 },
      { id: 'platinum',         label: 'Platinum',       detail: '$50K–$100K',     multiplier: 1.50 },
      { id: 'platinum_honors',  label: 'Plat. Honors',   detail: '$100K+',         multiplier: 1.75 },
    ],
  },
  'U.S. Bank': {
    programName: 'Smartly',
    // Applies only to the Smartly Visa Signature card — not Altitude or Cash+.
    // Bonus capped at $10K/month in purchases; base 2% applies above that.
    cardIds: [
      CARD_IDS.US_BANK_SMARTLY,
    ],
    tiers: [
      { id: 'none',     label: 'None',     detail: 'Under $10K',    multiplier: 1.00 },
      { id: 'silver',   label: 'Silver',   detail: '$10K–$50K',     multiplier: 1.25 },
      { id: 'gold',     label: 'Gold',     detail: '$50K–$100K',    multiplier: 1.50 },
      { id: 'platinum', label: 'Platinum', detail: '$100K+',        multiplier: 2.00 },
    ],
  },
  // To add a new program:
  // 'Issuer Name': { programName: '...', cardIds: ['card_id_1', 'card_id_2'], tiers: [...] }
};

// Find the ISSUER_TIERS entry for a card by matching its ID against each program's cardIds list.
// ID-based matching is exact and immune to issuer name formatting differences in Firestore.
function getTierConfig(card) {
  const entry = Object.entries(ISSUER_TIERS).find(([, config]) =>
    config.cardIds.includes(card.id)
  );
  return entry ? { issuerKey: entry[0], config: entry[1] } : null;
}

// Card data lives entirely in Firestore (fetched + cached in AsyncStorage).
// See fetchCardsFromFirestore() below.

// (card data removed — lives entirely in Firestore)

const __DEAD_CARDS_REMOVED = [
  {
    id: 'chase_sapphire_preferred', name: 'Sapphire Preferred', issuer: 'Chase',
    network: 'Visa', color: '#1A3C5E', annualFee: 95,
    rewards: { dining: 4.5, groceries: 4.5, gas: 4.5, travel: 7.5, online: 1.5, other: 1.5 }, // gas updated 2026-06-12: 3x on gas/EV added in June 2026 refresh (effective Jun 15)
    notes: '3x on dining, online groceries & gas, 5x via Chase Travel. Points worth 1.5¢ via portal.',
  },
  {
    id: 'chase_sapphire_reserve', name: 'Sapphire Reserve', issuer: 'Chase',
    network: 'Visa', color: '#1A3C5E', annualFee: 795,
    rewards: { dining: 4.5, groceries: 1.5, gas: 1.5, travel: 12.0, online: 1.5, other: 1.5 },
    notes: '3x on dining, 4x on flights/hotels direct, 8x via Chase Travel. $300 travel credit.',
  },
  {
    id: 'chase_freedom_unlimited', name: 'Freedom Unlimited', issuer: 'Chase',
    network: 'Visa', color: '#2D6A4F', annualFee: 0,
    rewards: { dining: 4.5, groceries: 1.5, gas: 1.5, travel: 7.5, online: 1.5, other: 2.25 }, // travel updated 2026-05-27
    notes: 'No annual fee. 3% on dining, 5x via Chase Travel, 1.5% on everything else.',
  },
  {
    id: 'chase_freedom_flex', name: 'Freedom Flex', issuer: 'Chase',
    network: 'Mastercard', color: '#2D6A4F', annualFee: 0,
    rewards: { dining: 4.5, groceries: 1.5, gas: 1.5, travel: 7.5, online: 1.5, other: 1.5 },
    notes: 'No annual fee. 3% on dining, 5x via Chase Travel. 5% rotating quarterly categories.',
  },
  {
    id: 'amex_gold', name: 'Gold Card', issuer: 'American Express',
    network: 'Amex', color: '#F07A00', annualFee: 325,
    rewards: { dining: 6.0, groceries: 6.0, gas: 1.5, travel: 7.5, online: 1.5, other: 1.5 },
    notes: '4x on dining & US supermarkets, 5x prepaid hotels & 3x flights via Amex Travel. $325 annual fee.',
  },
  {
    id: 'amex_platinum', name: 'Platinum Card', issuer: 'American Express',
    network: 'Amex', color: '#808080', annualFee: 895, // updated 2026-07-03: fee raised from $695 to $895 (effective Sep 2025 for new cardholders, Jan 2026 for existing)
    rewards: { dining: 1.5, groceries: 1.5, gas: 1.5, travel: 7.5, online: 1.5, other: 1.5 },
    notes: '5x on flights & prepaid hotels via Amex Travel. Loaded with travel perks. $895 annual fee.',
  },
  {
    id: 'amex_blue_cash_preferred', name: 'Blue Cash Preferred', issuer: 'American Express',
    network: 'Amex', color: '#007BC1', annualFee: 95,
    rewards: { dining: 1.0, groceries: 6.0, gas: 3.0, travel: 3.0, online: 1.0, other: 1.0 },
    notes: '6% at US supermarkets (up to $6k/yr), 3% at gas stations & transit.',
  },
  {
    id: 'amex_blue_cash_everyday', name: 'Blue Cash Everyday', issuer: 'American Express',
    network: 'Amex', color: '#007BC1', annualFee: 0,
    rewards: { dining: 1.0, groceries: 3.0, gas: 3.0, travel: 1.0, online: 3.0, other: 1.0 },
    notes: 'No annual fee. 3% on groceries, gas, and online retail.',
  },
  {
    id: 'citi_double_cash', name: 'Double Cash', issuer: 'Citi',
    network: 'Mastercard', color: '#003B70', annualFee: 0,
    rewards: { dining: 2.0, groceries: 2.0, gas: 2.0, travel: 3.0, online: 2.0, other: 2.0 },
    notes: '2% on everything. 3% on hotels, car rentals & attractions via Citi Travel. No annual fee.',
  },
  {
    id: 'citi_custom_cash', name: 'Custom Cash', issuer: 'Citi',
    network: 'Mastercard', color: '#003B70', annualFee: 0,
    rewards: { dining: 5.0, groceries: 5.0, gas: 5.0, travel: 5.0, online: 5.0, other: 1.0 },
    notes: '5% on your top spend category each billing cycle (up to $500/mo). CLOSED to new applicants as of May 28, 2026.', // updated 2026-07-03: Citi discontinued new applications
  },
  {
    id: 'capital_one_venture', name: 'Venture Rewards', issuer: 'Capital One',
    network: 'Visa', color: '#D03027', annualFee: 95,
    rewards: { dining: 2.0, groceries: 2.0, gas: 2.0, travel: 5.0, online: 2.0, other: 2.0 },
    notes: '2x miles on everything. 5x on Capital One Travel bookings.',
  },
  {
    id: 'capital_one_savor', name: 'Savor Cash Rewards', issuer: 'Capital One',
    network: 'Mastercard', color: '#D03027', annualFee: 0,
    rewards: { dining: 3.0, groceries: 3.0, gas: 1.0, travel: 5.0, online: 3.0, other: 1.0 },
    notes: 'No annual fee. 3% on dining, groceries & streaming. 5% on hotels/rentals via Capital One Travel.',
  },
  {
    id: 'discover_it', name: 'Discover it Cash Back', issuer: 'Discover',
    network: 'Discover', color: '#FF6600', annualFee: 0,
    rewards: { dining: 1.0, groceries: 1.0, gas: 1.0, travel: 1.0, online: 1.0, other: 1.0 },
    notes: '5% rotating quarterly categories. Cashback matched first year.',
  },
  {
    id: 'wells_fargo_active_cash', name: 'Active Cash', issuer: 'Wells Fargo',
    network: 'Visa', color: '#C0392B', annualFee: 0,
    rewards: { dining: 2.0, groceries: 2.0, gas: 2.0, travel: 2.0, online: 2.0, other: 2.0 },
    notes: 'No annual fee. Flat 2% cashback on everything.',
  },
  {
    id: 'bank_of_america_premium', name: 'Premium Rewards', issuer: 'Bank of America',
    network: 'Visa', color: '#E31837', annualFee: 95,
    rewards: { dining: 2.0, groceries: 2.0, gas: 2.0, travel: 3.0, online: 1.5, other: 1.5 },
    notes: '2x on travel & dining, 1.5x on everything else.',
  },

  // ── U.S. BANK ──────────────────────────────────────────────────────────────
  {
    id: 'us_bank_altitude_reserve', name: 'Altitude Reserve', issuer: 'U.S. Bank',
    network: 'Visa', color: '#003087', annualFee: 400,
    rewards: { dining: 1.0, groceries: 1.0, gas: 1.0, travel: 3.0, online: 1.0, other: 1.0 }, // all rates updated 2026-05-27: points devalued from 1.5¢ to 1¢/pt (effective Dec 2025); card closed to new applicants
    notes: '3x on travel & mobile wallet (up to $5k/billing cycle). $325 travel credit (Travel Center only). Closed to new applicants as of May 2026.',
  },
  {
    id: 'us_bank_altitude_connect', name: 'Altitude Connect', issuer: 'U.S. Bank',
    network: 'Visa', color: '#003087', annualFee: 95,
    rewards: { dining: 1.0, groceries: 1.0, gas: 4.0, travel: 4.0, online: 1.0, other: 1.0 },
    notes: '4x on travel & gas (up to $1,000/quarter on gas). No foreign transaction fees.',
  },
  {
    id: 'us_bank_cash_plus', name: 'Cash+', issuer: 'U.S. Bank',
    network: 'Visa', color: '#003087', annualFee: 0,
    rewards: { dining: 2.0, groceries: 2.0, gas: 2.0, travel: 2.0, online: 5.0, other: 1.0 },
    notes: 'No annual fee. 5% on two categories you choose, 2% on one everyday category, 1% on all else.',
  },

  // ── APPLE / CHASE ──────────────────────────────────────────────────────────
  {
    id: 'apple_card', name: 'Apple Card', issuer: 'Apple / Chase',
    network: 'Mastercard', color: '#555555', annualFee: 0,
    rewards: { dining: 2.0, groceries: 2.0, gas: 2.0, travel: 2.0, online: 3.0, other: 2.0 },
    notes: 'No annual fee. 3% at Apple & select merchants via Apple Pay. 2% on all Apple Pay purchases. 1% with physical card.',
  },

  // ── NAVY FEDERAL CREDIT UNION ──────────────────────────────────────────────
  {
    id: 'navy_federal_flagship', name: 'Visa Flagship Rewards', issuer: 'Navy Federal CU',
    network: 'Visa', color: '#003366', annualFee: 49,
    rewards: { dining: 2.0, groceries: 2.0, gas: 2.0, travel: 3.0, online: 2.0, other: 2.0 },
    notes: '3x on travel, 2x on everything else. $49 annual fee. Military-affiliated members only.',
  },
  {
    id: 'navy_federal_cash_rewards', name: 'cashRewards Plus', issuer: 'Navy Federal CU',
    network: 'Visa', color: '#003366', annualFee: 0,
    rewards: { dining: 2.0, groceries: 2.0, gas: 2.0, travel: 2.0, online: 2.0, other: 2.0 },
    notes: 'No annual fee. 2% on everything (requires $5k+ credit limit). Military-affiliated members only.',
  },

  // ── PENFED ─────────────────────────────────────────────────────────────────
  {
    id: 'penfed_platinum_rewards', name: 'Platinum Rewards', issuer: 'PenFed CU',
    network: 'Visa', color: '#1B4D8E', annualFee: 0,
    rewards: { dining: 3.0, groceries: 3.0, gas: 5.0, travel: 1.0, online: 1.0, other: 1.0 },
    notes: 'No annual fee. 5x on gas, 3x on groceries & dining. Redeem for travel, gift cards & merchandise.',
  },
  {
    id: 'penfed_power_cash', name: 'Power Cash Rewards', issuer: 'PenFed CU',
    network: 'Visa', color: '#1B4D8E', annualFee: 0,
    rewards: { dining: 1.5, groceries: 1.5, gas: 1.5, travel: 1.5, online: 1.5, other: 1.5 },
    notes: 'No annual fee. 1.5% on everything (2% for Honors Advantage members). Open to everyone.',
  },

  // ── AMAZON / CHASE ─────────────────────────────────────────────────────────
  {
    id: 'amazon_prime_visa', name: 'Prime Visa', issuer: 'Amazon / Chase',
    network: 'Visa', color: '#FF9900', annualFee: 0,
    rewards: { dining: 2.0, groceries: 5.0, gas: 2.0, travel: 5.0, online: 5.0, other: 1.0 },
    notes: 'No card fee (requires Prime membership). 5% at Amazon, Whole Foods & Chase Travel. 2% at restaurants & gas.',
  },

  // ── CITI ───────────────────────────────────────────────────────────────────
  {
    id: 'citi_strata_premier', name: 'Strata Premier', issuer: 'Citi',
    network: 'Mastercard', color: '#003B70', annualFee: 95,
    rewards: { dining: 3.0, groceries: 3.0, gas: 3.0, travel: 10.0, online: 1.0, other: 1.0 },
    notes: '10x on hotels/car rentals via Citi Travel. 3x on dining, groceries, gas & air travel. $100 hotel credit annually.',
  },
  {
    id: 'costco_anywhere_visa', name: 'Costco Anywhere Visa', issuer: 'Citi',
    network: 'Visa', color: '#003B70', annualFee: 0,
    rewards: { dining: 3.0, groceries: 2.0, gas: 4.0, travel: 3.0, online: 2.0, other: 1.0 },
    notes: 'No card fee (requires Costco membership). 4% on gas (up to $7k/yr), 3% dining & travel, 2% at Costco.',
  },

  // ── BILT ───────────────────────────────────────────────────────────────────
  {
    id: 'bilt_obsidian', name: 'Bilt Obsidian Card', issuer: 'Bilt',
    network: 'Mastercard', color: '#2C2C2C', annualFee: 95,
    rewards: { dining: 3.0, groceries: 3.0, gas: 1.0, travel: 2.0, online: 1.0, other: 1.0 }, // updated 2026-05-27: Bilt 2.0 restructure
    notes: 'Bilt 2.0: 3x on dining OR grocery (choose one annually; grocery capped $25k/yr), 2x travel, 1x other. Also earns on rent & mortgage. $95 fee offset by $100 hotel credit.',
  },

  // ── PAYPAL ─────────────────────────────────────────────────────────────────
  {
    id: 'paypal_cashback', name: 'PayPal Cashback Mastercard', issuer: 'PayPal / Synchrony',
    network: 'Mastercard', color: '#003087', annualFee: 0,
    rewards: { dining: 1.5, groceries: 1.5, gas: 1.5, travel: 1.5, online: 3.0, other: 1.5 },
    notes: 'No annual fee. 3% back via PayPal checkout, 1.5% on all other purchases.',
  },

  // ── FIDELITY ───────────────────────────────────────────────────────────────
  {
    id: 'fidelity_rewards_visa', name: 'Fidelity Rewards Visa', issuer: 'Fidelity / Elan',
    network: 'Visa', color: '#006633', annualFee: 0,
    rewards: { dining: 2.0, groceries: 2.0, gas: 2.0, travel: 2.0, online: 2.0, other: 2.0 },
    notes: 'No annual fee. Unlimited 2% back deposited into eligible Fidelity accounts.',
  },

  // ── CAPITAL ONE ────────────────────────────────────────────────────────────
  {
    id: 'capital_one_venture_x', name: 'Venture X', issuer: 'Capital One',
    network: 'Visa', color: '#D03027', annualFee: 395,
    rewards: { dining: 2.0, groceries: 2.0, gas: 2.0, travel: 10.0, online: 2.0, other: 2.0 },
    notes: '10x on hotels/car rentals via Capital One Travel, 5x on flights, 2x on everything else. $300 travel credit.',
  },

  // ── CHASE ──────────────────────────────────────────────────────────────────
  {
    id: 'chase_ink_preferred', name: 'Ink Business Preferred', issuer: 'Chase',
    network: 'Visa', color: '#1A3C5E', annualFee: 95,
    rewards: { dining: 1.5, groceries: 1.5, gas: 1.5, travel: 4.5, online: 4.5, other: 1.5 },
    notes: '3x on travel, shipping, ads & telecom (up to $150k/yr). Points worth 1.5¢ via Chase Travel.',
  },

  // ── AMERICAN EXPRESS ───────────────────────────────────────────────────────
  {
    id: 'amex_hilton_honors_surpass', name: 'Hilton Honors Surpass', issuer: 'American Express',
    network: 'Amex', color: '#00204E', annualFee: 150,
    rewards: { dining: 6.0, groceries: 6.0, gas: 6.0, travel: 12.0, online: 4.0, other: 3.0 }, // online updated 2026-05-31: 4x on US online retail (up from 3x)
    notes: '12x on Hilton purchases, 6x on dining, groceries & gas, 4x on US online retail, 3x on everything else. Hilton points valued at ~1¢.',
  },
  {
    id: 'amex_marriott_bonvoy_brilliant', name: 'Marriott Bonvoy Brilliant', issuer: 'American Express',
    network: 'Amex', color: '#8B1A1A', annualFee: 650,
    rewards: { dining: 3.0, groceries: 1.0, gas: 1.0, travel: 6.0, online: 1.0, other: 1.0 },
    notes: '6x on Marriott purchases, 3x on dining & flights. $300 Marriott dining credit. Annual free night.',
  },
]; // dead code — not used by app, card data lives in Firestore

// ─── THEME ───────────────────────────────────────────────────────────────────

const THEME = {
  light: {
    bg: '#F8F6F2', card: '#FFFFFF', border: '#E8E4DC', separator: '#F0EDE8',
    sectionBg: '#F8F6F2', notesBg: '#F5F2EC', subtleBorder: '#CCBFA8',
    chipBg: '#FAFAFA', text: '#111111', textSec: '#AAAAAA', textMuted: '#999999',
    inputBg: '#FFFFFF', badgeBg: '#111111', badgeText: '#FFFFFF',
    tabBg: '#FFFFFF', tabBorder: '#E8E4DC', tabActive: '#111111', tabInactive: '#BBBBBB',
  },
  dark: {
    bg: '#0D0D0D', card: '#1A1A1A', border: '#2A2A2A', separator: '#222222',
    sectionBg: '#0D0D0D', notesBg: '#1E1E1E', subtleBorder: '#3A3532',
    chipBg: '#222222', text: '#F0F0F0', textSec: '#666666', textMuted: '#555555',
    inputBg: '#1A1A1A', badgeBg: '#F0F0F0', badgeText: '#111111',
    tabBg: '#111111', tabBorder: '#2A2A2A', tabActive: '#F0F0F0', tabInactive: '#444444',
  },
};

function useTheme() {
  const scheme = useColorScheme();
  return THEME[scheme === 'dark' ? 'dark' : 'light'];
}

// ─── AUTH CONTEXT ─────────────────────────────────────────────────────────────

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

// ─── FIREBASE REST API ───────────────────────────────────────────────────────

const FIREBASE_PROJECT = 'rewardseasily-3caa3';
const FIREBASE_API_KEY = 'AIzaSyB1QfF2uSBeQEIp_yT5tBhB_we71n8VLgY';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;

// Refreshes the Firebase ID token (tokens expire after 1 hour).
// Always call this before any authenticated write so saves don't silently fail.
async function refreshUserToken(user) {
  if (!user?.refreshToken) return user?.idToken;
  try {
    const res = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: user.refreshToken }),
      }
    );
    const data = await res.json();
    return data.id_token || user.idToken;
  } catch { return user.idToken; }
}
const FIREBASE_AUTH_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';

// ─── AUTH FUNCTIONS ───────────────────────────────────────────────────────────

const AUTH_SESSION_KEY = '@rewardseasily_auth';
const BIOMETRIC_KEY    = '@rewardseasily_biometric';

async function firebaseSignUp(email, password) {
  const res = await fetch(`${FIREBASE_AUTH_URL}:signUp?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  return res.json();
}

async function firebaseSendPasswordReset(email) {
  const res = await fetch(`${FIREBASE_AUTH_URL}:sendOobCode?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
  });
  return res.json();
}

async function firebaseDeleteAccount(idToken) {
  const res = await fetch(`${FIREBASE_AUTH_URL}:delete?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  return res.json();
}

async function firebaseSignIn(email, password) {
  const res = await fetch(`${FIREBASE_AUTH_URL}:signInWithPassword?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  return res.json();
}

async function loadSavedSession() {
  try {
    const json = await AsyncStorage.getItem(AUTH_SESSION_KEY);
    return json ? JSON.parse(json) : null;
  } catch { return null; }
}

async function persistSession(user) {
  try { await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user)); } catch {}
}

async function clearSession() {
  try { await AsyncStorage.removeItem(AUTH_SESSION_KEY); } catch {}
}

// ─── BIOMETRIC FUNCTIONS ──────────────────────────────────────────────────────

async function isBiometricAvailable() {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch { return false; }
}

async function isBiometricEnabled() {
  try {
    const val = await AsyncStorage.getItem(BIOMETRIC_KEY);
    return val === 'true';
  } catch { return false; }
}

async function setBiometricEnabled(enabled) {
  await AsyncStorage.setItem(BIOMETRIC_KEY, enabled ? 'true' : 'false');
}

async function authenticateWithBiometric() {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock RewardsEasily',
      fallbackLabel: 'Use Password',
    });
    return result.success;
  } catch { return false; }
}

// Parse Firestore's typed value format into plain JS values
function parseValue(value) {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return parseInt(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('mapValue' in value) {
    const result = {};
    for (const [k, v] of Object.entries(value.mapValue.fields || {})) {
      result[k] = parseValue(v);
    }
    return result;
  }
  if ('arrayValue' in value) {
    return (value.arrayValue.values || []).map(parseValue);
  }
  return null;
}

// Parse a Firestore document into a plain JS object
function parseDoc(doc) {
  const result = {};
  for (const [key, value] of Object.entries(doc.fields || {})) {
    result[key] = parseValue(value);
  }
  // Extract doc ID from the document name path
  result.id = doc.name.split('/').pop();
  return result;
}

async function fetchCardsFromFirestore() {
  const CACHE_KEY = '@rewardseasily_cards_cache';
  try {
    const url = `${FIRESTORE_URL}/cards?key=${FIREBASE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.documents) throw new Error('No documents in response');
    const cards = data.documents.map(parseDoc).sort((a, b) =>
      a.issuer.localeCompare(b.issuer) || a.name.localeCompare(b.name)
    );
    // Save fresh data to cache for offline use
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cards));
    return cards;
  } catch (e) {
    console.warn('Firestore fetch failed, trying cache:', e.message);
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return []; // No cache yet — app will show empty state
  }
}

async function fetchOffersFromFirestore() {
  const CACHE_KEY = '@rewardseasily_offers_cache';
  try {
    const url = `${FIRESTORE_URL}/specialOffers?key=${FIREBASE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.documents) throw new Error('No documents in response');
    const today = new Date().toISOString().split('T')[0];
    const offers = data.documents.map(parseDoc).filter(o => o.expiresAt >= today);
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(offers));
    return offers;
  } catch (e) {
    console.warn('Offers fetch failed, trying cache:', e.message);
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const today = new Date().toISOString().split('T')[0];
        return JSON.parse(cached).filter(o => o.expiresAt >= today);
      }
    } catch (_) {}
    return [];
  }
}

// ─── CARD STORAGE (guest = AsyncStorage, logged in = Firestore) ───────────────

const GUEST_CARDS_KEY = '@rewardseasily_my_cards';

async function getUserCardIds(user) {
  if (!user) {
    // Guest: load from AsyncStorage
    try {
      const json = await AsyncStorage.getItem(GUEST_CARDS_KEY);
      return json ? JSON.parse(json) : [];
    } catch { return []; }
  }
  // Logged in: load from Firestore /users/{uid}
  try {
    const idToken = await refreshUserToken(user);
    const url = `${FIRESTORE_URL}/users/${user.uid}?key=${FIREBASE_API_KEY}`;
    const res  = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
    const data = await res.json();
    if (!data.fields || !data.fields.savedCardIds) return [];
    return (data.fields.savedCardIds.arrayValue.values || []).map(v => v.stringValue);
  } catch { return []; }
}

async function setUserCardIds(user, ids) {
  if (!user) {
    // Guest: save to AsyncStorage
    try { await AsyncStorage.setItem(GUEST_CARDS_KEY, JSON.stringify(ids)); } catch {}
    return;
  }
  // Logged in: write to Firestore /users/{uid}
  try {
    const idToken = await refreshUserToken(user); // refresh before write — tokens expire in 1hr
    const url  = `${FIRESTORE_URL}/users/${user.uid}?key=${FIREBASE_API_KEY}&updateMask.fieldPaths=savedCardIds`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({
        fields: {
          savedCardIds: { arrayValue: { values: ids.map(id => ({ stringValue: id })) } },
        },
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('setUserCardIds Firestore error:', err?.error?.message || res.status);
    }
  } catch (e) { console.warn('setUserCardIds failed:', e.message); }
}

async function toggleCardId(user, currentIds, cardId) {
  const next = currentIds.includes(cardId)
    ? currentIds.filter(id => id !== cardId)
    : [...currentIds, cardId];
  await setUserCardIds(user, next);
  return next;
}

// ─── USER PREFERENCES (issuer tier memberships, etc.) ────────────────────────

const GUEST_PREFS_KEY = '@rewardseasily_prefs';

async function getUserPrefs(user) {
  if (!user) {
    try {
      const json = await AsyncStorage.getItem(GUEST_PREFS_KEY);
      return json ? JSON.parse(json) : {};
    } catch { return {}; }
  }
  try {
    const idToken = await refreshUserToken(user);
    const url  = `${FIRESTORE_URL}/users/${user.uid}?key=${FIREBASE_API_KEY}`;
    const res  = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
    const data = await res.json();
    if (!data.fields || !data.fields.prefs) return {};
    return JSON.parse(data.fields.prefs.stringValue || '{}');
  } catch { return {}; }
}

async function setUserPrefs(user, prefs) {
  if (!user) {
    try { await AsyncStorage.setItem(GUEST_PREFS_KEY, JSON.stringify(prefs)); } catch {}
    return;
  }
  try {
    const idToken = await refreshUserToken(user);
    const url = `${FIRESTORE_URL}/users/${user.uid}?key=${FIREBASE_API_KEY}&updateMask.fieldPaths=prefs`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ fields: { prefs: { stringValue: JSON.stringify(prefs) } } }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('setUserPrefs Firestore error:', err?.error?.message || res.status);
    }
  } catch (e) { console.warn('setUserPrefs failed:', e.message); }
}

// ─── RATE CALCULATION ────────────────────────────────────────────────────────

// Returns the effective cashback % for a card in a given category,
// applying any active special offer and the user's issuer tier multiplier.
// Offer bonuses bypass the tier multiplier (they're already category-specific).
function getEffectiveRate(card, categoryId, offers, issuerPrefs) {
  const offer = (offers || []).find(o => o.cardId === card.id && o.category === categoryId);
  if (offer) return offer.bonusRate;
  const base  = card.rewards?.[categoryId] || 0;
  const match = getTierConfig(card);
  if (match && issuerPrefs) {
    const tierId = issuerPrefs[match.issuerKey] || 'none';
    const tier   = match.config.tiers.find(t => t.id === tierId);
    if (tier && tier.multiplier !== 1.0) return parseFloat((base * tier.multiplier).toFixed(2));
  }
  return base;
}

// Returns the maximum possible rate for a card, achieved at the highest tier.
// Used to show the rate range (e.g. "2.0–5.25%*") on tiered cards.
function getMaxRate(card, categoryId, offers) {
  const offer = (offers || []).find(o => o.cardId === card.id && o.category === categoryId);
  if (offer) return offer.bonusRate;
  const base  = card.rewards?.[categoryId] || 0;
  const match = getTierConfig(card);
  if (match) {
    const maxMult = Math.max(...match.config.tiers.map(t => t.multiplier));
    return parseFloat((base * maxMult).toFixed(2));
  }
  return base;
}

// ─── AUTH SCREEN ─────────────────────────────────────────────────────────────

function AuthScreen({ onAuth, onGuest, savedUser }) {
  const [mode, setMode]         = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [bioLoading, setBioLoading] = useState(false);
  const [resetSent, setResetSent]   = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) { setError('Enter your email address first, then tap Forgot Password.'); return; }
    setResetLoading(true);
    setError('');
    try {
      await firebaseSendPasswordReset(email.trim());
      setResetSent(true);
    } catch {
      setError('Could not send reset email. Check your connection and try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const tryFaceId = async () => {
    setBioLoading(true);
    const passed = await authenticateWithBiometric();
    setBioLoading(false);
    if (passed) onAuth(savedUser);
    else setError('Face ID not recognised. Try again or sign in with your email and password.');
  };

  const submit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) { setError('Please enter email and password.'); return; }
    setLoading(true);
    try {
      const data = mode === 'signup'
        ? await firebaseSignUp(email.trim(), password)
        : await firebaseSignIn(email.trim(), password);
      if (data.error) {
        const FIREBASE_ERRORS = {
          'INVALID_LOGIN_CREDENTIALS': 'Incorrect email or password.',
          'EMAIL_NOT_FOUND': 'No account found with that email.',
          'INVALID_PASSWORD': 'Incorrect password.',
          'EMAIL_EXISTS': 'An account with this email already exists.',
          'WEAK_PASSWORD : Password should be at least 6 characters': 'Password must be at least 6 characters.',
          'TOO_MANY_ATTEMPTS_TRY_LATER': 'Too many attempts. Please wait a few minutes and try again.',
          'USER_DISABLED': 'This account has been disabled. Contact support.',
          'INVALID_EMAIL': 'Please enter a valid email address.',
        };
        setError(FIREBASE_ERRORS[data.error.message] || 'Something went wrong. Please try again.');
        return;
      }
      const user = { uid: data.localId, email: data.email, idToken: data.idToken, refreshToken: data.refreshToken };
      await persistSession(user);
      onAuth(user);
    } catch (e) {
      setError('Network error. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111111' }}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 32 }}>

          {/* Face ID unlock — shown when a saved session exists */}
          {savedUser && (
            <TouchableOpacity
              onPress={tryFaceId}
              disabled={bioLoading}
              activeOpacity={0.7}
              style={{ alignItems: 'center', marginBottom: 40 }}
            >
              <Text style={{ fontSize: 48, marginBottom: 10 }}>􀎽</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }}>
                {bioLoading ? 'Authenticating…' : 'Unlock with Face ID'}
              </Text>
              <Text style={{ fontSize: 12, color: '#666666' }}>Tap to use Face ID</Text>
            </TouchableOpacity>
          )}

          {/* Logo */}
          <Text style={{ fontSize: 11, color: '#F07A00', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>Rewards Easily</Text>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 6, letterSpacing: -0.5 }}>
            {mode === 'signin' ? 'Welcome back.' : 'Create account.'}
          </Text>
          <Text style={{ fontSize: 14, color: '#666666', marginBottom: 40 }}>
            {mode === 'signin' ? 'Sign in to sync your cards across devices.' : 'Save your cards and access them anywhere.'}
          </Text>

          {/* Email */}
          <Text style={authStyles.label}>Email</Text>
          <TextInput
            style={authStyles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            placeholderTextColor="#444444"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Password */}
          <Text style={[authStyles.label, { marginTop: 16 }]}>Password</Text>
          <View style={{ position: 'relative' }}>
            <TextInput
              style={[authStyles.input, { paddingRight: 48 }]}
              value={password}
              onChangeText={setPassword}
              placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
              placeholderTextColor="#444444"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(v => !v)}
              style={{ position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 13, color: '#666666' }}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          {/* Forgot password — only show on sign-in mode */}
          {mode === 'signin' && (
            <TouchableOpacity
              onPress={handleForgotPassword}
              disabled={resetLoading}
              style={{ alignSelf: 'flex-end', marginTop: 10 }}
            >
              <Text style={{ fontSize: 12, color: '#F07A00' }}>
                {resetLoading ? 'Sending…' : 'Forgot password?'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Reset email confirmation */}
          {resetSent && (
            <View style={{ backgroundColor: '#1A2A1A', borderWidth: 1, borderColor: '#2D6A4F', borderRadius: 6, padding: 12, marginTop: 12 }}>
              <Text style={{ color: '#4CAF50', fontSize: 13 }}>
                If an account exists for {email}, a reset link has been sent. Check your inbox.
              </Text>
            </View>
          )}

          {/* Error */}
          {!!error && <Text style={{ color: '#C0392B', fontSize: 13, marginTop: 12 }}>{error}</Text>}

          {/* Submit */}
          <TouchableOpacity style={authStyles.primaryBtn} onPress={submit} disabled={loading} activeOpacity={0.8}>
            {loading
              ? <ActivityIndicator color="#111111" size="small" />
              : <Text style={authStyles.primaryBtnText}>{mode === 'signin' ? 'Sign In' : 'Create Account'}</Text>
            }
          </TouchableOpacity>

          {/* Privacy policy — sign-up only */}
          {mode === 'signup' && (
            <Text style={{ fontSize: 11, color: '#555555', textAlign: 'center', marginTop: 12, lineHeight: 17 }}>
              By creating an account, you agree to our{' '}
              <Text
                style={{ color: '#F07A00', textDecorationLine: 'underline' }}
                onPress={() => Linking.openURL('https://rewardseasily.com/privacy')}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          )}

          {/* Toggle mode */}
          <TouchableOpacity onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setResetSent(false); setShowPassword(false); }} style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={{ color: '#666666', fontSize: 13 }}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={{ color: '#F07A00' }}>{mode === 'signin' ? 'Sign up' : 'Sign in'}</Text>
            </Text>
          </TouchableOpacity>

          {/* Guest */}
          <TouchableOpacity onPress={onGuest} style={{ marginTop: 32, alignItems: 'center' }}>
            <Text style={{ color: '#888888', fontSize: 13 }}>Continue as guest  →</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const authStyles = StyleSheet.create({
  label: { fontSize: 10, color: '#666666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 4, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#FFFFFF' },
  primaryBtn: { backgroundColor: '#F07A00', borderRadius: 4, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: '#111111', letterSpacing: 0.5, textTransform: 'uppercase' },
});

// ─── REVIEW PROMPT ────────────────────────────────────────────────────────────
// Called after results load successfully. Asks for a review once the user has
// viewed results 3+ times and at least 60 days have passed since the last ask.

const REVIEW_VIEWS_KEY    = '@rewardseasily_results_views';
const REVIEW_PROMPTED_KEY = '@rewardseasily_review_prompted';

async function maybeRequestReview() {
  try {
    const countStr   = await AsyncStorage.getItem(REVIEW_VIEWS_KEY);
    const count      = (parseInt(countStr) || 0) + 1;
    await AsyncStorage.setItem(REVIEW_VIEWS_KEY, String(count));
    if (count < 3) return;                          // haven't gotten enough value yet
    const lastStr = await AsyncStorage.getItem(REVIEW_PROMPTED_KEY);
    if (lastStr) {
      const daysSince = (Date.now() - parseInt(lastStr)) / 86400000;
      if (daysSince < 60) return;                   // too soon since last ask
    }
    const available = await StoreReview.isAvailableAsync();
    if (!available) return;
    await StoreReview.requestReview();
    await AsyncStorage.setItem(REVIEW_PROMPTED_KEY, String(Date.now()));
  } catch { /* never crash on a rating prompt */ }
}

// ─── HOME SCREEN ─────────────────────────────────────────────────────────────

function HomeScreen({ navigation }) {
  const t = useTheme();
  const [merchantQuery, setMerchantQuery] = useState('');
  const [matchedCategory, setMatchedCategory] = useState(null);
  const [noMatch, setNoMatch] = useState(false);

  const handleMerchantSearch = (text) => {
    setMerchantQuery(text);
    setNoMatch(false);
    if (!text.trim()) { setMatchedCategory(null); return; }
    const catId = merchantToCategory(text);
    setMatchedCategory(catId ? CATEGORIES.find(c => c.id === catId) : null);
  };

  const handleMerchantSubmit = () => {
    if (matchedCategory) {
      navigation.navigate('Results', { category: matchedCategory });
      setMerchantQuery('');
      setMatchedCategory(null);
    } else if (merchantQuery.trim()) {
      setNoMatch(true);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
      <View style={[styles.header, { alignItems: 'center', paddingTop: 8, paddingBottom: 6 }]}>

        {/* Logo */}
        <Image
          source={LOGO_URI}
          style={{ width: 180, height: 56, marginBottom: 2 }}
          resizeMode="contain"
        />

        <Text style={{ fontSize: 11, color: '#666666', letterSpacing: 0.2, textAlign: 'center' }}>
          Find the best card to maximize rewards for every purchase
        </Text>

      </View>
      {/* Merchant search */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.card, borderWidth: 1, borderColor: matchedCategory ? '#F07A00' : t.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, gap: 8 }}>
          <Text style={{ fontSize: 14, color: t.textSec }}>🔍</Text>
          <TextInput
            value={merchantQuery}
            onChangeText={handleMerchantSearch}
            onSubmitEditing={handleMerchantSubmit}
            placeholder="Search merchant (e.g. Amazon, Starbucks…)"
            placeholderTextColor={t.textSec}
            style={{ flex: 1, fontSize: 14, color: t.text, padding: 0 }}
            returnKeyType="go"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>
        {matchedCategory && (
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: '#F07A0022', borderWidth: 1, borderColor: '#F07A0055', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, gap: 10 }}
            onPress={handleMerchantSubmit}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20 }}>{matchedCategory.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: t.text, fontWeight: '600' }}>Best card for {matchedCategory.label}</Text>
              <Text style={{ fontSize: 11, color: t.textSec }}>Tap to see your ranking →</Text>
            </View>
          </TouchableOpacity>
        )}
        {noMatch && !matchedCategory && (
          <Text style={{ fontSize: 12, color: t.textSec, marginTop: 8, paddingHorizontal: 4 }}>
            Merchant not recognized — pick a category below instead.
          </Text>
        )}
      </View>

      {/* Category list */}
      <FlatList
        data={CATEGORIES}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8, gap: 6 }}
        ItemSeparatorComponent={() => null}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryCard, { backgroundColor: t.card, borderColor: t.border }]}
            activeOpacity={0.6}
            onPress={() => navigation.navigate('Results', { category: item })}
          >
            <Text style={{ fontSize: 22, width: 34, textAlign: 'center', opacity: 0.85 }}>{item.icon}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.categoryLabel, { color: t.text }]}>{item.label}</Text>
              <Text style={[styles.categoryDesc, { color: t.textMuted }]}>{item.description}</Text>
            </View>
            <Text style={{ fontSize: 18, color: t.textSec, fontWeight: '300' }}>›</Text>
          </TouchableOpacity>
        )}
      />
      {/* Banner Ad */}
      <View style={{ alignItems: 'center', paddingBottom: 4 }}>
        <BannerAd
          unitId={AD_UNIT_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        />
      </View>
    </SafeAreaView>
  );
}

// ─── RESULTS SCREEN ───────────────────────────────────────────────────────────

function ResultsScreen({ route, navigation }) {
  const { category } = route.params;
  const { user } = useAuth();
  const t = useTheme();
  const [amount, setAmount] = useState('');
  const [savedIds, setSavedIds] = useState([]);
  const [allCards, setAllCards] = useState([]);
  const [offers, setOffers] = useState([]);
  const [prefs, setPrefs] = useState({});
  const [hasLoaded, setHasLoaded] = useState(false);

  useFocusEffect(useCallback(() => {
    Promise.all([getUserCardIds(user), fetchCardsFromFirestore(), fetchOffersFromFirestore(), getUserPrefs(user)])
      .then(([ids, cards, activeOffers, userPrefs]) => {
        setSavedIds(ids);
        setAllCards(cards);
        setOffers(activeOffers);
        setPrefs(userPrefs);
        setHasLoaded(true);
        // Track results views and prompt for a review after the user has gotten value
        maybeRequestReview();
      });
  }, [user]));

  // Returns the active offer for a card+category, or null
  const getOffer = (cardId) => offers.find(o => o.cardId === cardId && o.category === category.id) || null;
  // Returns the effective rate, applying tier multiplier and any active offer
  const effectiveRate = (card) => getEffectiveRate(card, category.id, offers, prefs);

  const [expanded, setExpanded] = useState(false);

  const savedCards = allCards.filter(c => savedIds.includes(c.id));
  const ranked = [...savedCards].sort((a, b) => effectiveRate(b) - effectiveRate(a));
  const displayedCards = expanded ? ranked : ranked.slice(0, 3);
  const hiddenCount = ranked.length - 3;
  const bestRate = ranked.length > 0 ? effectiveRate(ranked[0]) : 0;
  const dollarAmount = parseFloat(amount) || 0;

  // Best card across ALL cards (not just saved ones), using effective rates
  const overallBestRate = allCards.length > 0
    ? Math.max(...allCards.map(c => effectiveRate(c)))
    : 0;
  const overallBest = allCards.find(c => effectiveRate(c) === overallBestRate) || null;
  // Only show if the best overall card isn't already in the user's wallet
  const showRecommended = hasLoaded && overallBest && !savedIds.includes(overallBest.id);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
      <View style={[styles.header, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ marginRight: 2 }}
        >
          <Text style={{ fontSize: 17, color: t.text, fontWeight: '300' }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 26 }}>{category.icon}</Text>
        <Text style={styles.headerTitle}>{category.label}</Text>
      </View>

      <View style={{ backgroundColor: t.card, paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: t.border }}>
        <Text style={{ fontSize: 10, color: t.textSec, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Purchase Amount (optional)
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: t.border, borderRadius: 4, paddingHorizontal: 14, paddingVertical: 10 }}>
          <Text style={{ fontSize: 17, color: t.textSec, marginRight: 4 }}>$</Text>
          <TextInput
            style={{ fontSize: 17, flex: 1, color: t.text }}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={t.textMuted}
          />
        </View>
      </View>

      {!hasLoaded ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#F07A00" />
        </View>
      ) : (
        <FlatList
          data={displayedCards}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListHeaderComponent={ranked.length > 0 ? (() => {
            const activeOfferCards = ranked.filter(c => getOffer(c.id));
            return (
              <View style={{ marginTop: 20, marginBottom: 12 }}>
                <Text style={{ fontSize: 10, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: 1 }}>
                  From your wallet · {!expanded && ranked.length > 3 ? `Top 3 of ${ranked.length} cards` : `${ranked.length} card${ranked.length !== 1 ? 's' : ''}`}
                </Text>
                {activeOfferCards.length > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F07A00' }} />
                    <Text style={{ fontSize: 11, color: '#F07A00' }}>
                      {activeOfferCards.length === 1
                        ? `${activeOfferCards[0].name} has a limited offer`
                        : `${activeOfferCards.length} cards have limited offers`}
                    </Text>
                  </View>
                )}
              </View>
            );
          })() : null}
          ListEmptyComponent={(
            <View style={{ justifyContent: 'center', alignItems: 'center', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 32 }}>
              {allCards.length === 0 ? (
                <>
                  <Text style={{ fontSize: 56, marginBottom: 16 }}>📡</Text>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: t.text, marginBottom: 8 }}>Couldn't load cards</Text>
                  <Text style={{ fontSize: 15, color: t.textSec, textAlign: 'center' }}>Check your internet connection and try again.</Text>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 48, marginBottom: 16 }}>💳</Text>
                  <Text style={{ fontSize: 19, fontWeight: '700', color: t.text, marginBottom: 8, textAlign: 'center' }}>Your wallet is empty</Text>
                  <Text style={{ fontSize: 14, color: t.textSec, textAlign: 'center', lineHeight: 20, maxWidth: 240 }}>
                    Add the cards you own to see which one earns the most for {category.label.toLowerCase()}.
                  </Text>
                  <TouchableOpacity
                    style={{ marginTop: 24, backgroundColor: '#F07A00', paddingHorizontal: 28, paddingVertical: 13, borderRadius: 10 }}
                    onPress={() => navigation.getParent()?.navigate('MyCards')}
                  >
                    <Text style={{ color: '#111111', fontSize: 15, fontWeight: '700' }}>Add My Cards →</Text>
                  </TouchableOpacity>
                  {/* Show the overall best card even when wallet is empty */}
                  {showRecommended && (
                    <View style={{ marginTop: 32, width: '100%' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 }}>
                        <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
                        <Text style={{ fontSize: 9, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '600' }}>Top card for {category.label.toLowerCase()}</Text>
                        <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
          )}
          ListFooterComponent={(
            <>
              {!expanded && hiddenCount > 0 && (
                <TouchableOpacity
                  onPress={() => setExpanded(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginTop: 8, borderWidth: 1, borderColor: t.border, borderRadius: 8, gap: 6 }}
                >
                  <Text style={{ fontSize: 14, color: t.textSec, fontWeight: '500' }}>
                    Show {hiddenCount} more card{hiddenCount !== 1 ? 's' : ''} ▼
                  </Text>
                </TouchableOpacity>
              )}
              {expanded && ranked.length > 3 && (
                <TouchableOpacity
                  onPress={() => setExpanded(false)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginTop: 8, borderWidth: 1, borderColor: t.border, borderRadius: 8, gap: 6 }}
                >
                  <Text style={{ fontSize: 14, color: t.textSec, fontWeight: '500' }}>Show less ▲</Text>
                </TouchableOpacity>
              )}
              {ranked.length > 0 && ranked[0].notes && (
                <View style={{ backgroundColor: t.notesBg, padding: 14, marginTop: 10, borderRadius: 4, borderLeftWidth: 2, borderLeftColor: t.subtleBorder }}>
                  <Text style={{ fontSize: 12, color: t.textSec, lineHeight: 19 }}>{ranked[0].notes}</Text>
                </View>
              )}
              {showRecommended && (
                <View style={{ marginTop: 32 }}>
                  {/* Divider with secondary section label */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
                    <Text style={{ fontSize: 9, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '600' }}>
                      Worth adding
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
                  </View>
                  <View style={[styles.resultCard, { backgroundColor: t.card, borderColor: '#F07A00', borderWidth: 1.5 }]}>
                    <View style={{ position: 'absolute', top: -9, left: 16, backgroundColor: '#F07A00', borderRadius: 2, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: '#111111', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>{getOffer(overallBest.id) ? '🔥 Limited Offer' : '✦ Top Pick'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={{ width: 3, height: 36, backgroundColor: overallBest.color, marginRight: 14, borderRadius: 2 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: t.text, letterSpacing: 0.1 }}>{overallBest.name}</Text>
                        <Text style={{ fontSize: 12, color: t.textSec, marginTop: 2 }}>{overallBest.issuer}</Text>
                        {getOffer(overallBest.id) && (
                          <Text style={{ fontSize: 11, color: '#F07A00', marginTop: 4 }}>{getOffer(overallBest.id).description}</Text>
                        )}
                        {overallBest.annualFee > 0 && (
                          <Text style={{ fontSize: 11, color: t.textSec, marginTop: 3 }}>${overallBest.annualFee}/yr</Text>
                        )}
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                      {(() => {
                        const tierMatch  = getTierConfig(overallBest);
                        const tierConfig = tierMatch?.config;
                        const tierKey    = tierMatch?.issuerKey;
                        const tierIsSet  = tierConfig && prefs[tierKey] && prefs[tierKey] !== 'none';
                        const maxRate    = tierConfig && !tierIsSet ? getMaxRate(overallBest, category.id, offers) : overallBestRate;
                        const showRange  = tierConfig && !tierIsSet && maxRate > overallBestRate;
                        return showRange ? (
                          <>
                            <Text style={{ fontSize: 17, fontWeight: '700', color: '#F07A00', letterSpacing: -0.5 }}>
                              {overallBestRate.toFixed(1)}–{maxRate.toFixed(1)}%
                            </Text>
                            <Text style={{ fontSize: 9, color: t.textSec, marginTop: 2 }}>*with {tierConfig.programName}</Text>
                          </>
                        ) : (
                          <>
                            <Text style={{ fontSize: 22, fontWeight: '700', color: '#F07A00', letterSpacing: -0.5 }}>{overallBestRate.toFixed(1)}%</Text>
                            {dollarAmount > 0 && (
                              <Text style={{ fontSize: 12, color: '#2D6A4F', fontWeight: '500', marginTop: 2 }}>
                                ${((overallBestRate / 100) * dollarAmount).toFixed(2)} back
                              </Text>
                            )}
                          </>
                        );
                      })()}
                    </View>
                  </View>
                  {(() => {
                    const tierMatch  = getTierConfig(overallBest);
                    const tierConfig = tierMatch?.config;
                    const tierKey    = tierMatch?.issuerKey;
                    const tierIsSet  = tierConfig && prefs[tierKey] && prefs[tierKey] !== 'none';
                    const maxRate    = tierConfig ? getMaxRate(overallBest, category.id, offers) : overallBestRate;
                    if (tierConfig && !tierIsSet && maxRate > overallBestRate) {
                      return (
                        <View style={{ backgroundColor: t.notesBg, padding: 12, marginTop: 8, borderRadius: 4, borderLeftWidth: 2, borderLeftColor: '#F07A00' }}>
                          <Text style={{ fontSize: 12, color: '#F07A00', fontWeight: '600', marginBottom: 3 }}>
                            {tierConfig.programName} can boost this card
                          </Text>
                          <Text style={{ fontSize: 11, color: t.textSec, lineHeight: 17 }}>
                            Rate reaches {maxRate.toFixed(1)}% at the top tier. Set your membership level in My Cards → Rewards Programs.
                          </Text>
                        </View>
                      );
                    }
                    return null;
                  })()}
                  {overallBest.notes && (
                    <View style={{ backgroundColor: t.notesBg, padding: 12, marginTop: 8, borderRadius: 4, borderLeftWidth: 2, borderLeftColor: t.subtleBorder }}>
                      <Text style={{ fontSize: 12, color: t.textSec, lineHeight: 19 }}>{overallBest.notes}</Text>
                    </View>
                  )}
                </View>
              )}
            </>
          )}
          renderItem={({ item, index }) => {
            const offer = getOffer(item.id);
            const rate = effectiveRate(item);
            const isBest = index === 0;
            const est = dollarAmount > 0 ? ((rate / 100) * dollarAmount).toFixed(2) : null;
            const missed = dollarAmount > 0 && !isBest ? (((bestRate - rate) / 100) * dollarAmount).toFixed(2) : null;
            return (
              <View style={[styles.resultCard, { backgroundColor: t.card, borderColor: t.border }, isBest && !offer && { borderColor: t.badgeBg, borderWidth: 1.5 }, offer && { borderColor: '#F07A00', borderWidth: 1.5 }]}>
                {isBest && !offer && (
                  <View style={{ position: 'absolute', top: -9, left: 16, backgroundColor: t.badgeBg, borderRadius: 2, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ color: t.badgeText, fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>Best Pick</Text>
                  </View>
                )}
                {offer && (
                  <View style={{ position: 'absolute', top: -9, left: 16, backgroundColor: '#F07A00', borderRadius: 2, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ color: '#111111', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>Limited Offer{isBest ? ' · Best' : ''}</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 3, height: 36, backgroundColor: item.color, marginRight: 14, borderRadius: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: t.text, letterSpacing: 0.1 }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: t.textSec, marginTop: 2 }}>{item.issuer}</Text>
                    {offer && (
                      <View>
                        <Text style={{ fontSize: 11, color: '#F07A00', marginTop: 4 }}>{offer.description}</Text>
                        <Text style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>Expires {offer.expiresAt}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: offer ? '#F07A00' : t.text, letterSpacing: -0.5 }}>{rate.toFixed(1)}%</Text>
                  {est && <Text style={{ fontSize: 12, color: '#2D6A4F', fontWeight: '500', marginTop: 2 }}>${est} back</Text>}
                  {missed && <Text style={{ fontSize: 11, color: t.textSec, marginTop: 2 }}>Best earns ${missed} more</Text>}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ─── MY CARDS SCREEN ─────────────────────────────────────────────────────────

function groupByIssuer(cards) {
  const map = {};
  for (const card of cards) {
    if (!map[card.issuer]) map[card.issuer] = [];
    map[card.issuer].push(card);
  }
  return Object.keys(map).sort().map(issuer => ({ title: issuer, data: map[issuer] }));
}

function MyCardsScreen() {
  const { user, signOut } = useAuth();
  const t = useTheme();
  const [savedIds, setSavedIds]         = useState([]);
  const [allCards, setAllCards]         = useState([]);
  const [prefs, setPrefs]               = useState({});
  const [loading, setLoading]           = useState(true);
  const [bioAvailable, setBioAvailable]   = useState(false);
  const [bioEnabled, setBioEnabled]       = useState(false);
  const [collapsedTiers, setCollapsedTiers]     = useState(new Set(Object.keys(ISSUER_TIERS)));
  const [expandedSections, setExpandedSections] = useState(new Set()); // all issuer sections collapsed by default
  const [cardSearch, setCardSearch]             = useState('');

  useFocusEffect(useCallback(() => {
    Promise.all([
      getUserCardIds(user),
      fetchCardsFromFirestore(),
      getUserPrefs(user),
      isBiometricAvailable(),
      isBiometricEnabled(),
    ]).then(([ids, cards, userPrefs, available, enabled]) => {
      setSavedIds(ids);
      setAllCards(cards);
      setPrefs(userPrefs);
      setBioAvailable(available);
      setBioEnabled(enabled);
      setLoading(false);
    });
  }, [user]));

  const updateTierPref = async (issuer, tierId) => {
    const next = { ...prefs, [issuer]: tierId };
    setPrefs(next);
    await setUserPrefs(user, next);
    // Collapse the picker after a tier is chosen
    setCollapsedTiers(prev => new Set([...prev, issuer]));
  };

  const expandTierPicker = (issuer) => {
    setCollapsedTiers(prev => { const s = new Set(prev); s.delete(issuer); return s; });
  };

  const toggleCard = async (cardId) => {
    const next = await toggleCardId(user, savedIds, cardId);
    setSavedIds(next);
  };

  const toggleBiometric = async () => {
    const next = !bioEnabled;
    await setBiometricEnabled(next);
    setBioEnabled(next);
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  const myCards = allCards.filter(c => savedIds.includes(c.id));

  const toggleSection = (title) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  };

  // Build sections: filter by search, auto-expand matches, collapse untouched sections
  const rawSections = groupByIssuer(allCards);
  const searchQuery = cardSearch.trim().toLowerCase();
  const sections = rawSections
    .map(s => {
      const filtered = searchQuery
        ? s.data.filter(c =>
            c.name.toLowerCase().includes(searchQuery) ||
            c.issuer.toLowerCase().includes(searchQuery)
          )
        : s.data;
      const isExpanded = searchQuery ? filtered.length > 0 : expandedSections.has(s.title);
      return { ...s, data: isExpanded ? filtered : [], _totalCount: s.data.length };
    })
    .filter(s => !searchQuery || s._totalCount > 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cards</Text>
        <Text style={styles.headerSubtitle}>Tap to add or remove cards from your wallet</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#F07A00" />
          <Text style={{ marginTop: 12, color: t.textSec, fontSize: 13, letterSpacing: 0.3 }}>Loading cards…</Text>
        </View>
      ) : (
      <>
      {/* Search bar */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: t.card, borderBottomWidth: 1, borderBottomColor: t.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.inputBg, borderWidth: 1, borderColor: t.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
          <Text style={{ fontSize: 13, color: t.textSec }}>🔍</Text>
          <TextInput
            value={cardSearch}
            onChangeText={setCardSearch}
            placeholder="Search cards or issuers…"
            placeholderTextColor={t.textSec}
            style={{ flex: 1, fontSize: 13, color: t.text, padding: 0 }}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {cardSearch.length > 0 && (
            <TouchableOpacity onPress={() => setCardSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 13, color: t.textSec }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {myCards.length > 0 && (
        <View style={{ backgroundColor: t.card, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: t.border }}>
          <Text style={{ fontSize: 10, color: t.textSec, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' }}>
            Your Wallet · {myCards.length} card{myCards.length !== 1 ? 's' : ''}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {myCards.map(card => (
              <TouchableOpacity
                key={card.id}
                style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: t.border, borderRadius: 2, paddingHorizontal: 10, paddingVertical: 6, gap: 6, backgroundColor: t.chipBg }}
                onPress={() => {
                  Alert.alert(
                    'Remove Card',
                    `Remove ${card.name} from your wallet?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => toggleCard(card.id) },
                    ]
                  );
                }}
              >
                <View style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: card.color }} />
                <Text style={{ fontSize: 12, color: t.text }}>{card.name}</Text>
                <Text style={{ fontSize: 10, color: t.textSec }}>✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* First-launch hint — shown when nothing is expanded and no search is active */}
      {!searchQuery && expandedSections.size === 0 && myCards.length === 0 && (
        <View style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: t.notesBg, borderBottomWidth: 1, borderBottomColor: t.border }}>
          <Text style={{ fontSize: 12, color: t.textSec, lineHeight: 18 }}>
            💡 Tap any bank below to browse cards. Tap a card to add it to your wallet.
          </Text>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={(
          <>
            {/* Rewards Programs — pinned at top when user has a tiered card */}
            {myCards.some(c => getTierConfig(c)) && (
              <View style={{ backgroundColor: t.notesBg, borderBottomWidth: 1, borderBottomColor: t.border, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: '#F07A00', textTransform: 'uppercase', letterSpacing: 1, flex: 1 }}>Rewards Programs</Text>
                  <Text style={{ fontSize: 10, color: t.textSec }}>Affects earn rates ↑</Text>
                </View>
                {Object.entries(ISSUER_TIERS).map(([issuer, config]) => {
                  if (!myCards.some(c => getTierConfig(c)?.issuerKey === issuer)) return null;
                  const currentTier = prefs[issuer] || 'none';
                  const isCollapsed  = collapsedTiers.has(issuer);
                  const selectedTierLabel = config.tiers.find(t => t.id === currentTier)?.label || 'None';

                  if (isCollapsed) {
                    // Compact summary row — tap to re-open
                    return (
                      <TouchableOpacity
                        key={issuer}
                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
                        onPress={() => expandTierPicker(issuer)}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: t.text, flex: 1 }}>{issuer}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={{ backgroundColor: '#F07A00', borderRadius: 3, paddingHorizontal: 10, paddingVertical: 4 }}>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#111111' }}>{selectedTierLabel}</Text>
                          </View>
                          <Text style={{ fontSize: 12, color: t.textSec }}>Edit</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <View key={issuer} style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: t.text }}>{issuer}</Text>
                        <Text style={{ fontSize: 11, color: '#F07A00', marginLeft: 8 }}>{config.programName}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {config.tiers.map(tier => {
                          const isSelected = currentTier === tier.id;
                          return (
                            <TouchableOpacity
                              key={tier.id}
                              style={[
                                { borderWidth: 1, borderColor: t.border, borderRadius: 3, paddingHorizontal: 12, paddingVertical: 8, minWidth: 72, backgroundColor: t.card },
                                isSelected && { backgroundColor: '#F07A00', borderColor: '#F07A00' },
                              ]}
                              onPress={() => updateTierPref(issuer, tier.id)}
                              activeOpacity={0.7}
                            >
                              <Text style={{ fontSize: 12, fontWeight: '600', color: isSelected ? '#111111' : t.text }}>{tier.label}</Text>
                              {tier.detail && (
                                <Text style={{ fontSize: 10, color: isSelected ? '#333333' : t.textSec, marginTop: 2 }}>{tier.detail}</Text>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
                <Text style={{ fontSize: 11, color: t.textSec, lineHeight: 17, marginTop: 8 }}>
                  Your tier multiplies base earn rates across all {Object.keys(ISSUER_TIERS).join(' & ')} cards in your wallet.
                </Text>
              </View>
            )}
          </>
        )}
        renderSectionHeader={({ section }) => {
          const isOpen = searchQuery ? true : expandedSections.has(section.title);
          const totalInSection = section._totalCount || rawSections.find(s => s.title === section.title)?.data.length || 0;
          const addedInSection = rawSections.find(s => s.title === section.title)?.data.filter(c => savedIds.includes(c.id)).length || 0;
          return (
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10, backgroundColor: t.sectionBg }}
              onPress={() => toggleSection(section.title)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 10, fontWeight: '600', color: t.textSec, textTransform: 'uppercase', letterSpacing: 1, flex: 1 }}>{section.title}</Text>
              {addedInSection > 0 && (
                <View style={{ backgroundColor: '#F07A00', borderRadius: 3, paddingHorizontal: 7, paddingVertical: 2, marginRight: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#111111' }}>{addedInSection}</Text>
                </View>
              )}
              <Text style={{ fontSize: 11, color: t.textMuted, marginRight: 6 }}>{totalInSection} cards</Text>
              <Text style={{ fontSize: 12, color: t.textSec }}>{isOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: t.separator, marginLeft: 56 }} />}
        renderItem={({ item }) => {
          const isAdded = savedIds.includes(item.id);
          return (
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.card, paddingVertical: 16, paddingHorizontal: 20 }}
              activeOpacity={0.6}
              onPress={() => toggleCard(item.id)}
            >
              <View style={{ width: 3, height: 32, backgroundColor: item.color, marginRight: 16, borderRadius: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: t.text, letterSpacing: 0.1 }}>{item.name}</Text>
                <Text style={{ fontSize: 11, color: t.textSec, marginTop: 3 }}>
                  {item.issuer} · {item.network}{item.annualFee > 0 ? ` · $${item.annualFee}/yr` : ''}
                </Text>
              </View>
              <View style={[{ borderWidth: 1, borderColor: t.border, borderRadius: 2, paddingHorizontal: 12, paddingVertical: 6 }, isAdded && { backgroundColor: t.text, borderColor: t.text }]}>
                <Text style={[{ fontSize: 11, fontWeight: '600', color: t.text, letterSpacing: 0.3 }, isAdded && { color: t.bg }]}>
                  {isAdded ? '✓ Added' : '+ Add'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={(
          <View style={{ marginTop: 32, marginBottom: 40 }}>

            {/* Guest banner */}
            {!user && (
              <View style={{ marginHorizontal: 20, backgroundColor: t.card, borderWidth: 1, borderColor: t.border, borderRadius: 4, padding: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: t.text, marginBottom: 4 }}>Sync across devices</Text>
                  <Text style={{ fontSize: 12, color: t.textSec, lineHeight: 18 }}>Create a free account to save your cards and access them anywhere.</Text>
                </View>
                <TouchableOpacity
                  style={{ marginLeft: 14, backgroundColor: t.text, borderRadius: 4, paddingHorizontal: 14, paddingVertical: 8 }}
                  onPress={signOut}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: t.bg, letterSpacing: 0.5 }}>Sign Up / Log In</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Account section (logged-in users) */}
            {user && (
              <View style={{ marginHorizontal: 20 }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: t.textSec, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Account</Text>
                <View style={{ backgroundColor: t.card, borderWidth: 1, borderColor: t.border, borderRadius: 4, overflow: 'hidden' }}>
                  {/* Email row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.separator }}>
                    <Text style={{ fontSize: 13, color: t.textSec, width: 80 }}>Signed in as</Text>
                    <Text style={{ fontSize: 13, color: t.text, flex: 1 }} numberOfLines={1}>{user.email}</Text>
                  </View>

                  {/* Biometric toggle (only if hardware available) */}
                  {bioAvailable && (
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.separator }}
                      onPress={toggleBiometric}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: t.text }}>Face ID / Biometrics</Text>
                        <Text style={{ fontSize: 11, color: t.textSec, marginTop: 2 }}>Unlock app without password</Text>
                      </View>
                      <Switch
                        value={bioEnabled}
                        onValueChange={toggleBiometric}
                        trackColor={{ false: t.border, true: '#F07A00' }}
                        thumbColor={Platform.OS === 'android' ? (bioEnabled ? '#F07A00' : t.textSec) : undefined}
                      />
                    </TouchableOpacity>
                  )}

                  {/* Sign out */}
                  <TouchableOpacity
                    style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.separator }}
                    onPress={handleSignOut}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 13, color: '#C0392B', fontWeight: '600' }}>Sign Out</Text>
                  </TouchableOpacity>

                  {/* Delete account */}
                  <TouchableOpacity
                    style={{ paddingHorizontal: 16, paddingVertical: 14 }}
                    onPress={() => {
                      Alert.alert(
                        'Delete Account',
                        'This will permanently delete your account and all saved cards. This cannot be undone.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete Account',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                const freshToken = await refreshUserToken(user);
                                await firebaseDeleteAccount(freshToken || user.idToken);
                              } catch {}
                              await clearSession();
                              signOut();
                            },
                          },
                        ]
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 13, color: '#888888' }}>Delete Account</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* App version */}
            <Text style={{ textAlign: 'center', fontSize: 11, color: t.textMuted, marginTop: 16, letterSpacing: 0.3 }}>
              Rewards Easily v1.3.0
            </Text>
          </View>
        )}
      />
      </>
      )}
    </SafeAreaView>
  );
}

// ─── DISCOVER SCREEN ──────────────────────────────────────────────────────────

const DISCOVER_PREFS_KEY = '@rewardseasily_discover_prefs';

// Cards that earn points/miles (vs cashback)
const POINTS_CARD_IDS = new Set([
  'chase_sapphire_preferred', 'chase_sapphire_reserve', 'chase_ink_preferred',
  'amex_gold', 'amex_platinum', 'amex_green',
  'amex_delta_blue', 'amex_delta_gold',
  'amex_hilton_honors', 'amex_hilton_honors_surpass', 'amex_hilton_honors_aspire',
  'amex_marriott_bonvoy_bevy', 'amex_marriott_bonvoy_brilliant',
  'citi_strata_premier', 'citi_strata_elite',
  'capital_one_venture', 'capital_one_venture_one', 'capital_one_venture_x',
]);

// Cards that charge a foreign transaction fee (~3%)
const FTF_CARD_IDS = new Set([
  'chase_freedom_unlimited', 'chase_freedom_flex',
  'amex_blue_cash_preferred', 'amex_blue_cash_everyday',
  'citi_custom_cash',
]);

const QUIZ_STEPS = [
  {
    id: 'categories',
    question: 'Where do you spend the most?',
    subtitle: 'Pick up to 3 categories — your top pick matters most.',
    type: 'multi',
    max: 3,
    options: [
      { id: 'dining',    label: 'Dining',          icon: '🍽️' },
      { id: 'groceries', label: 'Groceries',        icon: '🛒' },
      { id: 'gas',       label: 'Gas',              icon: '⛽' },
      { id: 'travel',    label: 'Travel',           icon: '✈️' },
      { id: 'online',    label: 'Online Shopping',  icon: '🛍️' },
      { id: 'other',     label: 'Everything Else',  icon: '💳' },
    ],
  },
  {
    id: 'fee',
    question: 'Annual fee preference?',
    subtitle: 'Higher fees often come with bigger rewards.',
    type: 'single',
    options: [
      { id: 'none', label: 'No annual fee',   sub: 'Free cards only' },
      { id: 'low',  label: 'Up to $95/yr',    sub: 'Most popular range' },
      { id: 'mid',  label: 'Up to $250/yr',   sub: 'Premium perks' },
      { id: 'any',  label: 'No limit',        sub: 'Maximum rewards' },
    ],
  },
  {
    id: 'type',
    question: 'Cashback or points?',
    subtitle: 'Choose what works best for your lifestyle.',
    type: 'single',
    options: [
      { id: 'cashback', label: 'Cashback',       sub: 'Simple, direct cash rewards' },
      { id: 'points',   label: 'Points & Miles', sub: 'Great for travel redemptions' },
      { id: 'either',   label: 'No preference',  sub: 'Show me the best overall' },
    ],
  },
  {
    id: 'travel',
    question: 'Do you travel internationally?',
    subtitle: 'Helps us flag cards with foreign transaction fees.',
    type: 'single',
    options: [
      { id: 'often',     label: 'Often',            sub: 'Multiple trips a year' },
      { id: 'sometimes', label: 'Sometimes',        sub: 'Once a year or so' },
      { id: 'rarely',    label: 'Rarely or never',  sub: 'Mostly domestic' },
    ],
  },
];

function scoreCards(allCards, savedIds, answers) {
  const maxFee     = { none: 0, low: 95, mid: 250, any: 99999 }[answers.fee] ?? 99999;
  const categories = answers.categories || [];

  return allCards
    .filter(card => !savedIds.includes(card.id))
    .filter(card => (card.annualFee || 0) <= maxFee)
    .map(card => {
      // Weighted reward score — first pick matters most
      let score = 0;
      categories.forEach((catId, idx) => {
        const weight = 1 / (idx + 1);
        score += (card.rewards?.[catId] || 0) * weight;
      });

      // Reward type bonus
      const isPoints = POINTS_CARD_IDS.has(card.id);
      if (answers.type === 'points'   && isPoints)  score *= 1.2;
      if (answers.type === 'cashback' && !isPoints) score *= 1.2;

      // FTF penalty for international travelers
      if (FTF_CARD_IDS.has(card.id)) {
        if (answers.travel === 'often')     score *= 0.6;
        if (answers.travel === 'sometimes') score *= 0.82;
      }

      // Build reason line
      const topCat   = categories[0];
      const topRate  = topCat ? (card.rewards?.[topCat] || 0) : 0;
      const catLabel = CATEGORIES.find(c => c.id === topCat)?.label || '';
      let reason     = topRate > 0 ? `${topRate.toFixed(1)}% on ${catLabel}` : 'Strong everyday card';
      if (card.annualFee === 0) reason += ' · No annual fee';
      else reason += ` · $${card.annualFee}/yr`;
      if (!FTF_CARD_IDS.has(card.id) && answers.travel !== 'rarely') reason += ' · No foreign fee';

      return { card, score, reason };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

function DiscoverScreen() {
  const { user } = useAuth();
  const t = useTheme();
  const [step, setStep]       = useState(0); // 0=landing, 1-4=quiz, 5=results
  const [answers, setAnswers] = useState({});
  const [allCards, setAllCards] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [adding, setAdding]     = useState(null);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    Promise.all([fetchCardsFromFirestore(), getUserCardIds(user)]).then(([cards, ids]) => {
      setAllCards(cards);
      setSavedIds(ids);
      setLoading(false);
    });
    AsyncStorage.getItem(DISCOVER_PREFS_KEY).then(json => {
      if (json) { setAnswers(JSON.parse(json)); setStep(5); }
    });
  }, [user]));

  const qStep = QUIZ_STEPS[step - 1];

  const handleAnswer = (stepId, val) => setAnswers(prev => ({ ...prev, [stepId]: val }));

  const handleMultiToggle = (stepId, optId, max) => {
    setAnswers(prev => {
      const cur  = prev[stepId] || [];
      const next = cur.includes(optId)
        ? cur.filter(id => id !== optId)
        : cur.length < max ? [...cur, optId] : cur;
      return { ...prev, [stepId]: next };
    });
  };

  const canProceed = () => {
    if (!qStep) return false;
    const val = answers[qStep.id];
    return qStep.type === 'multi' ? (val && val.length > 0) : !!val;
  };

  const goNext = async () => {
    if (step < QUIZ_STEPS.length) { setStep(s => s + 1); return; }
    await AsyncStorage.setItem(DISCOVER_PREFS_KEY, JSON.stringify(answers));
    setStep(5);
  };

  const retakeQuiz = async () => {
    setAnswers({});
    await AsyncStorage.removeItem(DISCOVER_PREFS_KEY);
    setStep(1);
  };

  const addCard = async (cardId) => {
    setAdding(cardId);
    const next = await toggleCardId(user, savedIds, cardId);
    setSavedIds(next);
    setAdding(null);
  };

  // ── Landing ──────────────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover</Text>
          <Text style={styles.headerSubtitle}>Find cards matched to your spending</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 20 }}>✦</Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: t.text, textAlign: 'center', marginBottom: 12, letterSpacing: -0.3 }}>
            Find your perfect card
          </Text>
          <Text style={{ fontSize: 15, color: t.textSec, textAlign: 'center', lineHeight: 22, marginBottom: 40 }}>
            Answer 4 quick questions and we'll match you with the best cards for your spending habits — cards you don't already own.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#F07A00', paddingHorizontal: 36, paddingVertical: 16, borderRadius: 10 }}
            onPress={() => setStep(1)}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111111' }}>Get Started →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────────
  if (step === 5) {
    const results = loading ? [] : scoreCards(allCards, savedIds, answers);
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
        <View style={[styles.header, { flexDirection: 'row', alignItems: 'center' }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Your Matches</Text>
            <Text style={styles.headerSubtitle}>Based on your spending profile</Text>
          </View>
          <TouchableOpacity onPress={retakeQuiz} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ fontSize: 12, color: '#F07A00', fontWeight: '600' }}>Retake quiz →</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#F07A00" />
          </View>
        ) : results.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
            <Text style={{ fontSize: 36, marginBottom: 16 }}>🎯</Text>
            <Text style={{ fontSize: 19, fontWeight: '700', color: t.text, textAlign: 'center', marginBottom: 8 }}>
              All top cards are already in your wallet!
            </Text>
            <Text style={{ fontSize: 14, color: t.textSec, textAlign: 'center', lineHeight: 20 }}>
              Try relaxing the annual fee filter to see more options.
            </Text>
            <TouchableOpacity
              style={{ marginTop: 24, backgroundColor: '#F07A00', paddingHorizontal: 28, paddingVertical: 13, borderRadius: 10 }}
              onPress={retakeQuiz}
            >
              <Text style={{ color: '#111111', fontSize: 15, fontWeight: '700' }}>Retake Quiz</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => item.card.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item, index }) => {
              const { card, reason } = item;
              const isAdded   = savedIds.includes(card.id);
              const isAdding  = adding === card.id;
              return (
                <View style={[styles.resultCard, { backgroundColor: t.card, borderColor: index === 0 ? '#F07A00' : t.border, borderWidth: index === 0 ? 1.5 : 1 }]}>
                  {index === 0 && (
                    <View style={{ position: 'absolute', top: -9, left: 16, backgroundColor: '#F07A00', borderRadius: 2, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: '#111111', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>Best Match</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{ width: 3, height: 36, backgroundColor: card.color, marginRight: 14, borderRadius: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }}>{card.name}</Text>
                      <Text style={{ fontSize: 12, color: t.textSec, marginTop: 2 }}>{card.issuer}</Text>
                      <Text style={{ fontSize: 11, color: '#F07A00', marginTop: 4 }}>{reason}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[{ borderWidth: 1.5, borderColor: '#F07A00', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 8 }, isAdded && { backgroundColor: '#F07A00' }]}
                    onPress={() => addCard(card.id)}
                    disabled={isAdding}
                    activeOpacity={0.7}
                  >
                    {isAdding
                      ? <ActivityIndicator size="small" color={isAdded ? '#111111' : '#F07A00'} />
                      : <Text style={{ fontSize: 12, fontWeight: '700', color: isAdded ? '#111111' : '#F07A00' }}>{isAdded ? '✓ Added' : '+ Add'}</Text>
                    }
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )}
      </SafeAreaView>
    );
  }

  // ── Quiz steps ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
      {/* Header with back + progress bar */}
      <View style={[styles.header, { paddingBottom: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <TouchableOpacity
            onPress={() => setStep(s => Math.max(0, s - 1))}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ fontSize: 17, color: t.text, fontWeight: '300', marginRight: 16 }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 11, color: t.textSec, textTransform: 'uppercase', letterSpacing: 1 }}>
            Step {step} of {QUIZ_STEPS.length}
          </Text>
        </View>
        <View style={{ height: 3, backgroundColor: t.border, borderRadius: 2 }}>
          <View style={{ height: 3, width: `${(step / QUIZ_STEPS.length) * 100}%`, backgroundColor: '#F07A00', borderRadius: 2 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: t.text, marginBottom: 6, letterSpacing: -0.3 }}>
          {qStep.question}
        </Text>
        <Text style={{ fontSize: 14, color: t.textSec, marginBottom: 28 }}>{qStep.subtitle}</Text>

        {qStep.options.map(opt => {
          const val        = answers[qStep.id];
          const isSelected = qStep.type === 'multi'
            ? (val || []).includes(opt.id)
            : val === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: isSelected ? '#F07A0012' : t.card,
                borderWidth: 1.5,
                borderColor: isSelected ? '#F07A00' : t.border,
                borderRadius: 10, padding: 16, marginBottom: 10,
              }}
              onPress={() => {
                if (qStep.type === 'multi') handleMultiToggle(qStep.id, opt.id, qStep.max);
                else handleAnswer(qStep.id, opt.id);
              }}
              activeOpacity={0.7}
            >
              {opt.icon && <Text style={{ fontSize: 22, marginRight: 14 }}>{opt.icon}</Text>}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: isSelected ? '#F07A00' : t.text }}>{opt.label}</Text>
                {opt.sub && <Text style={{ fontSize: 12, color: t.textSec, marginTop: 2 }}>{opt.sub}</Text>}
              </View>
              <View style={{
                width: 20, height: 20,
                borderRadius: qStep.type === 'multi' ? 4 : 10,
                borderWidth: 1.5,
                borderColor: isSelected ? '#F07A00' : t.border,
                backgroundColor: isSelected ? '#F07A00' : 'transparent',
                justifyContent: 'center', alignItems: 'center',
              }}>
                {isSelected && <Text style={{ fontSize: 11, color: '#111111', fontWeight: '700' }}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sticky Next button */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 24, paddingTop: 12, backgroundColor: t.bg }}>
        <TouchableOpacity
          style={{ backgroundColor: canProceed() ? '#F07A00' : t.border, borderRadius: 10, paddingVertical: 16, alignItems: 'center' }}
          onPress={goNext}
          disabled={!canProceed()}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: canProceed() ? '#111111' : t.textMuted }}>
            {step === QUIZ_STEPS.length ? 'See My Matches →' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

function HomeStackNav() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Results" component={ResultsScreen} />
    </HomeStack.Navigator>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [user, setUser]           = useState(null);    // null = not logged in
  const [isGuest, setIsGuest]       = useState(false);   // true = chose guest mode
  const [authLoading, setAuthLoading] = useState(true); // startup check in progress
  const [savedUser, setSavedUser]   = useState(null);   // persisted session for Face ID retry

  // On mount: restore saved session + show splash for at least 1800ms
  useEffect(() => {
    (async () => {
      const [saved] = await Promise.all([
        loadSavedSession(),
        new Promise(resolve => setTimeout(resolve, 1800)),
      ]);
      if (saved) {
        const bioOn = await isBiometricEnabled();
        if (bioOn) {
          setSavedUser(saved); // keep for retry on AuthScreen
          const passed = await authenticateWithBiometric();
          if (passed) setUser(saved);
          // if failed, AuthScreen will show with Face ID retry button
        } else {
          setUser(saved);
        }
      }
      setAuthLoading(false);
    })();
  }, []);

  const handleAuth = (newUser) => setUser(newUser);
  const handleGuest = () => setIsGuest(true);
  const signOut = async () => {
    await clearSession();
    setUser(null);
    setIsGuest(false);
  };

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#111111', justifyContent: 'center', alignItems: 'center' }}>

        {/* Card mark */}
        <View style={{ width: 72, height: 53, marginBottom: 28 }}>
          {/* Back card peeking behind */}
          <View style={{ position: 'absolute', top: 0, left: 12, width: 72, height: 45, borderRadius: 5, borderWidth: 0.75, borderColor: '#252525' }} />
          {/* Front card */}
          <View style={{ position: 'absolute', top: 8, left: 0, width: 72, height: 45, borderRadius: 5, borderWidth: 0.75, borderColor: '#F07A00', backgroundColor: '#1C1C1C', overflow: 'hidden' }}>
            {/* Chip */}
            <View style={{ position: 'absolute', left: 12, top: 13, width: 16, height: 12, borderRadius: 2, borderWidth: 0.75, borderColor: '#F07A00' }} />
            {/* Chip cross lines */}
            <View style={{ position: 'absolute', left: 20, top: 13, width: 0.5, height: 12, backgroundColor: '#F07A00', opacity: 0.5 }} />
            <View style={{ position: 'absolute', left: 12, top: 19, width: 16, height: 0.5, backgroundColor: '#F07A00', opacity: 0.5 }} />
            {/* Stripe */}
            <View style={{ position: 'absolute', bottom: 8, left: 5, right: 5, height: 5, backgroundColor: '#F07A00', opacity: 0.28 }} />
          </View>
        </View>

        {/* Top gold line */}
        <View style={{ width: 140, height: 0.75, backgroundColor: '#F07A00', opacity: 0.55, marginBottom: 18 }} />

        {/* Wordmark */}
        <Text style={{ fontSize: 20, fontWeight: '300', color: '#FFFFFF', letterSpacing: 5, textTransform: 'uppercase', marginBottom: 8 }}>Rewards</Text>
        <Text style={{ fontSize: 10, color: '#F07A00', letterSpacing: 7, textTransform: 'uppercase', marginBottom: 0 }}>Easily</Text>

        {/* Bottom gold line */}
        <View style={{ width: 140, height: 0.5, backgroundColor: '#F07A00', opacity: 0.25, marginTop: 12, marginBottom: 16 }} />

        {/* Tagline */}
        <Text style={{ fontSize: 12, color: '#444444', letterSpacing: 0.3, textAlign: 'center', marginBottom: 28, paddingHorizontal: 40 }}>Find the best card to maximize rewards for every purchase</Text>

        {/* Loading dots */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#F07A00', opacity: 0.85 }} />
          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#F07A00', opacity: 0.3 }} />
          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#F07A00', opacity: 0.3 }} />
        </View>

      </View>
    );
  }

  // Show auth screen if not logged in and not in guest mode
  if (!user && !isGuest) {
    return <AuthScreen onAuth={handleAuth} onGuest={handleGuest} savedUser={savedUser} />;
  }

  return (
    <AuthContext.Provider value={{ user, signOut }}>
      <NavigationContainer>
        <StatusBar style="light" />
        <Tab.Navigator
          tabBar={(props) => (
            <View style={{ backgroundColor: isDark ? '#111111' : '#FFFFFF' }}>
              <PromoBanner />
              <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: isDark ? '#2A2A2A' : '#E8E4DC', height: 60 }}>
                {props.state.routes.map((route, i) => {
                  const focused = props.state.index === i;
                  const icons = { Spend: focused ? '◈' : '◇', Discover: focused ? '✦' : '✧', MyCards: focused ? '▪' : '▫' };
                  const labels = { Spend: 'Categories', Discover: 'Discover', MyCards: 'My Cards' };
                  const color = focused ? (isDark ? '#F0F0F0' : '#111111') : (isDark ? '#444444' : '#BBBBBB');
                  return (
                    <TouchableOpacity
                      key={route.key}
                      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 2 }}
                      onPress={() => props.navigation.navigate(route.name)}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 16, color }}>{icons[route.name]}</Text>
                      <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', color }}>{labels[route.name]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
          screenOptions={{ headerShown: false }}
        >
          <Tab.Screen name="Spend" component={HomeStackNav} options={{ tabBarLabel: 'Categories' }} />
          <Tab.Screen name="Discover" component={DiscoverScreen} options={{ tabBarLabel: 'Discover' }} />
          <Tab.Screen name="MyCards" component={MyCardsScreen} options={{ tabBarLabel: 'My Cards' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}

// ─── PROMO BANNER ────────────────────────────────────────────────────────────
// Rotating financial card promotions shown as a sponsored banner.
// Replace with Google AdMob (react-native-google-mobile-ads) after EAS Build.

const PROMO_ADS = [
  {
    issuer: 'Chase',
    card: 'Sapphire Preferred®',
    headline: 'Earn 60,000 bonus points',
    sub: 'After $4K spend in first 3 months',
    color: '#1A3C5E',
    url: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred',
  },
  {
    issuer: 'American Express',
    card: 'Gold Card',
    headline: '4X points at restaurants & U.S. supermarkets',
    sub: 'Terms apply. See rates & fees.',
    color: '#F07A00',
    url: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
  },
  {
    issuer: 'Capital One',
    card: 'Venture X',
    headline: 'Earn 75,000 miles — worth $750 in travel',
    sub: 'After $4K spend in first 3 months',
    color: '#CC0000',
    url: 'https://creditcards.capitalone.com/venture-x-credit-card/',
  },
  {
    issuer: 'Citi',
    card: 'Strata Premier℠',
    headline: '75,000 bonus ThankYou® Points',
    sub: 'After $4K spend in first 3 months',
    color: '#003B70',
    url: 'https://www.citi.com/credit-cards/citi-strata-premier-credit-card',
  },
  {
    issuer: 'Wells Fargo',
    card: 'Autograph Journey℠',
    headline: 'Earn 60,000 bonus points',
    sub: 'After $4K spend in first 3 months',
    color: '#CD1409',
    url: 'https://creditcards.wellsfargo.com/autograph-journey-visa-credit-card/',
  },
];

function PromoBanner() {
  const t = useTheme();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(i => (i + 1) % PROMO_ADS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const ad = PROMO_ADS[index];

  return (
    <TouchableOpacity
      onPress={() => Linking.openURL(ad.url).catch(() => {})}
      activeOpacity={0.85}
      style={{
        backgroundColor: t.card,
        borderTopWidth: 1,
        borderTopColor: t.border,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Color bar */}
      <View style={{ width: 4, height: 40, borderRadius: 2, backgroundColor: ad.color }} />

      {/* Text */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <View style={{ backgroundColor: t.border, borderRadius: 2, paddingHorizontal: 5, paddingVertical: 1 }}>
            <Text style={{ fontSize: 8, color: t.textMuted, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' }}>Sponsored</Text>
          </View>
          <Text style={{ fontSize: 10, color: t.textMuted }}>{ad.issuer} · {ad.card}</Text>
        </View>
        <Text style={{ fontSize: 13, fontWeight: '700', color: t.text, letterSpacing: 0.1 }} numberOfLines={1}>{ad.headline}</Text>
        <Text style={{ fontSize: 10, color: t.textSec, marginTop: 1 }} numberOfLines={1}>{ad.sub}</Text>
      </View>

      {/* CTA */}
      <View style={{ backgroundColor: ad.color, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>Apply</Text>
      </View>

      {/* Dots */}
      <View style={{ position: 'absolute', bottom: 4, right: 16, flexDirection: 'row', gap: 3 }}>
        {PROMO_ADS.map((_, i) => (
          <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: i === index ? ad.color : t.border }} />
        ))}
      </View>
    </TouchableOpacity>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F6F2' },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20, backgroundColor: '#111111' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 13, color: '#888888', marginTop: 5, letterSpacing: 0.2 },
  categoryCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 4, paddingVertical: 12, paddingHorizontal: 16,
    borderWidth: 1, borderColor: '#E8E4DC',
  },
  categoryLabel: { fontSize: 15, fontWeight: '600', color: '#111111', letterSpacing: 0.1 },
  categoryDesc: { fontSize: 12, color: '#999999', marginTop: 2 },
  resultCard: {
    backgroundColor: '#FFFFFF', borderRadius: 4, padding: 18,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#E8E4DC',
  },
});
