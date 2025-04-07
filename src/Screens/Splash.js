import {StyleSheet, Text, View, ActivityIndicator, Image} from 'react-native';
import React from 'react';
import img from '../assets/Images/img';
import Colors from '../constants/Colors';

const Splash = () => {
  return (
    <View style={styles.container}>
      <Image source={img.splash} style={styles.Splashimg1} />
      <Image source={img.star} style={styles.Splashimg2} />
      <Image source={img.star} style={styles.Splashimg3} />
      <Image source={img.Frame} style={styles.Frame} />
      <Image source={img.Gola} style={styles.Gola} />
      <Image source={img.Roket} style={styles.Roket} />
      <Image source={img.Begon} style={styles.Begon} />
    </View>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.White,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  Splashimg1: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  Splashimg2: {
    alignSelf:"flex-end",
    marginRight:30
  },
  Splashimg3: {
    alignSelf:"flex-start",
    marginLeft:40,
    position:"absolute",
    top:90
  },
});
