/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Platform,
  Dimensions,
  Text,
  Animated,
  Easing,
  LogBox,
} from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './src/redux/store';
import Navigator from './src/Navigation/Navigator';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';
import { checkAuth } from './src/redux/slices/authSlice';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from './src/constants/ThemeContext';
import { getMessaging, requestPermission, getToken, onMessage } from '@react-native-firebase/messaging';
import { getInstallations, getId } from '@react-native-firebase/installations';
import { createNotification, addLocalNotification } from './src/redux/slices/notificationsSlice';
import {
  BASE_URL,
  TOAST_POSITION,
  TOAST_TOP_OFFSET,
  TOAST_VISIBILITY_TIME,
  CREATE_NOTIFICATION_ERROR,
} from './src/constants/GlobalConstants';
import axios from 'axios';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Something went wrong. Please restart the app.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// Set to track processed notification keys
const processedNotificationKeys = new Set();

// Debounce function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = size => Math.round(size * scaleFactor);

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 34;

const navigationRef = React.createRef();
LogBox.ignoreAllLogs(true);

const Particle = ({ index, fadeAnim }) => {
  const orbitAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const orbit = Animated.loop(
      Animated.timing(orbitAnim, {
        toValue: 1,
        duration: 1500 + index * 80,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const scale = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.4,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    orbit.start();
    scale.start();
    return () => {
      orbit.stop();
      scale.stop();
    };
  }, [index]);

  const translateX = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      Math.cos(index * Math.PI / 3) * scale(35 + index * 4),
      Math.cos(index * Math.PI / 3) * scale(35 + index * 4),
    ],
  });

  const translateY = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      Math.sin(index * Math.PI / 3) * scale(25 + index * 3),
      Math.sin(index * Math.PI / 3) * scale(25 + index * 3),
    ],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          transform: [{ translateX }, { translateY }, { scale: scaleAnim }],
          opacity: fadeAnim,
        },
      ]}
    />
  );
};

const Sparkle = ({ index, sparkleOpacityAnim }) => {
  const moveXAnim = useRef(new Animated.Value(0)).current;
  const moveYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const move = Animated.parallel([
      Animated.timing(moveXAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(moveYAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    move.start();
    return () => move.stop();
  }, [index]);

  const startX = index % 4 === 0 ? scale(60) : index % 4 === 1 ? scale(-60) : index % 4 === 2 ? scale(40) : scale(-40);
  const startY = index % 4 === 0 ? scale(-60) : index % 4 === 1 ? scale(60) : index % 4 === 2 ? scale(-40) : scale(40);

  const endX = index < 4 ? (index % 2 === 0 ? scale(10) : scale(-10)) : (index % 2 === 0 ? scale(20) : scale(-20));
  const endY = index < 4 ? (index < 2 ? scale(-20) : scale(20)) : (index < 6 ? scale(-10) : scale(10));

  const translateX = moveXAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [startX, endX],
  });

  const translateY = moveYAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [startY, endY],
  });

  return (
    <Animated.View
      style={[
        styles.sparkle,
        {
          transform: [{ translateX }, { translateY }],
          opacity: sparkleOpacityAnim,
        },
      ]}
    />
  );
};

const Burst = ({ index, fadeAnim }) => {
  const moveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const move = Animated.timing(moveAnim, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    move.start();
    return () => move.stop();
  }, [index]);

  const translateX = moveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.cos(index * Math.PI / 4) * scale(30)],
  });

  const translateY = moveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.sin(index * Math.PI / 4) * scale(30)],
  });

  return (
    <Animated.View
      style={[
        styles.burst,
        {
          transform: [{ translateX }, { translateY }],
          opacity: fadeAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 0.5, 0],
          }),
        },
      ]}
    />
  );
};

const showNotificationToast = async (remoteMessage, dispatch, user, showSplash, initialRoute, navigationRef) => {
  if (showSplash || initialRoute === null) {
    console.log('Skipping notification due to splash screen or uninitialized route');
    return;
  }

  const currentTime = Date.now();
  const notificationId = remoteMessage.data?.notificationId || remoteMessage.messageId || `${currentTime}`;

  const notificationKey = `${
    remoteMessage.notification?.title || remoteMessage.data?.title || 'New Notification'
  }:${remoteMessage.notification?.body || remoteMessage.data?.body || 'Check it out!'}:${
    remoteMessage.data?.userId || ''
  }`;

  if (processedNotificationKeys.has(notificationKey)) {
    console.log('Skipping duplicate notification:', { notificationId, notificationKey });
    return;
  }

  processedNotificationKeys.add(notificationKey);

  const notification = {
    title: remoteMessage.notification?.title || remoteMessage.data?.title || 'New Notification',
    body: remoteMessage.notification?.body || remoteMessage.data?.body || 'Check it out!',
    timestamp: remoteMessage.data?.timestamp || currentTime,
    id: notificationId,
  };

  Toast.show({
    type: 'success',
    text1: notification.title,
    text2: notification.body,
    position: TOAST_POSITION,
    visibilityTime: TOAST_VISIBILITY_TIME,
    topOffset: TOAST_TOP_OFFSET,
    onPress: () => {
      if (navigationRef.current) {
        try {
          navigationRef.current.navigate('Notifications');
          console.log('Navigated to Notifications');
        } catch (error) {
          console.error('Navigation error:', error);
        }
      } else {
        console.warn('Navigation ref not ready');
      }
    },
  });

  console.log('Processing new notification:', {
    notificationId,
    notificationKey,
    remoteMessage: JSON.stringify(remoteMessage, null, 2),
  });

  if (user?.id) {
    try {
      await dispatch(createNotification({
        userId: user.id,
        title: notification.title,
        body: notification.body,
      })).unwrap();
      console.log('Notification saved to backend:', notification);
    } catch (error) {
      console.error('Failed to save notification to backend:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: CREATE_NOTIFICATION_ERROR,
        position: TOAST_POSITION,
        visibilityTime: TOAST_VISIBILITY_TIME,
        topOffset: TOAST_TOP_OFFSET,
      });
      dispatch(addLocalNotification(notification));
    }
  } else {
    dispatch(addLocalNotification(notification));
    console.log('Notification stored locally:', notification);
  }

  setTimeout(() => {
    processedNotificationKeys.delete(notificationKey);
    console.log('Cleared processed notification key:', notificationKey);
  }, 60000);
};

