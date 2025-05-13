// import React, { useRef, createContext, useContext, useState } from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import { StyleSheet, TouchableOpacity, Animated, Dimensions, View } from 'react-native';
// import { LinearGradient } from 'react-native-linear-gradient';
// import { useSelector } from 'react-redux';
// import DashBoard from '../AfterLogin/DashBoard';
// import Reels from '../AfterLogin/Reels';
// import Categories from '../AfterLogin/Categories';
// import Profile from '../AfterLogin/Profile';
// import SellerDashboard from '../SellerSenerio/SellerDashboard';

// const { width, height } = Dimensions.get('window');
// const Tab = createBottomTabNavigator();

// const ScrollContext = createContext();

// export const useScroll = () => useContext(ScrollContext);

// export const ScrollProvider = ({ children }) => {
//   const tabOffsetValue = useRef(new Animated.Value(0)).current;
//   const [tabBarVisible, setTabBarVisible] = useState(true);
  
//   const hideTabBar = () => {
//     if (tabBarVisible) {
//       Animated.timing(tabOffsetValue, {
//         toValue: 100,
//         duration: 200,
//         useNativeDriver: true,
//       }).start();
//       setTabBarVisible(false);
//     }
//   };
  
//   const showTabBar = () => {
//     if (!tabBarVisible) {
//       Animated.timing(tabOffsetValue, {
//         toValue: 0,
//         duration: 200,
//         useNativeDriver: true,
//       }).start();
//       setTabBarVisible(true);
//     }
//   };

//   return (
//     <ScrollContext.Provider value={{ hideTabBar, showTabBar, tabBarVisible }}>
//       {children}
//       <BottomTabs tabOffsetValue={tabOffsetValue} />
//     </ScrollContext.Provider>
//   );
// };

// const BottomTabs = ({ tabOffsetValue }) => {
//   const { user } = useSelector((state) => state.profile);
//   const isSeller = user?.userType === 'seller';

//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         tabBarIcon: ({ color, size }) => {
//           let iconName;

//           if (route.name === 'DashBoard') {
//             iconName = 'home-outline';
//           } else if (route.name === 'Profile' || route.name === 'SellerDashboard') {
//             iconName = 'person-outline';
//           } else if (route.name === 'Categories') {
//             iconName = 'grid-outline';
//           } else if (route.name === 'Reels') {
//             iconName = 'play-circle-outline';
//           }

//           return <Ionicons name={iconName} size={size} color={color} />;
//         },
//         tabBarActiveTintColor: '#7B61FF',
//         tabBarInactiveTintColor: '#9CA3AF',
//         headerShown: false,
//         tabBarButton: (props) => (
//           <TouchableOpacity activeOpacity={0.7} {...props} />
//         ),
//         tabBarStyle: {
//           position: 'absolute',
//           height: 60,
//           borderTopWidth: 0,
//           elevation: 0,
//           transform: [{ translateY: tabOffsetValue }],
//         },
//         tabBarBackground: () => (
//           <LinearGradient
//              colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']}
//             style={styles.tabBarBackground}
//           />
//         ),
//       })}
//     >
//       <Tab.Screen name="DashBoard">
//         {(props) => <ScrollViewWrapper ScreenComponent={DashBoard} {...props} />}
//       </Tab.Screen>
//       <Tab.Screen name="Reels">
//         {(props) => <ScrollViewWrapper ScreenComponent={Reels} {...props} />}
//       </Tab.Screen>
//       <Tab.Screen name="Categories">
//         {(props) => <ScrollViewWrapper ScreenComponent={Categories} {...props} />}
//       </Tab.Screen>
//       <Tab.Screen name={isSeller ? 'SellerDashboard' : 'Profile'}>
//         {(props) => (
//           <ScrollViewWrapper
//             ScreenComponent={isSeller ? SellerDashboard : Profile}
//             {...props}
//           />
//         )}
//       </Tab.Screen>
//     </Tab.Navigator>
//   );
// };

// const ScrollViewWrapper = ({ ScreenComponent, ...props }) => {
//   const { hideTabBar, showTabBar } = useScroll();
//   const lastOffset = useRef(0);
//   const scrollThreshold = 50; // Minimum scroll distance to trigger hide/show
//   const isScrollingDown = useRef(false);

//   const handleScroll = (event) => {
//     const currentOffset = event.nativeEvent.contentOffset.y;
//     const scrollDifference = currentOffset - lastOffset.current;

