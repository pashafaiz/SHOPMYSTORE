import React from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import Colors from '../constants/Colors';

const {width} = Dimensions.get('window');

const Toast = ({message, type = 'success'}) => {
  if (!message) return null;

  return (
    <View
      style={[
        styles.toastContainer,
        type === 'error' ? styles.errorBackground : styles.successBackground,
      ]}>
      <Text
        style={[
          styles.toastText,
          type === 'error' ? styles.errorText : styles.successText,
        ]}>
        {message}
      </Text>
    </View>
  );
};

export default Toast;

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 5,
    maxWidth: width * 0.9,
    zIndex: 20,
  },
  successBackground: {
    backgroundColor: '#d4edda',
  },
  errorBackground: {
    backgroundColor: '#f8d7da',
  },
  toastText: {
    fontSize: 14,
    textAlign: 'center',
  },
  successText: {
    color: '#155724',
  },
  errorText: {
    color: '#721c24',
  },
});
