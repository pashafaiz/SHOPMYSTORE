
// import React, {useEffect, useState} from 'react';
// import {createDrawerNavigator} from '@react-navigation/drawer';
// import {createNativeStackNavigator} from '@react-navigation/native-stack';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import {Dimensions} from 'react-native';
// import {useDispatch, useSelector} from 'react-redux';
// import {checkAuth} from '../redux/slices/authSlice';
// import Drawer from './Drawer';
// import BottomTabs from './BottomTabs';
// import DashBoard from '../AfterLogin/DashBoard';
// import Profile from '../AfterLogin/Profile';
// import Message from '../Message/Message';
// import ProductDetail from '../Products/ProductDetail';
// import UploadReel from '../AfterLogin/UploadReel';
// import ReelView from '../AfterLogin/ReelView';
// import UserProfile from '../UserProfile/UserProfile';
// import Categories from '../AfterLogin/Categories';
// import Rating from '../Components/Rating';
// import ProductSpecifications from '../Components/ProductSpecifications';
// import Login from '../BeforeLogin/Login';
// import SignUp from '../BeforeLogin/SignUp';
// import OTP from '../BeforeLogin/OTP';
// import SellerSignup from '../SellerSenerio/SellerSignup';
// import Support from '../constants/Support';
// import Chat from '../constants/Chat';
// import Settings from '../constants/Settings';
// import ChangeLanguage from '../constants/ChangeLanguage';
// import InviteFriends from '../constants/InviteFriends';
// import PremiumPlans from '../constants/PremiumPlans';
// import SellerDashboard from '../SellerSenerio/SellerDashboard';
// import SellerProducts from '../SellerSenerio/SellerProducts';
// import SellerOrders from '../SellerSenerio/SellerOrders';
// import SellerAnalytics from '../SellerSenerio/SellerAnalytics';
// import SellerProfile from '../SellerSenerio/SellerProfile';
// import ProductModal from '../Products/ProductModal';
// import Checkout from '../Products/Checkout';
// import OrderConfirmation from '../Products/OrderConfirmation';
// import OrderHistory from '../Products/OrderHistory';
// import Notifications from '../Message/Notifications';
// import NotificationsScreen from '../Message/NotificationScreen';
// import ForgotPassword from '../BeforeLogin/ForgotPassword';
// import Search from '../AfterLogin/Search';
// import CategoryProducts from '../Products/CategoryProducts';
// import ProductScreen from '../Products/ProductScreen';
// import KYCScreen from '../SellerSenerio/KYCScreen';
// import SellerPromos from '../SellerSenerio/SellerPromos';
// import SellerNotifications from '../SellerSenerio/SellerNotifications';
// import SellerSupport from '../SellerSenerio/SellerSupport';

// const Stack = createNativeStackNavigator();
// const DrawerNav = createDrawerNavigator();

// const HomeStack = () => {
//   return (
//     <Stack.Navigator screenOptions={{headerShown: false}}>
//       <Stack.Screen name="BottomTabs" component={BottomTabs} />
//       <Stack.Screen name="DashBoard" component={DashBoard} />
//       <Stack.Screen name="Profile" component={Profile} />
//       <Stack.Screen name="Message" component={Message} />
//       <Stack.Screen name="ProductDetail" component={ProductDetail} />
//       <Stack.Screen name="ProductModal" component={ProductModal} />
//       <Stack.Screen name="UploadReel" component={UploadReel} />
//       <Stack.Screen name="ReelView" component={ReelView} />
//       <Stack.Screen name="UserProfile" component={UserProfile} />
//       <Stack.Screen name="Categories" component={Categories} />
//       <Stack.Screen name="Rating" component={Rating} />
//       <Stack.Screen
//         name="ProductSpecifications"
//         component={ProductSpecifications}
//       />
//       <Stack.Screen name="Support" component={Support} />
//       <Stack.Screen name="Chat" component={Chat} />
//       <Stack.Screen name="Settings" component={Settings} />
//       <Stack.Screen name="ChangeLanguage" component={ChangeLanguage} />
//       <Stack.Screen name="InviteFriends" component={InviteFriends} />
//       <Stack.Screen name="PremiumPlans" component={PremiumPlans} />
//       <Stack.Screen name="SellerDashboard" component={SellerDashboard} />
//       <Stack.Screen name="SellerProducts" component={SellerProducts} />
//       <Stack.Screen name="SellerOrders" component={SellerOrders} />
//       <Stack.Screen name="SellerAnalytics" component={SellerAnalytics} />
//       <Stack.Screen name="SellerProfile" component={SellerProfile} />
//       <Stack.Screen name="Checkout" component={Checkout} />
//       <Stack.Screen name="OrderConfirmation" component={OrderConfirmation} />
//       <Stack.Screen name="OrderHistory" component={OrderHistory} />
//       <Stack.Screen name="Notifications" component={Notifications} />
//       <Stack.Screen
//         name="NotificationsScreen"
//         component={NotificationsScreen}
//       />
//       <Stack.Screen name="Search" component={Search} />
//       <Stack.Screen name="CategoryProducts" component={CategoryProducts} />
//       <Stack.Screen name="ProductScreen" component={ProductScreen} />
//       <Stack.Screen name="KYCScreen" component={KYCScreen} />
//       <Stack.Screen name="SellerPromos" component={SellerPromos} />
//       <Stack.Screen
//         name="SellerNotifications"
//         component={SellerNotifications}
//       />
//       <Stack.Screen name="SellerSupport"component={SellerSupport}/>
//     </Stack.Navigator>
//   );
// };

