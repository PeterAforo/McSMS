import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useAuthStore } from '../store/authStore';

export default function DashboardScreen() {
  const user = useAuthStore((state) => state.user);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#3B82F6' }]}>
          <Text style={styles.statValue}>95%</Text>
          <Text style={styles.statLabel}>Attendance</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
          <Text style={styles.statValue}>A</Text>
          <Text style={styles.statLabel}>Grade</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F59E0B' }]}>
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#8B5CF6' }]}>
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>Messages</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        <View style={styles.scheduleItem}>
          <Text style={styles.scheduleTime}>08:00 - 09:00</Text>
          <Text style={styles.scheduleSubject}>Mathematics</Text>
        </View>
        <View style={styles.scheduleItem}>
          <Text style={styles.scheduleTime}>09:00 - 10:00</Text>
          <Text style={styles.scheduleSubject}>English</Text>
        </View>
        <View style={styles.scheduleItem}>
          <Text style={styles.scheduleTime}>10:30 - 11:30</Text>
          <Text style={styles.scheduleSubject}>Science</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#1E40AF' },
  greeting: { fontSize: 16, color: '#93C5FD' },
  name: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12 },
  statCard: { width: '46%', margin: '2%', padding: 20, borderRadius: 12 },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 14, color: '#fff', opacity: 0.9 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#1F2937' },
  scheduleItem: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  scheduleTime: { color: '#6B7280', fontSize: 14 },
  scheduleSubject: { fontWeight: '600', color: '#1F2937' },
});
