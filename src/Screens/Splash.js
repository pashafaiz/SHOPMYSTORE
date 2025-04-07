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
   bottom:80,
   right:120

  },
  Splashimg3: {
    alignSelf:'flex-end',
    // marginLeft:40,
    right:90,
    position:"absolute",
    top:90
  },
  logo: {
    height:300,
    width:300
  },
  Gola:{
   bottom:300,
   alignSelf:'flex-start'
  },
  truk:{
   height:200,
   width:'100%',
   bottom:100

   
  },

});
