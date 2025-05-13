import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ProductSpecifications = ({ specifications }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Product Specifications</Text>
      <View style={styles.specsContainer}>
        {specifications.map((spec, index) => (
          <View key={index} style={styles.specRow}>
            <Text style={styles.specName}>{spec.name}:</Text>
            <Text style={styles.specValue}>{spec.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  specsContainer: {
    borderWidth: 1,
    borderColor: '#2A2A5A',
    borderRadius: 8,
    padding: 15,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  specName: {
    fontSize: 14,
    color: '#A78BFA',
    fontWeight: '600',
  },
  specValue: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'right',
  },
});

export default ProductSpecifications;