import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

// Define theme colors (move to GlobalConstants.js if possible)
const PRODUCT_BG_COLOR = '#f5f9ff';
const PRIMARY_THEME_COLOR = '#5b9cff';
const TEXT_THEME_COLOR = '#1a2b4a';
const SUBTEXT_THEME_COLOR = '#5a6b8a';
const BORDER_THEME_COLOR = 'rgba(91, 156, 255, 0.3)';

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375));

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
    marginVertical: scale(10),
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(8),
    padding: scale(10),
  },
  title: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: TEXT_THEME_COLOR,
    marginBottom: scale(15),
  },
  specsContainer: {
    borderWidth: scale(1),
    borderColor: BORDER_THEME_COLOR,
    borderRadius: scale(8),
    padding: scale(15),
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(10),
  },
  specName: {
    fontSize: scaleFont(14),
    color: PRIMARY_THEME_COLOR,
    fontWeight: '600',
  },
  specValue: {
    fontSize: scaleFont(14),
    color: SUBTEXT_THEME_COLOR,
    flex: 1,
    textAlign: 'right',
  },
});

export default ProductSpecifications;