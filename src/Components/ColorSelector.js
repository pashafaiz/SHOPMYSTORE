import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

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
    marginVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A5A',
  },
  selectedColorButton: {
    borderWidth: 2,
    borderColor: '#A78BFA',
  },
  checkmark: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default ColorSelector;