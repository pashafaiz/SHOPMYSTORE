import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProductHighlights = ({ highlights }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Product Highlights</Text>
      {highlights.map((highlight, index) => (
        <View key={index} style={styles.highlightItem}>
          <Icon name="check-circle" size={18} color="lightgreen" />
          <Text style={styles.highlightText}>{highlight}</Text>
        </View>
      ))}
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
    marginBottom: 10,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  highlightText: {
    fontSize: 14,
    color: '#A78BFA',
    marginLeft: 8,
    flex: 1,
  },
});

export default ProductHighlights;