const AppContent = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [initialRoute, setInitialRoute] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const sparkleOpacityAnim = useRef(new Animated.Value(0)).current;
  const starGlowAnim = useRef(new Animated.Value(1)).current;
  const titleLetterTranslateX = useRef(
    'Luxe Store'.split('').map((_, i) => new Animated.Value(i % 4 === 0 ? scale(50) : i % 4 === 1 ? scale(-50) : i % 4 === 2 ? scale(30) : scale(-30)))
  ).current;
  const titleLetterTranslateY = useRef(
    'Luxe Store'.split('').map((_, i) => new Animated.Value(i % 4 === 0 ? scale(-50) : i % 4 === 1 ? scale(50) : i % 4 === 2 ? scale(-30) : scale(30)))
  ).current;
  const titleLetterScale = useRef(
    'Luxe Store'.split('').map(() => new Animated.Value(0))
  ).current;
  const welcomeLetterOpacity = useRef(
    'Welcome to Luxe Store'.split('').map(() => new Animated.Value(0))
  ).current;

  const debouncedShowNotificationToast = useCallback(
    debounce((remoteMessage) => {
      showNotificationToast(remoteMessage, dispatch, user, showSplash, initialRoute, navigationRef);
    }, 50),
    [dispatch, user, showSplash, initialRoute]
  );

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '176825143733-v9jrtn0g0b77n2e0ia02hkjmn4ughvre.apps.googleusercontent.com',
      offlineAccess: true,
    });

    const requestUserPermission = async () => {
      try {
        const authStatus = await requestPermission();
        const enabled = authStatus === 1 || authStatus === 2;
        console.log('Notification permission status:', enabled ? 'Granted' : 'Denied', authStatus);
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    };

    const getAndSaveFCMToken = async () => {
      try {
        const token = await getToken(getMessaging());
        console.log('FCM Token:', token);
        await AsyncStorage.setItem('fcmToken', token);

        if (user?.id) {
          const authToken = await AsyncStorage.getItem('userToken');
          if (!authToken) {
            throw new Error('Authentication token missing');
          }
          await axios.post(
            `${BASE_URL}/api/notifications/save-fcm-token`,
            {
              userId: user.id,
              fcmToken: token,
            },
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json',
              },
            }
          );
          console.log('FCM token saved to backend for user:', user.id);
        }
      } catch (error) {
        console.error('Error fetching/saving FCM token:', error);
      }
    };

    const getInstallationId = async () => {
      try {
        const installationsInstance = getInstallations();
        const installationId = await getId(installationsInstance);
        console.log('Firebase Installation ID:', installationId);
        await AsyncStorage.setItem('installationId', installationId);
      } catch (error) {
        console.error('Error fetching Installation ID:', error);
      }
    };

    const unsubscribeForeground = onMessage(getMessaging(), async remoteMessage => {
      await debouncedShowNotificationToast(remoteMessage);
    });

    const initializeNotifications = async () => {
      await requestUserPermission();
      await getAndSaveFCMToken();
      await getInstallationId();
    };

    initializeNotifications();

    return () => {
      unsubscribeForeground();
    };
  }, [dispatch, showSplash, initialRoute, user, debouncedShowNotificationToast]);

  useEffect(() => {
    const animations = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim1, {
            toValue: 1.1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim1, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
    ]);

    animations.start();

    titleLetterScale.forEach((anim, index) => {
      Animated.sequence([
        Animated.spring(anim, {
          toValue: 1.2,
          friction: 3,
          tension: 80,
          delay: 150 + index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    });

    titleLetterTranslateX.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 500,
        delay: 150 + index * 50,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    titleLetterTranslateY.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 500,
        delay: 150 + index * 50,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    welcomeLetterOpacity.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: 600 + index * 40,
        useNativeDriver: true,
      }).start();
    });

    const starTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0.2,
          duration: 300,
          useNativeDriver: true,
        }),
        ...titleLetterScale.map(anim =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          })
        ),
        ...welcomeLetterOpacity.map(anim =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          })
        ),
        Animated.timing(sparkleOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(starGlowAnim, {
            toValue: 1.1,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(starGlowAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        { iterations: 1 }
      ).start();

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(starGlowAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleOpacityAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => setShowSplash(false));
      }, 2500);
    }, 3500);

    return () => {
      clearTimeout(starTimer);
      animations.stop();
    };
  }, []);

  useEffect(() => {
    if (!showSplash) {
      dispatch(checkAuth()).then(() => {
        setInitialRoute(isAuthenticated ? 'BottomTabs' : 'RoleSelection');
      });
    }
  }, [showSplash, isAuthenticated, dispatch]);

  if (showSplash || initialRoute === null) {
    return (
      <View style={styles.splashContainer}>
        <LinearGradient
          colors={['#1A0033', '#3C007A', '#9F5FFF', '#D946EF']}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Animated.View
          style={[
            styles.ring1,
            {
              transform: [{ scale: pulseAnim1 }],
              opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.animationContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.welcomeTextContainer}>
            {'Welcome to Luxe Store'.split('').map((char, index) => (
              <Animated.Text
                key={`welcome-${index}`}
                style={[
                  styles.splashText,
                  {
                    opacity: welcomeLetterOpacity[index],
                  },
                ]}
              >
                {char}
              </Animated.Text>
            ))}
          </View>
        </Animated.View>
        <View style={styles.titleTextContainer}>
          {'Luxe Store'.split('').map((char, index) => (
            <Animated.Text
              key={`title-${index}`}
              style={[
                styles.mainTitle,
                {
                  transform: [
                    { translateX: titleLetterTranslateX[index] },
                    { translateY: titleLetterTranslateY[index] },
                    { scale: titleLetterScale[index] },
                  ],
                },
              ]}
            >
              {char}
            </Animated.Text>
          ))}
        </View>
        {[...Array(6)].map((_, index) => (
          <Particle key={index} index={index} fadeAnim={fadeAnim} />
        ))}
        <Animated.View
          style={[
            styles.starContainer,
            {
              transform: [{ scale: starGlowAnim }],
            },
          ]}
        >
          {[...Array(8)].map((_, index) => (
            <Sparkle key={`sparkle-${index}`} index={index} sparkleOpacityAnim={sparkleOpacityAnim} />
          ))}
          {[...Array(6)].map((_, index) => (
            <Burst key={`burst-${index}`} index={index} fadeAnim={starGlowAnim} />
          ))}
        </Animated.View>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.rootContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#1A0033"
          translucent={false}
        />
        <View style={{ height: STATUS_BAR_HEIGHT, backgroundColor: '#8ec5fc' }} />
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
          <Navigator initialRouteName={initialRoute} />
          <Toast />
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <NavigationContainer ref={navigationRef}>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </NavigationContainer>
      </Provider>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#1A0033',
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A0033',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top:0,
    bottom: 0,
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    position: 'absolute',
    top: 10,
  },
  titleTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  welcomeTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    position: 'absolute',
    top: scale(50),
  },
  mainTitle: {
    fontSize: scale(30),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  splashText: {
    fontSize: scale(15),
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  ring1: {
    position: 'absolute',
    width: scale(160),
    height: scale(160),
    borderRadius: scale(80),
    borderWidth: scale(3),
    borderColor: 'rgba(159, 95, 255, 0.3)',
    backgroundColor: 'transparent',
    elevation: 10,
  },
  starContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 15,
  },
  sparkle: {
    position: 'absolute',
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: '#FFFFFF',
    elevation: 5,
  },
  burst: {
    position: 'absolute',
    width: scale(4),
    height: scale(4),
    borderRadius: scale(2),
    backgroundColor: '#F3E8FF',
    elevation: 3,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A0033',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: scale(15),
    textAlign: 'center',
    padding: scale(20),
  },
});

export default App;











// import React, { useState } from 'react';
// import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
// import Icon from 'react-native-vector-icons/FontAwesome';
// import * as Progress from 'react-native-progress';
// import LinearGradient from 'react-native-linear-gradient';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';

// const Stack = createStackNavigator();

// const MembershipSelection = ({ navigation }) => {
//   const [selectedPlan, setSelectedPlan] = useState('gold');

//   const plans = [
//     { id: 'gold', name: 'Gold', price: '$99', gradient: ['#FFF066', '#FFD900'] },
//     { id: 'diamond', name: 'Diamond', price: '$199', gradient: ['#B9F2FF', '#00BFFF'] },
//     { id: 'elite', name: 'Elite', price: '$299', gradient: ['#FF9A9E', '#FAD0C4'] },
//   ];

//   return (
//     <View style={styles.selectionContainer}>
//       <Text style={styles.selectionTitle}>Choose Your Plan</Text>

//       <View style={styles.plansContainer}>
//         {plans.map((plan) => (
//           <TouchableOpacity
//             key={plan.id}
//             onPress={() => setSelectedPlan(plan.id)}
//             style={styles.planButton}
//           >
//             <LinearGradient
//               colors={selectedPlan === plan.id ? plan.gradient : ['#f1f0f0', '#f1f0f0']}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 0 }}
//               style={[
//                 styles.planGradient,
//                 selectedPlan === plan.id && styles.selectedPlan,
//               ]}
//             >
//               <Text style={[
//                 styles.planName,
//                 selectedPlan === plan.id && styles.selectedText
//               ]}>
//                 {plan.name}
//               </Text>
//               <Text style={[
//                 styles.planPrice,
//                 selectedPlan === plan.id && styles.selectedText
//               ]}>
//                 {plan.price}
//               </Text>
//             </LinearGradient>
//           </TouchableOpacity>
//         ))}
//       </View>

//       <TouchableOpacity
//         style={styles.continueButton}
//         onPress={() => {
//           const selected = plans.find(plan => plan.id === selectedPlan);
//           navigation.navigate('ManageMembership', {
//             planId: selected.id,
//             planName: selected.name,
//             planPrice: selected.price,
//             planGradient: selected.gradient
//           });
//         }}
//       >
//         <LinearGradient
//           colors={['#FFF066', '#FFD900']}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 0 }}
//           style={styles.continueGradient}
//         >
//           <Text style={styles.continueText}>Continue</Text>
//         </LinearGradient>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const ManageMembership = ({ route }) => {
//   const { planId = 'gold', planName = 'Gold', planPrice = '$99', planGradient = ['#FFF066', '#FFD900'] } = route.params || {};
//   const [expandedFaqs, setExpandedFaqs] = useState([false, false, false, false]);

//   const toggleFaq = (index) => {
//     const newExpandedFaqs = [...expandedFaqs];
//     newExpandedFaqs[index] = !newExpandedFaqs[index];
//     setExpandedFaqs(newExpandedFaqs);
//   };

//   const faqs = [
//     {
//       question: 'What are the benefits of premium plans?',
//       answer: 'Lorem ipsum dolor sit amet consectetur. Curabitur proin ligula pharetra nibh ut viverra blandit nibh ac. Utricies posuere nulla tellus fermentum lorem sed. Hablantl tuctus convallis ut nullam ac Integer binarium. Mamorpore porta.',
//     },
//     {
//       question: 'How do I cancel my membership?',
//       answer: 'To cancel your membership, go to the Manage Membership section and select Cancel. Your membership will remain active until the end of your current billing period.',
//     },
//     {
//       question: 'Can I switch between different plans?',
//       answer: 'Yes, you can upgrade or downgrade your plan at any time. The changes will take effect at the start of your next billing cycle.',
//     },
//     {
//       question: 'What payment methods are accepted?',
//       answer: 'We accept a variety of payment methods including major credit cards (Visa, MasterCard, American Express), PayPal, and select digital wallets. You can manage your payment options in the Manage Payment section of your account settings.',
//     },
//   ];

//   const planDetails = {
//     gold: {
//       name: 'Gold Member',
//       color: '#FFD700',
//       gradient: ['#FFF066', '#FFD900'],
//       icon: require('./src/assets/Managegold.png'),
//     },
//     diamond: {
//       name: 'Diamond Member',
//       color: '#00BFFF',
//       gradient: ['#B9F2FF', '#00BFFF'],
//       icon: require('./src/assets/Managegold.png'),
//     },
//     elite: {
//       name: 'Elite Member',
//       color: '#FF6B6B',
//       gradient: ['#FF9A9E', '#FAD0C4'],
//       icon: require('./src/assets/Managegold.png'),
//     },
//   };

//   const currentPlan = planDetails[planId] || planDetails.gold;

//   const renderFaqItem = ({ item, index }) => (
//     <View style={styles.faqSection}>
//       <TouchableOpacity
//         style={styles.faqHeader}
//         onPress={() => toggleFaq(index)}
//         activeOpacity={0.8}
//       >
//         <Text style={styles.faqQuestion}>{item.question}</Text>
//         <Icon
//           name={expandedFaqs[index] ? 'chevron-up' : 'chevron-down'}
//           size={16}
//           color="#666"
//         />
//       </TouchableOpacity>

//       {expandedFaqs[index] && (
//         <Text style={styles.faqAnswer}>
//           {item.answer}
//         </Text>
//       )}
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={faqs}
//         renderItem={renderFaqItem}
//         keyExtractor={(item, index) => index.toString()}
//         ListHeaderComponent={
//           <>
//             <View style={styles.header}>
//               <Text style={styles.headerText}>Manage Membership</Text>
//               <Image
//                 source={{ uri: 'https://via.placeholder.com/20' }}
//                 style={styles.signalIcon}
//               />
//             </View>
//             <View style={styles.card}>
//               <Image
//                 style={styles.topImage}
//                 source={require('./src/assets/Managetop1.png')}
//                 resizeMode="cover"
//               />
//               <Image
//                 style={styles.goldIcon}
//                 source={currentPlan.icon}
//                 resizeMode="contain"
//               />
//               <View style={styles.infoContainer}>
//                 <View>
//                   <Text style={styles.title}>You are a{'\n'}{planName} Member</Text>
//                   <Text style={styles.subtitle}>
//                     Your plan valid till 02 June 2025
//                   </Text>
//                 </View>
//                 {/* <View style={styles.progressContainer}>
//                   <Progress.Circle
//                     size={60}
//                     progress={0.75}
//                     color={currentPlan.color}
//                     thickness={4}
//                     showsText={true}
//                     formatText={() => '19 \n days left'}
//                     textStyle={[styles.progressText, { color: currentPlan.color }]}
//                   />
//                 </View> */}

//                 <View style={styles.progressContainer}>
//   <View style={{ position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
//     <Progress.Circle
//       size={55}
//       progress={0.75}
//       color={currentPlan.color}
//       thickness={4}
//       showsText={false}
//     />

//     <View style={{ position: 'absolute', alignItems: 'center' }}>
//       <Text style={{ fontSize: 12, fontWeight: 'bold', color: 'black' }}>19</Text>
//       <Text style={{ fontSize: 9, color: currentPlan.color }}>days left</Text>
//     </View>
//   </View>
// </View>

//               </View>
//               <View style={styles.buttonContainer}>
//                 <TouchableOpacity>
//                   <View style={{ borderBottomWidth: 1.5, borderBottomColor: currentPlan.color }}>
//                     <Text style={{ color: currentPlan.color, fontSize: 16 }}>Membership Benefits</Text>
//                   </View>
//                 </TouchableOpacity>

//                 <TouchableOpacity>
//                   <LinearGradient
//                     colors={planGradient}
//                     start={{ x: 0, y: 0 }}
//                     end={{ x: 1, y: 0 }}
//                     style={styles.button}
//                   >
//                     <Text style={styles.buttonText}>Manage</Text>
//                   </LinearGradient>
//                 </TouchableOpacity>
//               </View>
//             </View>

//             <Text style={styles.sectionTitle}>Manage Payment</Text>
//             <View style={styles.paymentCard}>
//               <View style={styles.paymentDetails}>
//                 <Text style={{ fontSize: 16, fontWeight: '800' }}>3 Month {planName} Plan</Text>
//                 <Text style={styles.priceText}>{planPrice}</Text>
//               </View>
//               <Text style={styles.purchaseDate}>Purchase on 1 May 2025</Text>
//               <Text style={styles.paymentMethod}>By MasterCard ****2222</Text>
//               <TouchableOpacity style={styles.viewDetails}>
//                 <View style={{ borderBottomWidth: 1, borderBottomColor: currentPlan.color }}>
//                   <Text style={{ color: currentPlan.color }}>View Details</Text>
//                 </View>
//               </TouchableOpacity>
//             </View>

//             <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>Frequently Asked Questions</Text>
//           </>
//         }
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//       />
//     </View>
//   );
// };

// const App = () => {
//   return (
//     <NavigationContainer>
//       <Stack.Navigator initialRouteName="MembershipSelection" screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="MembershipSelection" component={MembershipSelection} />
//         <Stack.Screen name="ManageMembership" component={ManageMembership} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f1f0f0',
//   },
//   scrollContent: {
//     padding: 20,
//     flexGrow: 1,
//   },
//   header: {
//     alignItems: 'center',
//     marginBottom: 30,
//     top: 25,
//   },
//   headerText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   signalIcon: {
//     width: 20,
//     height: 20,
//   },
//   card: {
//     backgroundColor: '#FFF',
//     borderRadius: 20,
//     padding: 15,
//     alignItems: 'center',
//     marginBottom: 20,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   topImage: {
//     width: '111%',
//     height: 160,
//     position: 'absolute',
//     top: 0,
//   },
//   goldIcon: {
//     width: 110,
//     height: 110,
//     marginTop: 20,
//   },
//   infoContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     width: '100%',
//     paddingHorizontal: 10,
//     marginTop: 20,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//     textAlign: 'left',
//   },
//   subtitle: {
//     fontSize: 12,
//     color: '#666',
//     marginTop: 5,
//   },
//   progressContainer: {
//     alignItems: 'center',
//   },
//   progressText: {
//     fontSize: 10,
//     textAlign: 'center',
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     paddingHorizontal: 10,
//     marginTop: 20,
//     alignItems: 'center',
//   },
//   button: {
//     paddingVertical: 10,
//     paddingHorizontal: 60,
//     borderRadius: 40,
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: '#FFF',
//     fontWeight: 'bold',
//   },
//   paymentCard: {
//     backgroundColor: '#FFF',
//     borderRadius: 10,
//     padding: 15,
//     marginBottom: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//     height: 110,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   paymentDetails: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 14,
//   },
//   priceText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   purchaseDate: {
//     fontSize: 12,
//     color: '#666',
//     marginBottom: 10,
//   },
//   paymentMethod: {
//     fontSize: 12,
//     color: '#666',
//     marginBottom: 10,
//   },
//   viewDetails: {
//     alignItems: 'flex-end',
//     bottom: 25,
//     width: '25%',
//     alignSelf: 'flex-end',
//   },
//   faqSection: {
//     backgroundColor: '#FFF',
//     borderRadius: 10,
//     padding: 15,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//     marginBottom: 10,
//   },
//   faqHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   faqQuestion: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: '#333',
//     flex: 1,
//   },
//   faqAnswer: {
//     fontSize: 12,
//     color: '#666',
//     marginTop: 10,
//     lineHeight: 18,
//   },
//   selectionContainer: {
//     flex: 1,
//     backgroundColor: '#f1f0f0',
//     padding: 20,
//     justifyContent: 'center',
//   },
//   selectionTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginBottom: 30,
//   },
//   plansContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 30,
//   },
//   planButton: {
//     width: '30%',
//   },
//   planGradient: {
//     padding: 15,
//     borderRadius: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//     height: 120,
//   },
//   selectedPlan: {
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   planName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#666',
//     marginBottom: 5,
//   },
//   planPrice: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#666',
//   },
//   selectedText: {
//     color: '#FFF',
//   },
//   continueButton: {
//     marginTop: 20,
//   },
//   continueGradient: {
//     padding: 15,
//     borderRadius: 30,
//     alignItems: 'center',
//   },
//   continueText: {
//     color: '#FFF',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
// });

// export default App;





















// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Easing, ScrollView, Dimensions, FlatList, ImageBackground } from 'react-native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { NavigationContainer } from '@react-navigation/native';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import Ionicons from 'react-native-vector-icons/Ionicons';

// const { width, height } = Dimensions.get('window');

// const Stack = createNativeStackNavigator();
// const Tab = createBottomTabNavigator();

// // Splash Screen Component
// function SplashScreen({ navigation }) {
//   const [fadeAnim] = useState(new Animated.Value(0));
//   const [scaleAnim] = useState(new Animated.Value(0.8));

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 1500,
//         useNativeDriver: true,
//       }),
//       Animated.timing(scaleAnim, {
//         toValue: 1,
//         duration: 1500,
//         easing: Easing.elastic(1),
//         useNativeDriver: true,
//       }),
//     ]).start(() => {
//       setTimeout(() => {
//         navigation.navigate('MainTabs', { screen: 'Home' });
//       }, 1000);
//     });
//   }, []);

//   return (
//     <ImageBackground
//       source={{ uri: 'https://images.pexels.com/photos/915346/pexels-photo-915346.jpeg' }}
//       style={styles.splashContainer}
//       resizeMode="cover"
//     >
//       <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
//         <Image source={{ uri: 'https://i.pinimg.com/originals/3d/3d/d4/3d3dd4c5f8a8a4e8e4a3f3e3f3e3f3e.jpg' }} style={styles.splashImage} />
//         <Text style={styles.splashText}>For My Anmol</Text>
//       </Animated.View>
//     </ImageBackground>
//   );
// }

// // Home Screen Component
// function HomeScreen({ navigation }) {
//   const [bounceValue] = useState(new Animated.Value(0));

//   useEffect(() => {
//     bounceAnimation();
//   }, []);

//   const bounceAnimation = () => {
//     bounceValue.setValue(0);
//     Animated.spring(bounceValue, {
//       toValue: 1,
//       friction: 4,
//       useNativeDriver: true,
//     }).start();
//   };

//   const translateY = bounceValue.interpolate({
//     inputRange: [0, 0.5, 1],
//     outputRange: [0, -15, 0],
//   });

//   return (
//     <ImageBackground
//       source={{ uri: 'https://images.pexels.com/photos/1391499/pexels-photo-1391499.jpeg' }}
//       style={styles.homeContainer}
//       resizeMode="cover"
//     >
//       <ScrollView contentContainerStyle={styles.homeContent}>
//         <Animated.View style={{ transform: [{ translateY }] }}>
//           <Image source={{ uri: 'https://i.pinimg.com/originals/3d/3d/d4/3d3dd4c5f8a8a4e8e4a3f3e3f3e3f3e.jpg' }} style={styles.homeImage} />
//         </Animated.View>

//         <Text style={styles.homeTitle}>Special Gift for Anmol!</Text>
//         <Text style={styles.homeSubtitle}>A Gift From Faiz</Text>

//         {[
//           { name: 'Memories', label: 'Our Memories' },
//           { name: 'Messages', label: 'Special Messages' },
//           { name: 'Gallery', label: 'Photo Gallery' },
//           { name: 'Countdown', label: 'Since We Met' },
//           { name: 'LoveLetter', label: 'Love Letter' },
//           { name: 'Wishes', label: 'Special Wishes' },
//           { name: 'Future', label: 'Our Future' },
//           { name: 'Song', label: 'Your Song' },
//           { name: 'Surprise', label: 'Final Surprise' },
//           { name: 'OurMoments', label: 'Our Moments' },
//           { name: 'Promises', label: 'Our Promises' },
//           { name: 'Dreams', label: 'Our Dreams' },
//         ].map((item) => (
//           <TouchableOpacity
//             key={item.name}
//             style={styles.button}
//             onPress={() => navigation.navigate(item.name)}
//           >
//             <Text style={styles.buttonText}>{item.label}</Text>
//           </TouchableOpacity>
//         ))}
//       </ScrollView>
//     </ImageBackground>
//   );
// }

// // Memories Screen Component
// class MemoriesScreen extends React.Component {
//   state = {
//     memories: [
//       {
//         id: 1,
//         title: 'First Talk',
//         date: '4 Years Ago',
//         description: 'The day we first started talking, my life changed forever.',
//         image: require('./src/assets/us.js/baten.png'),
//       },
//       {
//         id: 2,
//         title: 'First Video Call',
//         date: 'Recently',
//         description: 'After 4 years, finally seeing your face was magical.',
//         image: require('./src/assets/us.js/Call.png'),
//       },
//       {
//         id: 3,
//         title: 'Countless Messages',
//         date: 'Every Day',
//         description: 'Thousands of messages that built our relationship.',
//         image: require('./src/assets/us.js/baten.png'),
//       },
//       {
//         id: 4,
//         title: 'Future Meeting',
//         date: 'Coming Soon',
//         description: 'The day we finally meet will be the best day of my life.',
//         image: require('./src/assets/us.js/New.jpg'),
//       },
//     ],
//     fadeAnim: new Animated.Value(0),
//   };

//   componentDidMount() {
//     Animated.timing(this.state.fadeAnim, {
//       toValue: 1,
//       duration: 1000,
//       useNativeDriver: true,
//     }).start();
//   }

//   renderMemory = ({ item }) => {
//     return (
//       <Animated.View style={[styles.memoryCard, { opacity: this.state.fadeAnim }]}>
//         <Image source={item?.image} resizeMode="cover" style={styles.memoryImage} />
//         <View style={styles.memoryTextContainer}>
//           <Text style={styles.memoryTitle}>{item.title}</Text>
//           <Text style={styles.memoryDate}>{item.date}</Text>
//           <Text style={styles.memoryDescription}>{item.description}</Text>
//         </View>
//       </Animated.View>
//     );
//   };

//   render() {
//     return (
//       <ImageBackground
//         source={{ uri: 'https://images.pexels.com/photos/1414651/pexels-photo-1414651.jpeg' }}
//         style={styles.memoriesContainer}
//         resizeMode="cover"
//       >
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => this.props.navigation.goBack()}
//         >
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.screenTitle}>Our Precious Memories</Text>
//         <FlatList
//           data={this.state.memories}
//           renderItem={this.renderMemory}
//           keyExtractor={item => item.id.toString()}
//           contentContainerStyle={styles.memoriesList}
//         />
//       </ImageBackground>
//     );
//   }
// }

