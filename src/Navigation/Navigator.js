// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createDrawerNavigator } from '@react-navigation/drawer';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import DashBoard from '../AfterLogin/DashBoard';
// import Login from '../BeforeLogin/Login';
// import SignUp from '../BeforeLogin/SignUp';
// import OTP from '../BeforeLogin/OTP';
// import BottomTabs from './BottomTabs';
// import Profile from '../AfterLogin/Profile';
// import Message from '../Message/Message';
// import ProductDetail from '../Products/ProductDetail';
// import UploadReel from '../AfterLogin/UploadReel';
// import ReelView from '../AfterLogin/ReelView';
// import UserProfile from '../UserProfile/UserProfile';
// import Categories from '../AfterLogin/Categories';
// import Rating from '../Components/Rating';
// import ProductSpecifications from '../Components/ProductSpecifications';
// import Drawer from './Drawer';
// import { Dimensions } from 'react-native';

// const Stack = createNativeStackNavigator();
// const DrawerNav = createDrawerNavigator();

// // Stack Navigator for main screens
// const MainStackNavigator = () => {
//   return (
//     <Stack.Navigator
//       screenOptions={{ headerShown: false }}
//       initialRouteName="Login"
//     >
//       <Stack.Screen name="Login" component={Login} />
//       <Stack.Screen name="SignUp" component={SignUp} />
//       <Stack.Screen name="DashBoard" component={DashBoard} />
//       <Stack.Screen name="OTP" component={OTP} />
//       <Stack.Screen name="BottomTabs" component={BottomTabs} />
//       <Stack.Screen name="Profile" component={Profile} />
//       <Stack.Screen name="Message" component={Message} />
//       <Stack.Screen name="ProductDetail" component={ProductDetail} />
//       <Stack.Screen name="UploadReel" component={UploadReel} />
//       <Stack.Screen name="ReelView" component={ReelView} />
//       <Stack.Screen name="UserProfile" component={UserProfile} />
//       <Stack.Screen name="Categories" component={Categories} />
//       <Stack.Screen name="Rating" component={Rating} />
//       <Stack.Screen name="ProductSpecifications" component={ProductSpecifications} />
//     </Stack.Navigator>
//   );
// };

// // Drawer Navigator
// const Navigator = () => {
//   return (
//     // <NavigationContainer>
//       <DrawerNav.Navigator
//         drawerContent={(props) => <Drawer {...props} />}
//         screenOptions={{
//           headerShown: false,
//           drawerStyle: {
//             width: Math.min(Dimensions.get('window').width * 0.75, 300),
//           },
//         }}
//       >
//         <DrawerNav.Screen
//           name="Main"
//           component={MainStackNavigator}
//           options={{ title: 'Home' }}
//         />
//       </DrawerNav.Navigator>
//     // </NavigationContainer>
//   );
// };

// export default Navigator;

// import React, { useEffect, useState } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createDrawerNavigator } from '@react-navigation/drawer';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import DashBoard from '../AfterLogin/DashBoard';
// import Login from '../BeforeLogin/Login';
// import SignUp from '../BeforeLogin/SignUp';
// import OTP from '../BeforeLogin/OTP';
// import BottomTabs from './BottomTabs';
// import Profile from '../AfterLogin/Profile';
// import Message from '../Message/Message';
// import ProductDetail from '../Products/ProductDetail';
// import UploadReel from '../AfterLogin/UploadReel';
// import ReelView from '../AfterLogin/ReelView';
// import UserProfile from '../UserProfile/UserProfile';
// import Categories from '../AfterLogin/Categories';
// import Rating from '../Components/Rating';
// import ProductSpecifications from '../Components/ProductSpecifications';
// import Drawer from './Drawer';
// import { Dimensions } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useDispatch, useSelector } from 'react-redux';
// import { checkAuth } from '../redux/slices/authSlice';

// const Stack = createNativeStackNavigator();
// const DrawerNav = createDrawerNavigator();

// const HomeStack = () => {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="BottomTabs" component={BottomTabs} />
//       <Stack.Screen name="DashBoard" component={DashBoard} />
//       <Stack.Screen name="Profile" component={Profile} />
//       <Stack.Screen name="Message" component={Message} />
//       <Stack.Screen name="ProductDetail" component={ProductDetail} />
//       <Stack.Screen name="UploadReel" component={UploadReel} />
//       <Stack.Screen name="ReelView" component={ReelView} />
//       <Stack.Screen name="UserProfile" component={UserProfile} />
//       <Stack.Screen name="Categories" component={Categories} />
//       <Stack.Screen name="Rating" component={Rating} />
//       <Stack.Screen name="ProductSpecifications" component={ProductSpecifications} />
//     </Stack.Navigator>
//   );
// };

// const Navigator = () => {
//   const [isLoading, setIsLoading] = useState(true);
//   const dispatch = useDispatch();
//   const { isAuthenticated } = useSelector((state) => state.auth);

//   useEffect(() => {
//     const checkLoginStatus = async () => {
//       try {
//         await dispatch(checkAuth()).unwrap();
//       } catch (error) {
//         console.error('Error checking login status:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     checkLoginStatus();
//   }, [dispatch]);

//   if (isLoading) {
//     return null;
//   }

