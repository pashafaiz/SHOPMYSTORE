import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Splash from '../AfterLogin/Splash';
import DashBoard from '../AfterLogin/DashBoard';
import Login from '../BeforeLogin/Login';
import SignUp from '../BeforeLogin/SignUp';

const Stack = createNativeStackNavigator();
const Navigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName='Login'>
                <Stack.Screen name="Login" component={Login} />
                <Stack.Screen name='SignUp' component={SignUp} />
                <Stack.Screen name="Splash" component={Splash} />
                <Stack.Screen name="DashBoard" component={DashBoard} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default Navigator;
