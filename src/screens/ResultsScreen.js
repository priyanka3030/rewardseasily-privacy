import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ALL_CARDS } from '../data/cards';
import { getSavedCardIds } from '../storage/cardStorage';

export default function ResultsScreen({ route, navigation }) {
  const { category } = route.params;
  const [amount, setAmount] = useState('');
  const [savedIds, setSavedIds] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Reload saved cards each time screen is focused (in case user adds/removes cards)
  useFocusEffect(
    useCallback(() => {
      getSavedCardIds().then((ids) => {
        setSavedIds(ids);
        setHasLoaded(true);
      });
    }, [])
  );

  const savedCards = ALL_CARDS.filter((c) => savedIds.includes(c.id));

  const rankedCards = [...savedCards].sort(
    (a, b) =>
      (b.rewards[category.id] || 0) - (a.rewards[category.id] || 0)
  );

  const bestRate = rankedCards.length > 0 ? rankedCards[0].rewards[category.id] : 0;

  const dollarAmount = parseFloat(amount) || 0;

  const renderCard = ({ item, index }) => {
    const rate = item.rewards[category.id] || 0;
    const isBest = index === 0;
    const estimatedReward = dollarAmount > 0 ? ((rate / 100) * dollarAmount).toFixed(2) : null;
    const missedVsBest =
      dollarAmount > 0 && !isBest
        ? (((bestRate - rate) / 100) * dollarAmount).toFixed(2)
        : null;

    return (
      <View style={[styles.resultCard, isBest && styles.bestCard]}>
        {isBest && (
          <View style={styles.bestBadge}>
            <Text style={styles.bestBadgeText}>⭐ Best Pick</Text>
          </View>
        )}
        <View style={styles.cardLeft}>
          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardIssuer}>{item.issuer}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.rateText}>{rate.toFixed(1)}%</Text>
          {estimatedReward && (
            <Text style={styles.estimatedReward}>
              ~${estimatedReward} back
            </Text>
          )}
          {missedVsBest && (
            <Text style={styles.missed}>−${missedVsBest} vs best</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Category header */}
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryIcon}>{category.icon}</Text>
        <Text style={styles.categoryLabel}>{category.label}</Text>
      </View>

      {/* Optional amount input */}
      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>Purchase amount (optional)</Text>
        <View style={styles.amountInputWrapper}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#AAAAAA"
          />
        </View>
      </View>

      {/* Results */}
      {!hasLoaded ? null : savedCards.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💳</Text>
          <Text style={styles.emptyTitle}>No cards added yet</Text>
          <Text style={styles.emptySubtitle}>
            Go to the My Cards tab to add the cards in your wallet.
          </Text>
          <TouchableOpacity
            style={styles.addCardsButton}
            onPress={() => navigation.navigate('MyCards')}
          >
            <Text style={styles.addCardsButtonText}>Add My Cards →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>
            {rankedCards.length} card{rankedCards.length !== 1 ? 's' : ''} ranked
          </Text>
          <FlatList
            data={rankedCards}
            keyExtractor={(item) => item.id}
            renderItem={renderCard}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          />
          {rankedCards[0] && (
            <View style={styles.noteRow}>
              <Text style={styles.noteText}>💡 {rankedCards[0].notes}</Text>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A3C5E',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },
  categoryIcon: {
    fontSize: 26,
  },
  categoryLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  amountRow: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  amountLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D0D8E4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  dollarSign: {
    fontSize: 18,
    color: '#555',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 18,
    flex: 1,
    color: '#1A1A1A',
  },
  sectionTitle: {
    fontSize: 13,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bestCard: {
    borderWidth: 2,
    borderColor: '#1A3C5E',
  },
  bestBadge: {
    position: 'absolute',
    top: -10,
    left: 14,
    backgroundColor: '#1A3C5E',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  bestBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  cardIssuer: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  rateText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A3C5E',
  },
  estimatedReward: {
    fontSize: 13,
    color: '#2D6A4F',
    fontWeight: '600',
    marginTop: 2,
  },
  missed: {
    fontSize: 12,
    color: '#E74C3C',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  addCardsButton: {
    marginTop: 24,
    backgroundColor: '#1A3C5E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addCardsButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  noteRow: {
    backgroundColor: '#EEF4FB',
    padding: 14,
    margin: 16,
    borderRadius: 10,
  },
  noteText: {
    fontSize: 13,
    color: '#4A6A8A',
    lineHeight: 20,
  },
});
