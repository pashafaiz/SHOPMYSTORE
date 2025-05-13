import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  Platform,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import Trace from '../utils/Trace';
import FastImage from 'react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/profileSlice';

const { width, height } = Dimensions.get('window');
const drawerWidth = Math.min(width * 0.8, 320);
const scaleFactor = width / 375;
const scale = size => size * scaleFactor;
const scaleFont = size => Math.round(size * (Math.min(width, height) / 375));

const Drawer = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth); // Access user from auth slice
  const [userData, setUserData] = useState({
    name: 'Guest',
    email: '',
    profileImage: null,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-drawerWidth)).current;
  const menuItemsAnim = useRef(
    Array(6)
      .fill()
      .map(() => new Animated.Value(0)),
  ).current;

  const menuItems = [
    { name: 'Orders', icon: 'shopping-cart', screen: 'OrderHistory' },
    { name: 'Change Language', icon: 'language', screen: 'ChangeLanguage' },
    { name: 'Settings', icon: 'settings', screen: 'Settings' },
    { name: 'Continue as Seller', icon: 'store', screen: 'SellerSignup' },
    { name: 'Support', icon: 'support-agent', screen: 'Support' },
    { name: 'Invite Friends', icon: 'person-add', screen: 'InviteFriends' },
  ];

  // Fetch user data from Redux or AsyncStorage
  useEffect(() => {
  
    const loadUserData = async () => {
      try {
        if (user?.fullName && user?.email) {
          setUserData({
            name: user.fullName || 'Guest',
            email: user.email || '',
            profileImage: user.profileImage || null,
          });
        } else {
          const storedUser = await AsyncStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUserData({
              name: parsedUser.fullName || 'Guest',
              email: parsedUser.email || '',
              profileImage: parsedUser?.profileImage || null,
            });
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setUserData({
          name: 'Guest',
          email: '',
          profileImage: null,
        });
      }
    };

    loadUserData();
  }, [user]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        tension: 100,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.stagger(
        100,
        menuItemsAnim.map(anim =>
          Animated.spring(anim, {
            toValue: 1,
            friction: 8,
            tension: 80,
            useNativeDriver: true,
          }),
        ),
      ),
    ]).start();
  }, []);

  const handleNavigation = async (screen, name) => {
    Trace(`Drawer Item Clicked: ${name}`);
    console.log(`Attempting navigation to: ${screen}`);
    try {
      navigation.navigate('Main', {
        screen: 'HomeStack',
        params: { screen, fromDrawer: true },
      });
      console.log('Navigation dispatched:', {
        route: 'Main -> HomeStack -> ' + screen,
        params: { screen, fromDrawer: true },
      });
      navigation.dispatch(DrawerActions.closeDrawer());
    } catch (error) {
      console.error(`Navigation error to ${screen}:`, error);
    }
  };

  const handleLogout = async () => {
    Trace('Drawer Item Clicked: Logout');
    console.log('Initiating logout...');
    try {
      await dispatch(logout()).unwrap();
      console.log('Logout successful, resetting to Login');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderMenuItem = (item, index) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const hoverAnim = useRef(new Animated.Value(0)).current;

    const onPressIn = () => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.98,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(hoverAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const onPressOut = () => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(hoverAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const gradientColors = ['rgba(138, 43, 226, 0.2)', 'rgba(30, 144, 255, 0.2)'];

    return (
      <Animated.View
        key={item.name}
        style={[
          styles.menuItem,
          {
            opacity: menuItemsAnim[index],
            transform: [
              {
                translateX: menuItemsAnim[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              },
              { scale: scaleAnim },
              {
                translateY: hoverAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -5],
                }),
              },
            ],
            backgroundColor: hoverAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [
                'rgba(255, 255, 255, 0.05)',
                'rgba(255, 255, 255, 0.15)',
              ],
            }),
          },
        ]}>
        <TouchableOpacity
          style={styles.menuItemTouchable}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => handleNavigation(item.screen, item.name)}>
          <LinearGradient
            colors={gradientColors}
            style={styles.menuItemGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <Icon
              name={item.icon}
              size={scale(20)}
              color="#A0E7E5"
              style={styles.menuIcon}
            />
            <Text style={styles.menuText}>{item.name}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Default profile image if user has no image
  const defaultProfileImage = 'https://via.placeholder.com/100';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateX }],
        },
      ]}>
      <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.drawer}>
        <View style={styles.header}>
          <FastImage
            source={{ uri: userData.profileImage || defaultProfileImage }}
            style={styles.profileImage}
            resizeMode={FastImage.resizeMode.cover}
            onError={() => {
              console.log('Failed to load profile image, using default');
            }}
          />
          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userEmail}>{userData.email || 'No email provided'}</Text>
        </View>

        <ScrollView
          style={styles.menuContainer}
          contentContainerStyle={styles.menuContentContainer}
          showsVerticalScrollIndicator={false}>
          {menuItems.map((item, index) => renderMenuItem(item, index))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.premiumButton}
            onPress={() => {
              Trace('Premium Upgrade Clicked');
              console.log('Navigating to Premium with fromDrawer: true');
              navigation.navigate('Main', {
                screen: 'HomeStack',
                params: { screen: 'PremiumPlans', fromDrawer: true },
              });
            }}>
            <LinearGradient
              colors={['#FF6B6B', '#FFD93D']}
              style={styles.premiumGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <Text style={styles.premiumText}>Go Premium</Text>
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                }}>
                <AntDesign name="star" size={scale(18)} color="#FFFFFF" />
              </Animated.View>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LinearGradient
              colors={['#EF4444', '#F87171']}
              style={styles.logoutGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <Icon
                name="exit-to-app"
                size={scale(18)}
                color="#FFFFFF"
                style={styles.menuIcon}
              />
              <Text style={styles.logoutText}>Logout</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.versionText}>App Version: 1.0.0</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  drawer: {
    height: '100%',
    paddingTop: Platform.OS === 'ios' ? scale(50) : scale(30),
    paddingBottom: scale(30),
    borderRightColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    padding: scale(20),
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(15),
    marginHorizontal: scale(15),
    backdropFilter: 'blur(10px)',
  },
  profileImage: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(50),
    borderWidth: 3,
    borderColor: '#A0E7E5',
    marginBottom: scale(15),
    shadowColor: '#A0E7E5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  userName: {
    fontSize: scaleFont(18),
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  userEmail: {
    fontSize: scaleFont(12),
    color: '#D1D5DB',
    marginTop: scale(5),
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: scale(10),
  },
  menuContentContainer: {
    paddingVertical: scale(30),
  },
  menuItem: {
    marginVertical: scale(8),
    marginHorizontal: scale(10),
    borderRadius: scale(15),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  menuItemTouchable: {
    borderRadius: scale(15),
  },
  menuItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(15),
    borderRadius: scale(15),
  },
  menuIcon: {
    marginRight: scale(15),
  },
  menuText: {
    fontSize: scaleFont(12),
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footer: {
    padding: scale(20),
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(15),
    marginHorizontal: scale(15),
  },
  premiumButton: {
    marginBottom: scale(15),
    borderRadius: scale(25),
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  premiumGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(12),
    paddingHorizontal: scale(25),
  },
  premiumText: {
    fontSize: scaleFont(14),
    color: '#FFFFFF',
    fontWeight: '700',
    marginRight: scale(10),
  },
  logoutButton: {
    marginBottom: scale(15),
    borderRadius: scale(25),
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(12),
    paddingHorizontal: scale(25),
  },
  logoutText: {
    fontSize: scaleFont(14),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  versionText: {
    fontSize: scaleFont(10),
    color: '#D1D5DB',
    letterSpacing: 0.5,
  },
});

export default Drawer;