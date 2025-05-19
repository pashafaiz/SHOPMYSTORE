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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import InputBox from '../Components/InputBox';
import img from '../assets/Images/img';
import { useNavigation } from '@react-navigation/native';
import Button from '../Components/Button';
import { signup, clearErrors } from '../redux/slices/authSlice';
import Loader from '../Components/Loader';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';

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

const SignUp = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { loading, errors } = useSelector((state) => state.auth);
  const [isChecked, setChecked] = useState(false);
  const [userType, setUserType] = useState(null);
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

    return () => {
      dispatch(clearErrors());
    };
  }, [dispatch]);

  const validateForm = () => {
    let tempErrors = {};
    let isValid = true;

    if (!userType) {
      tempErrors.userType = 'Please select user type';
      isValid = false;
    }

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
    navigation.navigate('OTP', { email });
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
      userType,
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

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
      const user = userCredential.user;

      const formData = {
        userType: 'customer',
        fullName: user.displayName,
        userName: user.email.split('@')[0],
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        password: '',
        confirmPassword: '',
        googleId: user.uid,
      };

      dispatch(signup(formData)).then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          navigation.navigate('BottomTabs');
        }
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Google Sign-In successful!',
        position: 'top',
        visibilityTime: 3000,
      });
    } catch (error) {
      let errorMessage = 'Google Sign-In failed';
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        errorMessage = 'Sign-in cancelled';
      } else if (error.code === statusCodes.IN_PROGRESS) {
        errorMessage = 'Sign-in in progress';
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = 'Play Services not available';
      } else {
        console.error('Google Sign-In Error:', error);
      }
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
        position: 'top',
        visibilityTime: 3000,
      });
    }
  };

  const clearError = (field) => {
    if (errors[field]) {
      dispatch(clearErrors());
    }
  };

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
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Image 
              style={styles.logo} 
              source={img.App} 
              resizeMode="contain"
            />
            <Text style={styles.tagline}>Your Premium Shopping Companion</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <Text style={styles.welcomeText}>Create Account</Text>
            
            <View style={styles.userTypeContainer}>
              <Text style={styles.userTypeLabel}>I want to register as:</Text>
              <View style={styles.userTypeOptions}>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    userType === 'seller' && styles.userTypeButtonSelected,
                  ]}
                  onPress={() => {
                    setUserType('seller');
                    clearError('userType');
                  }}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={
                      userType === 'seller'
                        ? ['#5b9cff', '#8ec5fc']
                        : ['transparent', 'transparent']
                    }
                    style={[
                      styles.userTypeCheckbox,
                      userType === 'seller' && styles.userTypeCheckboxSelected,
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {userType === 'seller' && (
                      <Image source={img.check} style={styles.checkIcon} />
                    )}
                  </LinearGradient>
                  <Text style={styles.userTypeText}>Seller</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    userType === 'customer' && styles.userTypeButtonSelected,
                  ]}
                  onPress={() => {
                    setUserType('customer');
                    clearError('userType');
                  }}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={
                      userType === 'customer'
                        ? ['#5b9cff', '#8ec5fc']
                        : ['transparent', 'transparent']
                    }
                    style={[
                      styles.userTypeCheckbox,
                      userType === 'customer' && styles.userTypeCheckboxSelected,
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {userType === 'customer' && (
                      <Image source={img.check} style={styles.checkIcon} />
                    )}
                  </LinearGradient>
                  <Text style={styles.userTypeText}>Customer</Text>
                </TouchableOpacity>
              </View>
              {errors.userType && (
                <Text style={[styles.errorText, { top: scale(0) }]}>
                  {errors.userType}
                </Text>
              )}
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
                  colors={
                    isChecked
                      ? ['#5b9cff', '#8ec5fc']
                      : ['transparent', 'transparent']
                  }
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
              <TouchableOpacity
                onPress={() => navigation.navigate('TermsOfService')}
              >
                <Text style={styles.termsLink}>Terms</Text>
              </TouchableOpacity>
              <Text style={styles.termsText}> and </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('PrivacyPolicy')}
              >
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>

            {errors.terms && (
              <Text style={styles.errorText}>{errors.terms}</Text>
            )}

            {errors.message && (
              <Text
                style={[styles.errorText, { textAlign: 'center', marginBottom: scale(10) }]}
              >
                {errors.message}
              </Text>
            )}

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <Button
                title="SIGN UP"
                onPress={handleSignup}
                style={styles.button}
                textStyle={styles.buttonText}
                gradientColors={['#5b9cff', '#8ec5fc']}
              />
            </Animated.View>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity
                style={styles.socialButton}
                activeOpacity={0.8}
                onPress={handleGoogleSignIn}
              >
                <Image
                  source={img.google}
                  style={styles.socialIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
                <Image
                  source={img.facebook}
                  style={styles.socialIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
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
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.08,
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
  formContainer: {
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(24),
    padding: scale(24),
    marginBottom: scale(24),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.15,
    shadowRadius: scale(10),
    elevation: 8,
  },
  welcomeText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(22),
    fontWeight: '700',
    marginBottom: scale(24),
    textAlign: 'center',
  },
  userTypeContainer: {
    marginBottom: scale(20),
    backgroundColor: PRODUCT_BG_COLOR,
  },
  userTypeLabel: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(14),
    marginBottom: scale(8),
    fontWeight: '500',
  },
  userTypeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(4),
  },
  userTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
    borderRadius: scale(12),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    backgroundColor: CATEGORY_BG_COLOR,
    width: '48%',
  },
  userTypeButtonSelected: {
    borderColor: PRIMARY_THEME_COLOR,
    backgroundColor: CATEGORY_BG_COLOR,
  },
  userTypeCheckbox: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(6),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(8),
  },
  userTypeCheckboxSelected: {
    borderColor: PRIMARY_THEME_COLOR,
  },
  userTypeText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(14),
    fontWeight: '500',
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
    // elevation: 3,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(24),
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
    marginBottom: scale(24),
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: scale(16),
  },
  dividerLine: {
    flex: 1,
    height: scale(1),
    backgroundColor: BORDER_THEME_COLOR,
  },
  dividerText: {
    color: SUBTEXT_THEME_COLOR,
    fontSize: scaleFont(12),
    marginHorizontal: scale(10),
    fontWeight: '500',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: scale(24),
    gap: scale(20),
  },
  socialButton: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: CATEGORY_BG_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: PRIMARY_THEME_COLOR,
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
  },
  socialIcon: {
    width: scale(28),
    height: scale(28),
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

export default SignUp;