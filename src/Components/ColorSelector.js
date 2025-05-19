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

const ColorSelector = ({ colors, selectedColor, onSelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Color</Text>
      <View style={styles.colorContainer}>
        {colors.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorButton,
              { backgroundColor: color },
              selectedColor === color && styles.selectedColorButton,
            ]}
            onPress={() => onSelect(color)}
          >
            {selectedColor === color && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
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
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    marginRight: scale(15),
    marginBottom: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: scale(1),
    borderColor: BORDER_THEME_COLOR,
  },
  selectedColorButton: {
    borderWidth: scale(2),
    borderColor: PRIMARY_THEME_COLOR,
  },
  checkmark: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: TEXT_THEME_COLOR,
    fontWeight: '700',
    fontSize: scaleFont(12),
  },
});

export default ColorSelector;