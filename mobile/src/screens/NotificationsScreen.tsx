import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const notifications = [
  { id: '1', title: 'New Assignment', message: 'Math homework due tomorrow', time: '1h ago', type: 'homework' },
  { id: '2', title: 'Attendance Alert', message: 'Your child was marked present', time: '3h ago', type: 'attendance' },
  { id: '3', title: 'Fee Reminder', message: 'Term fees due in 5 days', time: '1d ago', type: 'payment' },
];

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.notificationItem}>
            <View style={[styles.icon, item.type === 'homework' && { backgroundColor: '#3B82F6' }, item.type === 'attendance' && { backgroundColor: '#10B981' }, item.type === 'payment' && { backgroundColor: '#F59E0B' }]}>
              <Text style={styles.iconText}>{item.type[0].toUpperCase()}</Text>
            </View>
            <View style={styles.content}>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.message}>{item.message}</Text>
            </View>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#1E40AF' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  notificationItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, marginHorizontal: 16, marginTop: 8, borderRadius: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  iconText: { color: '#fff', fontWeight: 'bold' },
  content: { flex: 1, marginLeft: 12 },
  notificationTitle: { fontWeight: '600', color: '#1F2937' },
  message: { color: '#6B7280', marginTop: 2, fontSize: 13 },
  time: { color: '#9CA3AF', fontSize: 12 },
});
