// import React, { useCallback, useState, useRef } from 'react';
// import {
//   Image,
//   ScrollView,
//   StyleSheet,
//   Text,
//   View,
//   Dimensions,
//   TouchableOpacity,
//   BackHandler,
//   Animated,
//   KeyboardAvoidingView,
//   Platform,
//   Easing,
// } from 'react-native';
// import { useDispatch, useSelector } from 'react-redux';
// import img from '../assets/Images/img';
// import Strings from '../constants/Strings';
// import InputBox from '../Components/InputBox';
// import Button from '../Components/Button';
// import LinearGradient from 'react-native-linear-gradient';
// import { useFocusEffect, useNavigation } from '@react-navigation/native';
// import { login, clearErrors } from '../../src/redux/slices/authSlice';
// import Loader from '../Components/Loader';

// const { width, height } = Dimensions.get('window');

// const scaleSize = (size) => Math.round(size * (width / 375));
// const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375));

// const Login = () => {
//   const navigation = useNavigation();
//   const dispatch = useDispatch();
//   const { loading, errors } = useSelector((state) => state.auth);
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');

//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const slideUpAnim = useRef(new Animated.Value(30)).current;
//   const logoScale = useRef(new Animated.Value(0.9)).current;
//   const buttonScale = useRef(new Animated.Value(1)).current;

//   useFocusEffect(
//     useCallback(() => {
//       const backAction = () => {
//         BackHandler.exitApp();
//         return true;
//       };

//       const backHandler = BackHandler.addEventListener(
//         'hardwareBackPress',
//         backAction
//       );

//       Animated.parallel([
//         Animated.timing(fadeAnim, {
//           toValue: 1,
//           duration: 800,
//           useNativeDriver: true,
//         }),
//         Animated.timing(slideUpAnim, {
//           toValue: 0,
//           duration: 800,
//           easing: Easing.out(Easing.exp),
//           useNativeDriver: true,
//         }),
//         Animated.spring(logoScale, {
//           toValue: 1,
//           friction: 4,
//           useNativeDriver: true,
//         }),
//       ]).start();

//       return () => {
//         backHandler.remove();
//         fadeAnim.setValue(0);
//         slideUpAnim.setValue(30);
//         logoScale.setValue(0.9);
//         dispatch(clearErrors());
//       };
//     }, [dispatch])
//   );

//   const handleLogin = () => {
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

//     let tempErrors = {};
//     if (!email) tempErrors.email = 'Email is required';
//     if (!password) tempErrors.password = 'Password is required';

//     if (Object.keys(tempErrors).length > 0) {
//       dispatch({ type: 'auth/login/rejected', payload: tempErrors });
//       return;
//     }

//     dispatch(login({ email, password })).then((result) => {
//       if (result.meta.requestStatus === 'fulfilled') {
//         navigation.reset({
//           index: 0,
//           routes: [{ name: 'BottomTabs' }],
//         });
//       }
//     });
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
//             <Text style={styles.welcomeText}>Welcome Back</Text>
            
//             <InputBox
//               placeholder="Email Address"
//               placeholderTextColor="#A0A4B0"
//               icon={img.mail}
//               value={email}
//               onChangeText={setEmail}
//               error={errors.email}
//               iconColor="#7B61FF"
//               containerStyle={styles.inputContainer}
//             />

//             <InputBox
//               placeholder="Password"
//               placeholderTextColor="#A0A4B0"
//               icon={img.lock}
//               value={password}
//               onChangeText={setPassword}
//               secureTextEntry
//               error={errors.password}
//               iconColor="#7B61FF"
//               containerStyle={styles.inputContainer}
//             />

//             <TouchableOpacity 
//               style={styles.forgotPass}
//               onPress={() => navigation.navigate('ForgotPassword')}
//             >
//               <Text style={styles.forgotPassText}>Forgot Password ?</Text>
//             </TouchableOpacity>

//             <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
//               <Button
//                 title="LOGIN"
//                 onPress={handleLogin}
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