// // Messages Screen Component
// class MessagesScreen extends React.Component {
//   state = {
//     messages: [
//       {
//         id: 1,
//         text: 'Anmol, you are the most beautiful person I know, inside and out.',
//         animation: new Animated.Value(0),
//       },
//       {
//         id: 2,
//         text: 'Your smile brightens my darkest days.',
//         animation: new Animated.Value(0),
//       },
//       {
//         id: 3,
//         text: 'I fall in love with you more every day, even though we\'ve never met.',
//         animation: new Animated.Value(0),
//       },
//       {
//         id: 4,
//         text: 'Your patience with our situation shows how strong you are.',
//         animation: new Animated.Value(0),
//       },
//       {
//         id: 5,
//         text: 'I promise to make all your dreams come true when we\'re together.',
//         animation: new Animated.Value(0),
//       },
//       {
//         id: 6,
//         text: 'You are worth every second of this wait.',
//         animation: new Animated.Value(0),
//       },
//       {
//         id: 7,
//         text: 'My love for you grows stronger with each passing day.',
//         animation: new Animated.Value(0),
//       },
//       {
//         id: 8,
//         text: 'I can\'t wait to finally hold you in my arms this September.',
//         animation: new Animated.Value(0),
//       },
//     ],
//     heartScale: new Animated.Value(1),
//   };

