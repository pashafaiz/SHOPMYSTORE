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

const { width } = Dimensions.get('window');

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
          {step > 1 && <Icon name="check" size={14} color="#FFF" />}
        </View>
        <View style={[styles.stepLine, step >= 2 && styles.activeStepLine]} />
        <View style={[styles.stepDot, step >= 2 && styles.activeStepDot]}>
          {step > 2 && <Icon name="check" size={14} color="#FFF" />}
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
              <Icon name="email" size={22} color="#AEAEAE" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#AEAEAE"
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
                colors={['#7B5BFF', '#A68EFF']}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF"/>
                ) : (
                  <>
                    <Text style={styles.buttonText}>Send Verification Code</Text>
                    <Icon name="send" size={20} color="#FFFFFF" style={styles.buttonIcon} />
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
              <Icon name="vpn-key" size={22} color="#AEAEAE" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Verification Code"
                placeholderTextColor="#AEAEAE"
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
                colors={['#7B5BFF', '#A68EFF']}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Verify Code</Text>
                    <Icon name="check-circle" size={20} color="#FFFFFF" style={styles.buttonIcon} />
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
              <Icon name="lock" size={22} color="#AEAEAE" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                placeholderTextColor="#AEAEAE"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Icon name="lock-outline" size={22} color="#AEAEAE" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                placeholderTextColor="#AEAEAE"
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
                colors={['#7B5BFF', '#A68EFF']}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Reset Password</Text>
                    <Icon name="lock-reset" size={20} color="#FFFFFF" style={styles.buttonIcon} />
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
    <LinearGradient 
      colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} 
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Header
        title="Forgot Password"
        showLeftIcon={true}
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        transparent
        style={styles.header}
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
              <Icon name="error" size={16} color="#FF6B6B" /> {error}
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
              <Icon name="check-circle" size={16} color="#4CAF50" /> {success}
            </Text>
          </Animatable.View>
        ) : null}
        
        {renderStep()}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  header: {
    borderBottomWidth: 0,
    elevation: 0,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 25,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 24,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    width: '80%',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeStepLine: {
    backgroundColor: '#7B5BFF',
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  activeStepDot: {
    backgroundColor: '#7B5BFF',
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#7B5BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 18,
    marginBottom: 20,
    height: 55,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontSize: 16,
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#7B5BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  buttonIcon: {
    marginLeft: 5,
  },
  linkText: {
    color: '#A68EFF',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 14,
  },
  messageContainer: {
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    fontSize: 14,
  },
  successText: {
    color: '#4CAF50',
    textAlign: 'center',
    fontSize: 14,
  },
});
export default ForgotPassword;