import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, SectionList, TouchableOpacity,
  TextInput, StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import firebase from 'firebase/app';
import 'firebase/firestore';

// ─── FIREBASE CONFIG ──────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyAEYlNXZOtKLPHL8hMeFxf2ZfZ7n4gUPFE",
  authDomain: "rewardseasily-d2c36.firebaseapp.com",
  projectId: "rewardseasily-d2c36",
  storageBucket: "rewardseasily-d2c36.firebasestorage.app",
  messagingSenderId: "241513394398",
  appId: "1:241513394398:web:dce6620043b23f8c30924f",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// ─── SEED DATA (used to populate Firestore on first run) ─────────────────────

const SEED_CARDS = [
  {
    id: 'chase_sapphire_preferred', name: 'Sapphire Preferred', issuer: 'Chase',
    network: 'Visa', color: '#1A3C5E', annualFee: 95,
    rewards: { dining: 4.5, groceries: 1.5, gas: 1.5, travel: 4.5, online: 1.5, other: 1.5 },
    notes: '3x on dining & travel. Points worth 1.5¢ via Chase travel portal.',
  },
  {
    id: 'chase_sapphire_reserve', name: 'Sapphire Reserve', issuer: 'Chase',
    network: 'Visa', color: '#1A3C5E', annualFee: 550,
    rewards: { dining: 7.5, groceries: 1.5, gas: 1.5, travel: 7.5, online: 1.5, other: 1.5 },
    notes: '3x on dining & travel. $300 travel credit. Points worth 1.5¢ via portal.',
  },
  {
    id: 'chase_freedom_unlimited', name: 'Freedom Unlimited', issuer: 'Chase',
    network: 'Visa', color: '#2D6A4F', annualFee: 0,
    rewards: { dining: 4.5, groceries: 1.5, gas: 1.5, travel: 4.5, online: 1.5, other: 2.25 },
    notes: 'No annual fee. 3% on dining, 1.5% on everything else.',
  },
  {
    id: 'chase_freedom_flex', name: 'Freedom Flex', issuer: 'Chase',
    network: 'Mastercard', color: '#2D6A4F', annualFee: 0,
    rewards: { dining: 4.5, groceries: 1.5, gas: 1.5, travel: 1.5, online: 1.5, other: 1.5 },
    notes: 'No annual fee. 3% on dining. 5% rotating quarterly categories.',
  },
  {
    id: 'amex_gold', name: 'Gold Card', issuer: 'American Express',
    network: 'Amex', color: '#C9A84C', annualFee: 250,
    rewards: { dining: 6.0, groceries: 6.0, gas: 1.5, travel: 4.5, online: 1.5, other: 1.5 },
    notes: '4x on dining & US supermarkets, 3x on flights. $120 dining + $120 Uber Cash credits.',
  },
  {
    id: 'amex_platinum', name: 'Platinum Card', issuer: 'American Express',
    network: 'Amex', color: '#808080', annualFee: 695,
    rewards: { dining: 1.5, groceries: 1.5, gas: 1.5, travel: 7.5, online: 1.5, other: 1.5 },
    notes: '5x on flights & prepaid hotels via Amex Travel. Loaded with travel perks.',
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
    rewards: { dining: 2.0, groceries: 2.0, gas: 2.0, travel: 2.0, online: 2.0, other: 2.0 },
    notes: '2% on everything. No annual fee.',
  },
  {
    id: 'citi_custom_cash', name: 'Custom Cash', issuer: 'Citi',
    network: 'Mastercard', color: '#003B70', annualFee: 0,
    rewards: { dining: 5.0, groceries: 5.0, gas: 5.0, travel: 5.0, online: 5.0, other: 1.0 },
    notes: '5% on your top spend category each billing cycle (up to $500/mo).',
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
    rewards: { dining: 3.0, groceries: 3.0, gas: 1.0, travel: 1.0, online: 3.0, other: 1.0 },
    notes: 'No annual fee. 3% on dining, groceries, entertainment & streaming.',
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
];

const CATEGORIES = [
  { id: 'dining',    label: 'Dining',         icon: '🍽️',  description: 'Restaurants, cafes, takeout' },
  { id: 'groceries', label: 'Groceries',       icon: '🛒',  description: 'Supermarkets & grocery stores' },
  { id: 'gas',       label: 'Gas',             icon: '⛽',  description: 'Gas stations' },
  { id: 'travel',    label: 'Travel',          icon: '✈️',  description: 'Flights, hotels, rideshare' },
  { id: 'online',    label: 'Online Shopping', icon: '🛍️', description: 'Amazon & general e-commerce' },
  { id: 'other',     label: 'Everything Else', icon: '💳',  description: 'All other purchases' },
];

// ─── FIRESTORE HELPERS ────────────────────────────────────────────────────────

async function fetchCardsFromFirestore() {
  const snapshot = await db.collection('cards').get();
  if (snapshot.empty) {
    // First run — seed the database
    for (const card of SEED_CARDS) {
      await db.collection('cards').doc(card.id).set(card);
    }
    return SEED_CARDS;
  }
  return snapshot.docs.map(d => d.data());
}

// ─── LOCAL STORAGE (for saved card IDs) ──────────────────────────────────────

const STORAGE_KEY = '@rewardseasily_my_cards';

async function getSavedCardIds() {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

async function saveCardId(cardId) {
  const current = await getSavedCardIds();
  if (!current.includes(cardId)) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...current, cardId]));
  }
}

