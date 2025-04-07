import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

const DashBoard = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to Dashboard</Text>
    </View>
  );
};

export default DashBoard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
