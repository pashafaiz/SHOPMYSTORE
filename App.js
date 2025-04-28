import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Platform,
  Dimensions,
  LogBox,
  Animated,
  Easing,
} from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './src/redux/store';
import Navigator from './src/Navigation/Navigator';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';
import Trace from './src/utils/Trace';
import img from './src/assets/Images/img';
import { checkAuth } from './src/redux/slices/authSlice';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = size => Math.round(size * scaleFactor);

// Get status bar height for consistent padding
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

const AppContent = () => {
  LogBox.ignoreAllLogs(true);
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [initialRoute, setInitialRoute] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rotationLoop = useRef(null);

  useEffect(() => {
    // Start splash screen animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    rotationLoop.current = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotationLoop.current.start();

    // Hide splash screen after 2.5 seconds
    const splashTimer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setShowSplash(false));
    }, 2500);

    return () => {
      clearTimeout(splashTimer);
      if (rotationLoop.current) {
        rotationLoop.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!showSplash) {
      dispatch(checkAuth()).then(() => {
        setInitialRoute(isAuthenticated ? 'BottomTabs' : 'Login');
      });
    }
  }, [showSplash, isAuthenticated, dispatch]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (showSplash || initialRoute === null) {
    return (
      <View style={styles.splashContainer}>
        <LinearGradient
          colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
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
          <Animated.Image
            source={img.App}
            style={[
              styles.splashLogo,
              { transform: [{ rotate: rotateInterpolate }] },
            ]}
            resizeMode="contain"
          />
          <Animated.Text
            style={[
              styles.splashText,
              { opacity: fadeAnim },
            ]}
          >
            Welcome to ShopMyStore
          </Animated.Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.circle1,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.1],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.circle2,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.05],
              }),
            },
          ]}
        />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.rootContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#0A0A1E"
          translucent={false}
        />
        <View style={{ height: STATUS_BAR_HEIGHT, backgroundColor: '#0A0A1E' }} />
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
          <NavigationContainer>
            <Navigator initialRouteName={initialRoute} />
          </NavigationContainer>
          <Toast />
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0A0A1E',
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A1E',
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
  },
  splashLogo: {
    width: scale(120),
    height: scale(120),
    marginBottom: scale(20),
  },
  splashText: {
    fontSize: scale(18),
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(123, 97, 255, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  circle1: {
    position: 'absolute',
    width: scale(300),
    height: scale(300),
    borderRadius: scale(150),
    backgroundColor: '#7B61FF',
    top: '20%',
    left: '-20%',
  },
  circle2: {
    position: 'absolute',
    width: scale(400),
    height: scale(400),
    borderRadius: scale(200),
    backgroundColor: '#AD4DFF',
    bottom: '-20%',
    right: '-20%',
  },
  container: {
    flex: 1,
    backgroundColor: '#0A0A1E',
  },
});

export default App;