//   componentDidMount() {
//     this.animateMessages();
//     this.animateHeart();
//   }

//   animateMessages = () => {
//     this.state.messages.forEach((message, index) => {
//       setTimeout(() => {
//         Animated.spring(message.animation, {
//           toValue: 1,
//           friction: 5,
//           useNativeDriver: true,
//         }).start();
//       }, index * 300);
//     });
//   };

//   animateHeart = () => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(this.state.heartScale, {
//           toValue: 1.2,
//           duration: 500,
//           useNativeDriver: true,
//         }),
//         Animated.timing(this.state.heartScale, {
//           toValue: 1,
//           duration: 500,
//           useNativeDriver: true,
//         }),
//       ])
//     ).start();
//   };

//   renderMessage = (message) => {
//     const translateX = message.animation.interpolate({
//       inputRange: [0, 1],
//       outputRange: [width, 0],
//     });

//     return (
//       <Animated.View
//         key={message.id}
//         style={[
//           styles.messageCard,
//           { transform: [{ translateX }] },
//         ]}
//       >
//         <Text style={styles.messageText}>{message.text}</Text>
//       </Animated.View>
//     );
//   };

//   render() {
//     return (
//       <ImageBackground
//         source={{ uri: 'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg' }}
//         style={styles.messagesContainer}
//         resizeMode="cover"
//       >
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => this.props.navigation.goBack()}
//         >
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.screenTitle}>Special Messages For You</Text>

//         <ScrollView contentContainerStyle={styles.messagesList}>
//           {this.state.messages.map(message => this.renderMessage(message))}

//           <View style={styles.heartContainer}>
//             <Animated.Image
//               source={{ uri: 'https://cdn.pixabay.com/photo/2016/03/31/18/39/heart-1294761_960_720.png' }}
//               style={[
//                 styles.heartImage,
//                 { transform: [{ scale: this.state.heartScale }] },
//               ]}
//             />
//             <Text style={styles.heartText}>I Love You Anmol</Text>
//           </View>
//         </ScrollView>
//       </ImageBackground>
//     );
//   }
// }

// // Gallery Screen Component
// class GalleryScreen extends React.Component {
//   state = {
//     photos: [
//       { id: 1, uri: require('./src/assets/us.js/SHE.png'), caption: 'Your smile lights up my world' },
//       { id: 2, uri: require('./src/assets/us.js/SHE13.png'), caption: 'The most beautiful soul I know' },
//       { id: 3, uri: require('./src/assets/us.js/SHE1.png'), caption: 'My heart beats for you' },
//       { id: 4, uri: require('./src/assets/us.js/SHE2.png'), caption: 'Forever my favorite view' },
//       { id: 5, uri: require('./src/assets/us.js/SHE3.png'), caption: 'You make every moment special' },
//       { id: 6, uri: require('./src/assets/us.js/SHE4.png'), caption: 'My love for you is endless' },
//       { id: 7, uri: require('./src/assets/us.js/SHE5.png'), caption: 'You’re my dream come true' },
//       { id: 8, uri: require('./src/assets/us.js/SHE6.png'), caption: 'Every picture tells our story' },
//       { id: 9, uri: require('./src/assets/us.js/SHE7.png'), caption: 'My forever and always' },
//       { id: 10, uri: require('./src/assets/us.js/SHE8.png'), caption: 'You’re my everything' },
//       { id: 11, uri: require('./src/assets/us.js/SHE9.png'), caption: 'The reason I smile every day' },
//       { id: 12, uri: require('./src/assets/us.js/SHE10.png'), caption: 'My heart belongs to you' },
//       { id: 13, uri: require('./src/assets/us.js/SHE11.png'), caption: 'You make life beautiful' },
//       { id: 14, uri: require('./src/assets/us.js/SHE12.png'), caption: 'Our love in every frame' },
//       { id: 15, uri: require('./src/assets/us.js/SHE13.png'), caption: 'You’re my greatest treasure' },
//       { id: 16, uri: require('./src/assets/us.js/SHE14.png'), caption: 'Together forever, my love' },
//       { id: 17, uri: require('./src/assets/us.js/SHE15.png'), caption: 'You’re my safe haven' },
//       { id: 18, uri: require('./src/assets/us.js/SHE16.png'), caption: 'My love grows stronger daily' },
//       { id: 19, uri: require('./src/assets/us.js/SHE17.png'), caption: 'You’re my shining star' },
//       { id: 20, uri: require('./src/assets/us.js/SHE18.png'), caption: 'Forever grateful for you' },
//       { id: 21, uri: require('./src/assets/us.js/SHE19.png'), caption: 'You complete my world' },
//       { id: 22, uri: require('./src/assets/us.js/SHE20.png'), caption: 'My heart’s home is with you' },
//     ],
//     selectedPhoto: null,
//     zoomAnim: new Animated.Value(0),
//   };

//   openPhoto = (photo) => {
//     this.setState({ selectedPhoto: photo }, () => {
//       Animated.timing(this.state.zoomAnim, {
//         toValue: 1,
//         duration: 300,
//         useNativeDriver: true,
//       }).start();
//     });
//   };

//   closePhoto = () => {
//     Animated.timing(this.state.zoomAnim, {
//       toValue: 0,
//       duration: 300,
//       useNativeDriver: true,
//     }).start(() => {
//       this.setState({ selectedPhoto: null });
//     });
//   };

//   renderPhoto = ({ item }) => {
//     return (
//       <TouchableOpacity onPress={() => this.openPhoto(item)}>
//         <Image source={item.uri} style={styles.photoThumbnail} />
//       </TouchableOpacity>
//     );
//   };

//   render() {
//     const scale = this.state.zoomAnim.interpolate({
//       inputRange: [0, 1],
//       outputRange: [0.8, 1],
//     });

//     return (
//       <ImageBackground
//         source={{ uri: 'https://images.pexels.com/photos/949587/pexels-photo-949587.jpeg' }}
//         style={styles.galleryContainer}
//         resizeMode="cover"
//       >
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => this.props.navigation.goBack()}
//         >
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.screenTitle}>Our Photo Gallery</Text>

//         <FlatList
//           data={this.state.photos}
//           renderItem={this.renderPhoto}
//           keyExtractor={item => item.id.toString()}
//           numColumns={2}
//           contentContainerStyle={styles.galleryGrid}
//         />

//         {this.state.selectedPhoto && (
//           <TouchableOpacity
//             style={styles.photoModalBackdrop}
//             activeOpacity={1}
//             onPress={this.closePhoto}
//           >
//             <Animated.View style={[styles.photoModal, { transform: [{ scale }] }]}>
//               <Image
//                 source={this.state.selectedPhoto.uri}
//                 style={styles.photoFullsize}
//                 resizeMode="contain"
//               />
//               <Text style={styles.photoCaption}>{this.state.selectedPhoto.caption}</Text>
//             </Animated.View>
//           </TouchableOpacity>
//         )}
//       </ImageBackground>
//     );
//   }
// }