//             <View style={styles.signupContainer}>
//               <Text style={styles.signupText}>Don't have an account? </Text>
//               <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
//                 <Text style={styles.signupLink}>Sign Up</Text>
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
//     paddingHorizontal: scaleSize(24),
//     paddingBottom: scaleSize(20),
//   },
//   logoContainer: {
//     alignItems: 'center',
//     marginTop: height * 0.05,
//     marginBottom: scaleSize(30),
//   },
//   logo: {
//     width: width * 0.35,
//     height: width * 0.35,
//     marginBottom: scaleSize(12),
//   },
//   tagline: {
//     color: '#E5E7EB',
//     fontSize: scaleFont(14),
//     letterSpacing: 0.5,
//     opacity: 0.8,
//   },
//   formContainer: {
//     backgroundColor: 'rgba(30, 30, 63, 0.7)',
//     borderRadius: scaleSize(24),
//     padding: scaleSize(24),
//     marginBottom: scaleSize(24),
//     borderWidth: 1,
//     borderColor: 'rgba(123, 97, 255, 0.2)',
//   },
//   welcomeText: {
//     color: '#FFFFFF',
//     fontSize: scaleFont(22),
//     fontWeight: '700',
//     marginBottom: scaleSize(24),
//     textAlign: 'center',
//   },
//   inputContainer: {
//     backgroundColor: 'rgba(255, 255, 255, 0 | 0.08)',
//     borderWidth: 1,
//     borderColor: 'rgba(123, 97, 255, 0.3)',
//     borderRadius: scaleSize(12),
//     paddingHorizontal: scaleSize(16),
//     marginBottom: scaleSize(16),
//     height: scaleSize(52),
//   },
//   forgotPass: {
//     alignSelf: 'flex-end',
//     marginBottom: scaleSize(24),
//   },
//   forgotPassText: {
//     color: '#7B61FF',
//     fontSize: scaleFont(11),
//     fontWeight: '500',
//   },
//   button: {
//     height: scaleSize(45),
//     borderRadius: scaleSize(12),
//     marginBottom: scaleSize(24),
//     shadowColor: '#7B61FF',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   buttonText: {
//     fontSize: scaleFont(13),
//     fontWeight: '600',
//     color: '#FFFFFF',
//   },
//   dividerContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: scaleSize(16),
//   },
//   dividerLine: {
//     flex: 1,
//     height: 1,
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   dividerText: {
//     color: '#A0A4B0',
//     fontSize: scaleFont(12),
//     marginHorizontal: scaleSize(10),
//     fontWeight: '500',
//   },
//   socialButtonsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginBottom: scaleSize(24),
//     gap: scaleSize(16),
//   },
//   socialButton: {
//     width: scaleSize(48),
//     height: scaleSize(48),
//     borderRadius: scaleSize(24),
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(123, 97, 255, 0.2)',
//   },
//   socialIcon: {
//     width: scaleSize(24),
//     height: scaleSize(24),
//   },
//   signupContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//   },
//   signupText: {
//     color: '#E5E7EB',
//     fontSize: scaleFont(12),
//   },
//   signupLink: {
//     color: '#7B61FF',
//     fontSize: scaleFont(12),
//     fontWeight: '600',
//   },
// });

// export default Login;



import React, { useCallback, useState, useRef } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  BackHandler,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Easing,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import img from '../assets/Images/img';
import Strings from '../constants/Strings';
import InputBox from '../Components/InputBox';
import Button from '../Components/Button';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { login, clearErrors } from '../../src/redux/slices/authSlice';
import Loader from '../Components/Loader';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { getAuth, signInWithCredential, GoogleAuthProvider } from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

const scaleSize = (size) => Math.round(size * (width / 375));
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375));

