import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      checkLoginAndLoadGroups();
    }, [])
  );
  type Group = {
    id: string;
    name: string;
    members: string[];
    total?: number;
  };
  const checkLoginAndLoadGroups = async () => {
    setLoading(true);
    const username = await AsyncStorage.getItem('username');
    if (!username) {
      router.replace('/login');
      return;
    }

    try {
      const data = await AsyncStorage.getItem('groups');
      const parsed = data ? JSON.parse(data) : [];
      setGroups(parsed);

      let total = 0;
      parsed.forEach((g: any) => {
        const groupTotal = g.expenses?.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
        total += groupTotal || 0;
      });
      setTotalAmount(total);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderGroup = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupItem}
      onPress={() => router.push(`/group/${item.id}`)}

    >
      <Text style={styles.groupName}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderGroup}
        ListEmptyComponent={<Text style={styles.emptyText}>No groups yet</Text>}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/creategroup')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Total: ₹{totalAmount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  groupItem: {
    padding: 16,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginBottom: 10,
  },
  groupName: { fontSize: 18, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 30, color: 'gray' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 70,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  fabText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  footer: {
    position: 'absolute',
    bottom: 0,
    height: 50,
    width: '100%',
    backgroundColor: '#f4f4f4',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  footerText: { fontSize: 16, fontWeight: 'bold' },
});