// // Countdown Screen Component
// class CountdownScreen extends React.Component {
//   state = {
//     years: 0,
//     months: 0,
//     days: 0,
//     hours: 0,
//     minutes: 0,
//     seconds: 0,
//     rotateAnim: new Animated.Value(0),
//   };

//   componentDidMount() {
//     this.calculateTimeSince();
//     this.startRotationAnimation();
//     this.interval = setInterval(this.calculateTimeSince, 1000);
//   }

//   componentWillUnmount() {
//     clearInterval(this.interval);
//   }

//   calculateTimeSince = () => {
//     const meetingDate = new Date('2021-04-17');
//     const now = new Date();
//     const diff = now - meetingDate;

//     const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
//     const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.42));
//     const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30.42)) / (1000 * 60 * 60 * 24));
//     const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//     const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
//     const seconds = Math.floor((diff % (1000 * 60)) / 1000);

//     this.setState({ years, months, days, hours, minutes, seconds });
//   };

//   startRotationAnimation = () => {
//     Animated.loop(
//       Animated.timing(this.state.rotateAnim, {
//         toValue: 1,
//         duration: 10000,
//         easing: Easing.linear,
//         useNativeDriver: true,
//       })
//     ).start();
//   };

//   render() {
//     const rotate = this.state.rotateAnim.interpolate({
//       inputRange: [0, 1],
//       outputRange: ['0deg', '360deg'],
//     });

//     return (
//       <ImageBackground
//         source={{ uri: 'https://images.pexels.com/photos/1366630/pexels-photo-1366630.jpeg' }}
//         style={styles.countdownContainer}
//         resizeMode="cover"
//       >
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => this.props.navigation.goBack()}
//         >
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.screenTitle}>Since We Met</Text>

//         <Animated.View style={[styles.countdownCircle, { transform: [{ rotate }] }]}>
//           <Image
//             source={require('./src/assets/us.js/SHE19.png')}
//             style={styles.countdownHeart}
//           />
//         </Animated.View>

//         <View style={styles.countdownGrid}>
//           <View style={styles.countdownBox}>
//             <Text style={styles.countdownNumber}>{this.state.years}</Text>
//             <Text style={styles.countdownLabel}>Years</Text>
//           </View>

//           <View style={styles.countdownBox}>
//             <Text style={styles.countdownNumber}>{this.state.months}</Text>
//             <Text style={styles.countdownLabel}>Months</Text>
//           </View>

//           <View style={styles.countdownBox}>
//             <Text style={styles.countdownNumber}>{this.state.days}</Text>
//             <Text style={styles.countdownLabel}>Days</Text>
//           </View>

//           <View style={styles.countdownBox}>
//             <Text style={styles.countdownNumber}>{this.state.hours}</Text>
//             <Text style={styles.countdownLabel}>Hours</Text>
//           </View>

//           <View style={styles.countdownBox}>
//             <Text style={styles.countdownNumber}>{this.state.minutes}</Text>
//             <Text style={styles.countdownLabel}>Minutes</Text>
//           </View>

//           <View style={styles.countdownBox}>
//             <Text style={styles.countdownNumber}>{this.state.seconds}</Text>
//             <Text style={styles.countdownLabel}>Seconds</Text>
//           </View>
//         </View>

//         <Text style={styles.countdownMessage}>
//           Every moment since April 17, 2021, has been a treasure with you
//         </Text>
//       </ImageBackground>
//     );
//   }
// }

// // Love Letter Screen Component
// class LoveLetterScreen extends React.Component {
//   state = {
//     letterParts: [
//       'My Dearest Anmol,',
//       '',
//       "As I sit here thinking about you on your special day, my heart is filled with so much love and admiration for you. These past 4 years have been the most beautiful journey of my life, even though we haven't met in person yet.",
//       '',
//       "Your shyness during our first video call was the most adorable thing I've ever seen. That moment is etched in my memory forever. I understand your family situation and I admire your strength in handling it with such grace.",
//       '',
//       "I promise you that when we finally meet in September, I will make up for all the time we've spent apart. I'll hold your hand, look into your eyes, and tell you in person all the things I've been saving up to say.",
//       '',
//       'You are my strength, my happiness, and my future. No distance can change what I feel for you. I love you more than words can express.',
//       '',
//       'Happy Birthday my love. May this year bring you all the happiness you deserve.',
//       '',
//       'Forever yours,',
//       'Faiz',
//     ],
//     currentPart: 0,
//     fadeAnim: new Animated.Value(0),
//   };

//   componentDidMount() {
//     this.startLetterAnimation();
//   }

//   startLetterAnimation = () => {
//     if (this.state.currentPart < this.state.letterParts.length) {
//       this.state.fadeAnim.setValue(0);
//       Animated.timing(this.state.fadeAnim, {
//         toValue: 1,
//         duration: 1000,
//         useNativeDriver: true,
//       }).start(() => {
//         setTimeout(() => {
//           this.setState(
//             prevState => ({ currentPart: prevState.currentPart + 1 }),
//             this.startLetterAnimation
//           );
//         }, 1000);
//       });
//     }
//   };

//   render() {
//     return (
//       <ImageBackground
//         source={{ uri: 'https://images.pexels.com/photos/147411/pexels-photo-147411.jpeg' }}
//         style={styles.letterContainer}
//         resizeMode="cover"
//       >
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => this.props.navigation.goBack()}
//         >
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <View style={styles.letterPaper}>
//           <Text style={styles.letterDate}>October 2, 2023</Text>

//           {this.state.letterParts.slice(0, this.state.currentPart + 1).map((part, index) => (
//             <Animated.Text
//               key={index}
//               style={[
//                 styles.letterText,
//                 part === '' ? styles.letterEmptyLine : null,
//                 index === this.state.currentPart ? { opacity: this.state.fadeAnim } : null,
//               ]}
//             >
//               {part}
//             </Animated.Text>
//           ))}
//         </View>
//       </ImageBackground>
//     );
//   }
// }

// // Wishes Screen Component
// class WishesScreen extends React.Component {
//   state = {
//     wishes: [
//       'May all your dreams come true this year',
//       'Wishing you health, happiness and success',
//       'May our love grow stronger with each passing day',
//       'Hope this year brings us closer together',
//       'Wishing you the happiest birthday my love',
//       'May all your wishes be fulfilled',
//       'Hope this year is your best one yet',
//       'Wishing you endless joy and laughter',
//       'May we create beautiful memories together soon',
//       'Hope your special day is as wonderful as you are',
//     ],
//     currentWish: 0,
//     balloonAnim: new Animated.Value(0),
//     balloonPosition: new Animated.Value(height),
//   };

//   componentDidMount() {
//     this.animateBalloons();
//     this.wishInterval = setInterval(this.changeWish, 3000);
//   }

//   componentWillUnmount() {
//     clearInterval(this.wishInterval);
//   }

//   changeWish = () => {
//     this.setState(prevState => ({
//       currentWish: (prevState.currentWish + 1) % this.state.wishes.length,
//     }));
//   };

//   animateBalloons = () => {
//     this.state.balloonPosition.setValue(height);

//     Animated.timing(this.state.balloonPosition, {
//       toValue: -200,
//       duration: 10000,
//       useNativeDriver: true,
//       easing: Easing.linear,
//     }).start(this.animateBalloons);

//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(this.state.balloonAnim, {
//           toValue: 1,
//           duration: 1000,
//           useNativeDriver: true,
//         }),
//         Animated.timing(this.state.balloonAnim, {
//           toValue: 0,
//           duration: 1000,
//           useNativeDriver: true,
//         }),
//       ])
//     ).start();
//   };

//   render() {
//     const scale = this.state.balloonAnim.interpolate({
//       inputRange: [0, 1],
//       outputRange: [1, 1.05],
//     });

//     const translateY = this.state.balloonPosition;
//     const rotate = this.state.balloonPosition.interpolate({
//       inputRange: [0, height],
//       outputRange: ['0deg', '10deg'],
//     });

//     return (
//       <ImageBackground
//         source={{ uri: 'https://images.pexels.com/photos/1414651/pexels-photo-1414651.jpeg' }}
//         style={styles.wishesContainer}
//         resizeMode="cover"
//       >
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => this.props.navigation.goBack()}
//         >
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.screenTitle}>Special Wishes For You</Text>

//         <View style={styles.wishBox}>
//           <Text style={styles.wishText}>
//             {this.state.wishes[this.state.currentWish]}
//           </Text>
//         </View>

//         <Animated.Image
//           source={{ uri: 'https://cdn.pixabay.com/photo/2016/08/25/12/42/balloon-1619271_960_720.png' }}
//           style={[
//             styles.balloon,
//             {
//               transform: [{ translateY }, { scale }, { rotate }],
//               left: width * 0.2,
//             },
//           ]}
//         />

//         <Animated.Image
//           source={{ uri: 'https://cdn.pixabay.com/photo/2016/08/25/12/42/balloon-1619271_960_720.png' }}
//           style={[
//             styles.balloon,
//             {
//               transform: [{ translateY }, { scale }, { rotate: '-5deg' }],
//               left: width * 0.6,
//             },
//           ]}
//         />

//         <Animated.Image
//           source={{ uri: 'https://cdn.pixabay.com/photo/2016/08/25/12/42/balloon-1619271_960_720.png' }}
//           style={[
//             styles.balloon,
//             {
//               transform: [{ translateY }, { scale }, { rotate: '5deg' }],
//               left: width * 0.4,
//             },
//           ]}
//         />
//       </ImageBackground>
//     );
//   }
// }

// // Future Screen Component
// class FutureScreen extends React.Component {
//   state = {
//     futurePlans: [
//       {
//         title: 'Our First Meeting',
//         description: 'Finally seeing you in person after all this time',
//         image: 'https://i.pinimg.com/originals/3d/3d/d4/3d3dd4c5f8a8a4e8e4a3f3e3f3e3f3e.jpg',
//       },
//       {
//         title: 'Exploring Together',
//         description: 'Traveling to beautiful places hand in hand',
//         image: 'https://i.pinimg.com/originals/3d/3d/d4/3d3dd4c5f8a8a4e8e4a3f3e3f3e3f3e.jpg',
//       },
//       {
//         title: 'Special Moments',
//         description: 'Celebrating birthdays and anniversaries together',
//         image: 'https://i.pinimg.com/originals/3d/3d/d4/3d3dd4c5f8a8a4e8e4a3f3e3f3e3f3e.jpg',
//       },
//       {
//         title: 'Building a Life',
//         description: 'Creating a loving home filled with love and laughter',
//         image: 'https://i.pinimg.com/originals/3d/3d/d4/3d3dd4c5f8a8a4e8e4a3f3e3f3e3f3e.jpg',
//       },
//     ],
//     currentIndex: 0,
//     fadeAnim: new Animated.Value(1),
//   };