//     // Only trigger if user scrolls more than the threshold
//     if (Math.abs(scrollDifference) > scrollThreshold) {
//       if (scrollDifference > 0 && currentOffset > 10) {
//         // Scrolling down
//         if (!isScrollingDown.current) {
//           hideTabBar();
//           isScrollingDown.current = true;
//         }
//       } else {
//         // Scrolling up - only show if at top or explicitly scrolling up
//         if (isScrollingDown.current || currentOffset <= 10) {
//           showTabBar();
//           isScrollingDown.current = false;
//         }
//       }
//       lastOffset.current = currentOffset;
//     }
//   };

//   return (
//     <ScreenComponent 
//       {...props} 
//       onScroll={handleScroll}
//       scrollEventThrottle={16}
//     />
//   );
// };

// const styles = StyleSheet.create({
//   tabBarBackground: {
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     top: 0,
//     bottom: 0,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     overflow: 'hidden',
//   },
// });

// export default ScrollProvider;





import React, { useRef, createContext, useContext, useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StyleSheet, TouchableOpacity, Animated, Dimensions, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import DashBoard from '../AfterLogin/DashBoard';
import Reels from '../AfterLogin/Reels';
import Categories from '../AfterLogin/Categories';
import Profile from '../AfterLogin/Profile';
import SellerDashboard from '../SellerSenerio/SellerDashboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [isSeller, setIsSeller] = useState(null); // null indicates loading

  // Check user type from Redux or AsyncStorage on mount
  useEffect(() => {
    const determineUserType = async () => {
      try {
        if (user?.userType) {
          // User data is available in Redux
          setIsSeller(user.userType === 'seller');
        } else {
          // Fallback to AsyncStorage if user is not yet in Redux
          const storedUser = await AsyncStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setIsSeller(parsedUser.userType === 'seller');
          } else {
            // Default to buyer if no user data is found
            setIsSeller(false);
          }
        }
      } catch (error) {
        console.error('Error determining user type:', error);
        setIsSeller(false); // Default to buyer on error
      }
    };

    determineUserType();
  }, [user]);

  // Show loader while user type is being determined
  if (isSeller === null) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#7B61FF" />
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'DashBoard') {
            iconName = 'home-outline';
          } else if (route.name === 'Profile' || route.name === 'SellerDashboard') {
            iconName = 'person-outline';
          } else if (route.name === 'Categories') {
            iconName = 'grid-outline';
          } else if (route.name === 'Reels') {
            iconName = 'play-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#7B61FF',
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,
        tabBarButton: (props) => (
          <TouchableOpacity activeOpacity={0.7} {...props} />
        ),
        tabBarStyle: {
          position: 'absolute',
          height: 60,
          borderTopWidth: 0,
          elevation: 0,
          transform: [{ translateY: tabOffsetValue }],
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']}
            style={styles.tabBarBackground}
          />
        ),
        tabBarLabel: route.name === 'SellerDashboard' ? 'Dashboard' : route.name,
      })}
    >
      <Tab.Screen name="DashBoard">
        {(props) => <ScrollViewWrapper ScreenComponent={DashBoard} {...props} />}
      </Tab.Screen>
      <Tab.Screen name="Reels">
        {(props) => <ScrollViewWrapper ScreenComponent={Reels} {...props} />}
      </Tab.Screen>
      <Tab.Screen name="Categories">
        {(props) => <ScrollViewWrapper ScreenComponent={Categories} {...props} />}
      </Tab.Screen>
      <Tab.Screen name={isSeller ? 'SellerDashboard' : 'Profile'}>
        {(props) => (
          <ScrollViewWrapper
            ScreenComponent={isSeller ? SellerDashboard : Profile}
            {...props}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const ScrollViewWrapper = ({ ScreenComponent, ...props }) => {
  const { hideTabBar, showTabBar } = useScroll();
  const lastOffset = useRef(0);
  const scrollThreshold = 50; // Minimum scroll distance to trigger hide/show
  const isScrollingDown = useRef(false);

  const handleScroll = (event) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const scrollDifference = currentOffset - lastOffset.current;

    // Only trigger if user scrolls more than the threshold
    if (Math.abs(scrollDifference) > scrollThreshold) {
      if (scrollDifference > 0 && currentOffset > 10) {
        // Scrolling down
        if (!isScrollingDown.current) {
          hideTabBar();
          isScrollingDown.current = true;
        }
      } else {
        // Scrolling up - only show if at top or explicitly scrolling up
        if (isScrollingDown.current || currentOffset <= 10) {
          showTabBar();
          isScrollingDown.current = false;
        }
      }
      lastOffset.current = currentOffset;
    }
  };

  return (
    <ScreenComponent 
      {...props} 
      onScroll={handleScroll}
      scrollEventThrottle={16}
    />
  );
};

const styles = StyleSheet.create({
  tabBarBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A0B3B',
  },
});

export default ScrollProvider;