// const Navigator = () => {
//   const [isLoading, setIsLoading] = useState(true);
//   const dispatch = useDispatch();
//   const {isAuthenticated} = useSelector(state => state.auth);

//   useEffect(() => {
//     const checkLoginStatus = async () => {
//       try {
//         const wasOnSignupForm = await AsyncStorage.getItem('wasOnSignupForm');
//         if (wasOnSignupForm === 'true') {
//           await AsyncStorage.multiRemove([
//             'userToken',
//             'wasOnSignupForm',
//             'user',
//           ]);
//           console.log('Cleared AsyncStorage due to wasOnSignupForm');
//           setIsLoading(false);
//           return;
//         }
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
//     <Stack.Navigator screenOptions={{headerShown: false}}>
//       {isAuthenticated ? (
//         <Stack.Screen name="Main">
//           {() => (
//             <DrawerNav.Navigator
//               drawerContent={props => <Drawer {...props} />}
//               screenOptions={{
//                 headerShown: false,
//                 drawerStyle: {
//                   width: Math.min(Dimensions.get('window').width * 0.75, 300),
//                 },
//               }}
//               initialRouteName="HomeStack">
//               <DrawerNav.Screen name="HomeStack" component={HomeStack} />
//             </DrawerNav.Navigator>
//           )}
//         </Stack.Screen>
//       ) : (
//         <>
//           <Stack.Screen name="Login" component={Login} />
//           <Stack.Screen name="SignUp" component={SignUp} />
//           <Stack.Screen name="OTP" component={OTP} />
//           <Stack.Screen name="SellerSignup" component={SellerSignup} />
//           <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
//         </>
//       )}
//     </Stack.Navigator>
//   );
// };

// export default Navigator;









import React, { useEffect, useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dimensions } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from '../redux/slices/authSlice';
import Drawer from './Drawer';
import BottomTabs from './BottomTabs';
import DashBoard from '../AfterLogin/DashBoard';
import Profile from '../AfterLogin/Profile';
import Message from '../Message/Message';
import ProductDetail from '../Products/ProductDetail';
import UploadReel from '../AfterLogin/UploadReel';
import ReelView from '../AfterLogin/ReelView';
import UserProfile from '../UserProfile/UserProfile';
import Categories from '../AfterLogin/Categories';
import Rating from '../Components/Rating';
import ProductSpecifications from '../Components/ProductSpecifications';
import Login from '../BeforeLogin/Login';
import SignUp from '../BeforeLogin/SignUp';
import OTP from '../BeforeLogin/OTP';
import SellerSignup from '../SellerSenerio/SellerSignup';
import Support from '../constants/Support';
import Chat from '../constants/Chat';
import Settings from '../constants/Settings';
import ChangeLanguage from '../constants/ChangeLanguage';
import InviteFriends from '../constants/InviteFriends';
import PremiumPlans from '../constants/PremiumPlans';
import SellerDashboard from '../SellerSenerio/SellerDashboard';
import SellerProducts from '../SellerSenerio/SellerProducts';
import SellerOrders from '../SellerSenerio/SellerOrders';
import SellerAnalytics from '../SellerSenerio/SellerAnalytics';
import SellerProfile from '../SellerSenerio/SellerProfile';
import ProductModal from '../Products/ProductModal';
import Checkout from '../Products/Checkout';
import OrderConfirmation from '../Products/OrderConfirmation';
import OrderHistory from '../Products/OrderHistory';
import Notifications from '../Message/Notifications';
import NotificationsScreen from '../Message/NotificationScreen';
import ForgotPassword from '../BeforeLogin/ForgotPassword';
import Search from '../AfterLogin/Search';
import CategoryProducts from '../Products/CategoryProducts';
import ProductScreen from '../Products/ProductScreen';
import KYCScreen from '../SellerSenerio/KYCScreen';
import SellerPromos from '../SellerSenerio/SellerPromos';
import SellerNotifications from '../SellerSenerio/SellerNotifications';
import SellerSupport from '../SellerSenerio/SellerSupport';
import Management from '../SellerSenerio/Management';

