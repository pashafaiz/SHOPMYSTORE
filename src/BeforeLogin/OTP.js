import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, TextInput, View, TouchableOpacity, Dimensions, ActivityIndicator,
  BackHandler
} from 'react-native';
import Header from '../Components/Header';
import img from '../assets/Images/img';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Strings from '../constants/Strings';
import Button from '../Components/Button';
import Colors from '../constants/Colors';
import { verifyOtpApi } from '../../apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const OTP = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const email = route.params?.email;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputRefs = useRef([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);


  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp(); // exits app
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove();
    }, [])
  );

  const handleChange = (text, index) => {
    if (/^\d*$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);
      setError('');

      if (text && index < 5) {
        inputRefs.current[index + 1].focus();
      }
      if (!text && index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleResend = async () => {
    setTimer(30);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0].focus();
  
    const { ok, data } = await resendOtpApi(email);
    if (!ok) {
      setError(data?.errors?.email || "Failed to resend OTP");
    }
  };
  

  // const handleVerifyOtp = async () => {
  //   const enteredOtp = otp.join('');
  //   if (enteredOtp.length !== 6) {
  //     setError("Please enter a valid 6-digit OTP");
  //     return;
  //   }

  //   setLoading(true);
  //   const { ok, data } = await verifyOtpApi(enteredOtp, email);
  //   console.log("---data-->",data);
  //   setLoading(false);

  //   if (ok) {
  //     // navigation.navigate("BottomTabs");
  //   } else {
  //     setError(data?.errors?.otp || "OTP verification failed");
  //   }
  // };

  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }
  
    setLoading(true);
    const { ok, data } = await verifyOtpApi(enteredOtp, email);
    console.log("---data-->", data);
    setLoading(false);
  
    if (ok) {
      try {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        navigation.reset({
          index: 0,
          routes: [{ name: 'BottomTabs' }],
        });
      } catch (err) {
        console.log('Error storing token/user:', err);
      }
    } else {
      setError(data?.errors?.otp || "OTP verification failed");
    }
  };
  return (
    <View style={styles.container}>
      <Header
        title={Strings.OTP_Verify}
        showLeftIcon={true}
        leftIcon={img.back_Icon}
        onLeftPress={() => navigation.goBack()}
      />

      <View style={styles.verifyText}>
        <Text style={styles.verifyString}>Verification</Text>
        <Text style={styles.codeSend_String}>
          We’ve sent you the verification{'\n'}code on {email || "your email"}
        </Text>
      </View>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={ref => (inputRefs.current[index] = ref)}
            style={[styles.otpInput, digit ? styles.filledInput : null]}
            maxLength={1}
            keyboardType="number-pad"
            value={digit}
            onChangeText={text => handleChange(text, index)}
          />
        ))}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button
        title={loading ? <ActivityIndicator color="#fff" /> : Strings.continue}
        onPress={handleVerifyOtp}
        style={styles.button}
        disabled={loading}
      />

      <View style={styles.resendContainer}>
        {timer > 0 ? (
          <Text style={styles.timerText}>
            Re-send code in <Text style={styles.timerCount}>0:{timer.toString().padStart(2, '0')}</Text>
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.resendText}>Resend Code</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default OTP;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.White },
  verifyText: { paddingHorizontal: 40, paddingVertical: 40 },
  verifyString: { fontSize: 25, fontWeight: '600', lineHeight: 40, marginBottom: 10 },
  codeSend_String: { fontSize: 16, lineHeight: 22, color: Colors.lightGray1 },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 30,
    marginTop: 20,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 10,
    width: 45,
    height: 55,
    textAlign: 'center',
    fontSize: 20,
    color: Colors.lightGray1,
    backgroundColor: Colors.White,
  },
  filledInput: { borderColor: "#ddf" },
  button: {
    backgroundColor: Colors.pink,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 40,
    marginTop: 50,
    width: width * 0.8,
  },
  resendContainer: { alignItems: 'center', marginTop: 20 },
  timerText: { fontSize: 14, color: Colors.lightGray1 },
  timerCount: { color: Colors.pink, fontWeight: '500' },
  resendText: { fontSize: 14, color: Colors.pink, fontWeight: '500' },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 10,
  }
});
