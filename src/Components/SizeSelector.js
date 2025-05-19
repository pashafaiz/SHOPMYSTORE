import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

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

const SizeSelector = ({ sizes, selectedSize, onSelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Size</Text>
      <View style={styles.sizeContainer}>
        {sizes.map((size) => (
          <TouchableOpacity
            key={size}
            style={[
              styles.sizeButton,
              selectedSize === size && styles.selectedSizeButton,
            ]}
            onPress={() => onSelect(size)}
          >
            <Text
              style={[
                styles.sizeText,
                selectedSize === size && styles.selectedSizeText,
              ]}
            >
              {size}
            </Text>
          </TouchableOpacity>
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
    marginBottom: scale(10),
  },
  sizeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sizeButton: {
    width: scale(50),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: scale(1),
    borderColor: BORDER_THEME_COLOR,
    borderRadius: scale(8),
    marginRight: scale(10),
    marginBottom: scale(10),
  },
  selectedSizeButton: {
    backgroundColor: PRIMARY_THEME_COLOR,
    borderColor: PRIMARY_THEME_COLOR,
  },
  sizeText: {
    fontSize: scaleFont(14),
    color: SUBTEXT_THEME_COLOR,
  },
  selectedSizeText: {
    color: TEXT_THEME_COLOR,
    fontWeight: '700',
  },
});

export default SizeSelector;