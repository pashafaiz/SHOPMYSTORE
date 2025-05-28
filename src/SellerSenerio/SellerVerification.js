import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  Easing
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';

const { width, height } = Dimensions.get('window');
const scale = (size) => Math.round((width / 375) * size);

const SellerVerification = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    businessName: '',
    businessType: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    panNumber: '',
    bankAccountNumber: '',
    ifscCode: '',
    password: '',
    confirmPassword: '',
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      })
    ]).start();
  };

  const animateOut = (callback) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(callback);
  };

  React.useEffect(() => {
    animateIn();
  }, [currentStep]);

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
    if (!formData.businessType.trim()) newErrors.businessType = 'Business type is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    if (!formData.gstNumber.trim()) newErrors.gstNumber = 'GST number is required';
    if (!formData.panNumber.trim()) newErrors.panNumber = 'PAN number is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!formData.bankAccountNumber.trim()) newErrors.bankAccountNumber = 'Account number is required';
    if (!formData.ifscCode.trim()) newErrors.ifscCode = 'IFSC code is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    Keyboard.dismiss();
    if (currentStep === 1 && validateStep1()) {
      animateOut(() => setCurrentStep(2));
    } else if (currentStep === 2 && validateStep2()) {
      animateOut(() => setCurrentStep(3));
    }
  };

  const handlePrevious = () => {
    Keyboard.dismiss();
    animateOut(() => setCurrentStep(currentStep - 1));
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (validateStep3()) {
      Alert.alert(
        'Success',
        'Your seller account has been created successfully!',
        [{ text: 'OK', onPress: () => navigation.navigate('SellerDashboard') }]
      );
    }
  };

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const renderStepIndicator = () => {
    return (
      <Animatable.View 
        animation="fadeIn"
        duration={800}
        style={styles.stepContainer}
      >
        {[1, 2, 3].map((step) => (
          <View key={step} style={styles.stepRow}>
            <Animatable.View
              animation={currentStep === step ? 'pulse' : null}
              duration={500}
              style={[
                styles.stepIndicator,
                currentStep === step && styles.activeStep,
                currentStep > step && styles.completedStep,
              ]}>
              {currentStep > step ? (
                <Icon name="check" size={scale(14)} color="#fff" />
              ) : (
                <Text style={styles.stepText}>{step}</Text>
              )}
            </Animatable.View>
            {step < 3 && (
              <View
                style={[
                  styles.stepLine,
                  currentStep > step && styles.completedStepLine,
                ]}
              />
            )}
          </View>
        ))}
      </Animatable.View>
    );
  };

  const renderStep1 = () => (
    <Animated.View 
      style={[
        styles.formSection,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }]
        }
      ]}
    >
      <Animatable.Text 
        animation="fadeInDown" 
        duration={600} 
        style={styles.sectionTitle}
      >
        Personal Information
      </Animatable.Text>
      
      <Animatable.View animation="fadeInUp" duration={600} delay={100}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <View style={[styles.inputWrapper, errors.fullName && styles.inputErrorWrapper]}>
          <Icon name="person" size={scale(20)} color="#6c5ce7" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            placeholderTextColor="#999"
            value={formData.fullName}
            onChangeText={(text) => handleChange('fullName', text)}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>
        {errors.fullName && <Animatable.Text animation="fadeIn" duration={300} style={styles.errorText}>{errors.fullName}</Animatable.Text>}
      </Animatable.View>

      <Animatable.View animation="fadeInUp" duration={600} delay={150}>
        <Text style={styles.inputLabel}>Email</Text>
        <View style={[styles.inputWrapper, errors.email && styles.inputErrorWrapper]}>
          <Icon name="email" size={scale(20)} color="#6c5ce7" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="john@business.com"
            placeholderTextColor="#999"
            keyboardType="email-address"
            value={formData.email}
            onChangeText={(text) => handleChange('email', text)}
            autoCapitalize="none"
            returnKeyType="next"
          />
        </View>
        {errors.email && <Animatable.Text animation="fadeIn" duration={300} style={styles.errorText}>{errors.email}</Animatable.Text>}
      </Animatable.View>

      <Animatable.View animation="fadeInUp" duration={600} delay={200}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <View style={[styles.inputWrapper, errors.phone && styles.inputErrorWrapper]}>
          <Icon name="phone" size={scale(20)} color="#6c5ce7" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="+91 9876543210"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(text) => handleChange('phone', text)}
            autoCapitalize="none"
            returnKeyType="next"
          />
        </View>
        {errors.phone && <Animatable.Text animation="fadeIn" duration={300} style={styles.errorText}>{errors.phone}</Animatable.Text>}
      </Animatable.View>

      <Animatable.View animation="fadeInUp" duration={600} delay={250}>
        <Text style={styles.inputLabel}>Business Name</Text>
        <View style={[styles.inputWrapper, errors.businessName && styles.inputErrorWrapper]}>
          <Icon name="business" size={scale(20)} color="#6c5ce7" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Doe Enterprises"
            placeholderTextColor="#999"
            value={formData.businessName}
            onChangeText={(text) => handleChange('businessName', text)}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>
        {errors.businessName && <Animatable.Text animation="fadeIn" duration={300} style={styles.errorText}>{errors.businessName}</Animatable.Text>}
      </Animatable.View>

      <Animatable.View animation="fadeInUp" duration={600} delay={300}>
        <Text style={styles.inputLabel}>Business Type</Text>
        <View style={[styles.inputWrapper, errors.businessType && styles.inputErrorWrapper]}>
          <Icon name="store" size={scale(20)} color="#6c5ce7" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Retail, Wholesale, etc."
            placeholderTextColor="#999"
            value={formData.businessType}
            onChangeText={(text) => handleChange('businessType', text)}
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>
        {errors.businessType && <Animatable.Text animation="fadeIn" duration={300} style={styles.errorText}>{errors.businessType}</Animatable.Text>}
      </Animatable.View>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View 
      style={[
        styles.formSection,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }]
        }
      ]}
    >
      <Animatable.Text 
        animation="fadeInDown" 
        duration={600} 
        style={styles.sectionTitle}
      >
        Business Details
      </Animatable.Text>
      
      <Animatable.View animation="fadeInUp" duration={600} delay={100}>
        <Text style={styles.inputLabel}>Address</Text>
        <View style={[styles.inputWrapper, errors.address && styles.inputErrorWrapper]}>
          <Icon name="home" size={scale(20)} color="#6c5ce7" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { height: scale(80) }]}
            placeholder="123 Business Street"
            placeholderTextColor="#999"
            multiline
            value={formData.address}
            onChangeText={(text) => handleChange('address', text)}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>
        {errors.address && <Animatable.Text animation="fadeIn" duration={300} style={styles.errorText}>{errors.address}</Animatable.Text>}
      </Animatable.View>

      <Animatable.View animation="fadeInUp" duration={600} delay={150}>
        <Text style={styles.inputLabel}>City</Text>
        <View style={[styles.inputWrapper, errors.city && styles.inputErrorWrapper]}>
          <Icon name="location-city" size={scale(20)} color="#6c5ce7" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Mumbai"
            placeholderTextColor="#999"
            value={formData.city}
            onChangeText={(text) => handleChange('city', text)}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>
        {errors.city && <Animatable.Text animation="fadeIn" duration={300} style={styles.errorText}>{errors.city}</Animatable.Text>}
      </Animatable.View>

      <Animatable.View animation="fadeInUp" duration={600} delay={200}>
        <Text style={styles.inputLabel}>State</Text>
        <View style={[styles.inputWrapper, errors.state && styles.inputErrorWrapper]}>
          <Icon name="map" size={scale(20)} color="#6c5ce7" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Maharashtra"
            placeholderTextColor="#999"
            value={formData.state}
            onChangeText={(text) => handleChange('state', text)}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>
        {errors.state && <Animatable.Text animation="fadeIn" duration={300} style={styles.errorText}>{errors.state}</Animatable.Text>}
      </Animatable.View>

      <Animatable.View animation="fadeInUp" duration={600} delay={250}>
        <Text style={styles.inputLabel}>Pincode</Text>
        <View style={[styles.inputWrapper, errors.pincode && styles.inputErrorWrapper]}>
          <Icon name="markunread-mailbox" size={scale(20)} color="#6c5ce7" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="400001"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={formData.pincode}
            onChangeText={(text) => handleChange('pincode', text)}
            autoCapitalize="none"
            returnKeyType="next"
          />
        </View>
        {errors.pincode && <Animatable.Text animation="fadeIn" duration={300} style={styles.errorText}>{errors.pincode}</Animatable.Text>}
      </Animatable.View>

      <Animatable.View animation="fadeInUp" duration={600} delay={300}>
        <Text style={styles.inputLabel}>GST Number</Text>
        <View style={[styles.inputWrapper, errors.gstNumber && styles.inputErrorWrapper]}>
          <Icon name="receipt" size={scale(20)} color="#6c5ce7" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="22AAAAA0000A1Z5"
            placeholderTextColor="#999"
            value={formData.gstNumber}
            onChangeText={(text) => handleChange('gstNumber', text)}
            autoCapitalize="characters"
            returnKeyType="next"
          />
        </View>
        {errors.gstNumber && <Animatable.Text animation="fadeIn" duration={300} style={styles.errorText}>{errors.gstNumber}</Animatable.Text>}
      </Animatable.View>

      <Animatable.View animation="fadeInUp" duration={600} delay={350}>
        <Text style={styles.inputLabel}>PAN Number</Text>
        <View style={[styles.inputWrapper, errors.panNumber && styles.inputErrorWrapper]}>
          <Icon name="credit-card" size={scale(20)} color="#6c5ce7" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="AAAAA0000A"
            placeholderTextColor="#999"
            value={formData.panNumber}
            onChangeText={(text) => handleChange('panNumber', text)}
            autoCapitalize="characters"
            returnKeyType="done"
          />
        </View>
        {errors.panNumber && <Animatable.Text animation="fadeIn" duration={300} style={styles.errorText}>{errors.panNumber}</Animatable.Text>}
      </Animatable.View>
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View 
      style={[
        styles.formSection,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }]
        }
      ]}
    >
      <Animatable.Text 
        animation="fadeInDown" 
        duration={600} 
        style={styles.sectionTitle}
      >
        Bank Details
      </Animatable.Text>
      
      <Animatable.View animation="fadeInUp" duration={600} delay={100}>
        <Text style={styles.inputLabel}>Bank Account Number</Text>
        <View style={[styles.inputWrapper, errors.bankAccountNumber && styles.inputErrorWrapper]}>
          <Icon name="account-balance" size={scale(20)} color="#6c5ce7" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="1234567890"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={formData.bankAccountNumber}
            onChangeText={(text) => handleChange('bankAccountNumber', text)}
            autoCapitalize="none"
            returnKeyType="next"
          />
        </View>
        {errors.bankAccountNumber && <Animatable.Text animation="fadeIn" duration={300} style={styles.errorText}>{errors.bankAccountNumber}</Animatable.Text>}
      </Animatable.View>

      <Animatable.View animation="fadeInUp" duration={600} delay={150}>
        <Text style={styles.inputLabel}>IFSC Code</Text>
        <View style={[styles.inputWrapper, errors.ifscCode && styles.inputErrorWrapper]}>
          <Icon name="code" size={scale(20)} color="#6c5ce7" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="ABCD0123456"
            placeholderTextColor="#999"
            value={formData.ifscCode}
            onChangeText={(text) => handleChange('ifscCode', text)}
            autoCapitalize="characters"
            returnKeyType="next"
          />
        </View>
        {errors.ifscCode && <Animatable.Text animation="fadeIn" duration={300} style={styles.errorText}>{errors.ifscCode}</Animatable.Text>}
      </Animatable.View>

      <Animatable.Text 
        animation="fadeInDown" 
        duration={600} 
        style={[styles.sectionTitle, { marginTop: scale(20) }]}
      >
        Account Security
      </Animatable.Text>

      <Animatable.View animation="fadeInUp" duration={600} delay={200}>
        <Text style={styles.inputLabel}>Password</Text>
        <View style={[styles.inputWrapper, errors.password && styles.inputErrorWrapper]}>
          <Icon name="lock" size={scale(20)} color="#6c5ce7" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#999"
            secureTextEntry
            value={formData.password}
            onChangeText={(text) => handleChange('password', text)}
            autoCapitalize="none"
            returnKeyType="next"
          />
        </View>
        {errors.password && <Animatable.Text animation="fadeIn" duration={300} style={styles.errorText}>{errors.password}</Animatable.Text>}
      </Animatable.View>

      <Animatable.View animation="fadeInUp" duration={600} delay={250}>
        <Text style={styles.inputLabel}>Confirm Password</Text>
        <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputErrorWrapper]}>
          <Icon name="lock-outline" size={scale(20)} color="#6c5ce7" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#999"
            secureTextEntry
            value={formData.confirmPassword}
            onChangeText={(text) => handleChange('confirmPassword', text)}
            autoCapitalize="none"
            returnKeyType="done"
          />
        </View>
        {errors.confirmPassword && <Animatable.Text animation="fadeIn" duration={300} style={styles.errorText}>{errors.confirmPassword}</Animatable.Text>}
      </Animatable.View>
    </Animated.View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <LinearGradient
        colors={['#f9f9ff', '#e6e6ff']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? scale(60) : 0}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animatable.View 
              animation="fadeInDown"
              duration={800}
              style={styles.header}
            >
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Icon name="arrow-back" size={scale(24)} color="#6c5ce7" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Seller Registration</Text>
              <View style={{ width: scale(24) }} />
            </Animatable.View>

            {renderStepIndicator()}

            <View style={styles.formContainer}>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
            </View>
          </ScrollView>

          <Animatable.View 
            animation="fadeInUp"
            duration={800}
            style={styles.buttonContainer}
          >
            {currentStep > 1 && (
              <TouchableOpacity
                style={[styles.button, styles.prevButton]}
                onPress={handlePrevious}
                activeOpacity={0.7}
              >
                <Icon name="arrow-back" size={scale(18)} color="#6c5ce7" />
                <Text style={[styles.buttonText, { color: '#6c5ce7' }]}>Previous</Text>
              </TouchableOpacity>
            )}
            {currentStep < 3 ? (
              <TouchableOpacity
                style={[styles.button, styles.nextButton]}
                onPress={handleNext}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>Next</Text>
                <Icon name="arrow-forward" size={scale(18)} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>Submit</Text>
                <Icon name="check-circle" size={scale(18)} color="#fff" />
              </TouchableOpacity>
            )}
          </Animatable.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: scale(80),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale(20),
    paddingTop: scale(40),
    paddingBottom: scale(15),
  },
  backButton: {
    padding: scale(5),
    borderRadius: scale(20),
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
  },
  headerTitle: {
    fontSize: scale(22),
    fontWeight: '700',
    color: '#6c5ce7',
    letterSpacing: 0.5,
  },
  stepContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scale(15),
    paddingHorizontal: scale(20),
    marginBottom: scale(10),
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIndicator: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: '#e0e0ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  activeStep: {
    backgroundColor: '#6c5ce7',
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  completedStep: {
    backgroundColor: '#a29bfe',
  },
  stepLine: {
    width: scale(50),
    height: 2,
    backgroundColor: '#e0e0ff',
  },
  completedStepLine: {
    backgroundColor: '#a29bfe',
  },
  stepText: {
    color: '#fff',
    fontSize: scale(14),
    fontWeight: 'bold',
  },
  formContainer: {
    paddingHorizontal: scale(25),
  },
  formSection: {
    marginBottom: scale(20),
  },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: '600',
    color: '#6c5ce7',
    marginBottom: scale(20),
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: scale(12),
    paddingHorizontal: scale(15),
    marginBottom: scale(10),
    borderWidth: 1,
    borderColor: '#e6e6ff',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  inputErrorWrapper: {
    borderColor: '#ff7675',
  },
  inputIcon: {
    marginRight: scale(10),
  },
  inputLabel: {
    fontSize: scale(14),
    color: '#6c5ce7',
    fontWeight: '500',
    marginBottom: scale(8),
    marginLeft: scale(5),
  },
  input: {
    flex: 1,
    height: scale(50),
    fontSize: scale(14),
    color: '#333',
    paddingVertical: 0,
  },
  errorText: {
    color: '#ff7675',
    fontSize: scale(12),
    marginLeft: scale(15),
    marginBottom: scale(10),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: scale(20),
    paddingBottom: scale(30),
    backgroundColor: 'transparent',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(15),
    borderRadius: scale(12),
    marginHorizontal: scale(5),
    backgroundColor: '#6c5ce7',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  prevButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#6c5ce7',
  },
  nextButton: {
    backgroundColor: '#6c5ce7',
  },
  submitButton: {
    backgroundColor: '#00b894',
    shadowColor: '#00b894',
  },
  buttonText: {
    color: '#fff',
    fontSize: scale(16),
    fontWeight: '600',
    marginHorizontal: scale(8),
  },
});

export default SellerVerification;