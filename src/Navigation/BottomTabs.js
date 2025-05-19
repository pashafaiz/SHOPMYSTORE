import React, { useRef, createContext, useContext, useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StyleSheet, TouchableOpacity, Animated, Dimensions, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DashBoard from '../AfterLogin/DashBoard';
import Reels from '../AfterLogin/Reels';
import Categories from '../AfterLogin/Categories';
import Profile from '../AfterLogin/Profile';
import SellerDashboard from '../SellerSenerio/SellerDashboard';
import SellerProducts from '../SellerSenerio/SellerProducts';
import SellerOrders from '../SellerSenerio/SellerOrders';
import SellerProfile from '../SellerSenerio/SellerProfile';
import {
  PRIMARY_THEME_COLOR, SUBTEXT_THEME_COLOR, BACKGROUND_GRADIENT,
} from '../constants/GlobalConstants';
import Management from '../SellerSenerio/Management';

const { width, height } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

const ScrollContext = createContext();

export const useScroll = () => useContext(ScrollContext);

export const ScrollProvider = ({ children }) => {
  const tabOffsetValue = useRef(new Animated.Value(0)).current;
  const [tabBarVisible, setTabBarVisible] = useState(true);

  const hideTabBar = () => {
    if (tabBarVisible) {
      Animated.timing(tabOffsetValue, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }).start();
      setTabBarVisible(false);
    }
  };

  const showTabBar = () => {
    if (!tabBarVisible) {
      Animated.timing(tabOffsetValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      setTabBarVisible(true);
    }
  };

  return (
    <ScrollContext.Provider value={{ hideTabBar, showTabBar, tabBarVisible }}>
      {children}
      <BottomTabs tabOffsetValue={tabOffsetValue} />
    </ScrollContext.Provider>
  );
};

const BottomTabs = ({ tabOffsetValue }) => {
  const { user } = useSelector((state) => state.profile);
  const [isSeller, setIsSeller] = useState(null);

  useEffect(() => {
    const determineUserType = async () => {
      try {
        if (user?.userType) {
          setIsSeller(user.userType === 'seller');
        } else {
          const storedUser = await AsyncStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setIsSeller(parsedUser.userType === 'seller');
          } else {
            setIsSeller(false);
          }
        }
      } catch (error) {
        console.error('Error determining user type:', error);
        setIsSeller(false);
      }
    };
    determineUserType();
  }, [user]);

  if (isSeller === null) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={PRIMARY_THEME_COLOR} />
      </View>
    );
  }

  return isSeller ? (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'SellerDashboard') {
            iconName = 'stats-chart-outline';
          } else if (route.name === 'Management') {
            iconName = 'cube-outline';
          } else if (route.name === 'SellerProducts') {
            iconName = 'cart-outline';
          } else if (route.name === 'SellerProfile') {
            iconName = 'person-outline';
          }
          return <Ionicons name={iconName} size={20} color={color} />;
        },
        tabBarActiveTintColor: PRIMARY_THEME_COLOR,
        tabBarInactiveTintColor: SUBTEXT_THEME_COLOR,
        headerShown: false,
        tabBarButton: (props) => <TouchableOpacity activeOpacity={0.7} {...props} />,
        tabBarStyle: {
          position: 'absolute',
          height: 50,
          borderTopWidth: 0,
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          ...styles.tabBarShadow,
          transform: [{ translateY: tabOffsetValue }],
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={["white","white"]}
            style={styles.tabBarBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: 0,
          fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
        },
      })}
    >
      <Tab.Screen
        name="SellerDashboard"
        options={{ tabBarLabel: 'Dashboard' }}
        component={SellerDashboard}
      />
      <Tab.Screen
        name="Management"
        options={{ tabBarLabel: 'Management' }}
        component={Management}
      />
      <Tab.Screen
        name="SellerProducts"
        options={{ tabBarLabel: 'Products' }}
        component={SellerProducts}
      />
      <Tab.Screen
        name="SellerProfile"
        options={{ tabBarLabel: 'Profile' }}
        component={SellerProfile}
      />
    </Tab.Navigator>
  ) : (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'DashBoard') {
            iconName = 'home-outline';
          } else if (route.name === 'Reels') {
            iconName = 'play-circle-outline';
          } else if (route.name === 'Categories') {
            iconName = 'grid-outline';
          } else if (route.name === 'Profile') {
            iconName = 'person-outline';
          }
          return <Ionicons name={iconName} size={20} color={color} />;
        },
        tabBarActiveTintColor: PRIMARY_THEME_COLOR,
        tabBarInactiveTintColor: SUBTEXT_THEME_COLOR,
        headerShown: false,
        tabBarButton: (props) => <TouchableOpacity activeOpacity={0.7} {...props} />,
        tabBarStyle: {
          position: 'absolute',
          height: 50,
          borderTopWidth: 0,
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          ...styles.tabBarShadow,
          transform: [{ translateY: tabOffsetValue }],
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={["#fff","#fff"]}
            style={styles.tabBarBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: 0,
          fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
        },
      })}
    >
      <Tab.Screen name="DashBoard" component={DashBoard} />
      <Tab.Screen name="Reels" component={Reels} />
      <Tab.Screen name="Categories" component={Categories} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  tabBarShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
});

export default ScrollProvider;