//   componentDidMount() {
//     this.planInterval = setInterval(this.changePlan, 4000);
//   }

//   componentWillUnmount() {
//     clearInterval(this.planInterval);
//   }

//   changePlan = () => {
//     Animated.timing(this.state.fadeAnim, {
//       toValue: 0,
//       duration: 500,
//       useNativeDriver: true,
//     }).start(() => {
//       this.setState(
//         prevState => ({
//           currentIndex: (prevState.currentIndex + 1) % this.state.futurePlans.length,
//           fadeAnim: new Animated.Value(0),
//         }),
//         () => {
//           Animated.timing(this.state.fadeAnim, {
//             toValue: 1,
//             duration: 500,
//             useNativeDriver: true,
//           }).start();
//         }
//       );
//     });
//   };

//   render() {
//     const currentPlan = this.state.futurePlans[this.state.currentIndex];

//     return (
//       <ImageBackground
//         source={{ uri: 'https://images.pexels.com/photos/1128317/pexels-photo-1128317.jpeg' }}
//         style={styles.futureContainer}
//         resizeMode="cover"
//       >
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => this.props.navigation.goBack()}
//         >
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.screenTitle}>Our Beautiful Future</Text>

//         <Animated.View style={{ opacity: this.state.fadeAnim }}>
//           <Image
//             source={{ uri: currentPlan.image }}
//             style={styles.futureImage}
//           />
//           <View style={styles.futureTextContainer}>
//             <Text style={styles.futureTitle}>{currentPlan.title}</Text>
//             <Text style={styles.futureDescription}>{currentPlan.description}</Text>
//           </View>
//         </Animated.View>

//         <View style={styles.dotsContainer}>
//           {this.state.futurePlans.map((_, index) => (
//             <View
//               key={index}
//               style={[
//                 styles.dot,
//                 index === this.state.currentIndex ? styles.activeDot : null,
//               ]}
//             />
//           ))}
//         </View>
//       </ImageBackground>
//     );
//   }
// }

// // Song Screen Component
// class SongScreen extends React.Component {
//   state = {
//     lyrics: [
//       { line: "Anmol, you're my shining star", duration: 3000 },
//       { line: 'No matter where you are', duration: 2500 },
//       { line: 'Your love lights up my darkest night', duration: 3500 },
//       { line: 'Everything feels right', duration: 2500 },
//       { line: "Four years we've waited patiently", duration: 3500 },
//       { line: "Soon you'll be here with me", duration: 3000 },
//       { line: 'Happy birthday to the love of my life', duration: 4000 },
//       { line: "One day you'll be my wife", duration: 3000 },
//     ],
//     currentLine: 0,
//     fadeAnim: new Animated.Value(0),
//     musicNotes: [],
//   };

//   componentDidMount() {
//     this.startLyricsAnimation();
//     this.startMusicNotes();
//   }

//   componentWillUnmount() {
//     clearInterval(this.lyricsInterval);
//     clearInterval(this.notesInterval);
//   }

//   startLyricsAnimation = () => {
//     this.showNextLine();
//     this.lyricsInterval = setInterval(this.showNextLine, 6000);
//   };

//   showNextLine = () => {
//     this.state.fadeAnim.setValue(0);
//     Animated.timing(this.state.fadeAnim, {
//       toValue: 1,
//       duration: 1000,
//       useNativeDriver: true,
//     }).start(() => {
//       setTimeout(() => {
//         Animated.timing(this.state.fadeAnim, {
//           toValue: 0,
//           duration: 1000,
//           useNativeDriver: true,
//         }).start(() => {
//           this.setState(prevState => ({
//             currentLine: (prevState.currentLine + 1) % this.state.lyrics.length,
//           }));
//         });
//       }, this.state.lyrics[this.state.currentLine].duration);
//     });
//   };

//   startMusicNotes = () => {
//     this.notesInterval = setInterval(() => {
//       this.setState(prevState => ({
//         musicNotes: [
//           ...prevState.musicNotes,
//           {
//             id: Date.now(),
//             left: Math.random() * width,
//             animation: new Animated.Value(0),
//           },
//         ],
//       }), () => {
//         const note = this.state.musicNotes[this.state.musicNotes.length - 1];
//         Animated.timing(note.animation, {
//           toValue: 1,
//           duration: 2000,
//           useNativeDriver: true,
//         }).start(() => {
//           this.setState(prevState => ({
//             musicNotes: prevState.musicNotes.filter(n => n.id !== note.id),
//           }));
//         });
//       });
//     }, 500);
//   };

//   renderMusicNote = (note) => {
//     const translateY = note.animation.interpolate({
//       inputRange: [0, 1],
//       outputRange: [0, -200],
//     });

//     const opacity = note.animation.interpolate({
//       inputRange: [0, 0.8, 1],
//       outputRange: [1, 1, 0],
//     });

//     return (
//       <Animated.Image
//         key={note.id}
//         source={{ uri: 'https://cdn.pixabay.com/photo/2016/03/31/20/11/music-note-1295357_960_720.png' }}
//         style={[
//           styles.musicNote,
//           {
//             left: note.left,
//             transform: [{ translateY }],
//             opacity,
//           },
//         ]}
//       />
//     );
//   };

//   render() {
//     return (
//       <ImageBackground
//         source={{ uri: 'https://images.pexels.com/photos/1064162/pexels-photo-1064162.jpeg' }}
//         style={styles.songContainer}
//         resizeMode="cover"
//       >
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => this.props.navigation.goBack()}
//         >
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.screenTitle}>Your Special Song</Text>

//         <View style={styles.lyricsContainer}>
//           <Animated.Text style={[styles.lyricsLine, { opacity: this.state.fadeAnim }]}>
//             {this.state.lyrics[this.state.currentLine].line}
//           </Animated.Text>
//         </View>

//         <Image
//           source={{ uri: 'https://i.pinimg.com/originals/3d/3d/d4/3d3dd4c5f8a8a4e8e4a3f3e3f3e3f3e.jpg' }}
//           style={styles.songImage}
//         />

//         {this.state.musicNotes.map(note => this.renderMusicNote(note))}
//       </ImageBackground>
//     );
//   }
// }

// // Surprise Screen Component
// class SurpriseScreen extends React.Component {
//   state = {
//     showSurprise: false,
//     confettiPieces: [],
//     scaleAnim: new Animated.Value(0.5),
//     rotateAnim: new Animated.Value(0),
//   };

//   componentDidMount() {
//     this.createConfetti();
//     Animated.parallel([
//       Animated.spring(this.state.scaleAnim, {
//         toValue: 1,
//         friction: 3,
//         useNativeDriver: true,
//       }),
//       Animated.loop(
//         Animated.timing(this.state.rotateAnim, {
//           toValue: 1,
//           duration: 5000,
//           easing: Easing.linear,
//           useNativeDriver: true,
//         })
//       ),
//     ]).start();
//   }

//   createConfetti = () => {
//     const pieces = [];
//     const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff6f61', '#6b5b95'];
//     const shapes = ['circle', 'square'];

//     for (let i = 0; i < 200; i++) {
//       pieces.push({
//         id: i,
//         color: colors[Math.floor(Math.random() * colors.length)],
//         shape: shapes[Math.floor(Math.random() * shapes.length)],
//         left: Math.random() * width,
//         top: -Math.random() * 200,
//         animation: new Animated.Value(0),
//       });
//     }

//     this.setState({ confettiPieces: pieces }, this.animateConfetti);
//   };

//   animateConfetti = () => {
//     this.state.confettiPieces.forEach(piece => {
//       const duration = 4000 + Math.random() * 4000;

//       Animated.timing(piece.animation, {
//         toValue: 1,
//         duration,
//         useNativeDriver: true,
//         easing: Easing.linear,
//       }).start();
//     });
//   };

//   showSurprise = () => {
//     this.setState({ showSurprise: true });
//   };

//   renderConfettiPiece = (piece) => {
//     const translateY = piece.animation.interpolate({
//       inputRange: [0, 1],
//       outputRange: [0, height + 200],
//     });

//     const rotate = piece.animation.interpolate({
//       inputRange: [0, 1],
//       outputRange: ['0deg', `${Math.random() * 720 - 360}deg`],
//     });

//     const shapeStyle = piece.shape === 'circle' ?
//       { borderRadius: 10 } :
//       { borderRadius: 0 };

//     return (
//       <Animated.View
//         key={piece.id}
//         style={[
//           styles.confettiPiece,
//           shapeStyle,
//           {
//             backgroundColor: piece.color,
//             left: piece.left,
//             top: piece.top,
//             transform: [{ translateY }, { rotate }],
//           },
//         ]}
//       />
//     );
//   };

//   render() {
//     const rotate = this.state.rotateAnim.interpolate({
//       inputRange: [0, 1],
//       outputRange: ['0deg', '360deg'],
//     });

//     const scale = this.state.scaleAnim;

//     return (
//       <ImageBackground
//         source={{ uri: 'https://images.pexels.com/photos/1021045/pexels-photo-1021045.jpeg' }}
//         style={styles.surpriseContainer}
//         resizeMode="cover"
//       >
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => this.props.navigation.goBack()}
//         >
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         {this.state.confettiPieces.map(piece => this.renderConfettiPiece(piece))}

//         <TouchableOpacity
//           style={styles.surpriseButton}
//           onPress={this.showSurprise}
//           disabled={this.state.showSurprise}
//         >
//           <Animated.View style={{ transform: [{ scale }, { rotate }] }}>
//             <Image
//               source={{ uri: 'https://i.pinimg.com/originals/3d/3d/d4/3d3dd4c5f8a8a4e8e4a3f3e3f3e3f3e.jpg' }}
//               style={styles.surpriseGift}
//             />
//           </Animated.View>

