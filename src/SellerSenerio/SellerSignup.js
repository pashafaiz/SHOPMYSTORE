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
import Strings from '../constants/Strings';
import Colors from '../constants/Colors';
import img from '../assets/Images/img';
import { useNavigation } from '@react-navigation/native';
import Button from '../Components/Button';
import { signup, clearErrors } from '../redux/slices/authSlice';
import Loader from '../Components/Loader';

const { width, height } = Dimensions.get('window');

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
      if (showSignupForm) {
        AsyncStorage.removeItem('userToken')
          .then(() => {
            BackHandler.exitApp();
          })
          .catch((error) => {
            console.error('Error removing token:', error);
            BackHandler.exitApp();
          });
        return true;
      } else {
        try {
          navigation.goBack();
        } catch (error) {
          console.error('Error navigating back:', error);
          navigation.navigate('Login'); 
        }
        return true; // Handle back press manually
      }
    };

    const backListener = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      backListener.remove(); // Properly clean up the listener
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
    try {
      navigation.goBack();
    } catch (error) {
      console.error('Error navigating back:', error);
      navigation.navigate('Login'); // Fallback to Login screen
    }
  };

  const handleLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
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
          gradientColors={['#7B61FF', '#AD4DFF']}
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
          colors={['#7B61FF', '#AD4DFF']}
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
        placeholderTextColor="#A0A4B0"
        icon={img.user}
        value={fullName}
        onChangeText={(text) => {
          setFullName(text);
          clearError('fullName');
        }}
        error={errors.fullName}
        iconColor="#AD4DFF"
        containerStyle={styles.inputContainer}
      />

      <InputBox
        placeholder="Username"
        placeholderTextColor="#A0A4B0"
        icon={img.user}
        value={userName}
        onChangeText={(text) => {
          setUserName(text);
          clearError('userName');
        }}
        error={errors.userName}
        iconColor="#AD4DFF"
        containerStyle={styles.inputContainer}
      />

      <InputBox
        placeholder="Email Address"
        placeholderTextColor="#A0A4B0"
        icon={img.mail}
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          clearError('email');
        }}
        error={errors.email}
        iconColor="#AD4DFF"
        containerStyle={styles.inputContainer}
        keyboardType="email-address"
      />

      <InputBox
        placeholder="Phone Number"
        placeholderTextColor="#A0A4B0"
        icon={img.call}
        value={phoneNumber}
        onChangeText={(text) => {
          setPhoneNumber(text);
          clearError('phoneNumber');
        }}
        error={errors.phoneNumber}
        iconColor="#AD4DFF"
        containerStyle={styles.inputContainer}
        keyboardType="phone-pad"
      />

      <InputBox
        placeholder="Password"
        placeholderTextColor="#A0A4B0"
        icon={img.lock}
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          clearError('password');
        }}
        secureTextEntry
        error={errors.password}
        iconColor="#AD4DFF"
        containerStyle={styles.inputContainer}
      />

      <InputBox
        placeholder="Confirm Password"
        placeholderTextColor="#A0A4B0"
        icon={img.lock}
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          clearError('confirmPassword');
        }}
        secureTextEntry
        error={errors.confirmPassword}
        iconColor="#AD4DFF"
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
            colors={isChecked ? ['#7B61FF', '#AD4DFF'] : ['transparent', 'transparent']}
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
        <Text style={[styles.errorText, { textAlign: 'center', marginBottom: 10 }]}>
          {errors.message}
        </Text>
      )}

      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <Button
          title="CREATE SELLER ACCOUNT"
          onPress={handleSignup}
          style={styles.button}
          textStyle={styles.buttonText}
          gradientColors={['#AD4DFF', '#7B61FF']}
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
        colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Loader visible={loading} color="#7B61FF" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
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
    backgroundColor: '#0A0A1E',
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
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: width * 0.35,
    height: width * 0.35,
    marginBottom: 12,
  },
  tagline: {
    color: '#E5E7EB',
    fontSize: 16,
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    color: '#D8B4FE',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  welcomeButton: {
    height: 52,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    width: width * 0.6,
  },
  backLink: {
    color: '#7B61FF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },
  formContainer: {
    backgroundColor: 'rgba(30, 30, 63, 0.85)',
    borderRadius: 20,
    padding: 20,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(173, 77, 255, 0.3)',
    shadowColor: '#AD4DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  formTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    color: '#D8B4FE',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  sellerCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: 'rgba(123, 97, 255, 0.1)',
    borderRadius: 10,
  },
  sellerCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerCheckboxText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(173, 77, 255, 0.4)',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
    height: 50,
    shadowColor: '#AD4DFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  checkboxContainer: {
    marginRight: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(173, 77, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: '#AD4DFF',
  },
  checkIcon: {
    width: 12,
    height: 10,
    tintColor: '#FFFFFF',
  },
  termsText: {
    color: '#E5E7EB',
    fontSize: 12,
    marginRight: 4,
  },
  termsLink: {
    color: '#AD4DFF',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  button: {
    height: 50,
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: '#AD4DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    color: '#E5E7EB',
    fontSize: 12,
  },
  loginLink: {
    color: '#AD4DFF',
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 11,
    top: -16,
    marginBottom: 8,
  },
});

export default SellerSignup;