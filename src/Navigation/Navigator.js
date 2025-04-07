import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignUp from '../afterLogin/signUp';
import Splash from '../Screens/Splash';
import DashBoard from '../Screens/DashBoard';

const Stack = createNativeStackNavigator();

const Navigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Splash" component={Splash} />
                <Stack.Screen name="SignUp" component={SignUp} />
                <Stack.Screen name="DashBoard" component={DashBoard} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default Navigator;