//           <Text style={styles.surpriseButtonText}>
//             {this.state.showSurprise ? '' : 'Tap for your final surprise!'}
//           </Text>
//         </TouchableOpacity>

//         {this.state.showSurprise && (
//           <Animated.View style={[styles.surpriseMessage, { transform: [{ scale }] }]}>
//             <Text style={styles.surpriseTitle}>My Eternal Promise to You</Text>
//             <Text style={styles.surpriseText}>
//               Anmol, my heart, I've planned something truly special for us! I've booked tickets for us to meet on September 15th, your birthday month, to celebrate not just your special day but the beautiful journey that began on April 17, 2021. After over four years of love, laughter, and countless messages, we'll finally hold each other. I've also reserved a spot for us to have a magical dinner under the stars, where I'll tell you in person how you've made every moment of my life brighter. This is just the start of our forever, my love.
//             </Text>
//             <Text style={styles.surpriseSignature}>Forever and always yours, Faiz</Text>
//           </Animated.View>
//         )}
//       </ImageBackground>
//     );
//   }
// }

// // New Screen: Our Moments
// class OurMomentsScreen extends React.Component {
//   state = {
//     moments: [
//       {
//         id: 1,
//         title: 'Our First Chat',
//         description: 'The night we stayed up talking about everything and nothing.',
//         image: 'https://images.pexels.com/photos/1024984/pexels-photo-1024984.jpeg',
//       },
//       {
//         id: 2,
//         title: 'Your Favorite Song',
//         description: 'When you shared your favorite song, and it became ours.',
//         image: 'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg',
//       },
//       {
//         id: 3,
//         title: 'Late Night Calls',
//         description: 'Hours spent hearing your voice, dreaming of the future.',
//         image: 'https://images.pexels.com/photos/355952/pexels-photo-355952.jpeg',
//       },
//     ],
//     fadeAnim: new Animated.Value(0),
//   };

//   componentDidMount() {
//     Animated.timing(this.state.fadeAnim, {
//       toValue: 1,
//       duration: 1000,
//       useNativeDriver: true,
//     }).start();
//   }

//   renderMoment = ({ item }) => {
//     return (
//       <Animated.View style={[styles.momentCard, { opacity: this.state.fadeAnim }]}>
//         <Image source={{ uri: item.image }} style={styles.momentImage} />
//         <View style={styles.momentTextContainer}>
//           <Text style={styles.momentTitle}>{item.title}</Text>
//           <Text style={styles.momentDescription}>{item.description}</Text>
//         </View>
//       </Animated.View>
//     );
//   };

//   render() {
//     return (
//       <ImageBackground
//         source={{ uri: 'https://images.pexels.com/photos/1485548/pexels-photo-1485548.jpeg' }}
//         style={styles.momentsContainer}
//         resizeMode="cover"
//       >
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => this.props.navigation.goBack()}
//         >
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.screenTitle}>Our Cherished Moments</Text>
//         <FlatList
//           data={this.state.moments}
//           renderItem={this.renderMoment}
//           keyExtractor={item => item.id.toString()}
//           contentContainerStyle={styles.momentsList}
//         />
//       </ImageBackground>
//     );
//   }
// }

// // New Screen: Promises
// class PromisesScreen extends React.Component {
//   state = {
//     promises: [
//       { id: 1, text: 'I promise to always make you smile, no matter the distance.' },
//       { id: 2, text: 'I vow to support your dreams and be your biggest cheerleader.' },
//       { id: 3, text: 'I promise to cherish every moment we share, big or small.' },
//       { id: 4, text: 'I vow to hold your hand through every challenge we face.' },
//     ],
//     currentPromise: 0,
//     fadeAnim: new Animated.Value(0),
//   };

//   componentDidMount() {
//     this.startPromiseAnimation();
//   }

//   startPromiseAnimation = () => {
//     Animated.timing(this.state.fadeAnim, {
//       toValue: 1,
//       duration: 1000,
//       useNativeDriver: true,
//     }).start(() => {
//       setTimeout(() => {
//         Animated.timing(this.state.fadeAnim, {
//           toValue: 0,
//           duration: 1000,
//           useNativeDriver: true,
//         }).start(() => {
//           this.setState(
//             prevState => ({
//               currentPromise: (prevState.currentPromise + 1) % this.state.promises.length,
//             }),
//             this.startPromiseAnimation
//           );
//         });
//       }, 3000);
//     });
//   };

//   render() {
//     const currentPromise = this.state.promises[this.state.currentPromise];

//     return (
//       <ImageBackground
//         source={{ uri: 'https://images.pexels.com/photos/169191/pexels-photo-169191.jpeg' }}
//         style={styles.promisesContainer}
//         resizeMode="cover"
//       >
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => this.props.navigation.goBack()}
//         >
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.screenTitle}>My Promises to You</Text>
//         <Animated.View style={[styles.promiseBox, { opacity: this.state.fadeAnim }]}>
//           <Text style={styles.promiseText}>{currentPromise.text}</Text>
//         </Animated.View>
//       </ImageBackground>
//     );
//   }
// }

// // New Screen: Dreams
// class DreamsScreen extends React.Component {
//   state = {
//     dreams: [
//       {
//         id: 1,
//         title: 'A World Tour',
//         description: 'Traveling the world together, exploring new cultures.',
//         image: 'https://images.pexels.com/photos/672358/pexels-photo-672358.jpeg',
//       },
//       {
//         id: 2,
//         title: 'Our Dream Home',
//         description: 'Building a cozy home filled with love and warmth.',
//         image: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg',
//       },
//       {
//         id: 3,
//         title: 'Starry Nights',
//         description: 'Watching the stars together, dreaming of our future.',
//         image: 'https://images.pexels.com/photos/355465/pexels-photo-355465.jpeg',
//       },
//     ],
//     currentIndex: 0,
//     fadeAnim: new Animated.Value(1),
//   };

//   componentDidMount() {
//     this.dreamInterval = setInterval(this.changeDream, 4000);
//   }

//   componentWillUnmount() {
//     clearInterval(this.dreamInterval);
//   }

//   changeDream = () => {
//     Animated.timing(this.state.fadeAnim, {
//       toValue: 0,
//       duration: 500,
//       useNativeDriver: true,
//     }).start(() => {
//       this.setState(
//         prevState => ({
//           currentIndex: (prevState.currentIndex + 1) % this.state.dreams.length,
//           fadeAnim: new Animated.Value(0),
//         }),
//         () => {
//           Animated.timing(this.state.fadeAnim, {
//             toValue: 1,
//             duration: 500,
//             useNativeDriver: true,
//           }).start();
//         }
//       );
//     });
//   };

//   render() {
//     const currentDream = this.state.dreams[this.state.currentIndex];

//     return (
//       <ImageBackground
//         source={{ uri: 'https://images.pexels.com/photos/1109541/pexels-photo-1109541.jpeg' }}
//         style={styles.dreamsContainer}
//         resizeMode="cover"
//       >
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => this.props.navigation.goBack()}
//         >
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.screenTitle}>Our Shared Dreams</Text>

//         <Animated.View style={{ opacity: this.state.fadeAnim }}>
//           <Image
//             source={{ uri: currentDream.image }}
//             style={styles.dreamImage}
//           />
//           <View style={styles.dreamTextContainer}>
//             <Text style={styles.dreamTitle}>{currentDream.title}</Text>
//             <Text style={styles.dreamDescription}>{currentDream.description}</Text>
//           </View>
//         </Animated.View>

//         <View style={styles.dotsContainer}>
//           {this.state.dreams.map((_, index) => (
//             <View
//               key={index}
//               style={[
//                 styles.dot,
//                 index === this.state.currentIndex ? styles.activeDot : null,
//               ]}
//             />
//           ))}
//         </View>
//       </ImageBackground>
//     );
//   }
// }

// // Bottom Tabs Navigator
// function MainTabs() {
//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         // eslint-disable-next-line react/no-unstable-nested-components
//         tabBarIcon: ({ color, size }) => {
//           let iconName;
//           if (route.name === 'Home') {iconName = 'home';}
//           else if (route.name === 'Memories') {iconName = 'heart';}
//           else if (route.name === 'OurMoments') {iconName = 'chatbubble';}
//           else if (route.name === 'Promises') {iconName = 'lock-closed';}
//           else if (route.name === 'Dreams') {iconName = 'star';}
//           return <Ionicons name={iconName} size={size} color={color} />;
//         },
//         tabBarActiveTintColor: '#c2185b',
//         tabBarInactiveTintColor: '#888',
//         tabBarStyle: {
//           backgroundColor: 'rgba(255, 235, 238, 0.9)',
//           borderTopWidth: 0,
//           elevation: 5,
//         },
//         headerShown: false,
//       })}
//     >
//       <Tab.Screen name="Home" component={HomeScreen} />
//       <Tab.Screen name="Memories" component={MemoriesScreen} />
//       <Tab.Screen name="OurMoments" component={OurMomentsScreen} />
//       <Tab.Screen name="Promises" component={PromisesScreen} />
//       <Tab.Screen name="Dreams" component={DreamsScreen} />
//     </Tab.Navigator>
//   );
// }

// // Main App Component
// export default function App() {
//   return (
//     <NavigationContainer>
//       <Stack.Navigator screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="Splash" component={SplashScreen} />
//         <Stack.Screen name="MainTabs" component={MainTabs} />
//         <Stack.Screen name="Messages" component={MessagesScreen} />
//         <Stack.Screen name="Gallery" component={GalleryScreen} />
//         <Stack.Screen name="Countdown" component={CountdownScreen} />
//         <Stack.Screen name="LoveLetter" component={LoveLetterScreen} />
//         <Stack.Screen name="Wishes" component={WishesScreen} />
//         <Stack.Screen name="Future" component={FutureScreen} />
//         <Stack.Screen name="Song" component={SongScreen} />
//         <Stack.Screen name="Surprise" component={SurpriseScreen} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }

// // Styles
// const styles = StyleSheet.create({
//   // Splash Screen Styles
//   splashContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   splashImage: {
//     width: 200,
//     height: 200,
//     borderRadius: 100,
//     alignSelf: 'center',
//   },
//   splashText: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#d81b60',
//     marginTop: 20,
//     textAlign: 'center',
//     fontFamily: 'Georgia',
//   },

