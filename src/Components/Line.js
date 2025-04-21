import {Dimensions, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import Colors from '../constants/Colors';
const {width} = Dimensions.get('window').width;
const Line = ({style}) => {
  return (
    <View>
      <View
        style={[{
          width: width * 0.38,
          borderWidth: 0.2,
          borderColor: Colors.lightPurple,
          marginVertical: 6,
        },style]}></View>
    </View>
  );
};

export default Line;

const styles = StyleSheet.create({});
