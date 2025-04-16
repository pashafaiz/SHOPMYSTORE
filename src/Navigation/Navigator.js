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

const Stack = createNativeStackNavigator();
// const Navigator = ({ initialRoute }) => {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
//       <Stack.Screen name="Login" component={Login} />
//       <Stack.Screen name="SignUp" component={SignUp} />
//       <Stack.Screen name="Splash" component={Splash} />
//       <Stack.Screen name="DashBoard" component={DashBoard} />
//       <Stack.Screen name="OTP" component={OTP} />
//       <Stack.Screen name="BottomTabs" component={BottomTabs} />
//       <Stack.Screen name="Profile" component={Profile} />
//     </Stack.Navigator>
//   );
// };


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
    </Stack.Navigator>
  );
};



export default Navigator;



// import React from 'react';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import Splash from '../AfterLogin/Splash';
// import DashBoard from '../AfterLogin/DashBoard';
// import Login from '../BeforeLogin/Login';
// import SignUp from '../BeforeLogin/SignUp';
// import OTP from '../BeforeLogin/OTP';
// import BottomTabs from './BottomTabs';
// import AuthLoading from '../Components/AuthLoading';
// import Profile from '../AfterLogin/Profile';

// const Stack = createNativeStackNavigator();

// const Navigator = () => {
//     return (
//       <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={"Login"}>
//         <Stack.Screen name="Login" component={Login} />
//         <Stack.Screen name="AuthLoading" component={AuthLoading} />
//         <Stack.Screen name='SignUp' component={SignUp} />
//         <Stack.Screen name="Splash" component={Splash} />
//         <Stack.Screen name="DashBoard" component={DashBoard} />
//         <Stack.Screen name='OTP' component={OTP} />
//         <Stack.Screen name='BottomTabs' component={BottomTabs} />
//         <Stack.Screen name='Profile' component={Profile} />
//       </Stack.Navigator>
//     );
//   };
  

// export default Navigator;
