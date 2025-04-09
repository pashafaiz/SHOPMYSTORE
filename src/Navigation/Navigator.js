import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Splash from '../AfterLogin/Splash';
import DashBoard from '../AfterLogin/DashBoard';
import Login from '../BeforeLogin/Login';
import SignUp from '../BeforeLogin/SignUp';
import Groups from '../AfterLogin/Groups';
import Products from '../AfterLogin/Products';
import BottomTabs from '../AfterLogin/BottomTabs';

const Stack = createNativeStackNavigator();
const Navigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName='Splash'>
               <Stack.Screen name="Splash" component={Splash} />
               <Stack.Screen name="BottomTabs" component={BottomTabs} />
               <Stack.Screen name="DashBoard" component={DashBoard} />
               <Stack.Screen name="Groups" component={Groups} />
               <Stack.Screen name="Products" component={Products} />
                <Stack.Screen name="Login" component={Login} />
                <Stack.Screen name='SignUp' component={SignUp} />
                

            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default Navigator;
