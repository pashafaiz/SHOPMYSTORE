// import React, { useState, useEffect, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Image,
//   Dimensions,
//   Animated,
//   KeyboardAvoidingView,
//   Platform,
//   Easing,
// } from 'react-native';
// import { useDispatch, useSelector } from 'react-redux';
// import LinearGradient from 'react-native-linear-gradient';
// import InputBox from '../Components/InputBox';
// import Strings from '../constants/Strings';
// import Colors from '../constants/Colors';
// import img from '../assets/Images/img';
// import { useNavigation } from '@react-navigation/native';
// import Button from '../Components/Button';
// import { signup, clearErrors } from '.././/redux/slices/authSlice';
// import Loader from '../Components/Loader';

// const { width, height } = Dimensions.get('window');

// const SignUp = () => {
//   const navigation = useNavigation();
//   const dispatch = useDispatch();
//   const { loading, errors } = useSelector((state) => state.auth);
//   const [isChecked, setChecked] = useState(false);
//   const [userType, setUserType] = useState(null);
//   const [fullName, setFullName] = useState('');
//   const [userName, setUserName] = useState('');
//   const [email, setEmail] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');

//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const slideUpAnim = useRef(new Animated.Value(30)).current;
//   const logoScale = useRef(new Animated.Value(0.9)).current;
//   const buttonScale = useRef(new Animated.Value(1)).current;

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 800,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideUpAnim, {
//         toValue: 0,
//         duration: 800,
//         easing: Easing.out(Easing.exp),
//         useNativeDriver: true,
//       }),
//       Animated.spring(logoScale, {
//         toValue: 1,
//         friction: 4,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     return () => {
//       dispatch(clearErrors());
//     };
//   }, [dispatch]);

//   const validateForm = () => {
//     let tempErrors = {};
//     let isValid = true;

//     if (!userType) {
//       tempErrors.userType = 'Please select user type';
//       isValid = false;
//     }

//     if (!fullName.trim()) {
//       tempErrors.fullName = 'Full Name is required';
//       isValid = false;
//     }

//     if (!userName.trim()) {
//       tempErrors.userName = 'Username is required';
//       isValid = false;
//     }

//     if (!email.trim()) {
//       tempErrors.email = 'Email is required';
//       isValid = false;
//     }

//     if (!phoneNumber.trim()) {
//       tempErrors.phoneNumber = 'Phone Number is required';
//       isValid = false;
//     }

//     if (!password.trim()) {
//       tempErrors.password = 'Password is required';
//       isValid = false;
//     }

//     if (!confirmPassword.trim()) {
//       tempErrors.confirmPassword = 'Please confirm your password';
//       isValid = false;
//     }

//     if (!isChecked) {
//       tempErrors.terms = 'Please accept Terms & Conditions and Privacy Policy';
//       isValid = false;
//     }

//     dispatch({ type: 'auth/signup/rejected', payload: tempErrors });
//     return isValid;
//   };

//   const handleSignup = () => {
//     Animated.sequence([
//       Animated.timing(buttonScale, {
//         toValue: 0.95,
//         duration: 100,
//         useNativeDriver: true,
//       }),
//       Animated.timing(buttonScale, {
//         toValue: 1,
//         duration: 200,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     if (!validateForm()) {
//       return;
//     }

//     const formData = {
//       userType,
//       fullName,
//       userName,
//       email,
//       phoneNumber,
//       password,
//       confirmPassword,
//     };

//     dispatch(signup(formData)).then((result) => {
//       if (result.meta.requestStatus === 'fulfilled') {
//         navigation.navigate('OTP', { email });
//       }
//     });
//   };

//   const clearError = (field) => {
//     if (errors[field]) {
//       dispatch(clearErrors());
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <LinearGradient
//         colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']}
//         style={styles.backgroundGradient}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//       />
      
//       <Loader visible={loading} color="#7B61FF" />
      
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.keyboardAvoid}
//         keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
//       >
//         <ScrollView
//           contentContainerStyle={styles.scrollContainer}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//         >
//           <Animated.View
//             style={[
//               styles.logoContainer,
//               {
//                 opacity: fadeAnim,
//                 transform: [{ scale: logoScale }],
//               },
//             ]}
//           >
//             <Image 
//               style={styles.logo} 
//               source={img.App} 
//               resizeMode="contain"
//             />
//             <Text style={styles.tagline}>Your Premium Shopping Companion</Text>
//           </Animated.View>

