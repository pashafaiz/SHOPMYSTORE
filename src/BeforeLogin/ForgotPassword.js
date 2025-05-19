import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../Components/Header';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import axios from 'axios';
import {
  BASE_URL,
  AUTH_FORGOT_PASSWORD_ENDPOINT,
  AUTH_VERIFY_PASSWORD_RESET_OTP_ENDPOINT,
  AUTH_RESET_PASSWORD_ENDPOINT,
  NETWORK_ERROR,
} from '../constants/GlobalConstants';

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
const SUCCESS_COLOR = '#4CAF50';

const ForgotPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const formRef = useRef(null);

  const handleSendCode = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email) {
      shakeAnimation();
      setError('Please enter your email');
      setLoading(false);
      return;
    }
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      shakeAnimation();
      setError('Please enter a valid email');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}${AUTH_FORGOT_PASSWORD_ENDPOINT}`, {
        email,
      });

      setSuccess(response.data.msg);
      setStep(2);
    } catch (err) {
      shakeAnimation();
      if (err.response && err.response.data) {
        const { errors, msg } = err.response.data;
        if (errors && errors.email) {
          setError(errors.email);
        } else if (msg) {
          setError(msg);
        } else {
          setError(NETWORK_ERROR);
        }
      } else {
        setError(NETWORK_ERROR);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    if (!code) {
      shakeAnimation();
      setError('Please enter the verification code');
      setLoading(false);
      return;
    }
    if (code.length !== 6) {
      shakeAnimation();
      setError('Code must be 6 digits');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}${AUTH_VERIFY_PASSWORD_RESET_OTP_ENDPOINT}`, {
        email,
        otp: code,
      });

      setResetToken(response.data.resetToken);
      setSuccess(response.data.msg);
      setStep(3);
    } catch (err) {
      shakeAnimation();
      if (err.response && err.response.data) {
        const { errors, msg } = err.response.data;
        if (errors && errors.otp) {
          setError(errors.otp);
        } else if (msg) {
          setError(msg);
        } else {
          setError(NETWORK_ERROR);
        }
      } else {
        setError(NETWORK_ERROR);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    if (!newPassword || !confirmPassword) {
      shakeAnimation();
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }
    if (!/(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}/.test(newPassword)) {
      shakeAnimation();
      setError('Password must be at least 8 characters, include a number, a letter, and a special character');
      setLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      shakeAnimation();
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}${AUTH_RESET_PASSWORD_ENDPOINT}`, {
        resetToken,
        newPassword,
        confirmPassword,
      });

      setSuccess(response.data.msg);
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    } catch (err) {
      shakeAnimation();
      if (err.response && err.response.data) {
        const { errors, msg } = err.response.data;
        if (errors) {
          if (errors.newPassword) {
            setError(errors.newPassword);
          } else if (errors.confirmPassword) {
            setError(errors.confirmPassword);
          } else if (errors.resetToken) {
            setError(errors.resetToken);
          } else {
            setError(msg || NETWORK_ERROR);
          }
        } else if (msg) {
          setError(msg);
        } else {
          setError(NETWORK_ERROR);
        }
      } else {
        setError(NETWORK_ERROR);
      }
    } finally {
      setLoading(false);
    }
  };

  const shakeAnimation = () => {
    if (formRef.current) {
      formRef.current.shake(800);
    }
  };

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepContainer}>
        <View style={[styles.stepLine, step >= 1 && styles.activeStepLine]} />
        <View style={[styles.stepDot, step >= 1 && styles.activeStepDot]}>
          {step > 1 && <Icon name="check" size={scale(14)} color={TEXT_THEME_COLOR} />}
        </View>
        <View style={[styles.stepLine, step >= 2 && styles.activeStepLine]} />
        <View style={[styles.stepDot, step >= 2 && styles.activeStepDot]}>
          {step > 2 && <Icon name="check" size={scale(14)} color={TEXT_THEME_COLOR} />}
        </View>
        <View style={[styles.stepLine, step >= 3 && styles.activeStepLine]} />
        <View style={[styles.stepDot, step >= 3 && styles.activeStepDot]} />
      </View>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Animatable.View 
            ref={formRef}
            animation="fadeInUp"
            duration={500}
            style={styles.formContainer}
          >
            <Text style={styles.subtitle}>Enter your email to receive a verification code</Text>
            
            <View style={styles.inputContainer}>
              <Icon name="email" size={scale(22)} color={SUBTEXT_THEME_COLOR} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={SUBTEXT_THEME_COLOR}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleSendCode}
              activeOpacity={0.8}
              disabled={loading}
            >
              <LinearGradient
                colors={['#5b9cff', '#8ec5fc']}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={TEXT_THEME_COLOR} />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Send Verification Code</Text>
                    <Icon name="send" size={scale(20)} color={TEXT_THEME_COLOR} style={styles.buttonIcon} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>
        );
      case 2:
        return (
          <Animatable.View 
            ref={formRef}
            animation="fadeInUp"
            duration={500}
            style={styles.formContainer}
          >
            <Text style={styles.subtitle}>Check your email for the verification code</Text>
            
            <View style={styles.inputContainer}>
              <Icon name="vpn-key" size={scale(22)} color={SUBTEXT_THEME_COLOR} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Verification Code"
                placeholderTextColor={SUBTEXT_THEME_COLOR}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleVerifyCode}
              activeOpacity={0.8}
              disabled={loading}
            >
              <LinearGradient
                colors={['#5b9cff', '#8ec5fc']}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={TEXT_THEME_COLOR} />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Verify Code</Text>
                    <Icon name="check-circle" size={scale(20)} color={TEXT_THEME_COLOR} style={styles.buttonIcon} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setStep(1)}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text style={styles.linkText}>Change Email</Text>
            </TouchableOpacity>
          </Animatable.View>
        );
      case 3:
        return (
          <Animatable.View 
            ref={formRef}
            animation="fadeInUp"
            duration={500}
            style={styles.formContainer}
          >
            <Text style={styles.subtitle}>Create a new password</Text>
            
            <View style={styles.inputContainer}>
              <Icon name="lock" size={scale(22)} color={SUBTEXT_THEME_COLOR} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                placeholderTextColor={SUBTEXT_THEME_COLOR}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Icon name="lock-outline" size={scale(22)} color={SUBTEXT_THEME_COLOR} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                placeholderTextColor={SUBTEXT_THEME_COLOR}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleResetPassword}
              activeOpacity={0.8}
              disabled={loading}
            >
              <LinearGradient
                colors={['#5b9cff', '#8ec5fc']}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={TEXT_THEME_COLOR} />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Reset Password</Text>
                    <Icon name="lock-reset" size={scale(20)} color={TEXT_THEME_COLOR} style={styles.buttonIcon} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>
        );
      default:
        return null;
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
      <Header
        title="Forgot Password"
        showLeftIcon={true}
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        textStyle={styles.headerText}
        containerStyle={styles.header}
      />
      
      <View style={styles.content}>
        <Animatable.View 
          animation="fadeInDown"
          duration={600}
          style={styles.headerContainer}
        >
          <Text style={styles.title}>Reset Your Password</Text>
          {renderStepIndicator()}
        </Animatable.View>
        
        {error ? (
          <Animatable.View 
            animation="fadeIn"
            duration={400}
            style={styles.messageContainer}
          >
            <Text style={styles.errorText}>
              <Icon name="error" size={scale(16)} color={SECONDARY_THEME_COLOR} /> {error}
            </Text>
          </Animatable.View>
        ) : null}
        
        {success ? (
          <Animatable.View 
            animation="fadeIn"
            duration={400}
            style={styles.messageContainer}
          >
            <Text style={styles.successText}>
              <Icon name="check-circle" size={scale(16)} color={SUCCESS_COLOR} /> {success}
            </Text>
          </Animatable.View>
        ) : null}
        
        {renderStep()}
      </View>
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
  content: {
    flex: 1,
    padding: scale(20),
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: scale(30),
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(20),
    padding: scale(20),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    elevation: 5,
  },
  title: {
    fontSize: scaleFont(22),
    fontWeight: '800',
    color: TEXT_THEME_COLOR,
    marginBottom: scale(25),
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: scaleFont(14),
    color: SUBTEXT_THEME_COLOR,
    marginBottom: scale(30),
    textAlign: 'center',
    lineHeight: scale(20),
    fontWeight: '500',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(30),
    width: scale(200),
  },
  stepLine: {
    flex: 1,
    height: scale(3),
    backgroundColor: BORDER_THEME_COLOR,
  },
  activeStepLine: {
    backgroundColor: PRIMARY_THEME_COLOR,
  },
  stepDot: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: BORDER_THEME_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: scale(5),
  },
  activeStepDot: {
    backgroundColor: PRIMARY_THEME_COLOR,
  },
  formContainer: {
    width: '100%',
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(20),
    padding: scale(20),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(16),
    paddingHorizontal: scale(14),
    marginBottom: scale(20),
    height: scale(56),
    borderWidth: scale(1),
    borderColor: BORDER_THEME_COLOR,
  },
  inputIcon: {
    marginRight: scale(12),
  },
  input: {
    flex: 1,
    height: '100%',
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(16),
  },
  button: {
    borderRadius: scale(16),
    overflow: 'hidden',
    marginBottom: scale(20),
    shadowColor: PRIMARY_THEME_COLOR,
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  gradientButton: {
    paddingVertical: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: scale(1),
    borderColor: BORDER_THEME_COLOR,
  },
  buttonText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginRight: scale(10),
  },
  buttonIcon: {
    marginLeft: scale(5),
  },
  linkText: {
    color: PRIMARY_THEME_COLOR,
    textAlign: 'center',
    marginTop: scale(15),
    fontSize: scaleFont(14),
    fontWeight: '500',
  },
  messageContainer: {
    marginBottom: scale(20),
    padding: scale(14),
    borderRadius: scale(12),
    backgroundColor: CATEGORY_BG_COLOR,
    borderWidth: scale(1),
    borderColor: BORDER_THEME_COLOR,
  },
  errorText: {
    color: SECONDARY_THEME_COLOR,
    textAlign: 'center',
    fontSize: scaleFont(14),
    fontWeight: '500',
  },
  successText: {
    color: SUCCESS_COLOR,
    textAlign: 'center',
    fontSize: scaleFont(14),
    fontWeight: '500',
  },
});

export default ForgotPassword;