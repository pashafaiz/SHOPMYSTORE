import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Easing,
  BackHandler,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InputBox from '../Components/InputBox';
import img from '../assets/Images/img';
import { useNavigation, StackActions } from '@react-navigation/native';
import Button from '../Components/Button';
import { signup, clearErrors, logout } from '../redux/slices/authSlice';
import Loader from '../Components/Loader';

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

const SellerSignup = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { loading, errors } = useSelector((state) => state.auth);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [isChecked, setChecked] = useState(false);
  const [fullName, setFullName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const welcomeFade = useRef(new Animated.Value(1)).current;
  const formFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    const handleBackPress = () => {
      console.log('Back press triggered, showSignupForm:', showSignupForm);
      if (showSignupForm) {
        navigation.navigate('Main', {
          screen: 'HomeStack',
          params: { screen: 'BottomTabs' },
        });
        return true;
      } else {
        navigation.navigate('Login');
        return true;
      }
    };

    const backListener = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      backListener.remove();
      AsyncStorage.removeItem('wasOnSignupForm').catch((error) =>
        console.error('Error removing wasOnSignupForm:', error)
      );
      dispatch(clearErrors());
    };
  }, [dispatch, showSignupForm, navigation]);

  const handleProceedToSignup = () => {
    Animated.parallel([
      Animated.timing(welcomeFade, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(formFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSignupForm(true);
      AsyncStorage.setItem('wasOnSignupForm', 'true').catch((error) =>
        console.error('Error setting wasOnSignupForm:', error)
      );
    });
  };

  const handleGoBack = () => {
    console.log('Attempting to go back to BottomTabs');
    try {
      navigation.navigate('Main', {
        screen: 'HomeStack',
        params: { screen: 'BottomTabs' },
      });
      console.log('Navigated to BottomTabs');
    } catch (error) {
      console.error('Error navigating to BottomTabs:', error);
      navigation.navigate('Login');
      console.log('Fallback: Navigated to Login');
    }
  };

  const handleLogin = async () => {
    console.log('Attempting to navigate to Login from SellerSignup');
    console.log('Navigation state before:', navigation.getState());
    try {
      // Clear all auth-related AsyncStorage keys
      await AsyncStorage.multiRemove(['userToken', 'wasOnSignupForm', 'user']);
      console.log('AsyncStorage cleared: userToken, wasOnSignupForm, user');

      // Dispatch logout to clear Redux auth state
      await dispatch(logout()).unwrap();
      console.log('Logout dispatched, auth state cleared');

      // Try replacing the current screen with Login
      navigation.dispatch(StackActions.replace('Login'));
      console.log('Dispatched StackActions.replace to Login');
    } catch (error) {
      console.error('Navigation to Login failed:', error);
      // Fallback to reset navigation stack
      try {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        console.log('Navigation reset to Login');
      } catch (resetError) {
        console.error('Reset navigation to Login failed:', resetError);
        // Ultimate fallback: navigate to root
        navigation.navigate('Login');
        console.log('Fallback: Navigated to Login');
      }
    }
    console.log('Navigation state after:', navigation.getState());
  };

  const validateForm = () => {
    let tempErrors = {};
    let isValid = true;

    if (!fullName.trim()) {
      tempErrors.fullName = 'Full Name is required';
      isValid = false;
    }

    if (!userName.trim()) {
      tempErrors.userName = 'Username is required';
      isValid = false;
    }

    if (!email.trim()) {
      tempErrors.email = 'Email is required';
      isValid = false;
    }

    if (!phoneNumber.trim()) {
      tempErrors.phoneNumber = 'Phone Number is required';
      isValid = false;
    }

    if (!password.trim()) {
      tempErrors.password = 'Password is required';
      isValid = false;
    }

    if (!confirmPassword.trim()) {
      tempErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    }

    if (!isChecked) {
      tempErrors.terms = 'Please accept Terms & Conditions and Privacy Policy';
      isValid = false;
    }

    dispatch({ type: 'auth/signup/rejected', payload: tempErrors });
    return isValid;
  };

  const handleSignup = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    if (!validateForm()) {
      return;
    }

    const formData = {
      userType: 'seller',
      fullName,
      userName,
      email,
      phoneNumber,
      password,
      confirmPassword,
    };

    dispatch(signup(formData)).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        navigation.navigate('OTP', { email });
      }
    });
  };

  const clearError = (field) => {
    if (errors[field]) {
      dispatch(clearErrors());
    }
  };

  const renderWelcomeScreen = () => (
    <Animated.View
      style={[
        styles.welcomeContainer,
        {
          opacity: welcomeFade,
          transform: [{ translateY: slideUpAnim }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          style={styles.logo}
          source={img.App}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>Become a Seller Today!</Text>
      </Animated.View>
      <Text style={styles.welcomeText}>Ready to Start Selling?</Text>
      <Text style={styles.welcomeSubtitle}>
        Join our platform and reach millions of customers with your products!
      </Text>
      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <Button
          title="Yes, Let's Go!"
          onPress={handleProceedToSignup}
          style={styles.welcomeButton}
          textStyle={styles.buttonText}
          gradientColors={['#5b9cff', '#8ec5fc']}
        />
      </Animated.View>
      <TouchableOpacity onPress={handleGoBack}>
        <Text style={styles.backLink}>Not Now</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSignupForm = () => (
    <Animated.View
      style={[
        styles.formContainer,
        {
          opacity: formFade,
          transform: [{ translateY: slideUpAnim }],
        },
      ]}
    >
      <Text style={styles.formTitle}>Join as a Seller</Text>
      <Text style={styles.formSubtitle}>Create your seller account</Text>

      <View style={styles.sellerCheckboxContainer}>
        <LinearGradient
          colors={['#5b9cff', '#8ec5fc']}
          style={styles.sellerCheckbox}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Image source={img.check} style={styles.checkIcon} />
        </LinearGradient>
        <Text style={styles.sellerCheckboxText}>Registering as Seller</Text>
      </View>

      <InputBox
        placeholder="Full Name"
        placeholderTextColor={SUBTEXT_THEME_COLOR}
        icon={img.user}
        value={fullName}
        onChangeText={(text) => {
          setFullName(text);
          clearError('fullName');
        }}
        error={errors.fullName}
        iconColor={PRIMARY_THEME_COLOR}
        containerStyle={styles.inputContainer}
      />

      <InputBox
        placeholder="Username"
        placeholderTextColor={SUBTEXT_THEME_COLOR}
        icon={img.user}
        value={userName}
        onChangeText={(text) => {
          setUserName(text);
          clearError('userName');
        }}
        error={errors.userName}
        iconColor={PRIMARY_THEME_COLOR}
        containerStyle={styles.inputContainer}
      />

      <InputBox
        placeholder="Email Address"
        placeholderTextColor={SUBTEXT_THEME_COLOR}
        icon={img.mail}
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          clearError('email');
        }}
        error={errors.email}
        iconColor={PRIMARY_THEME_COLOR}
        containerStyle={styles.inputContainer}
        keyboardType="email-address"
      />

      <InputBox
        placeholder="Phone Number"
        placeholderTextColor={SUBTEXT_THEME_COLOR}
        icon={img.call}
        value={phoneNumber}
        onChangeText={(text) => {
          setPhoneNumber(text);
          clearError('phoneNumber');
        }}
        error={errors.phoneNumber}
        iconColor={PRIMARY_THEME_COLOR}
        containerStyle={styles.inputContainer}
        keyboardType="phone-pad"
      />

      <InputBox
        placeholder="Password"
        placeholderTextColor={SUBTEXT_THEME_COLOR}
        icon={img.lock}
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          clearError('password');
        }}
        secureTextEntry
        error={errors.password}
        iconColor={PRIMARY_THEME_COLOR}
        containerStyle={styles.inputContainer}
      />

      <InputBox
        placeholder="Confirm Password"
        placeholderTextColor={SUBTEXT_THEME_COLOR}
        icon={img.lock}
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          clearError('confirmPassword');
        }}
        secureTextEntry
        error={errors.confirmPassword}
        iconColor={PRIMARY_THEME_COLOR}
        containerStyle={styles.inputContainer}
      />

      <View style={styles.termsRow}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          activeOpacity={0.7}
          onPress={() => {
            setChecked(!isChecked);
            clearError('terms');
          }}
        >
          <LinearGradient
            colors={isChecked ? ['#5b9cff', '#8ec5fc'] : ['transparent', 'transparent']}
            style={[styles.checkbox, isChecked && styles.checkboxChecked]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {isChecked && (
              <Image source={img.check} style={styles.checkIcon} />
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.termsText}>I agree to the </Text>
        <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')}>
          <Text style={styles.termsLink}>Terms</Text>
        </TouchableOpacity>
        <Text style={styles.termsText}> and </Text>
        <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      {errors.terms && (
        <Text style={styles.errorText}>{errors.terms}</Text>
      )}

      {errors.message && (
        <Text style={[styles.errorText, { textAlign: 'center', marginBottom: scale(10) }]}>
          {errors.message}
        </Text>
      )}

      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <Button
          title="CREATE SELLER ACCOUNT"
          onPress={handleSignup}
          style={styles.button}
          textStyle={styles.buttonText}
          gradientColors={['#5b9cff', '#8ec5fc']}
        />
      </Animated.View>

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Already have a seller account? </Text>
        <TouchableOpacity onPress={handleLogin}>
          <Text style={styles.loginLink}>Login</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={BACKGROUND_GRADIENT}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <Loader visible={loading} color={PRIMARY_THEME_COLOR} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? scale(60) : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {showSignupForm ? renderSignupForm() : renderWelcomeScreen()}
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: scale(24),
    paddingBottom: scale(40),
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.1,
    padding: scale(20),
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(20),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: scale(30),
  },
  logo: {
    width: width * 0.35,
    height: width * 0.35,
    marginBottom: scale(12),
  },
  tagline: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(14),
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  welcomeText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(26),
    fontWeight: '700',
    marginBottom: scale(16),
    textAlign: 'center',
  },
  welcomeSubtitle: {
    color: SUBTEXT_THEME_COLOR,
    fontSize: scaleFont(14),
    textAlign: 'center',
    marginBottom: scale(24),
    paddingHorizontal: scale(20),
    fontWeight: '500',
  },
  welcomeButton: {
    height: scale(56),
    borderRadius: scale(16),
    marginBottom: scale(16),
    shadowColor: PRIMARY_THEME_COLOR,
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
    elevation: 5,
    width: width * 0.6,
  },
  backLink: {
    color: SECONDARY_THEME_COLOR,
    fontSize: scaleFont(14),
    fontWeight: '600',
    marginTop: scale(10),
  },
  formContainer: {
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(20),
    padding: scale(20),
    marginVertical: scale(20),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.15,
    shadowRadius: scale(10),
    elevation: 8,
  },
  formTitle: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(22),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: scale(8),
  },
  formSubtitle: {
    color: SUBTEXT_THEME_COLOR,
    fontSize: scaleFont(14),
    textAlign: 'center',
    marginBottom: scale(20),
    fontWeight: '500',
  },
  sellerCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(20),
    padding: scale(12),
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(12),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  sellerCheckbox: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(6),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  sellerCheckboxText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: CATEGORY_BG_COLOR,
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    borderRadius: scale(16),
    paddingHorizontal: scale(8),
    marginBottom: scale(16),
    height: scale(56),
    shadowColor: PRIMARY_THEME_COLOR,
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(20),
    flexWrap: 'wrap',
  },
  checkboxContainer: {
    marginRight: scale(8),
  },
  checkbox: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(6),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: PRIMARY_THEME_COLOR,
  },
  checkIcon: {
    width: scale(12),
    height: scale(10),
    tintColor: TEXT_THEME_COLOR,
  },
  termsText: {
    color: SUBTEXT_THEME_COLOR,
    fontSize: scaleFont(12),
    marginRight: scale(4),
    fontWeight: '500',
  },
  termsLink: {
    color: SECONDARY_THEME_COLOR,
    fontSize: scaleFont(12),
    fontWeight: '600',
    marginRight: scale(4),
  },
  button: {
    height: scale(56),
    borderRadius: scale(16),
    marginBottom: scale(20),
    shadowColor: PRIMARY_THEME_COLOR,
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
    elevation: 6,
  },
  buttonText: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    color: SUBTEXT_THEME_COLOR,
    fontSize: scaleFont(13),
    fontWeight: '500',
  },
  loginLink: {
    color: SECONDARY_THEME_COLOR,
    fontSize: scaleFont(13),
    fontWeight: '600',
  },
  errorText: {
    color: SECONDARY_THEME_COLOR,
    fontSize: scaleFont(11),
    top: scale(-16),
    marginBottom: scale(8),
    fontWeight: '500',
  },
});

export default SellerSignup;