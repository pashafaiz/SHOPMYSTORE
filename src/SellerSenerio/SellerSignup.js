import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Easing,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { sellerSignup, resetSellerSignup } from '../redux/slices/sellerSlice';
import Loader from '../Components/Loader';
import Toast from 'react-native-toast-message';
import { Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const scaleFactor = Math.min(width, 375) / 375;
const scale = (size) => Math.round(size * scaleFactor);
const scaleFont = (size) => {
  const fontScale = Math.min(width, height) / 375;
  const scaledSize = size * fontScale * (Platform.OS === 'ios' ? 0.9 : 0.85);
  return Math.round(scaledSize);
};

const SellerSignup = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { sellerSignup: signupState } = useSelector((state) => state.seller);
  const { email } = route?.params || {};

  // Form state
  const [formData, setFormData] = useState({
    email: email || '',
    otp: '',
    fullName: '',
    userName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    gstNumber: '',
    panNumber: '',
    bankDetails: {
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      branch: '',
    },
    businessAddress: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
    },
  });

  const [activeSection, setActiveSection] = useState('basic');
  const [errors, setErrors] = useState({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
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
    ]).start();

    return () => {
      dispatch(resetSellerSignup());
    };
  }, [dispatch]);

  useEffect(() => {
    if (signupState.error) {
      // Handle backend validation errors
      if (signupState.error.errors) {
        setErrors(signupState.error.errors);
        
        // Determine which section has errors to scroll to it
        const errorFields = Object.keys(signupState.error.errors);
        if (errorFields.some(field => ['businessName', 'gstNumber', 'panNumber'].includes(field))) {
          setActiveSection('business');
        } else if (errorFields.some(field => ['accountHolderName', 'accountNumber', 'bankName', 'ifscCode', 'branch'].includes(field))) {
          setActiveSection('bank');
        } else if (errorFields.some(field => ['street', 'city', 'state', 'postalCode'].includes(field))) {
          setActiveSection('address');
        } else {
          setActiveSection('basic');
        }
      } else if (signupState.error.message) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: signupState.error.message,
          position: 'top',
        });
      }
    }

    if (signupState.success) {
      handleSignupSuccess();
    }
  }, [signupState]);

  const handleSignupSuccess = async () => {
    try {
      // Store token and user data
      await AsyncStorage.multiSet([
        ['userToken', signupState.token],
        ['user', JSON.stringify(signupState.user)],
      ]);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Seller account created successfully!',
        position: 'top',
      });

      // Navigate to seller dashboard
      navigation.reset({
        index: 0,
        routes: [{ name: 'SellerDashboard' }],
      });
    } catch (error) {
      console.error('Error storing user data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save user data',
        position: 'top',
      });
    }
  };

  const handleChange = (field, value, section = null) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error when field changes
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateBasicInfo = () => {
    const newErrors = {};
    
    // Only basic client-side validations that can't be done on backend
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (activeSection === 'basic' && !validateBasicInfo()) return;
    
    if (activeSection === 'basic') setActiveSection('business');
    else if (activeSection === 'business') setActiveSection('bank');
    else if (activeSection === 'bank') setActiveSection('address');
  };

  const handleSubmit = () => {
    // All validations will be handled by backend
    dispatch(sellerSignup(formData));
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
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(activeSection === 'address' ? handleSubmit : handleNext);
  };

  const renderSectionTitle = (title, section) => (
    <TouchableOpacity
      style={[
        styles.sectionTitle,
        activeSection === section && styles.activeSectionTitle,
      ]}
      onPress={() => setActiveSection(section)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.sectionTitleText,
          activeSection === section && styles.activeSectionTitleText,
        ]}
      >
        {title}
      </Text>
      {activeSection === section && (
        <View style={styles.sectionIndicator} />
      )}
    </TouchableOpacity>
  );

  const renderBasicInfo = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Text style={styles.sectionHeader}>Basic Information</Text>

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="email"
          size={scale(20)}
          color="#5a6b8a"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, errors.email && styles.errorInput]}
          placeholder="Email"
          placeholderTextColor="#5a6b8a"
          value={formData.email}
          onChangeText={(text) => handleChange('email', text)}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!!email} // Disable if email is passed from params
        />
      </View>
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="verified-user"
          size={scale(20)}
          color="#5a6b8a"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, errors.otp && styles.errorInput]}
          placeholder="OTP"
          placeholderTextColor="#5a6b8a"
          value={formData.otp}
          onChangeText={(text) => handleChange('otp', text)}
          keyboardType="number-pad"
        />
      </View>
      {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="person-outline"
          size={scale(20)}
          color="#5a6b8a"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, errors.fullName && styles.errorInput]}
          placeholder="Full Name"
          placeholderTextColor="#5a6b8a"
          value={formData.fullName}
          onChangeText={(text) => handleChange('fullName', text)}
        />
      </View>
      {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="alternate-email"
          size={scale(20)}
          color="#5a6b8a"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, errors.userName && styles.errorInput]}
          placeholder="Username"
          placeholderTextColor="#5a6b8a"
          value={formData.userName}
          onChangeText={(text) => handleChange('userName', text)}
          autoCapitalize="none"
        />
      </View>
      {errors.userName && <Text style={styles.errorText}>{errors.userName}</Text>}

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="phone"
          size={scale(20)}
          color="#5a6b8a"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, errors.phoneNumber && styles.errorInput]}
          placeholder="Phone Number"
          placeholderTextColor="#5a6b8a"
          value={formData.phoneNumber}
          onChangeText={(text) => handleChange('phoneNumber', text)}
          keyboardType="phone-pad"
        />
      </View>
      {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="lock-outline"
          size={scale(20)}
          color="#5a6b8a"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, errors.password && styles.errorInput]}
          placeholder="Password"
          placeholderTextColor="#5a6b8a"
          value={formData.password}
          onChangeText={(text) => handleChange('password', text)}
          secureTextEntry
        />
      </View>
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="lock-outline"
          size={scale(20)}
          color="#5a6b8a"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, errors.confirmPassword && styles.errorInput]}
          placeholder="Confirm Password"
          placeholderTextColor="#5a6b8a"
          value={formData.confirmPassword}
          onChangeText={(text) => handleChange('confirmPassword', text)}
          secureTextEntry
        />
      </View>
      {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
    </Animated.View>
  );

  const renderBusinessInfo = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Text style={styles.sectionHeader}>Business Information</Text>

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="business"
          size={scale(20)}
          color="#5a6b8a"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, errors.businessName && styles.errorInput]}
          placeholder="Business Name"
          placeholderTextColor="#5a6b8a"
          value={formData.businessName}
          onChangeText={(text) => handleChange('businessName', text)}
        />
      </View>
      {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="receipt"
          size={scale(20)}
          color="#5a6b8a"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, errors.gstNumber && styles.errorInput]}
          placeholder="GST Number"
          placeholderTextColor="#5a6b8a"
          value={formData.gstNumber}
          onChangeText={(text) => handleChange('gstNumber', text)}
        />
      </View>
      {errors.gstNumber && <Text style={styles.errorText}>{errors.gstNumber}</Text>}

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="credit-card"
          size={scale(20)}
          color="#5a6b8a"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, errors.panNumber && styles.errorInput]}
          placeholder="PAN Number"
          placeholderTextColor="#5a6b8a"
          value={formData.panNumber}
          onChangeText={(text) => handleChange('panNumber', text)}
        />
      </View>
      {errors.panNumber && <Text style={styles.errorText}>{errors.panNumber}</Text>}
    </Animated.View>
  );

  const renderBankDetails = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Text style={styles.sectionHeader}>Bank Details</Text>

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="account-balance"
          size={scale(20)}
          color="#5a6b8a"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, errors.accountHolderName && styles.errorInput]}
          placeholder="Account Holder Name"
          placeholderTextColor="#5a6b8a"
          value={formData.bankDetails.accountHolderName}
          onChangeText={(text) => handleChange('accountHolderName', text, 'bankDetails')}
        />
      </View>
      {errors.accountHolderName && <Text style={styles.errorText}>{errors.accountHolderName}</Text>}

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="account-balance-wallet"
          size={scale(20)}
          color="#5a6b8a"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, errors.accountNumber && styles.errorInput]}
          placeholder="Account Number"
          placeholderTextColor="#5a6b8a"
          value={formData.bankDetails.accountNumber}
          onChangeText={(text) => handleChange('accountNumber', text, 'bankDetails')}
          keyboardType="number-pad"
        />
      </View>
      {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="account-balance"
          size={scale(20)}
          color="#5a6b8a"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, errors.bankName && styles.errorInput]}
          placeholder="Bank Name"
          placeholderTextColor="#5a6b8a"
          value={formData.bankDetails.bankName}
          onChangeText={(text) => handleChange('bankName', text, 'bankDetails')}
        />
      </View>
      {errors.bankName && <Text style={styles.errorText}>{errors.bankName}</Text>}

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="code"
          size={scale(20)}
          color="#5a6b8a"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, errors.ifscCode && styles.errorInput]}
          placeholder="IFSC Code"
          placeholderTextColor="#5a6b8a"
          value={formData.bankDetails.ifscCode}
          onChangeText={(text) => handleChange('ifscCode', text, 'bankDetails')}
        />
      </View>
      {errors.ifscCode && <Text style={styles.errorText}>{errors.ifscCode}</Text>}

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="place"
          size={scale(20)}
          color="#5a6b8a"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, errors.branch && styles.errorInput]}
          placeholder="Branch"
          placeholderTextColor="#5a6b8a"
          value={formData.bankDetails.branch}
          onChangeText={(text) => handleChange('branch', text, 'bankDetails')}
        />
      </View>
      {errors.branch && <Text style={styles.errorText}>{errors.branch}</Text>}
    </Animated.View>
  );

  const renderAddress = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Text style={styles.sectionHeader}>Business Address</Text>

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="home"
          size={scale(20)}
          color="#5a6b8a"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, errors.street && styles.errorInput]}
          placeholder="Street Address"
          placeholderTextColor="#5a6b8a"
          value={formData.businessAddress.street}
          onChangeText={(text) => handleChange('street', text, 'businessAddress')}
        />
      </View>
      {errors.street && <Text style={styles.errorText}>{errors.street}</Text>}

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="location-city"
          size={scale(20)}
          color="#5a6b8a"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, errors.city && styles.errorInput]}
          placeholder="City"
          placeholderTextColor="#5a6b8a"
          value={formData.businessAddress.city}
          onChangeText={(text) => handleChange('city', text, 'businessAddress')}
        />
      </View>
      {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="map"
          size={scale(20)}
          color="#5a6b8a"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, errors.state && styles.errorInput]}
          placeholder="State"
          placeholderTextColor="#5a6b8a"
          value={formData.businessAddress.state}
          onChangeText={(text) => handleChange('state', text, 'businessAddress')}
        />
      </View>
      {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="markunread-mailbox"
          size={scale(20)}
          color="#5a6b8a"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, errors.postalCode && styles.errorInput]}
          placeholder="Postal Code"
          placeholderTextColor="#5a6b8a"
          value={formData.businessAddress.postalCode}
          onChangeText={(text) => handleChange('postalCode', text, 'businessAddress')}
          keyboardType="number-pad"
        />
      </View>
      {errors.postalCode && <Text style={styles.errorText}>{errors.postalCode}</Text>}

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="public"
          size={scale(20)}
          color="#5a6b8a"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Country"
          placeholderTextColor="#5a6b8a"
          value={formData.businessAddress.country}
          onChangeText={(text) => handleChange('country', text, 'businessAddress')}
          editable={false}
        />
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f5f9ff', '#e8f4ff']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <Loader visible={signupState?.loading ?? false} color="#5b9cff" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? scale(60) : 0}
      >
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={scale(24)} color="#1a2b4a" />
          </TouchableOpacity>
          <Text style={styles.title}>Seller Registration</Text>
          <Text style={styles.subtitle}>Complete your seller profile</Text>
        </Animated.View>

        <View style={styles.sectionTabs}>
          {renderSectionTitle('Basic', 'basic')}
          {renderSectionTitle('Business', 'business')}
          {renderSectionTitle('Bank', 'bank')}
          {renderSectionTitle('Address', 'address')}
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeSection === 'basic' && renderBasicInfo()}
          {activeSection === 'business' && renderBusinessInfo()}
          {activeSection === 'bank' && renderBankDetails()}
          {activeSection === 'address' && renderAddress()}
        </ScrollView>

        <Animated.View
          style={[
            styles.footer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleButtonPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#5b9cff', '#8ec5fc']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonText}>
                  {activeSection === 'address' ? 'Complete Registration' : 'Continue'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f9ff',
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
  header: {
    paddingHorizontal: scale(24),
    paddingTop: scale(60),
    paddingBottom: scale(20),
  },
  backButton: {
    position: 'absolute',
    top: scale(40),
    left: scale(24),
    zIndex: 1,
  },
  title: {
    fontSize: scaleFont(28),
    fontWeight: '700',
    color: '#1a2b4a',
    marginBottom: scale(8),
  },
  subtitle: {
    fontSize: scaleFont(14),
    color: '#5a6b8a',
    fontWeight: '500',
  },
  sectionTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scale(24),
    marginBottom: scale(16),
  },
  sectionTitle: {
    paddingBottom: scale(8),
    alignItems: 'center',
  },
  activeSectionTitle: {
    borderBottomWidth: 0,
  },
  sectionTitleText: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: '#5a6b8a',
  },
  activeSectionTitleText: {
    color: '#1a2b4a',
  },
  sectionIndicator: {
    height: scale(3),
    width: '100%',
    backgroundColor: '#5b9cff',
    marginTop: scale(4),
    borderRadius: scale(2),
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(24),
    paddingBottom: scale(100),
  },
  sectionHeader: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: '#1a2b4a',
    marginBottom: scale(16),
    marginTop: scale(8),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f9ff',
    borderRadius: scale(16),
    paddingHorizontal: scale(16),
    height: scale(56),
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.3)',
    marginBottom: scale(16),
  },
  inputIcon: {
    marginRight: scale(12),
  },
  input: {
    flex: 1,
    fontSize: scaleFont(14),
    color: '#1a2b4a',
    fontWeight: '500',
  },
  errorInput: {
    borderColor: '#ff6b8a',
  },
  errorText: {
    color: '#ff6b8a',
    fontSize: scaleFont(12),
    marginTop: scale(-12),
    marginBottom: scale(12),
    paddingLeft: scale(16),
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: scale(24),
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(91, 156, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 16,
  },
  continueButton: {
    borderRadius: scale(16),
    overflow: 'hidden',
    height: scale(56),
    shadowColor: '#5b9cff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default SellerSignup;