//           <Animated.View
//             style={[
//               styles.formContainer,
//               {
//                 opacity: fadeAnim,
//                 transform: [{ translateY: slideUpAnim }],
//               },
//             ]}
//           >
//             <Text style={styles.welcomeText}>Create Account</Text>
            
//             <View style={styles.userTypeContainer}>
//               <Text style={styles.userTypeLabel}>I want to register as:</Text>
//               <View style={styles.userTypeOptions}>
//                 <TouchableOpacity
//                   style={[
//                     styles.userTypeButton,
//                     userType === 'seller' && styles.userTypeButtonSelected
//                   ]}
//                   onPress={() => {
//                     setUserType('seller');
//                     clearError('userType');
//                   }}
//                   activeOpacity={0.7}
//                 >
//                   <LinearGradient
//                     colors={userType === 'seller' ? ['#7B61FF', '#9D4DFF'] : ['transparent', 'transparent']}
//                     style={[styles.userTypeCheckbox, userType === 'seller' && styles.userTypeCheckboxSelected]}
//                     start={{ x: 0, y: 0 }}
//                     end={{ x: 1, y: 1 }}
//                   >
//                     {userType === 'seller' && (
//                       <Image source={img.check} style={styles.checkIcon} />
//                     )}
//                   </LinearGradient>
//                   <Text style={styles.userTypeText}>Seller</Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={[
//                     styles.userTypeButton,
//                     userType === 'customer' && styles.userTypeButtonSelected
//                   ]}
//                   onPress={() => {
//                     setUserType('customer');
//                     clearError('userType');
//                   }}
//                   activeOpacity={0.7}
//                 >
//                   <LinearGradient
//                     colors={userType === 'customer' ? ['#7B61FF', '#9D4DFF'] : ['transparent', 'transparent']}
//                     style={[styles.userTypeCheckbox, userType === 'customer' && styles.userTypeCheckboxSelected]}
//                     start={{ x: 0, y: 0 }}
//                     end={{ x: 1, y: 1 }}
//                   >
//                     {userType === 'customer' && (
//                       <Image source={img.check} style={styles.checkIcon} />
//                     )}
//                   </LinearGradient>
//                   <Text style={styles.userTypeText}>Customer</Text>
//                 </TouchableOpacity>
//               </View>
//               {errors.userType && (
//                 <Text style={[styles.errorText,{top:0}]}>{errors.userType}</Text>
//               )}
//             </View>

//             <InputBox
//               placeholder="Full Name"
//               placeholderTextColor="#A0A4B0"
//               icon={img.user}
//               value={fullName}
//               onChangeText={(text) => {
//                 setFullName(text);
//                 clearError('fullName');
//               }}
//               error={errors.fullName}
//               iconColor="#7B61FF"
//               containerStyle={styles.inputContainer}
//             />

//             <InputBox
//               placeholder="Username"
//               placeholderTextColor="#A0A4B0"
//               icon={img.user}
//               value={userName}
//               onChangeText={(text) => {
//                 setUserName(text);
//                 clearError('userName');
//               }}
//               error={errors.userName}
//               iconColor="#7B61FF"
//               containerStyle={styles.inputContainer}
//             />

//             <InputBox
//               placeholder="Email Address"
//               placeholderTextColor="#A0A4B0"
//               icon={img.mail}
//               value={email}
//               onChangeText={(text) => {
//                 setEmail(text);
//                 clearError('email');
//               }}
//               error={errors.email}
//               iconColor="#7B61FF"
//               containerStyle={styles.inputContainer}
//               keyboardType="email-address"
//             />

