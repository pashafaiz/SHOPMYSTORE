import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import React, {useCallback, useState} from 'react';
import img from '../assets/Images/img';
import Strings from '../constants/Strings';
import Colors from '../constants/Colors';
import InputBox from '../Components/InputBox';
import Button from '../Components/Button';
import SocialLogin from '../Components/SocialLogin';
const {width, height} = Dimensions.get('window');
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {loginApi} from '../../apiClient';
import Loader from '../Components/Loader';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Login = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);



  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        BackHandler.exitApp(); // Or show alert to exit
        return true;
      };
  
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );
  
      return () => backHandler.remove();
    }, [])
  );


  // const handleLogin = async () => {
  //   setErrors({});
  //   let tempErrors = {};
  //   if (!email) tempErrors.email = 'Email is required';
  //   if (!password) tempErrors.password = 'Password is required';

  //   if (Object.keys(tempErrors).length > 0) {
  //     setErrors(tempErrors);
  //     return;
  //   }

  //   setLoading(true); // 👈 Start loader before API call

  //   const {ok, data} = await loginApi(email, password);

  //   setLoading(false);

  //   if (ok) {
  //     navigation.navigate('BottomTabs');
  //   } else {
  //     if (data.errors) {
  //       setErrors(data.errors);
  //     } else {
  //       setErrors({
  //         email: 'Login failed',
  //         password: 'Login failed',
  //       });
  //     }
  //   }
  // };

  const handleLogin = async () => {
    setErrors({});
    let tempErrors = {};
  
    if (!email) tempErrors.email = 'Email is required';
    if (!password) tempErrors.password = 'Password is required';
  
    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }
  
    setLoading(true);
  
    try {
      const { ok, data } = await loginApi(email, password);
  
      if (ok && data.token) {
        alert("-----")
        await AsyncStorage.setItem('userToken', data.token);
        if (data.user) {
          alert("hiiii")
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
        }
  
        navigation.reset({
          index: 0,
          routes: [{ name: 'BottomTabs' }],
        });
      } else {
        if (data?.errors) {
          setErrors(data.errors);
        } else if (data?.message) {
          setErrors({
            email: data.message,
            password: data.message,
          });
        } else {
          setErrors({
            email: 'Login failed',
            password: 'Login failed',
          });
        }
      }
    } catch (error) {
      console.log("Login error:", error);
      setErrors({
        email: 'Something went wrong',
        password: 'Something went wrong',
      });
    }
  
    setLoading(false);
  };
  
  

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image style={styles.logo} source={img.App} />
        <Image style={styles.welcome} source={img.welcome} />
        <Text style={styles.login}>{Strings.Login}</Text>

        <InputBox
          placeholder="Email/Username"
          style={styles.input}
          inputContainer1={styles.inputContainer}
          icon={img.mail}
          value={email}
          onChangeText={text => {
            setEmail(text);
            if (errors.email) setErrors(prev => ({...prev, email: ''}));
          }}
          error={errors.email}
        />

        {/* <InputBox
            placeholder="Password"
            style={styles.input}
            inputContainer1={styles.inputContainer}
            icon={img.lock}
            value={password}
            onChangeText={text => {
              setPassword(text);
              if (errors.password) setErrors(prev => ({...prev, password: ''}));
            }}
            secureTextEntry
            error={errors.password}
          /> */}

        <InputBox
          placeholder="Password"
          style={styles.input}
          inputContainer1={styles.inputContainer}
          icon={img.lock}
          value={password}
          onChangeText={text => {
            setPassword(text);
            if (errors.password) setErrors(prev => ({...prev, password: ''}));
          }}
          secureTextEntry
          error={errors.password}
        />

        <Button
          title={Strings.Login}
          onPress={handleLogin}
          style={styles.button}
        />

        <TouchableOpacity style={styles.forgotPass}>
          <Text>{Strings.forgot_Pass}</Text>
        </TouchableOpacity>

        <View style={styles.no_acc}>
          <Text style={styles.singup_Free}>{Strings.no_acc}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={[styles.singup_Free, {color: Colors.pink}]}>
              {Strings.singup_Free}
            </Text>
          </TouchableOpacity>
        </View>

        <SocialLogin />
      </ScrollView>
      <Loader visible={loading} color={Colors.pink} />
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 25,
  },
  logo: {
    justifyContent: 'center',
    alignSelf: 'center',
    resizeMode: 'contain',
    width: width * 0.9,
    height: height * 0.3,
    marginTop: 10,
  },
  welcome: {
    resizeMode: 'contain',
    width: width * 0.5,
    height: height * 0.06,
    alignSelf: 'flex-end',
    transform: [{rotate: '-20deg'}],
  },
  login: {
    alignSelf: 'center',
    fontSize: 30,
    fontWeight: '600',
    color: Colors.Black,
    lineHeight: height * 0.08,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.lightGray1,
    width: width * 0.8,
  },
  inputContainer: {
    width: width * 0.87,
    alignSelf: 'center',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#ff9eb5',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    width: width * 0.8,
  },
  forgotPass: {
    alignSelf: 'flex-end',
    padding: 16,
    marginRight: 24,
  },
  no_acc: {
    flexDirection: 'row',
    justifyContent: 'center',
    top: 10,
  },
  singup_Free: {
    fontSize: 16,
  },
});
