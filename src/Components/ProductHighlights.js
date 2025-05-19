import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Define theme colors (move to GlobalConstants.js if possible)
const PRODUCT_BG_COLOR = '#f5f9ff';
const SECONDARY_THEME_COLOR = '#ff6b8a';
const TEXT_THEME_COLOR = '#1a2b4a';
const SUBTEXT_THEME_COLOR = '#5a6b8a';

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375));

const ProductHighlights = ({ highlights }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Product Highlights</Text>
      {highlights.map((highlight, index) => (
        <View key={index} style={styles.highlightItem}>
          <Icon name="check-circle" size={scale(18)} color={SECONDARY_THEME_COLOR} />
          <Text style={styles.highlightText}>{highlight}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: scale(10),
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(8),
    padding: scale(10),
  },
  title: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: TEXT_THEME_COLOR,
    marginBottom: scale(10),
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scale(8),
  },
  highlightText: {
    fontSize: scaleFont(14),
    color: SUBTEXT_THEME_COLOR,
    marginLeft: scale(8),
    flex: 1,
  },
});

export default ProductHighlights;