async function removeCardId(cardId) {
  const current = await getSavedCardIds();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current.filter(id => id !== cardId)));
}

// ─── HOME SCREEN ─────────────────────────────────────────────────────────────

function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RewardsEasily</Text>
        <Text style={styles.headerSubtitle}>What are you buying today?</Text>
      </View>
      <FlatList
        data={CATEGORIES}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.categoryCard}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Results', { category: item })}
          >
            <Text style={{ fontSize: 30, width: 44, textAlign: 'center' }}>{item.icon}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.categoryLabel}>{item.label}</Text>
              <Text style={styles.categoryDesc}>{item.description}</Text>
            </View>
            <Text style={{ fontSize: 24, color: '#CCC' }}>›</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

// ─── RESULTS SCREEN ───────────────────────────────────────────────────────────

function ResultsScreen({ route, navigation }) {
  const { category } = route.params;
  const [amount, setAmount] = useState('');
  const [savedIds, setSavedIds] = useState([]);
  const [allCards, setAllCards] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useFocusEffect(useCallback(() => {
    Promise.all([getSavedCardIds(), fetchCardsFromFirestore()]).then(([ids, cards]) => {
      setSavedIds(ids);
      setAllCards(cards);
      setHasLoaded(true);
    });
  }, []));

  const savedCards = allCards.filter(c => savedIds.includes(c.id));
  const ranked = [...savedCards].sort((a, b) => (b.rewards[category.id] || 0) - (a.rewards[category.id] || 0));
  const bestRate = ranked.length > 0 ? ranked[0].rewards[category.id] : 0;
  const dollarAmount = parseFloat(amount) || 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
        <Text style={{ fontSize: 26 }}>{category.icon}</Text>
        <Text style={styles.headerTitle}>{category.label}</Text>
      </View>

      <View style={{ backgroundColor: '#FFF', padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEE' }}>
        <Text style={{ fontSize: 12, color: '#888', marginBottom: 6, textTransform: 'uppercase' }}>
          Purchase amount (optional)
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#D0D8E4', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
          <Text style={{ fontSize: 18, color: '#555', marginRight: 4 }}>$</Text>
          <TextInput
            style={{ fontSize: 18, flex: 1, color: '#1A1A1A' }}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#AAA"
          />
        </View>
      </View>

      {!hasLoaded ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1A3C5E" />
          <Text style={{ marginTop: 12, color: '#888' }}>Loading latest rates...</Text>
        </View>
      ) : savedCards.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>💳</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 }}>No cards added yet</Text>
          <Text style={{ fontSize: 15, color: '#888', textAlign: 'center' }}>Go to My Cards tab to add your cards.</Text>
          <TouchableOpacity
            style={{ marginTop: 24, backgroundColor: '#1A3C5E', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
            onPress={() => navigation.navigate('MyCards')}
          >
            <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>Add My Cards →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={{ fontSize: 13, color: '#888', textTransform: 'uppercase', margin: 16, marginBottom: 8 }}>
            {ranked.length} card{ranked.length !== 1 ? 's' : ''} ranked
          </Text>
          <FlatList
            data={ranked}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item, index }) => {
              const rate = item.rewards[category.id] || 0;
              const isBest = index === 0;
              const est = dollarAmount > 0 ? ((rate / 100) * dollarAmount).toFixed(2) : null;
              const missed = dollarAmount > 0 && !isBest ? (((bestRate - rate) / 100) * dollarAmount).toFixed(2) : null;
              return (
                <View style={[styles.resultCard, isBest && { borderWidth: 2, borderColor: '#1A3C5E' }]}>
                  {isBest && (
                    <View style={{ position: 'absolute', top: -10, left: 14, backgroundColor: '#1A3C5E', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>⭐ Best Pick</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: item.color, marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>{item.name}</Text>
                      <Text style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{item.issuer}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#1A3C5E' }}>{rate.toFixed(1)}%</Text>
                    {est && <Text style={{ fontSize: 13, color: '#2D6A4F', fontWeight: '600', marginTop: 2 }}>~${est} back</Text>}
                    {missed && <Text style={{ fontSize: 12, color: '#E74C3C', marginTop: 2 }}>−${missed} vs best</Text>}
                  </View>
                </View>
              );
            }}
          />
          {ranked[0] && (
            <View style={{ backgroundColor: '#EEF4FB', padding: 14, margin: 16, borderRadius: 10 }}>
              <Text style={{ fontSize: 13, color: '#4A6A8A', lineHeight: 20 }}>💡 {ranked[0].notes}</Text>
            </View>
          )}
        </>
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
  const [savedIds, setSavedIds] = useState([]);
  const [allCards, setAllCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    Promise.all([getSavedCardIds(), fetchCardsFromFirestore()]).then(([ids, cards]) => {
      setSavedIds(ids);
      setAllCards(cards);
      setLoading(false);
    });
  }, []));

  const toggleCard = async (cardId) => {
    if (savedIds.includes(cardId)) {
      await removeCardId(cardId);
      setSavedIds(prev => prev.filter(id => id !== cardId));
    } else {
      await saveCardId(cardId);
      setSavedIds(prev => [...prev, cardId]);
    }
  };

  const myCards = allCards.filter(c => savedIds.includes(c.id));
  const sections = groupByIssuer(allCards);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cards</Text>
        <Text style={styles.headerSubtitle}>Tap to add or remove cards from your wallet</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1A3C5E" />
          <Text style={{ marginTop: 12, color: '#888' }}>Loading cards...</Text>
        </View>
      ) : (
        <>
          {myCards.length > 0 && (
            <View style={{ backgroundColor: '#FFF', padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEE' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 }}>
                💳 Your wallet ({myCards.length} card{myCards.length !== 1 ? 's' : ''})
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {myCards.map(card => (
                  <TouchableOpacity
                    key={card.id}
                    style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: card.color, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 5 }}
                    onPress={() => toggleCard(card.id)}
                  >
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: card.color }} />
                    <Text style={{ fontSize: 13, color: '#333' }}>{card.name}</Text>
                    <Text style={{ fontSize: 11, color: '#AAA' }}>✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <SectionList
            sections={sections}
            keyExtractor={item => item.id}
            stickySectionHeadersEnabled={false}
            renderSectionHeader={({ section }) => (
              <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, backgroundColor: '#F5F7FA' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#555', textTransform: 'uppercase' }}>{section.title}</Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#F0F0F0', marginLeft: 60 }} />}
            renderItem={({ item }) => {
              const isAdded = savedIds.includes(item.id);
              return (
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 14, paddingHorizontal: 16 }}
                  activeOpacity={0.7}
                  onPress={() => toggleCard(item.id)}
                >
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: item.color, marginRight: 14 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A' }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                      {item.issuer} · {item.network}{item.annualFee > 0 ? ` · $${item.annualFee}/yr` : ' · No annual fee'}
                    </Text>
                  </View>
                  <View style={[{ borderWidth: 1.5, borderColor: '#1A3C5E', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 }, isAdded && { backgroundColor: '#1A3C5E' }]}>
                    <Text style={[{ fontSize: 13, fontWeight: '600', color: '#1A3C5E' }, isAdded && { color: '#FFF' }]}>
                      {isAdded ? '✓ Added' : '+ Add'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </>
      )}
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
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#1A3C5E',
          tabBarInactiveTintColor: '#AAA',
          tabBarStyle: { backgroundColor: '#FFF', borderTopColor: '#E8ECF0', height: 60 },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
          tabBarIcon: ({ focused }) => {
            const icons = { Spend: focused ? '🛒' : '🛍️', MyCards: '💳' };
            return <Text style={{ fontSize: 22 }}>{icons[route.name]}</Text>;
          },
        })}
      >
        <Tab.Screen name="Spend" component={HomeStackNav} options={{ tabBarLabel: 'Best Card' }} />
        <Tab.Screen name="MyCards" component={MyCardsScreen} options={{ tabBarLabel: 'My Cards' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, backgroundColor: '#1A3C5E' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: '#A8C4DF', marginTop: 4 },
  categoryCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 14, paddingVertical: 18, paddingHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  categoryLabel: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  categoryDesc: { fontSize: 13, color: '#888', marginTop: 2 },
  resultCard: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
});
