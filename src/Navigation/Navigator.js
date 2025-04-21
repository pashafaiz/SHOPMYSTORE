import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashBoard from '../AfterLogin/DashBoard';
import Login from '../BeforeLogin/Login';
import SignUp from '../BeforeLogin/SignUp';
import OTP from '../BeforeLogin/OTP';
import BottomTabs from './BottomTabs';
import Profile from '../AfterLogin/Profile';
import Splash from '../BeforeLogin/Splash';
import Message from '../Message/Message';
import ProductDetail from '../Products/ProductDetail';
import UploadReel from '../AfterLogin/UploadReel';
import ReelView from '../AfterLogin/ReelView';
import All_Product from '../Products/All_Product';

const Stack = createNativeStackNavigator();



const Navigator = ({ initialRouteName = 'Login' }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name='SignUp' component={SignUp} />
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="DashBoard" component={DashBoard} />
      <Stack.Screen name='OTP' component={OTP} />
      <Stack.Screen name='BottomTabs' component={BottomTabs}/>
      <Stack.Screen name='Profile' component={Profile}/>
      <Stack.Screen name='Message' component={Message} />
      <Stack.Screen name='ProductDetail' component={ProductDetail}/>
      <Stack.Screen name='UploadReel' component={UploadReel}/>
      <Stack.Screen name="ReelView" component={ReelView} />
      <Stack.Screen name='All_Product' component={All_Product}/>
    </Stack.Navigator>
  );
};



export default Navigator;


