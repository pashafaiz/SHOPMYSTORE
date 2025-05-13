import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

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
    marginVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  sizeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sizeButton: {
    width: 50,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A5A',
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedSizeButton: {
    backgroundColor: '#A78BFA',
    borderColor: '#A78BFA',
  },
  sizeText: {
    fontSize: 14,
    color: '#A78BFA',
  },
  selectedSizeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default SizeSelector;