import React, { useEffect, useRef, useContext, useState } from 'react';
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
import { ThemeContext } from '../constants/ThemeContext';
import FastImage from 'react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = size => size * scaleFactor;
const scaleFont = size => Math.round(size * (Math.min(width, height) / 375));

const Settings = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { theme, isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { user } = useSelector((state) => state.auth); // Access user from auth slice
  const [userData, setUserData] = useState({
    name: 'Guest',
    email: '',
    profileImage: null,
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);

  // Fetch user data from Redux or AsyncStorage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (user?.fullName && user?.email) {
          // Use Redux data if available
          setUserData({
            name: user.fullName || 'Guest',
            email: user.email || '',
            profileImage: user.profileImage || null,
          });
        } else {
          // Fallback to AsyncStorage
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
  }, []);

  const handleToggleNotifications = () => {
    setIsNotificationsEnabled(prev => !prev);
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
      <Animated.View style={[styles.settingItem(theme), { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          style={styles.settingItemContent}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={onPress}
        >
          <LinearGradient
            colors={['rgba(123, 97, 255, 0.2)', 'rgba(173, 77, 255, 0.2)']}
            style={styles.settingItemGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.settingItemLeft}>
              <Icon name={icon} size={scale(20)} color={theme.textTertiary} style={styles.settingIcon} />
              <Text style={[styles.settingText, { color: theme.textPrimary }]}>{title}</Text>
            </View>
            {isToggle ? (
              <Switch
                value={toggleValue}
                onValueChange={toggleAction}
                trackColor={{ false: theme.textMuted, true: '#AD4DFF' }}
                thumbColor={toggleValue ? '#7B61FF' : theme.textPrimary}
              />
            ) : (
              <Icon name="chevron-right" size={scale(20)} color={theme.textTertiary} />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Default profile image
  const defaultProfileImage = 'https://via.placeholder.com/100';

  return (
    <View style={[styles.container, { backgroundColor: theme.containerBg }]}>
      <LinearGradient
        colors={theme.background}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Animated.View
        style={[styles.mainContainer, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}
      >
        <Header
          showLeftIcon={true}
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
          title="Settings"
          textStyle={{ color: theme.textPrimary }}
        />
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileSection(theme)}>
            <LinearGradient
              colors={['#7B61FF', '#AD4DFF']}
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
            <Text style={[styles.profileName, { color: theme.textPrimary }]}>{userData.name}</Text>
            <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>
              {userData.email || 'No email provided'}
            </Text>
          </View>

          <View style={styles.settingsSection(theme)}>
            <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>General Settings</Text>
            {renderSettingItem(
              'notifications',
              'Notifications',
              null,
              true,
              isNotificationsEnabled,
              handleToggleNotifications
            )}
            {renderSettingItem(
              'dark-mode',
              'Dark Mode',
              null,
              true,
              isDarkMode,
              toggleTheme
            )}
            {renderSettingItem('language', 'Language', () => handleNavigation('ChangeLanguage'))}
            {renderSettingItem('privacy', 'Privacy', () => handleNavigation('Privacy'))}
          </View>

          <View style={styles.accountSection(theme)}>
            <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Account</Text>
            {renderSettingItem('lock', 'Change Password', () => handleNavigation('ForgotPassword'))}
            {renderSettingItem('help', 'Help & Support', () => handleNavigation('Support'))}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LinearGradient
                colors={['#EF4444', '#F87171']}
                style={styles.logoutGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Icon name="exit-to-app" size={scale(18)} color="#FFFFFF" style={styles.menuIcon} />
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
  scrollContainer: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(30),
    flexGrow: 1,
    marginTop: scale(30),
  },
  profileSection: theme => ({
    alignItems: 'center',
    marginBottom: scale(30),
    padding: scale(16),
    backgroundColor: theme.glassBg,
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: theme.glassBorder,
  }),
  profileIconContainer: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(16),
  },
  profileImage: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: scaleFont(24),
    fontWeight: '800',
    marginBottom: scale(8),
    textAlign: 'center',
    letterSpacing: 1,
  },
  profileEmail: {
    fontSize: scaleFont(14),
    marginBottom: scale(16),
    textAlign: 'center',
    opacity: 0.9,
  },
  settingsSection: theme => ({
    marginBottom: scale(30),
    padding: scale(12),
    backgroundColor: theme.glassBg,
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: theme.glassBorder,
  }),
  accountSection: theme => ({
    marginBottom: scale(30),
    padding: scale(12),
    backgroundColor: theme.glassBg,
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: theme.glassBorder,
  }),
  sectionTitle: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    marginBottom: scale(16),
    letterSpacing: 0.5,
  },
  settingItem: theme => ({
    marginBottom: scale(8),
    borderRadius: scale(12),
    overflow: 'hidden',
    backgroundColor: theme.glassBg,
    borderWidth: 1,
    borderColor: theme.glassBorder,
  }),
  settingItemContent: {
    borderRadius: scale(12),
    minHeight: scale(48),
  },
  settingItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
    justifyContent: 'space-between',
    minHeight: scale(48),
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
    fontSize: scaleFont(14),
    fontWeight: '700',
    flex: 1,
    lineHeight: scale(20),
  },
  logoutButton: {
    marginTop: scale(8),
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(12),
    paddingHorizontal: scale(18),
  },
  logoutText: {
    fontSize: scaleFont(14),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  menuIcon: {
    marginRight: scale(12),
  },
});

export default Settings;