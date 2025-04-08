import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export default function AddExpense() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [group, setGroup] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [payer, setPayer] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [customSplits, setCustomSplits] = useState<{ [key: string]: string }>({});

  useFocusEffect(
    useCallback(() => {
      const loadGroupAndUser = async () => {
        const username = await AsyncStorage.getItem('username');
        setCurrentUser(username || '');
        setPayer(username || '');

        const data = await AsyncStorage.getItem('groups');
        if (data) {
          const parsed = JSON.parse(data);
          const found = parsed.find((g: any) => g.id === id);
          if (found) {
            setGroup(found);
          }
        }
      };
      loadGroupAndUser();
    }, [id])
  );

  const handleCreateExpense = async () => {
    if (!title || !amount || !payer) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Amount must be a valid positive number');
      return;
    }

    const shares: { [key: string]: number } = {};

    const allMembers = [...new Set([...group.members, currentUser])];

    if (splitType === 'equal') {
      const perHead = parsedAmount / allMembers.length;
      allMembers.forEach((m: string) => {
        shares[m] = parseFloat(perHead.toFixed(2));
      });
    } else {
      let totalCustom = 0;
      for (let m of allMembers) {
        const val = parseFloat(customSplits[m] || '0');
        if (isNaN(val)) {
          Alert.alert('Error', `Invalid amount entered for ${m}`);
          return;
        }
        shares[m] = val;
        totalCustom += val;
      }

      if (Math.abs(totalCustom - parsedAmount) > 0.01) {
        Alert.alert('Error', 'Sum of custom splits must equal the total amount');
        return;
      }
    }

    const newExpense = {
      id: uuidv4(),
      title,
      desc,
      amount: parsedAmount,
      category,
      date,
      payer,
      split: {
        type: splitType,
        shares,
      },
    };

    const data = await AsyncStorage.getItem('groups');
    if (data) {
      const parsed = JSON.parse(data);
      const updatedGroups = parsed.map((g: any) => {
        if (g.id === id) {
          return {
            ...g,
            expenses: [...(g.expenses || []), newExpense],
          };
        }
        return g;
      });

      await AsyncStorage.setItem('groups', JSON.stringify(updatedGroups));
      setTitle('');
      setDesc('');
      setAmount('');
      setCategory('');
      setDate('');
      setSplitType('equal');
      setCustomSplits({});
      router.push(`/group/${id}`);
    }
  };

  if (!group) {
    return (
      <View style={styles.centered}>
        <Text>Loading group...</Text>
      </View>
    );
  }

  const allMembers = [...new Set([...group.members, currentUser])];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Title *</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Description</Text>
      <TextInput style={styles.input} value={desc} onChangeText={setDesc} />

      <Text style={styles.label}>Category</Text>
      <TextInput style={styles.input} value={category} onChangeText={setCategory} />

      <Text style={styles.label}>Amount *</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Split Type</Text>
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <TouchableOpacity
          onPress={() => setSplitType('equal')}
          style={[
            styles.splitOption,
            splitType === 'equal' && styles.splitOptionSelected,
          ]}
        >
          <Text>Equal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSplitType('custom')}
          style={[
            styles.splitOption,
            splitType === 'custom' && styles.splitOptionSelected,
          ]}
        >
          <Text>Custom</Text>
        </TouchableOpacity>
      </View>

      {splitType === 'custom' &&
        allMembers.map((member: string) => (
          <View key={member} style={{ marginTop: 8 }}>
            <Text>{member}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Amount owed"
              value={customSplits[member] || ''}
              onChangeText={(text) =>
                setCustomSplits({ ...customSplits, [member]: text })
              }
            />
          </View>
        ))}

      <Text style={styles.label}>Date</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
      />

      {/* Removed "Paid by" picker */}

      <View style={styles.button}>
        <Button title="Create Expense" onPress={handleCreateExpense} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 16, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  button: {
    marginTop: 24,
  },
  splitOption: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 10,
    borderRadius: 8,
    marginRight: 12,
  },
  splitOptionSelected: {
    backgroundColor: '#cce5ff',
  },
});
