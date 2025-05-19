import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

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

const QuantitySelector = ({ quantity, onIncrement, onDecrement }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quantity</Text>
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={onDecrement}
          disabled={quantity <= 1}
        >
          <Icon
            name="remove"
            size={scale(20)}
            color={quantity <= 1 ? SUBTEXT_THEME_COLOR : PRIMARY_THEME_COLOR}
          />
        </TouchableOpacity>
        <Text style={styles.quantity}>{quantity}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={onIncrement}
          disabled={quantity >= 10}
        >
          <Icon
            name="add"
            size={scale(20)}
            color={quantity >= 10 ? SUBTEXT_THEME_COLOR : PRIMARY_THEME_COLOR}
          />
        </TouchableOpacity>
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
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: scale(1),
    borderColor: BORDER_THEME_COLOR,
    borderRadius: scale(8),
    alignSelf: 'flex-start',
  },
  button: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    width: scale(40),
    textAlign: 'center',
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: TEXT_THEME_COLOR,
  },
});

export default QuantitySelector;