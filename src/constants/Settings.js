import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
  Switch,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/profileSlice';
import Trace from '../utils/Trace';
import Header from '../Components/Header';
import FastImage from 'react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const scaleFactor = Math.min(width, 375) / 375;
const scale = (size) => Math.round(size * scaleFactor);
const scaleFont = (size) => {
  const fontScale = Math.min(width, height) / 375;
  const scaledSize = size * fontScale * (Platform.OS === 'ios' ? 0.9 : 0.85);
  return Math.round(scaledSize);
};

// Theme constants
const PRODUCT_BG_COLOR = '#f5f9ff';
const CATEGORY_BG_COLOR = 'rgba(91, 156, 255, 0.2)';
const PRIMARY_THEME_COLOR = '#5b9cff';
const SECONDARY_THEME_COLOR = '#ff6b8a';
const TEXT_THEME_COLOR = '#1a2b4a';
const SUBTEXT_THEME_COLOR = '#5a6b8a';
const BORDER_THEME_COLOR = 'rgba(91, 156, 255, 0.3)';
const BACKGROUND_GRADIENT = ['#8ec5fc', '#fff'];

const Settings = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [userData, setUserData] = useState({
    name: 'Guest',
    email: '',
    profileImage: null,
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);

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
              profileImage: parsedUser.profileImage || null,
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
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideUpAnim]);

  const handleToggleNotifications = () => {
    setIsNotificationsEnabled((prev) => !prev);
  };

  const handleNavigation = (screen) => {
    navigation.navigate(screen);
  };

  const handleLogout = async () => {
    Trace('Settings: Logout Clicked');
    console.log('Initiating logout from Settings...');
    try {
      await dispatch(logout()).unwrap();
      console.log('Logout successful, resetting to Login');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderSettingItem = (icon, title, onPress, isToggle = false, toggleValue, toggleAction) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View style={[styles.settingItem, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          style={styles.settingItemContent}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={onPress}
        >
          <LinearGradient
            colors={[CATEGORY_BG_COLOR, CATEGORY_BG_COLOR]}
            style={styles.settingItemGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.settingItemLeft}>
              <Icon name={icon} size={scale(20)} color={SUBTEXT_THEME_COLOR} style={styles.settingIcon} />
              <Text style={styles.settingText}>{title}</Text>
            </View>
            {isToggle ? (
              <Switch
                value={toggleValue}
                onValueChange={toggleAction}
                trackColor={{ false: CATEGORY_BG_COLOR, true: PRIMARY_THEME_COLOR }}
                thumbColor={toggleValue ? TEXT_THEME_COLOR : PRODUCT_BG_COLOR}
              />
            ) : (
              <Icon name="chevron-right" size={scale(20)} color={SUBTEXT_THEME_COLOR} />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const defaultProfileImage = 'https://via.placeholder.com/100';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={BACKGROUND_GRADIENT}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <Animated.View
        style={[styles.mainContainer, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}
      >
        <Header
          showLeftIcon={true}
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
          title="Settings"
          textStyle={styles.headerText}
          containerStyle={styles.headerContainer}
        />
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileSection}>
            <LinearGradient
              colors={['#5b9cff', '#8ec5fc']}
              style={styles.profileIconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <FastImage
                source={{ uri: userData.profileImage || defaultProfileImage }}
                style={styles.profileImage}
                resizeMode={FastImage.resizeMode.cover}
                onError={() => {
                  console.log('Failed to load profile image, using default');
                }}
              />
            </LinearGradient>
            <Text style={styles.profileName}>{userData.name}</Text>
            <Text style={styles.profileEmail}>{userData.email || 'No email provided'}</Text>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>General Settings</Text>
            {renderSettingItem(
              'notifications',
              'Notifications',
              null,
              true,
              isNotificationsEnabled,
              handleToggleNotifications
            )}
            {renderSettingItem('language', 'Language', () => handleNavigation('ChangeLanguage'))}
            {renderSettingItem('privacy', 'Privacy', () => handleNavigation('Privacy'))}
          </View>

          <View style={styles.accountSection}>
            <Text style={styles.sectionTitle}>Account</Text>
            {renderSettingItem('lock', 'Change Password', () => handleNavigation('ForgotPassword'))}
            {renderSettingItem('help', 'Help & Support', () => handleNavigation('Support'))}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LinearGradient
                colors={['#ff6b8a', '#ff8b9a']}
                style={styles.logoutGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Icon name="exit-to-app" size={scale(18)} color={TEXT_THEME_COLOR} style={styles.menuIcon} />
                <Text style={styles.logoutText}>Logout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRODUCT_BG_COLOR,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  mainContainer: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(20),
    padding: scale(15),
    margin: scale(20),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    elevation: 5,
  },
  headerText: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
    textAlign: 'center',
  },
  scrollContainer: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(40),
    flexGrow: 1,
    marginTop: scale(20),
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: scale(30),
    padding: scale(20),
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(20),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    // elevation: 5,
  },
  profileIconContainer: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(16),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  profileImage: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    borderWidth: scale(2),
    borderColor: PRODUCT_BG_COLOR,
  },
  profileName: {
    fontSize: scaleFont(22),
    fontWeight: '800',
    color: TEXT_THEME_COLOR,
    marginBottom: scale(8),
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  profileEmail: {
    fontSize: scaleFont(14),
    color: SUBTEXT_THEME_COLOR,
    textAlign: 'center',
    fontWeight: '500',
  },
  settingsSection: {
    marginBottom: scale(30),
    padding: scale(20),
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(20),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    // elevation: 5,
  },
  accountSection: {
    marginBottom: scale(30),
    padding: scale(20),
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(20),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    // elevation: 5,
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
    marginBottom: scale(16),
    letterSpacing: 0.5,
  },
  settingItem: {
    marginBottom: scale(12),
    borderRadius: scale(16),
    overflow: 'hidden',
    backgroundColor: PRODUCT_BG_COLOR,
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(6),
    // elevation: 3,
  },
  settingItemContent: {
    borderRadius: scale(16),
    minHeight: scale(56),
  },
  settingItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(14),
    justifyContent: 'space-between',
    minHeight: scale(56),
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: scale(12),
  },
  settingText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: TEXT_THEME_COLOR,
    flex: 1,
    lineHeight: scale(22),
  },
  logoutButton: {
    marginTop: scale(12),
    borderRadius: scale(16),
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
    paddingHorizontal: scale(18),
  },
  logoutText: {
    fontSize: scaleFont(16),
    color: TEXT_THEME_COLOR,
    fontWeight: '700',
  },
  menuIcon: {
    marginRight: scale(12),
  },
});

export default Settings;