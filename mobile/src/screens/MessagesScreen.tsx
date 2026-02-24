import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';

const messages = [
  { id: '1', sender: 'Mr. Johnson', subject: 'Math Assignment', time: '2h ago', unread: true },
  { id: '2', sender: 'Mrs. Smith', subject: 'Parent Meeting', time: '5h ago', unread: true },
  { id: '3', sender: 'Admin', subject: 'School Event', time: '1d ago', unread: false },
];

export default function MessagesScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.messageItem, item.unread && styles.unread]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.sender[0]}</Text>
            </View>
            <View style={styles.messageContent}>
              <Text style={styles.sender}>{item.sender}</Text>
              <Text style={styles.subject}>{item.subject}</Text>
            </View>
            <Text style={styles.time}>{item.time}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#1E40AF' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  messageItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, marginHorizontal: 16, marginTop: 8, borderRadius: 12 },
  unread: { borderLeftWidth: 3, borderLeftColor: '#3B82F6' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  messageContent: { flex: 1, marginLeft: 12 },
  sender: { fontWeight: '600', color: '#1F2937' },
  subject: { color: '#6B7280', marginTop: 2 },
  time: { color: '#9CA3AF', fontSize: 12 },
});