const Stack = createNativeStackNavigator();
const DrawerNav = createDrawerNavigator();

// Stack navigator for authenticated user screens
const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Main app navigation */}
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
      <Stack.Screen name="ProductSpecifications" component={ProductSpecifications} />
      <Stack.Screen name="Support" component={Support} />
      <Stack.Screen name="Chat" component={Chat} />
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen name="ChangeLanguage" component={ChangeLanguage} />
      <Stack.Screen name="InviteFriends" component={InviteFriends} />
      <Stack.Screen name="PremiumPlans" component={PremiumPlans} />
      <Stack.Screen name="SellerDashboard" component={SellerDashboard} options={{ title: 'Seller Dashboard' }} />
      <Stack.Screen name="SellerProducts" component={SellerProducts} options={{ title: 'Seller Products' }} />
      <Stack.Screen name="SellerOrders" component={SellerOrders} options={{ title: 'Seller Orders' }} />
      <Stack.Screen name="SellerAnalytics" component={SellerAnalytics} options={{ title: 'Seller Analytics' }} />
      <Stack.Screen name="SellerProfile" component={SellerProfile} options={{ title: 'Seller Profile' }} />
      <Stack.Screen name="SellerPromos" component={SellerPromos} options={{ title: 'Seller Promos' }} />
      <Stack.Screen name="SellerNotifications" component={SellerNotifications} options={{ title: 'Seller Notifications' }} />
      <Stack.Screen name="SellerSupport" component={SellerSupport} options={{ title: 'Seller Support' }} />
      <Stack.Screen name="Checkout" component={Checkout} />
      <Stack.Screen name="OrderConfirmation" component={OrderConfirmation} />
      <Stack.Screen name="OrderHistory" component={OrderHistory} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
      <Stack.Screen name="Search" component={Search} />
      <Stack.Screen name="CategoryProducts" component={CategoryProducts} />
      <Stack.Screen name="ProductScreen" component={ProductScreen} />
      <Stack.Screen name="KYCScreen" component={KYCScreen} />
      <Stack.Screen name="Management" component={Management} />
    </Stack.Navigator>
  );
};

// Main navigator handling authentication
const Navigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const wasOnSignupForm = await AsyncStorage.getItem('wasOnSignupForm');
        if (wasOnSignupForm === 'true') {
          await AsyncStorage.multiRemove(['userToken', 'wasOnSignupForm', 'user']);
          console.log('Cleared AsyncStorage due to wasOnSignupForm');
          setIsLoading(false);
          return;
        }
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
    return null; // Optionally replace with a loading screen component
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main">
          {() => (
            <DrawerNav.Navigator
              drawerContent={(props) => <Drawer {...props} />}
              screenOptions={{
                headerShown: false,
                drawerStyle: {
                  width: Math.min(Dimensions.get('window').width * 0.75, 300),
                },
              }}
              initialRouteName="HomeStack"
            >
              <DrawerNav.Screen name="HomeStack" component={HomeStack} />
            </DrawerNav.Navigator>
          )}
        </Stack.Screen>
      ) : (
        <>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="OTP" component={OTP} />
          <Stack.Screen name="SellerSignup" component={SellerSignup} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default Navigator;