//             <InputBox
//               placeholder="Phone Number"
//               placeholderTextColor="#A0A4B0"
//               icon={img.call}  
//               value={phoneNumber}
//               onChangeText={(text) => {
//                 setPhoneNumber(text);
//                 clearError('phoneNumber');
//               }}
//               error={errors.phoneNumber}
//               iconColor="#7B61FF"
//               containerStyle={styles.inputContainer}
//               keyboardType="phone-pad"
//             />

//             <InputBox
//               placeholder="Password"
//               placeholderTextColor="#A0A4B0"
//               icon={img.lock}
//               value={password}
//               onChangeText={(text) => {
//                 setPassword(text);
//                 clearError('password');
//               }}
//               secureTextEntry
//               error={errors.password}
//               iconColor="#7B61FF"
//               containerStyle={styles.inputContainer}
//             />

//             <InputBox
//               placeholder="Confirm Password"
//               placeholderTextColor="#A0A4B0"
//               icon={img.lock}
//               value={confirmPassword}
//               onChangeText={(text) => {
//                 setConfirmPassword(text);
//                 clearError('confirmPassword');
//               }}
//               secureTextEntry
//               error={errors.confirmPassword}
//               iconColor="#7B61FF"
//               containerStyle={styles.inputContainer}
//             />

//             <View style={styles.termsRow}>
//               <TouchableOpacity
//                 style={styles.checkboxContainer}
//                 activeOpacity={0.7}
//                 onPress={() => {
//                   setChecked(!isChecked);
//                   clearError('terms');
//                 }}
//               >
//                 <LinearGradient
//                   colors={isChecked ? ['#7B61FF', '#9D4DFF'] : ['transparent', 'transparent']}
//                   style={[styles.checkbox, isChecked && styles.checkboxChecked]}
//                   start={{ x: 0, y: 0 }}
//                   end={{ x: 1, y: 1 }}
//                 >
//                   {isChecked && (
//                     <Image source={img.check} style={styles.checkIcon} />
//                   )}
//                 </LinearGradient>
//               </TouchableOpacity>
              
//               <Text style={styles.termsText}>I agree to the </Text>
//               <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')}>
//                 <Text style={styles.termsLink}>Terms</Text>
//               </TouchableOpacity>
//               <Text style={styles.termsText}> and </Text>
//               <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
//                 <Text style={styles.termsLink}>Privacy Policy</Text>
//               </TouchableOpacity>
//             </View>
            
//             {errors.terms && (
//               <Text style={styles.errorText}>{errors.terms}</Text>
//             )}

//             {errors.message && (
//               <Text style={[styles.errorText, { textAlign: 'center', marginBottom: 10 }]}>
//                 {errors.message}
//               </Text>
//             )}

//             <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
//               <Button
//                 title="SIGN UP"
//                 onPress={handleSignup}
//                 style={styles.button}
//                 textStyle={styles.buttonText}
//                 gradientColors={['#7B61FF', '#AD4DFF']}
//               />
//             </Animated.View>

//             <View style={styles.dividerContainer}>
//               <View style={styles.dividerLine} />
//               <Text style={styles.dividerText}>OR</Text>
//               <View style={styles.dividerLine} />
//             </View>

//             <View style={styles.socialButtonsContainer}>
//               <TouchableOpacity 
//                 style={styles.socialButton}
//                 activeOpacity={0.8}
//               >
//                 <Image 
//                   source={img.google} 
//                   style={styles.socialIcon} 
//                   resizeMode="contain"
//                 />
//               </TouchableOpacity>

//               <TouchableOpacity 
//                 style={styles.socialButton}
//                 activeOpacity={0.8}
//               >
//                 <Image 
//                   source={img.facebook} 
//                   style={styles.socialIcon} 
//                   resizeMode="contain"
//                 />
//               </TouchableOpacity>
//             </View>

