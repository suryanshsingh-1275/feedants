import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { getCompetitions } from '../api';
import { colors } from '../theme';

export default function CompetitionListScreen({ user, onOpen, onCreate, onLogout }) {
  const [comps, setComps] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getCompetitions();
      setComps(data);
    } catch (err) {
      console.log(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const isOrganizer = user?.role === 'organizer';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Competitions</Text>
        <TouchableOpacity onPress={onLogout}>
          <Text style={styles.logout}>Log out</Text>
        </TouchableOpacity>
      </View>

      {isOrganizer && (
        <TouchableOpacity style={styles.createButton} onPress={onCreate}>
          <Text style={styles.createButtonText}>+ Create Competition</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={comps}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => onOpen(item.id)}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>
              Prize Pool ₹{item.prizePool} · Entry ₹{item.entryFee}
            </Text>
            <Text style={styles.cardMeta}>
              {item.spotsLeft} / {item.totalSpots} spots left · {item.status}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {isOrganizer ? 'No competitions yet. Create one above.' : 'No competitions yet. Check back soon.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  logout: { color: colors.primary, fontWeight: '600' },
  createButton: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center'
  },
  createButtonText: { color: colors.white, fontWeight: '700' },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  cardMeta: { color: colors.subtext, marginTop: 2 },
  empty: { textAlign: 'center', color: colors.subtext, marginTop: 40, paddingHorizontal: 24 }
});