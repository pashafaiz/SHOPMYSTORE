import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SellerProducts = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Products</Text>
      <Text style={styles.subtitle}>Add, edit, or remove your product listings.</Text>
      {/* Add product management UI here */}
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

export default SellerProducts;