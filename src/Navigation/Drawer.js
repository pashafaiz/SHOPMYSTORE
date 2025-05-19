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

// Theme constants
const PRODUCT_BG_COLOR = '#f5f9ff';
const CATEGORY_BG_COLOR = 'rgba(91, 156, 255, 0.2)';
const SELECTED_CATEGORY_BG_COLOR = '#5b9cff';
const PRIMARY_THEME_COLOR = '#5b9cff';
const SECONDARY_THEME_COLOR = '#ff6b8a';
const TEXT_THEME_COLOR = '#1a2b4a';
const SUBTEXT_THEME_COLOR = '#5a6b8a';
const BORDER_THEME_COLOR = 'rgba(91, 156, 255, 0.3)';
const BACKGROUND_GRADIENT = ['#8ec5fc', '#fff'];

const Drawer = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [userData, setUserData] = useState({
    name: 'Guest',
    email: '',
    profileImage: null,
  });
  const [isSeller, setIsSeller] = useState(false);

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
    { name: isSeller ? 'Seller Dashboard' : 'Continue as Seller', icon: 'store', screen: isSeller ? 'SellerDashboard' : 'SellerSignup' },
    { name: 'Support', icon: 'support-agent', screen: 'Support' },
    { name: 'Invite Friends', icon: 'person-add', screen: 'InviteFriends' },
  ];

  // Fetch user data and determine seller status
  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (user?.fullName && user?.email) {
          setUserData({
            name: user.fullName || 'Guest',
            email: user.email || '',
            profileImage: user.profileImage || null,
          });
          setIsSeller(user.userType === 'seller');
        } else {
          const storedUser = await AsyncStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUserData({
              name: parsedUser.fullName || 'Guest',
              email: parsedUser.email || '',
              profileImage: parsedUser?.profileImage || null,
            });
            setIsSeller(parsedUser.userType === 'seller');
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setUserData({
          name: 'Guest',
          email: '',
          profileImage: null,
        });
        setIsSeller(false);
      }
    };

    loadUserData();
  }, [user]);

  // Drawer animations
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
        route: `Main -> HomeStack -> ${screen}`,
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
                CATEGORY_BG_COLOR,
                SELECTED_CATEGORY_BG_COLOR,
              ],
            }),
          },
        ]}>
        <TouchableOpacity
          style={styles.menuItemTouchable}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => handleNavigation(item.screen, item.name)}
        >
          <LinearGradient
            colors={[PRODUCT_BG_COLOR, PRODUCT_BG_COLOR]}
            style={styles.menuItemGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon
              name={item.icon}
              size={scale(22)}
              color={PRIMARY_THEME_COLOR}
              style={styles.menuIcon}
            />
            <Text style={styles.menuText}>{item.name}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Default profile image
  const defaultProfileImage = 'https://via.placeholder.com/100';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateX }],
        },
      ]}
    >
      <LinearGradient
        colors={BACKGROUND_GRADIENT}
        style={styles.drawer}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
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
          showsVerticalScrollIndicator={false}
        >
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
            }}
          >
            <LinearGradient
              colors={['#5b9cff', '#8ec5fc']}
              style={styles.premiumGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
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
                }}
              >
                <AntDesign name="star" size={scale(18)} color={TEXT_THEME_COLOR} />
              </Animated.View>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LinearGradient
              colors={['#ff6b8a', '#ff8e9e']}
              style={styles.logoutGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon
                name="exit-to-app"
                size={scale(18)}
                color={TEXT_THEME_COLOR}
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  drawer: {
    height: '100%',
    paddingTop: Platform.OS === 'ios' ? scale(50) : scale(30),
    paddingBottom: scale(30),
    borderRightWidth: scale(2),
    borderRightColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    elevation: 5,
  },
  header: {
    padding: scale(25),
    alignItems: 'center',
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(20),
    marginHorizontal: scale(15),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    elevation: 4,
  },
  profileImage: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    borderWidth: scale(3),
    borderColor: PRIMARY_THEME_COLOR,
    marginBottom: scale(20),
    shadowColor: PRIMARY_THEME_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
  },
  userName: {
    fontSize: scaleFont(20),
    fontWeight: '800',
    color: TEXT_THEME_COLOR,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  userEmail: {
    fontSize: scaleFont(14),
    color: SUBTEXT_THEME_COLOR,
    marginTop: scale(8),
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: scale(15),
  },
  menuContentContainer: {
    paddingVertical: scale(30),
  },
  menuItem: {
    marginVertical: scale(10),
    marginHorizontal: scale(10),
    borderRadius: scale(20),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    elevation: 4,
  },
  menuItemTouchable: {
    borderRadius: scale(20),
  },
  menuItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(18),
    borderRadius: scale(20),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  menuIcon: {
    marginRight: scale(15),
  },
  menuText: {
    fontSize: scaleFont(15),
    color: TEXT_THEME_COLOR,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footer: {
    padding: scale(25),
    alignItems: 'center',
    backgroundColor: PRODUCT_BG_COLOR,
    borderTopWidth: scale(2),
    borderTopColor: BORDER_THEME_COLOR,
    borderRadius: scale(20),
    marginHorizontal: scale(15),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    elevation: 4,
  },
  premiumButton: {
    marginBottom: scale(20),
    borderRadius: scale(30),
    overflow: 'hidden',
    shadowColor: PRIMARY_THEME_COLOR,
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
    elevation: 5,
  },
  premiumGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(14),
    paddingHorizontal: scale(30),
  },
  premiumText: {
    fontSize: scaleFont(16),
    color: TEXT_THEME_COLOR,
    fontWeight: '700',
    marginRight: scale(12),
  },
  logoutButton: {
    marginBottom: scale(20),
    borderRadius: scale(30),
    overflow: 'hidden',
    shadowColor: SECONDARY_THEME_COLOR,
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
    elevation: 5,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(14),
    paddingHorizontal: scale(30),
  },
  logoutText: {
    fontSize: scaleFont(16),
    color: TEXT_THEME_COLOR,
    fontWeight: '700',
  },
  versionText: {
    fontSize: scaleFont(12),
    color: SUBTEXT_THEME_COLOR,
    letterSpacing: 0.5,
  },
});

export default Drawer;