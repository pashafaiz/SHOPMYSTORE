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
import Colors from '../constants/Colors';
import { verifyOtp, resendOtp, setOtp, setOtpTimer } from '.././/redux/slices/authSlice';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const scaleSize = (size) => Math.round(size * (width / 375));
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375));

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
        colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Header
        title={Strings.OTP_Verify}
        showLeftIcon={true}
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        transparent
        style={styles.header}
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
                    selectionColor="#7B61FF"
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
              title={loading ? <ActivityIndicator color="#fff" /> : Strings.continue}
              onPress={handleVerifyOtp}
              style={styles.button}
              textStyle={styles.buttonText}
              gradientColors={['#7B61FF', '#AD4DFF']}
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
                  colors={['#7B61FF', '#AD4DFF']}
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
    backgroundColor: '#0A0A1E',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scaleSize(16),
    margin: scaleSize(16),
    paddingVertical: scaleSize(12),
    paddingHorizontal: scaleSize(16),
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  keyboardAvoid: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: scaleSize(24),
    paddingBottom: scaleSize(40),
  },
  verifyText: {
    marginBottom: scaleSize(40),
    paddingHorizontal: scaleSize(16),
    alignItems: 'center',
  },
  verifyString: {
    fontSize: scaleFont(20),
    fontWeight: '800',
    color: Colors.White,
    marginBottom: scaleSize(12),
    textShadowColor: 'rgba(123, 97, 255, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  codeSend_String: {
    fontSize: scaleFont(15),
    lineHeight: scaleFont(22),
    color: '#C0C4D0',
    textAlign: 'center',
  },
  emailText: {
    color: '#7B61FF',
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: scaleSize(10),
    marginBottom: scaleSize(16),
  },
  otpInput: {
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.4)',
    borderRadius: scaleSize(14),
    width: scaleSize(45),
    height: scaleSize(54),
    textAlign: 'center',
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: Colors.White,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  filledInput: { 
    fontSize:16,
    borderColor: '#7B61FF',
    backgroundColor: 'rgba(123, 97, 255, 0.1)',
  },
  errorInput: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  button: {
    height: scaleSize(56),
    borderRadius: scaleSize(14),
    marginTop: scaleSize(32),
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonText: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: Colors.White,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: scaleSize(28),
  },
  resendButton: {
    paddingVertical: scaleSize(10),
    paddingHorizontal: scaleSize(20),
    borderRadius: scaleSize(10),
  },
  timerText: {
    fontSize: scaleFont(15),
    color: '#C0C4D0',
  },
  timerCount: {
    color: '#7B61FF',
    fontWeight: '600',
  },
  resendText: {
    fontSize: scaleFont(15),
    color: Colors.White,
    fontWeight: '600',
  },
  toggleText: {
    fontSize: scaleFont(12),
    color: '#7B61FF',
    marginTop: scaleSize(12),
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: scaleFont(14),
    textAlign: 'center',
    marginTop: scaleSize(12),
    marginBottom: scaleSize(12),
  },
  instructionText: {
    color: '#C0C4D0',
    fontSize: scaleFont(12),
    textAlign: 'center',
    marginTop: scaleSize(12),
    marginBottom: scaleSize(12),
  },
});

export default OTP;