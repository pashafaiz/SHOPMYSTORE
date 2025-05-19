import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SellerAnalytics = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sales Analytics</Text>
      <Text style={styles.subtitle}>Track your performance and sales metrics.</Text>
      {/* Add analytics charts and data here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default SellerAnalytics;