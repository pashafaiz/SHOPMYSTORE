import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
<<<<<<< HEAD
import SignUp from '../afterLogin/signUp'; 
=======
import SignUp from '../afterLogin/signUp';
>>>>>>> 68a4673b2ba5502c9afc2c7ff12f4101e8adcc3c
import Splash from '../Screens/Splash';
import DashBoard from '../Screens/DashBoard';

const Stack = createNativeStackNavigator();

const Navigator = () => {
<<<<<<< HEAD
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={Splash} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="DashBoard" component={DashBoard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
=======
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Splash" component={Splash} />
                <Stack.Screen name="SignUp" component={SignUp} />
                <Stack.Screen name="DashBoard" component={DashBoard} />
            </Stack.Navigator>
        </NavigationContainer>
    );
>>>>>>> 68a4673b2ba5502c9afc2c7ff12f4101e8adcc3c
};

export default Navigator;
