import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, TextInput, View, TouchableOpacity, Dimensions, ActivityIndicator,
  BackHandler, Animated, Easing, KeyboardAvoidingView, Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../Components/Header';
import img from '../assets/Images/img';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Strings from '../constants/Strings';
import Button from '../Components/Button';
import { verifyOtp, resendOtp, setOtp, setOtpTimer } from '../redux/slices/authSlice';
import LinearGradient from 'react-native-linear-gradient';

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

const OTP = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const email = route.params?.email;
  const dispatch = useDispatch();
  const { otp: reduxOtp, otpTimer, loading, errors } = useSelector((state) => state.auth);
  const [isAutoFillEnabled, setIsAutoFillEnabled] = useState(true);

  const inputRefs = useRef([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const containerScale = useRef(new Animated.Value(0.9)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const errorShake = useRef(new Animated.Value(0)).current;
  const inputScales = useRef(Array(6).fill().map(() => new Animated.Value(0.8))).current;

  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => {
        dispatch(setOtpTimer(otpTimer - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer, dispatch]);

  useEffect(() => {
    if (isAutoFillEnabled && otpTimer > 0) {
      const timeout = setTimeout(() => {
        const mockOtp = ['1', '2', '3', '4', '5', '6'];
        dispatch(setOtp(mockOtp));
        inputScales.forEach((scale, index) => {
          Animated.sequence([
            Animated.timing(scale, {
              toValue: 1.1,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        });
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isAutoFillEnabled, otpTimer, dispatch]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideUpAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.spring(containerScale, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.stagger(100, inputScales.map(scale =>
          Animated.spring(scale, {
            toValue: 1,
            friction: 6,
            tension: 60,
            useNativeDriver: true,
          })
        )),
      ]).start();

      return () => {
        backHandler.remove();
        fadeAnim.setValue(0);
        slideUpAnim.setValue(50);
        containerScale.setValue(0.9);
        inputScales.forEach(scale => scale.setValue(0.8));
      };
    }, [fadeAnim, slideUpAnim, containerScale, inputScales])
  );

  const handleChange = (text, index) => {
    if (/^\d*$/.test(text)) {
      const newOtp = [...(reduxOtp || ['', '', '', '', '', ''])];
      newOtp[index] = text;
      dispatch(setOtp(newOtp));

      if (text && index < 5) {
        inputRefs.current[index + 1].focus();
      }
      if (!text && index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleResend = () => {
    dispatch(setOtp(['', '', '', '', '', '']));
    dispatch(setOtpTimer(30));
    inputRefs.current[0].focus();
    dispatch(resendOtp(email));
  };

  const handleVerifyOtp = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const enteredOtp = reduxOtp?.join('') || '';
    if (enteredOtp.length !== 6) {
      dispatch({ type: 'auth/verifyOtp/rejected', payload: { message: 'Please enter a valid 6-digit OTP' } });
      triggerErrorShake();
      return;
    }

    dispatch(verifyOtp({ otp: enteredOtp, email })).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'BottomTabs' }],
        });
      } else {
        triggerErrorShake();
      }
    });
  };

  const triggerErrorShake = () => {
    Animated.sequence([
      Animated.timing(errorShake, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(errorShake, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(errorShake, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(errorShake, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleAutoFill = () => {
    setIsAutoFillEnabled(prev => !prev);
    dispatch(setOtp(['', '', '', '', '', '']));
    dispatch(setOtpTimer(30));
    inputRefs.current[0].focus();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={BACKGROUND_GRADIENT}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <Header
        title={Strings.OTP_Verify}
        showLeftIcon={true}
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        textStyle={styles.headerText}
        containerStyle={styles.header}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 20}
      >
        <Animated.View 
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideUpAnim },
                { scale: containerScale }
              ],
            }
          ]}
        >
          <View style={styles.verifyText}>
            <Text style={styles.verifyString}>Verify Your Identity</Text>
            <Text style={styles.codeSend_String}>
              A 6-digit code has been sent to{'\n'}
              <Text style={styles.emailText}>{email || "your email"}</Text>
            </Text>
          </View>

          <Animated.View style={{ transform: [{ translateX: errorShake }] }}>
            <View style={styles.otpContainer}>
              {(reduxOtp || ['', '', '', '', '', '']).map((digit, index) => (
                <Animated.View
                  key={index}
                  style={{ transform: [{ scale: inputScales[index] }] }}
                >
                  <TextInput
                    ref={ref => (inputRefs.current[index] = ref)}
                    style={[
                      styles.otpInput, 
                      digit ? styles.filledInput : null,
                      errors.message ? styles.errorInput : null
                    ]}
                    maxLength={1}
                    keyboardType="number-pad"
                    value={digit}
                    onChangeText={text => handleChange(text, index)}
                    selectionColor={PRIMARY_THEME_COLOR}
                    autoFocus={index === 0}
                    accessibilityLabel={`OTP digit ${index + 1}`}
                  />
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {errors.message ? (
            <Text style={styles.errorText}>{errors.message}</Text>
          ) : (
            <Text style={styles.instructionText}>Enter the code from your email</Text>
          )}

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Button
              title={loading ? <ActivityIndicator color={TEXT_THEME_COLOR} /> : Strings.continue}
              onPress={handleVerifyOtp}
              style={styles.button}
              textStyle={styles.buttonText}
              gradientColors={['#5b9cff', '#8ec5fc']}
              disabled={loading}
            />
          </Animated.View>

          <View style={styles.resendContainer}>
            {otpTimer > 0 ? (
              <Text style={styles.timerText}>
                Resend in <Text style={styles.timerCount}>0:{otpTimer.toString().padStart(2, '0')}</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <LinearGradient
                  colors={['#5b9cff', '#8ec5fc']}
                  style={styles.resendButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.resendText}>Resend Code</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={toggleAutoFill}>
              <Text style={styles.toggleText}>
                {isAutoFillEnabled ? 'Disable Autofill' : 'Enable Autofill'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
  header: {
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(20),
    margin: scale(20),
    padding: scale(15),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
  },
  headerText: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
    textAlign: 'center',
  },
  keyboardAvoid: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: scale(20),
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(20),
    marginHorizontal: scale(20),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
  },
  verifyText: {
    marginBottom: scale(30),
    paddingHorizontal: scale(16),
    alignItems: 'center',
  },
  verifyString: {
    fontSize: scaleFont(22),
    fontWeight: '800',
    color: TEXT_THEME_COLOR,
    marginBottom: scale(12),
    letterSpacing: 0.8,
  },
  codeSend_String: {
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
    color: SUBTEXT_THEME_COLOR,
    textAlign: 'center',
    fontWeight: '500',
  },
  emailText: {
    color: PRIMARY_THEME_COLOR,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: scale(10),
    marginBottom: scale(16),
  },
  otpInput: {
    borderWidth: scale(1),
    borderColor: BORDER_THEME_COLOR,
    borderRadius: scale(16),
    width: scale(45),
    height: scale(50),
    textAlign: 'center',
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: TEXT_THEME_COLOR,
    backgroundColor: CATEGORY_BG_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
  },
  filledInput: { 
    borderColor: PRIMARY_THEME_COLOR,
    backgroundColor: CATEGORY_BG_COLOR,
  },
  errorInput: {
    borderColor: PRIMARY_THEME_COLOR,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  button: {
    height: scale(56),
    borderRadius: scale(16),
    marginTop: scale(32),
    borderWidth: scale(1),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: PRIMARY_THEME_COLOR,
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
  },
  buttonText: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: scale(28),
  },
  resendButton: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    borderRadius: scale(12),
    borderWidth: scale(1),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: PRIMARY_THEME_COLOR,
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.2,
    shadowRadius: scale(6),
  },
  timerText: {
    fontSize: scaleFont(14),
    color: SUBTEXT_THEME_COLOR,
    fontWeight: '500',
  },
  timerCount: {
    color: PRIMARY_THEME_COLOR,
    fontWeight: '600',
  },
  resendText: {
    fontSize: scaleFont(14),
    color: TEXT_THEME_COLOR,
    fontWeight: '600',
  },
  toggleText: {
    fontSize: scaleFont(12),
    color: PRIMARY_THEME_COLOR,
    marginTop: scale(12),
    fontWeight: '500',
  },
  errorText: {
    color: SECONDARY_THEME_COLOR,
    fontSize: scaleFont(14),
    textAlign: 'center',
    marginTop: scale(12),
    marginBottom: scale(12),
    fontWeight: '500',
  },
  instructionText: {
    color: SUBTEXT_THEME_COLOR,
    fontSize: scaleFont(14),
    textAlign: 'center',
    marginTop: scale(12),
    marginBottom: scale(12),
    fontWeight: '500',
  },
});

export default OTP;