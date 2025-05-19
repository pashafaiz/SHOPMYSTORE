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

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

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
        setInitialRoute(isAuthenticated ? 'BottomTabs' : 'Login');
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
    top: 0,
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