import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  SectionList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ALL_CARDS } from '../data/cards';
import { getSavedCardIds, saveCardId, removeCardId } from '../storage/cardStorage';

// Group cards by issuer for the full list
function groupByIssuer(cards) {
  const map = {};
  for (const card of cards) {
    if (!map[card.issuer]) map[card.issuer] = [];
    map[card.issuer].push(card);
  }
  return Object.keys(map)
    .sort()
    .map((issuer) => ({ title: issuer, data: map[issuer] }));
}

export default function MyCardsScreen() {
  const [savedIds, setSavedIds] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getSavedCardIds().then(setSavedIds);
    }, [])
  );

  const toggleCard = async (cardId) => {
    if (savedIds.includes(cardId)) {
      await removeCardId(cardId);
      setSavedIds((prev) => prev.filter((id) => id !== cardId));
    } else {
      await saveCardId(cardId);
      setSavedIds((prev) => [...prev, cardId]);
    }
  };

  const myCards = ALL_CARDS.filter((c) => savedIds.includes(c.id));
  const sections = groupByIssuer(ALL_CARDS);

  const renderCardRow = ({ item }) => {
    const isAdded = savedIds.includes(item.id);
    return (
      <TouchableOpacity
        style={styles.cardRow}
        activeOpacity={0.7}
        onPress={() => toggleCard(item.id)}
      >
        <View style={[styles.colorDot, { backgroundColor: item.color }]} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardMeta}>
            {item.issuer} · {item.network}
            {item.annualFee > 0 ? ` · $${item.annualFee}/yr fee` : ' · No annual fee'}
          </Text>
        </View>
        <View style={[styles.toggle, isAdded && styles.toggleOn]}>
          <Text style={[styles.toggleText, isAdded && styles.toggleTextOn]}>
            {isAdded ? '✓ Added' : '+ Add'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cards</Text>
        <Text style={styles.headerSubtitle}>
          Tap to add or remove cards from your wallet
        </Text>
      </View>

      {/* My saved cards summary */}
      {myCards.length > 0 && (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>
            💳 Your wallet ({myCards.length} card{myCards.length !== 1 ? 's' : ''})
          </Text>
          <View style={styles.chipRow}>
            {myCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={[styles.chip, { borderColor: card.color }]}
                onPress={() => toggleCard(card.id)}
              >
                <View style={[styles.chipDot, { backgroundColor: card.color }]} />
                <Text style={styles.chipText}>{card.name}</Text>
                <Text style={styles.chipRemove}>✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* All available cards */}
      <View style={styles.allCardsHeader}>
        <Text style={styles.allCardsTitle}>All Available Cards</Text>
        <Text style={styles.allCardsCount}>{ALL_CARDS.length} cards</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderCardRow}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: '#F0F0F0', marginLeft: 60 }} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#1A3C5E',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#A8C4DF',
    marginTop: 4,
  },
  summaryBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#FAFAFA',
    gap: 5,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 13,
    color: '#333',
  },
  chipRemove: {
    fontSize: 11,
    color: '#AAAAAA',
    marginLeft: 2,
  },
  allCardsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  allCardsTitle: {
    fontSize: 13,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  allCardsCount: {
    fontSize: 13,
    color: '#888',
  },
  list: {
    paddingBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    backgroundColor: '#F5F7FA',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  cardMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  toggle: {
    borderWidth: 1.5,
    borderColor: '#1A3C5E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  toggleOn: {
    backgroundColor: '#1A3C5E',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A3C5E',
  },
  toggleTextOn: {
    color: '#FFFFFF',
  },
});
