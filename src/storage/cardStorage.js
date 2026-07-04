import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@rewardseasily_my_cards';

// Returns array of card IDs the user has saved
export async function getSavedCardIds() {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function saveCardId(cardId) {
  const current = await getSavedCardIds();
  if (!current.includes(cardId)) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...current, cardId]));
  }
}

export async function removeCardId(cardId) {
  const current = await getSavedCardIds();
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(current.filter((id) => id !== cardId))
  );
}
