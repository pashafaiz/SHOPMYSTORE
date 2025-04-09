import { StyleSheet, View, Image } from 'react-native';
import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native'; // 👈 import this
import img from '../assets/Images/img'; // Your image imports
import Colors from '../constants/Colors'; // Your color constants

const Splash = () => {
  const navigation = useNavigation(); // 👈 initialize navigation

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('BottomTabs'); // 👈 navigate to Dashboard
    }, 3000);

    return () => clearTimeout(timer); // cleanup
  }, []);

  return (
    <View style={styles.container}>
      <Image source={img.splash} style={styles.Splashimg1} />
      <Image source={img.star} style={styles.Splashimg2} />
      <Image source={img.star} style={styles.Splashimg3} />
      <Image source={img.logo} style={styles.logo} />
      <Image source={img.Gola} style={styles.Gola} />
      <Image source={img.truk} style={styles.truk} />
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
  Splashimg1: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  Splashimg2: {
    bottom: 80,
    right: 120,
    position: 'absolute',
  },
  Splashimg3: {
    alignSelf: 'flex-end',
    right: 90,
    position: 'absolute',
    top: 90,
  },
  logo: {
    height: 300,
    width: 300,
  },
  Gola: {
    bottom: 300,
    alignSelf: 'flex-start',
    position: 'absolute',
  },
  truk: {
    height: 200,
    width: '100%',
    position: 'absolute',
    bottom: 100,
  },
});
