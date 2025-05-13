import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
            size={20}
            color={quantity <= 1 ? '#2A2A5A' : '#A78BFA'}
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
            size={20}
            color={quantity >= 10 ? '#2A2A5A' : '#A78BFA'}
          />
        </TouchableOpacity>
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
    marginBottom: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A5A',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  button: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    width: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default QuantitySelector;