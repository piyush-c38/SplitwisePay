// app/creategroup.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'expo-router';

export default function CreateGroup() {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState('');

  const handleCreateGroup = async () => {
    if (!groupName || members.trim().length === 0) {
      Alert.alert('Error', 'Please enter a group name and add members');
      return;
    }
  
    // Convert comma-separated members to an array
    let membersArray = members.split(',').map(m => m.trim()).filter(m => m);
  
    // Get current user
    const username = await AsyncStorage.getItem('username');
  
    // Ensure current user is part of the group
    if (username && !membersArray.includes(username)) {
      membersArray.push(username);
    }
  
    const newGroup = {
      id: uuidv4(),
      name: groupName,
      members: membersArray,
      expenses: [],
    };
  
    const existing = await AsyncStorage.getItem('groups');
    const groups = existing ? JSON.parse(existing) : [];
    groups.push(newGroup);
  
    await AsyncStorage.setItem('groups', JSON.stringify(groups));
    router.replace('/');
  };
  


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Group</Text>

      <TextInput
        style={styles.input}
        placeholder="Group Name"
        value={groupName}
        onChangeText={setGroupName}
      />

      <TextInput
        style={styles.input}
        placeholder="Members (comma-separated)"
        value={members}
        onChangeText={setMembers}
      />

      <Button title="Create Group" onPress={handleCreateGroup} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
});
