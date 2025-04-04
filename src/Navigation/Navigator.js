// import React, { Component } from 'react'
// import { StyleSheet, Text, View } from 'react-native'
// import signUp from '../afterLogin/signUp';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// // import { NavigationContainer } from '@react-navigation/native';
// // import signUp from '../afterLogin/signUp';
// // import { createNativeStackNavigator } from '@react-navigation/native-stack';


// const Stack = createNativeStackNavigator;
// export default class Navigator extends Component {
//     render() {
//         return (
//             <NavigationContainer>
//                 <Stack.Navigator screenOptions={{ headerShown: false }}>
//                     <Stack.Screen name='signUp' component={signUp} />
//                 </Stack.Navigator>
//             </NavigationContainer>
//         )
//     }
// }

// const styles = StyleSheet.create({})



import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignUp from '../afterLogin/signUp';  // Ensure this path is correct

const Stack = createNativeStackNavigator();

const Navigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SignUp" component={SignUp} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigator;