//   // Home Screen Styles
//   homeContainer: {
//     flex: 1,
//   },
//   homeContent: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//     backgroundColor: 'rgba(255, 235, 238, 0.7)',
//   },
//   homeImage: {
//     width: 150,
//     height: 150,
//     borderRadius: 75,
//     marginBottom: 30,
//   },
//   homeTitle: {
//     fontSize: 30,
//     fontWeight: 'bold',
//     color: '#c2185b',
//     marginBottom: 10,
//     textAlign: 'center',
//     fontFamily: 'Georgia',
//   },
//   homeSubtitle: {
//     fontSize: 20,
//     color: '#e91e63',
//     marginBottom: 30,
//     textAlign: 'center',
//     fontFamily: 'Georgia',
//   },
//   button: {
//     backgroundColor: 'rgba(225, 30, 95, 0.8)',
//     padding: 15,
//     borderRadius: 25,
//     width: 250,
//     alignItems: 'center',
//     marginVertical: 10,
//     elevation: 5,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//     fontFamily: 'Georgia',
//   },

//   // Common Screen Styles
//   screenTitle: {
//     fontSize: 26,
//     fontWeight: 'bold',
//     color: '#c2185b',
//     textAlign: 'center',
//     marginVertical: 20,
//     fontFamily: 'Georgia',
//   },
//   backButton: {
//     position: 'absolute',
//     top: 40,
//     left: 20,
//     zIndex: 10,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     padding: 10,
//     borderRadius: 20,
//   },

//   // Memories Screen Styles
//   memoriesContainer: {
//     flex: 1,
//   },
//   memoriesList: {
//     paddingBottom: 20,
//   },
//   memoryCard: {
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 10,
//     marginHorizontal: 15,
//     marginVertical: 10,
//     overflow: 'hidden',
//     elevation: 3,
//   },
//   memoryImage: {
//     width: '100%',
//     height: 200,
//   },
//   memoryTextContainer: {
//     padding: 15,
//   },
//   memoryTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#c2185b',
//     fontFamily: 'Georgia',
//   },
//   memoryDate: {
//     fontSize: 14,
//     color: '#e91e63',
//     marginVertical: 5,
//     fontFamily: 'Georgia',
//   },
//   memoryDescription: {
//     fontSize: 16,
//     color: '#333',
//     fontFamily: 'Georgia',
//   },

//   // Messages Screen Styles
//   messagesContainer: {
//     flex: 1,
//   },
//   messagesList: {
//     paddingBottom: 20,
//   },
//   messageCard: {
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 10,
//     padding: 15,
//     marginHorizontal: 15,
//     marginVertical: 10,
//     elevation: 2,
//   },
//   messageText: {
//     fontSize: 16,
//     color: '#333',
//     fontFamily: 'Georgia',
//   },
//   heartContainer: {
//     alignItems: 'center',
//     marginVertical: 30,
//   },
//   heartImage: {
//     width: 100,
//     height: 100,
//     marginBottom: 10,
//   },
//   heartText: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#c2185b',
//     fontFamily: 'Georgia',
//   },

//   // Gallery Screen Styles
//   galleryContainer: {
//     flex: 1,
//   },
//   galleryGrid: {
//     padding: 5,
//     alignSelf: 'center',
//   },
//   photoThumbnail: {
//     width: width / 2 - 10,
//     height: width / 2 - 10,
//     margin: 5,
//     borderRadius: 5,
//   },
//   photoModalBackdrop: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(0,0,0,0.8)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   photoModal: {
//     width: width - 40,
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 10,
//     padding: 10,
//   },
//   photoFullsize: {
//     width: '100%',
//     height: height * 0.6,
//     borderRadius: 5,
//   },
//   photoCaption: {
//     fontSize: 16,
//     color: '#c2185b',
//     textAlign: 'center',
//     marginTop: 10,
//     fontFamily: 'Georgia',
//   },

//   // Countdown Screen Styles
//   countdownContainer: {
//     flex: 1,
//     alignItems: 'center',
//     paddingTop: 20,
//   },
//   countdownCircle: {
//     width: 150,
//     height: 140,
//     borderRadius: 0,
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginVertical: 30,
//     elevation: 5,
//   },
//   countdownHeart: {
//     width: 150,
//     height: 140,
//     overflow: 'hidden',
//   },
//   countdownGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'center',
//     marginBottom: 20,
//   },
//   countdownBox: {
//     width: width / 2 - 30,
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 10,
//     padding: 15,
//     margin: 10,
//     alignItems: 'center',
//     elevation: 3,
//   },
//   countdownNumber: {
//     fontSize: 36,
//     fontWeight: 'bold',
//     color: '#c2185b',
//     fontFamily: 'Georgia',
//   },
//   countdownLabel: {
//     fontSize: 16,
//     color: '#e91e63',
//     fontFamily: 'Georgia',
//   },
//   countdownMessage: {
//     fontSize: 16,
//     color: '#c2185b',
//     textAlign: 'center',
//     marginHorizontal: 30,
//     marginBottom: 20,
//     fontFamily: 'Georgia',
//   },

//   // Love Letter Screen Styles
//   letterContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   letterBackground: {
//     position: 'absolute',
//     width: '100%',
//     height: '100%',
//     opacity: 0.3,
//   },
//   letterPaper: {
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     width: width - 40,
//     padding: 25,
//     borderRadius: 5,
//     elevation: 5,
//   },
//   letterDate: {
//     fontSize: 16,
//     color: '#888',
//     textAlign: 'right',
//     marginBottom: 20,
//     fontFamily: 'Georgia',
//   },
//   letterText: {
//     fontSize: 16,
//     lineHeight: 24,
//     marginBottom: 10,
//     fontFamily: 'Georgia',
//   },
//   letterEmptyLine: {
//     height: 10,
//   },

//   // Wishes Screen Styles
//   wishesContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   wishBox: {
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 10,
//     padding: 20,
//     margin: 20,
//     elevation: 3,
//   },
//   wishText: {
//     fontSize: 18,
//     color: '#c2185b',
//     textAlign: 'center',
//     fontFamily: 'Georgia',
//   },
//   balloon: {
//     position: 'absolute',
//     width: 80,
//     height: 100,
//     resizeMode: 'contain',
//   },

//   // Future Screen Styles
//   futureContainer: {
//     flex: 1,
//   },
//   futureImage: {
//     width: width - 40,
//     height: height * 0.5,
//     borderRadius: 10,
//     alignSelf: 'center',
//     marginTop: 20,
//   },
//   futureTextContainer: {
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 10,
//     padding: 15,
//     margin: 20,
//     elevation: 3,
//   },
//   futureTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#c2185b',
//     marginBottom: 5,
//     fontFamily: 'Georgia',
//   },
//   futureDescription: {
//     fontSize: 16,
//     color: '#333',
//     fontFamily: 'Georgia',
//   },
//   dotsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginVertical: 20,
//   },
//   dot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     backgroundColor: '#e0e0e0',
//     marginHorizontal: 5,
//   },
//   activeDot: {
//     backgroundColor: '#c2185b',
//   },

//   // Song Screen Styles
//   songContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   lyricsContainer: {
//     minHeight: 100,
//     justifyContent: 'center',
//     marginBottom: 30,
//   },
//   lyricsLine: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#c2185b',
//     textAlign: 'center',
//     fontFamily: 'Georgia',
//   },
//   songImage: {
//     width: 200,
//     height: 200,
//     borderRadius: 100,
//     marginVertical: 30,
//   },
//   musicNote: {
//     position: 'absolute',
//     width: 30,
//     height: 30,
//     resizeMode: 'contain',
//   },

//   // Surprise Screen Styles
//   surpriseContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   surpriseButton: {
//     alignItems: 'center',
//   },
//   surpriseGift: {
//     width: 200,
//     height: 200,
//     borderRadius: 20,
//   },
//   surpriseButtonText: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#c2185b',
//     marginTop: 20,
//     textAlign: 'center',
//     fontFamily: 'Georgia',
//   },
//   surpriseMessage: {
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 10,
//     padding: 20,
//     margin: 20,
//     elevation: 5,
//   },
//   surpriseTitle: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#c2185b',
//     marginBottom: 15,
//     textAlign: 'center',
//     fontFamily: 'Georgia',
//   },
//   surpriseText: {
//     fontSize: 16,
//     color: '#333',
//     marginBottom: 15,
//     lineHeight: 24,
//     fontFamily: 'Georgia',
//   },
//   surpriseSignature: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#c2185b',
//     textAlign: 'right',
//     fontFamily: 'Georgia',
//   },
//   confettiPiece: {
//     position: 'absolute',
//     width: 10,
//     height: 10,
//   },

//   // Our Moments Screen Styles
//   momentsContainer: {
//     flex: 1,
//   },
//   momentsList: {
//     paddingBottom: 20,
//   },
//   momentCard: {
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 10,
//     marginHorizontal: 15,
//     marginVertical: 10,
//     overflow: 'hidden',
//     elevation: 3,
//   },
//   momentImage: {
//     width: '100%',
//     height: 200,
//   },
//   momentTextContainer: {
//     padding: 15,
//   },
//   momentTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#c2185b',
//     fontFamily: 'Georgia',
//   },
//   momentDescription: {
//     fontSize: 16,
//     color: '#333',
//     fontFamily: 'Georgia',
//   },

//   // Promises Screen Styles
//   promisesContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   promiseBox: {
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 10,
//     padding: 20,
//     margin: 20,
//     elevation: 3,
//   },
//   promiseText: {
//     fontSize: 18,
//     color: '#c2185b',
//     textAlign: 'center',
//     fontFamily: 'Georgia',
//   },

//   // Dreams Screen Styles
//   dreamsContainer: {
//     flex: 1,
//   },
//   dreamImage: {
//     width: width - 40,
//     height: height * 0.5,
//     borderRadius: 10,
//     alignSelf: 'center',
//     marginTop: 20,
//   },
//   dreamTextContainer: {
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     borderRadius: 10,
//     padding: 15,
//     margin: 20,
//     elevation: 3,
//   },
//   dreamTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#c2185b',
//     marginBottom: 5,
//     fontFamily: 'Georgia',
//   },
//   dreamDescription: {
//     fontSize: 16,
//     color: '#333',
//     fontFamily: 'Georgia',
//   },
// });
