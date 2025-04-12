import React from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import Colors from '../constants/Colors';

const Loader = ({visible = false, color = Colors.pink}) => {
  if (!visible) return null;

  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color={color} />
    </View>
  );
};

export default Loader;

const styles = StyleSheet.create({
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
