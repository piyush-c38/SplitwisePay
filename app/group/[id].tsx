import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function GroupDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [group, setGroup] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);

  useEffect(() => {
    const fetchGroup = async () => {
      const data = await AsyncStorage.getItem('groups');
      if (data) {
        const parsed = JSON.parse(data);
        const found = parsed.find((g: any) => g.id === id);
        setGroup(found);
        const groupExpenses = found?.expenses || [];
        setExpenses(groupExpenses);
        calculateBalances(found?.members || [], groupExpenses);
      }
    };
    fetchGroup();
  }, [id]);

  const calculateBalances = (members: string[], expenses: any[]) => {
    const totals: { [key: string]: number } = {};
    members.forEach((m) => (totals[m] = 0));

    expenses.forEach((expense) => {
      const perHead = expense.amount / members.length;
      members.forEach((m) => {
        if (m === expense.payer) {
          totals[m] += expense.amount - perHead;
        } else {
          totals[m] -= perHead;
        }
      });
    });

    const balanceArray = members.map((m) => ({ member: m, balance: Math.round(totals[m]) }));
    setBalances(balanceArray);
  };

  const handleAddExpense = () => {
    router.push(`/group/${id}/add-expense`);
  };

  if (!group) {
    return (
      <View style={styles.centered}>
        <Text>Group not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{group.name}</Text>

      {expenses.length === 0 ? (
        <Text style={styles.noExpenses}>No expenses yet.</Text>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.expenseItem}>
              <View>
                <Text style={styles.expenseTitle}>{item.title}</Text>
                <Text style={styles.expenseDesc}>Paid by {item.payer}</Text>
              </View>
              <Text>{item.amount} ₹</Text>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handleAddExpense}>
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Balances</Text>
        {balances.map((b, idx) => (
          <Text key={idx}>
            {b.member}: {b.balance >= 0 ? `will receive ₹${b.balance}` : `owes ₹${-b.balance}`}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  noExpenses: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#777' },
  expenseItem: {
    padding: 12,
    backgroundColor: '#eee',
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseTitle: { fontWeight: '600', fontSize: 16 },
  expenseDesc: { fontSize: 12, color: '#555' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#2196F3',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});
