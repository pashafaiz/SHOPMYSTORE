import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
  Easing,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { selectRole, resetRoleSelection } from '../redux/slices/sellerSlice';
import Loader from '../Components/Loader';
import Toast from 'react-native-toast-message';
import { BACKGROUND_GRADIENT, SECONDARY_THEME_COLOR, SELECTED_CATEGORY_BG_COLOR } from '../constants/GlobalConstants';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;
const scaleFactor = Math.min(width, 375) / 375;
const scale = (size) => Math.round(size * scaleFactor);
const scaleFont = (size) => {
  const fontScale = Math.min(width, height) / 375;
  const scaledSize = size * fontScale * (Platform.OS === 'ios' ? 0.95 : 0.9);
  return Math.round(scaledSize);
};

const RoleSelection = ({ navigation }) => {
  const dispatch = useDispatch();
  const { roleSelection } = useSelector((state) => state.seller);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.spring(card1Anim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(card2Anim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      dispatch(resetRoleSelection());
    };
  }, []);

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleRoleSelection = () => {
    if (!selectedRole) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a role',
        position: 'top',
      });
      return;
    }

    if (selectedRole === 'seller' && !validateEmail()) {
      return;
    }

    if (selectedRole === 'seller') {
      dispatch(selectRole({ email, userType: selectedRole }))
        .unwrap()
        .then(() => {
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'OTP sent to your email',
            position: 'top',
          });
          navigation.navigate('SellerSignup', { email });
        })
        .catch((error) => {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: error.message || 'Failed to select role',
            position: 'top',
          });
        });
    } else {
      navigation.navigate('SignUp', { role: selectedRole });
    }
  };

  const handleButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(handleRoleSelection);
  };

  const handleRolePress = (role) => {
    setSelectedRole(role);
    if (role === 'seller') {
      Animated.parallel([
        Animated.spring(card1Anim, {
          toValue: 1.03,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(card2Anim, {
          toValue: 0.97,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(card1Anim, {
          toValue: 0.97,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(card2Anim, {
          toValue: 1.03,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={BACKGROUND_GRADIENT}
        style={styles.backgroundGradient}
      />

      <Loader visible={roleSelection.loading} color="#ffffff" />

      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          },
        ]}
      >
        <Text style={styles.title}>Join Us</Text>
        <Text style={styles.subtitle}>
          Select your role to begin your journey
        </Text>
      </Animated.View>

      <View style={styles.formContainer}>
        {selectedRole === 'seller' && (
          <Animated.View
            style={[
              styles.inputWrapper,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="email"
                size={scale(22)}
                color="#3b82f6"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Business email address"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                onBlur={validateEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}
          </Animated.View>
        )}

        <View style={styles.roleContainer}>
          <Animated.View
            style={[
              styles.roleCardWrapper,
              {
                transform: [
                  { scale: card1Anim },
                  {
                    translateY: card1Anim.interpolate({
                      inputRange: [0.97, 1, 1.03],
                      outputRange: [0, 0, -5],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.roleCard,
                selectedRole === 'seller' && styles.roleCardSelected,
              ]}
              onPress={() => handleRolePress('seller')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  selectedRole === 'seller'
                    ? ['#3b82f6', '#2563eb']
                    : ['#f8fafc', '#e2e8f0']
                }
                style={styles.roleGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.iconCircle}>
                  <FontAwesome
                    name="user-circle-o"
                    size={scale(28)}
                    color={selectedRole === 'seller' ? '#ffffff' : '#3b82f6'}
                  />
                </View>
                <Text
                  style={[
                    styles.roleTitle,
                    selectedRole === 'seller' && styles.roleTitleSelected,
                  ]}
                >
                  Seller
                </Text>
                <Text
                  style={[
                    styles.roleDescription,
                    selectedRole === 'seller' && styles.roleDescriptionSelected,
                  ]}
                >
                  List and sell your products
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              styles.roleCardWrapper,
              {
                transform: [
                  { scale: card2Anim },
                  {
                    translateY: card2Anim.interpolate({
                      inputRange: [0.97, 1, 1.03],
                      outputRange: [0, 0, -5],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.roleCard,
                selectedRole === 'customer' && styles.roleCardSelected,
              ]}
              onPress={() => handleRolePress('customer')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  selectedRole === 'customer'
                    ? ['#3b82f6', '#2563eb']
                    : ['#f8fafc', '#e2e8f0']
                }
                style={styles.roleGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.iconCircle}>
                  <FontAwesome
                    name="shopping-bag"
                    size={scale(28)}
                    color={selectedRole === 'customer' ? '#ffffff' : '#3b82f6'}
                  />
                </View>
                <Text
                  style={[
                    styles.roleTitle,
                    selectedRole === 'customer' && styles.roleTitleSelected,
                  ]}
                >
                  Customer
                </Text>
                <Text
                  style={[
                    styles.roleDescription,
                    selectedRole === 'customer' && styles.roleDescriptionSelected,
                  ]}
                >
                  Shop amazing products
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.buttonWrapper,
            {
              transform: [{ scale: buttonScale }],
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleButtonPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#2563eb', '#3b82f6']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    paddingHorizontal: scale(24),
    paddingTop: scale(isSmallDevice ? 40 : 60),
    paddingBottom: scale(20),
    alignItems: 'center',
  },
  title: {
    fontSize: scaleFont(32),
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: scale(8),
  },
  subtitle: {
    fontSize: scaleFont(16),
    color: '#e0f2fe',
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: scale(22),
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: scale(24),
    paddingBottom: scale(40),
  },
  inputWrapper: {
    marginBottom: scale(24),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: scale(14),
    paddingHorizontal: scale(18),
    height: scale(56),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputIcon: {
    marginRight: scale(12),
  },
  input: {
    flex: 1,
    fontSize: scaleFont(16),
    color: '#1e293b',
    fontWeight: '500',
    paddingVertical: scale(16),
  },
  errorText: {
    color: '#ef4444',
    fontSize: scaleFont(13),
    marginTop: scale(6),
    marginLeft: scale(4),
    fontWeight: '500',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(40),
  },
  roleCardWrapper: {
    width: '48%',
  },
  roleCard: {
    borderRadius: scale(18),
    overflow: 'hidden',
  },
  roleCardSelected: {
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  roleGradient: {
    padding: scale(20),
    alignItems: 'center',
    minHeight: scale(160),
    justifyContent: 'center',
  },
  iconCircle: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  roleTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: scale(6),
    textAlign: 'center',
  },
  roleTitleSelected: {
    color: '#ffffff',
  },
  roleDescription: {
    fontSize: scaleFont(13),
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: scale(18),
  },
  roleDescriptionSelected: {
    color: '#e0f2fe',
  },
  buttonWrapper: {
    marginTop: scale(16),
  },
  continueButton: {
    borderRadius: scale(14),
    overflow: 'hidden',
    height: scale(56),
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: scale(24),
    position:"absolute",
    bottom:0,
    alignSelf:"center"
  },
  loginText: {
    color: SELECTED_CATEGORY_BG_COLOR,
    fontSize: scaleFont(14),
    fontWeight: '500',
  },
  loginLink: {
    color: SECONDARY_THEME_COLOR,
    fontSize: scaleFont(14),
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default RoleSelection;