//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       {isAuthenticated ? (
//         <Stack.Screen name="Main">
//           {() => (
//             <DrawerNav.Navigator
//               drawerContent={(props) => <Drawer {...props} />}
//               screenOptions={{
//                 headerShown: false,
//                 drawerStyle: {
//                   width: Math.min(Dimensions.get('window').width * 0.75, 300),
//                 },
//               }}
//               initialRouteName="HomeStack"
//             >
//               <DrawerNav.Screen name="HomeStack" component={HomeStack} />
//             </DrawerNav.Navigator>
//           )}
//         </Stack.Screen>
//       ) : (
//         <>
//           <Stack.Screen name="Login" component={Login} />
//           <Stack.Screen name="SignUp" component={SignUp} />
//           <Stack.Screen name="OTP" component={OTP} />
//         </>
//       )}
//     </Stack.Navigator>
//   );
// };

// export default Navigator;

import React, {useEffect, useState} from 'react';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DashBoard from '../AfterLogin/DashBoard';
import Login from '../BeforeLogin/Login';
import SignUp from '../BeforeLogin/SignUp';
import OTP from '../BeforeLogin/OTP';
import BottomTabs from './BottomTabs';
import Profile from '../AfterLogin/Profile';
import Message from '../Message/Message';
import ProductDetail from '../Products/ProductDetail';
import UploadReel from '../AfterLogin/UploadReel';
import ReelView from '../AfterLogin/ReelView';
import UserProfile from '../UserProfile/UserProfile';
import Categories from '../AfterLogin/Categories';
import Rating from '../Components/Rating';
import ProductSpecifications from '../Components/ProductSpecifications';
import Drawer from './Drawer';
import {Dimensions} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {checkAuth} from '../redux/slices/authSlice';
import SellerSignup from '../SellerSenerio/SellerSignup';
import Support from '../constants/Support';
import Chat from '../constants/Chat';
import Settings from '../constants/Settings';
import ChangeLanguage from '../constants/ChangeLanguage';
import InviteFriends from '../constants/InviteFriends';
import PremiumPlans from '../constants/PremiumPlans';
import SellerDashboard from '../SellerSenerio/SellerDashboard';
import ProductModal from '../Products/ProductModal';
import Checkout from '../Products/Checkout';
import OrderConfirmation from '../Products/OrderConfirmation';
import OrderHistory from '../Products/OrderHistory';
import Notifications from '../Message/Notifications';
import NotificationsScreen from '../Message/NotificationScreen';
import ForgotPassword from '../BeforeLogin/ForgotPassword';

const Stack = createNativeStackNavigator();
const DrawerNav = createDrawerNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="BottomTabs" component={BottomTabs} />
      <Stack.Screen name="DashBoard" component={DashBoard} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="Message" component={Message} />
      <Stack.Screen name="ProductDetail" component={ProductDetail} />
      <Stack.Screen name="ProductModal" component={ProductModal} />
      <Stack.Screen name="UploadReel" component={UploadReel} />
      <Stack.Screen name="ReelView" component={ReelView} />
      <Stack.Screen name="UserProfile" component={UserProfile} />
      <Stack.Screen name="Categories" component={Categories} />
      <Stack.Screen name="Rating" component={Rating} />
      <Stack.Screen name="SellerSignup" component={SellerSignup} />
      <Stack.Screen name="Support" component={Support} />
      <Stack.Screen name="Chat" component={Chat} />
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen name="ChangeLanguage" component={ChangeLanguage} />
      <Stack.Screen name="InviteFriends" component={InviteFriends} />
      <Stack.Screen name="PremiumPlans" component={PremiumPlans} />
      <Stack.Screen name="SellerDashboard" component={SellerDashboard} />
      <Stack.Screen name="Checkout" component={Checkout} />
      <Stack.Screen name="OrderConfirmation" component={OrderConfirmation} />
      <Stack.Screen name="OrderHistory" component={OrderHistory} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen
        name="NotificationsScreen"
        component={NotificationsScreen}
      />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
    </Stack.Navigator>
  );
};

const Navigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const {isAuthenticated} = useSelector(state => state.auth);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // Check if user was on signup form before app was killed
        const wasOnSignupForm = await AsyncStorage.getItem('wasOnSignupForm');
        if (wasOnSignupForm === 'true') {
          // Remove token and clear flag
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('wasOnSignupForm');
          setIsLoading(false);
          return; // Skip checkAuth to show Login screen
        }

        // Normal auth check
        await dispatch(checkAuth()).unwrap();
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, [dispatch]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {isAuthenticated ? (
        <Stack.Screen name="Main">
          {() => (
            <DrawerNav.Navigator
              drawerContent={props => <Drawer {...props} />}
              screenOptions={{
                headerShown: false,
                drawerStyle: {
                  width: Math.min(Dimensions.get('window').width * 0.75, 300),
                },
              }}
              initialRouteName="HomeStack">
              <DrawerNav.Screen name="HomeStack" component={HomeStack} />
            </DrawerNav.Navigator>
          )}
        </Stack.Screen>
      ) : (
        <>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="OTP" component={OTP} />
          <Stack.Screen name="sellerSignup" component={SellerSignup} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default Navigator;