const Login = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { loading, errors } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        BackHandler.exitApp();
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );

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
        backHandler.remove();
        fadeAnim.setValue(0);
        slideUpAnim.setValue(30);
        logoScale.setValue(0.9);
        dispatch(clearErrors());
      };
    }, [dispatch])
  );

  const handleLogin = () => {
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

    let tempErrors = {};
    if (!email) tempErrors.email = 'Email is required';
    if (!password) tempErrors.password = 'Password is required';

    if (Object.keys(tempErrors).length > 0) {
      dispatch({ type: 'auth/login/rejected', payload: tempErrors });
      return;
    }

    dispatch(login({ email, password })).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'BottomTabs' }],
        });
      }
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log('Step 1: Checking Play Services...');
      const hasPlayServices = await GoogleSignin.hasPlayServices();
      console.log('Step 1: Play Services available:', hasPlayServices);

      console.log('Step 2: Attempting Google Sign-In...');
      const signInResult = await GoogleSignin.signIn();
      console.log('Step 2: Google Sign-In Result:', JSON.stringify(signInResult, null, 2));
      const { idToken } = signInResult;

      console.log('Step 3: Creating Google Credential...');
      const googleCredential = GoogleAuthProvider.credential(idToken);
      console.log('Step 3: Credential created successfully');

      console.log('Step 4: Signing in with Firebase...');
      const auth = getAuth();
      const userCredential = await signInWithCredential(auth, googleCredential);
      console.log('Step 4: Firebase Sign-In successful:', JSON.stringify(userCredential, null, 2));
      const user = userCredential.user;

      console.log('Step 5: Dispatching login action...');
      dispatch(login({
        email: user.email,
        fullName: user.displayName,
        googleId: user.uid,
      })).then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'BottomTabs' }],
          });
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
      if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
        errorMessage = 'Google Sign-In failed: Unknown error (empty error object)';
      } else if (error && typeof error === 'object') {
        if (error.code) {
          if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            errorMessage = 'Sign-in cancelled';
          } else if (error.code === statusCodes.IN_PROGRESS) {
            errorMessage = 'Sign-in in progress';
          } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            errorMessage = 'Play Services not available';
          } else {
            errorMessage = `Error: ${error.message || 'Unknown error'}`;
          }
        } else {
          errorMessage = `Error: ${error.message || 'Unexpected error occurred'}`;
        }
      } else {
        errorMessage = 'An unexpected error occurred';
      }

      console.error('Google Sign-In Error:', JSON.stringify(error || {}, null, 2));
      console.log('Error occurred at step:', errorMessage);

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
        position: 'top',
        visibilityTime: 3000,
      });
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
            <Text style={styles.welcomeText}>Welcome Back</Text>
            
            <InputBox
              placeholder="Email Address"
              placeholderTextColor="#A0A4B0"
              icon={img.mail}
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              iconColor="#7B61FF"
              containerStyle={styles.inputContainer}
            />

            <InputBox
              placeholder="Password"
              placeholderTextColor="#A0A4B0"
              icon={img.lock}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
              iconColor="#7B61FF"
              containerStyle={styles.inputContainer}
            />

            <TouchableOpacity 
              style={styles.forgotPass}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPassText}>Forgot Password ?</Text>
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <Button
                title="LOGIN"
                onPress={handleLogin}
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

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signupLink}>Sign Up</Text>
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
    paddingHorizontal: scaleSize(24),
    paddingBottom: scaleSize(20),
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.05,
    marginBottom: scaleSize(30),
  },
  logo: {
    width: width * 0.35,
    height: width * 0.35,
    marginBottom: scaleSize(12),
  },
  tagline: {
    color: '#E5E7EB',
    fontSize: scaleFont(14),
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  formContainer: {
    backgroundColor: 'rgba(30, 30, 63, 0.7)',
    borderRadius: scaleSize(24),
    padding: scaleSize(24),
    marginBottom: scaleSize(24),
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.2)',
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: scaleFont(22),
    fontWeight: '700',
    marginBottom: scaleSize(24),
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.3)',
    borderRadius: scaleSize(12),
    paddingHorizontal: scaleSize(16),
    marginBottom: scaleSize(16),
    height: scaleSize(52),
  },
  forgotPass: {
    alignSelf: 'flex-end',
    marginBottom: scaleSize(24),
  },
  forgotPassText: {
    color: '#7B61FF',
    fontSize: scaleFont(11),
    fontWeight: '500',
  },
  button: {
    height: scaleSize(45),
    borderRadius: scaleSize(12),
    marginBottom: scaleSize(24),
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: scaleFont(13),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: scaleSize(16),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: '#A0A4B0',
    fontSize: scaleFont(12),
    marginHorizontal: scaleSize(10),
    fontWeight: '500',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: scaleSize(24),
    gap: scaleSize(16),
  },
  socialButton: {
    width: scaleSize(48),
    height: scaleSize(48),
    borderRadius: scaleSize(24),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.2)',
  },
  socialIcon: {
    width: scaleSize(24),
    height: scaleSize(24),
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    color: '#E5E7EB',
    fontSize: scaleFont(12),
  },
  signupLink: {
    color: '#7B61FF',
    fontSize: scaleFont(12),
    fontWeight: '600',
  },
});

export default Login;