//             <View style={styles.loginContainer}>
//               <Text style={styles.loginText}>Already have an account? </Text>
//               <TouchableOpacity onPress={() => navigation.navigate('Login')}>
//                 <Text style={styles.loginLink}>Login</Text>
//               </TouchableOpacity>
//             </View>
//           </Animated.View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#0A0A1E',
//   },
//   backgroundGradient: {
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     top: 0,
//     bottom: 0,
//   },
//   keyboardAvoid: {
//     flex: 1,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     paddingHorizontal: 24,
//     paddingBottom: 20,
//   },
//   logoContainer: {
//     alignItems: 'center',
//     marginTop: height * 0.05,
//     marginBottom: 30,
//   },
//   logo: {
//     width: width * 0.35,
//     height: width * 0.35,
//     marginBottom: 12,
//   },
//   tagline: {
//     color: '#E5E7EB',
//     fontSize: 14,
//     letterSpacing: 0.5,
//     opacity: 0.8,
//   },
//   formContainer: {
//     backgroundColor: 'rgba(30, 30, 63, 0.7)',
//     borderRadius: 24,
//     padding: 24,
//     marginBottom: 24,
//     borderWidth: 1,
//     borderColor: 'rgba(123, 97, 255, 0.2)',
//   },
//   welcomeText: {
//     color: '#FFFFFF',
//     fontSize: 22,
//     fontWeight: '700',
//     marginBottom: 24,
//     textAlign: 'center',
//   },
//   userTypeContainer: {
//     marginBottom: 16,
//   },
//   userTypeLabel: {
//     color: '#E5E7EB',
//     fontSize: 14,
//     marginBottom: 8,
//   },
//   userTypeOptions: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 4,
//   },
//   userTypeButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 10,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: 'rgba(123, 97, 255, 0.3)',
//     width: '48%',
//   },
//   userTypeButtonSelected: {
//     borderColor: '#7B61FF',
//     backgroundColor: 'rgba(123, 97, 255, 0.1)',
//   },
//   userTypeCheckbox: {
//     width: 18,
//     height: 18,
//     borderRadius: 4,
//     borderWidth: 1,
//     borderColor: 'rgba(123, 97, 255, 0.3)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 8,
//   },
//   userTypeCheckboxSelected: {
//     borderColor: '#7B61FF',
//   },
//   userTypeText: {
//     color: '#E5E7EB',
//     fontSize: 14,
//   },
//   inputContainer: {
//     backgroundColor: 'rgba(255, 255, 255, 0.08)',
//     borderWidth: 1,
//     borderColor: 'rgba(123, 97, 255, 0.3)',
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     marginBottom: 16,
//     height: 52,
//   },
//   termsRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 24,
//     flexWrap: 'wrap',
//   },
//   checkboxContainer: {
//     marginRight: 8,
//   },
//   checkbox: {
//     width: 18,
//     height:18,
//     borderRadius: 4,
//     borderWidth: 1,
//     borderColor: 'rgba(123, 97, 255, 0.3)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   checkboxChecked: {
//     borderColor: '#7B61FF',
//   },
//   checkIcon: {
//     width: 10,
//     height: 8,
//     tintColor: '#FFFFFF',
//   },
//   termsText: {
//     color: '#E5E7EB',
//     fontSize: 10,
//     marginRight: 4,
//   },
//   termsLink: {
//     color: '#7B61FF',
//     fontSize: 11,
//     fontWeight: '600',
//     marginRight: 4,
//   },
//   button: {
//     height: 52,
//     borderRadius: 12,
//     marginBottom: 24,
//     shadowColor: '#7B61FF',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   buttonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#FFFFFF',
//   },
//   dividerContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 16,
//   },
//   dividerLine: {
//     flex: 1,
//     height: 1,
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   dividerText: {
//     color: '#A0A4B0',
//     fontSize: 12,
//     marginHorizontal: 10,
//     fontWeight: '500',
//   },
//   socialButtonsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginBottom: 24,
//     gap: 16,
//   },
//   socialButton: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(123, 97, 255, 0.2)',
//   },
//   socialIcon: {
//     width: 24,
//     height: 24,
//   },
//   loginContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//   },
//   loginText: {
//     color: '#E5E7EB',
//     fontSize: 11,
//   },
//   loginLink: {
//     color: '#7B61FF',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   errorText: {
//     color: '#FF6B6B',
//     fontSize: 10,
//     top: -18,
//     marginBottom: 8,
//   },
// });

// export default SignUp;




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
import Strings from '../constants/Strings';
import Colors from '../constants/Colors';
import img from '../assets/Images/img';
import { useNavigation } from '@react-navigation/native';
import Button from '../Components/Button';
import { signup, clearErrors } from '../redux/slices/authSlice';
import Loader from '../Components/Loader';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

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

      // Dispatch signup action with Google user data
      const formData = {
        userType: 'customer', // Default to customer, adjust as needed
        fullName: user.displayName,
        userName: user.email.split('@')[0], // Generate username from email
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        password: '', // Google Sign-In doesn't require password
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
                    userType === 'seller' && styles.userTypeButtonSelected
                  ]}
                  onPress={() => {
                    setUserType('seller');
                    clearError('userType');
                  }}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={userType === 'seller' ? ['#7B61FF', '#9D4DFF'] : ['transparent', 'transparent']}
                    style={[styles.userTypeCheckbox, userType === 'seller' && styles.userTypeCheckboxSelected]}
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
                    userType === 'customer' && styles.userTypeButtonSelected
                  ]}
                  onPress={() => {
                    setUserType('customer');
                    clearError('userType');
                  }}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={userType === 'customer'

                    ? ['#7B61FF', '#9D4DFF'] : ['transparent', 'transparent']}
                    style={[styles.userTypeCheckbox, userType === 'customer' && styles.userTypeCheckboxSelected]}
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
                <Text style={[styles.errorText,{top:0}]}>{errors.userType}</Text>
              )}
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
              iconColor="#7B61FF"
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
              iconColor="#7B61FF"
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
              iconColor="#7B61FF"
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
              iconColor="#7B61FF"
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
              iconColor="#7B61FF"
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
              iconColor="#7B61FF"
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
                  colors={isChecked ? ['#7B61FF', '#9D4DFF'] : ['transparent', 'transparent']}
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
                title="SIGN UP"
                onPress={handleSignup}
                style={styles.button}
                textStyle={styles.buttonText}
                gradientColors={['#7B61FF', '#AD4DFF']}
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

              <TouchableOpacity 
                style={styles.socialButton}
                activeOpacity={0.8}
              >
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
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.05,
    marginBottom: 30,
  },
  logo: {
    width: width * 0.35,
    height: width * 0.35,
    marginBottom: 12,
  },
  tagline: {
    color: '#E5E7EB',
    fontSize: 14,
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  formContainer: {
    backgroundColor: 'rgba(30, 30, 63, 0.7)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.2)',
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  userTypeContainer: {
    marginBottom: 16,
  },
  userTypeLabel: {
    color: '#E5E7EB',
    fontSize: 14,
    marginBottom: 8,
  },
  userTypeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.3)',
    width: '48%',
  },
  userTypeButtonSelected: {
    borderColor: '#7B61FF',
    backgroundColor: 'rgba(123, 97, 255, 0.1)',
  },
  userTypeCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userTypeCheckboxSelected: {
    borderColor: '#7B61FF',
  },
  userTypeText: {
    color: '#E5E7EB',
    fontSize: 14,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 52,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  checkboxContainer: {
    marginRight: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: '#7B61FF',
  },
  checkIcon: {
    width: 10,
    height: 8,
    tintColor: '#FFFFFF',
  },
  termsText: {
    color: '#E5E7EB',
    fontSize: 10,
    marginRight: 4,
  },
  termsLink: {
    color: '#7B61FF',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 4,
  },
  button: {
    height: 52,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: '#A0A4B0',
    fontSize: 12,
    marginHorizontal: 10,
    fontWeight: '500',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 16,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.2)',
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    color: '#E5E7EB',
    fontSize: 11,
  },
  loginLink: {
    color: '#7B61FF',
    fontSize: 12,
    fontWeight: '600',
  },
    errorText: {
    color: '#FF6B6B',
    fontSize: 10,
    top: -18,
    marginBottom: 8,
  },
});

export default SignUp;