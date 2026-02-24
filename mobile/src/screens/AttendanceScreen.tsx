import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function AttendanceScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>
      </View>
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>95%</Text>
          <Text style={styles.summaryLabel}>Overall</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>18</Text>
          <Text style={styles.summaryLabel}>Present</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>1</Text>
          <Text style={styles.summaryLabel}>Absent</Text>
        </View>
      </View>
      <View style={styles.calendar}>
        <Text style={styles.sectionTitle}>February 2026</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#10B981' }]} /><Text>Present</Text></View>
          <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#EF4444' }]} /><Text>Absent</Text></View>
          <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#F59E0B' }]} /><Text>Late</Text></View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#1E40AF' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  summary: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 12 },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 28, fontWeight: 'bold', color: '#1F2937' },
  summaryLabel: { color: '#6B7280', marginTop: 4 },
  calendar: { margin: 16, backgroundColor: '#fff', padding: 16, borderRadius: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  legend: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
});
