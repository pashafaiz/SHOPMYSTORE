import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import InputBox from '../Components/InputBox';
import Strings from '../constants/Strings';
import Colors from '../constants/Colors';
import img from '../assets/Images/img';
import {useNavigation} from '@react-navigation/native';
import SocialLogin from '../Components/SocialLogin';
import Button from '../Components/Button';
import {signupApi} from '../../apiClient';
import Loader from '../Components/Loader';

const {width, height} = Dimensions.get('window');

const SignUp = () => {
  const navigation = useNavigation();
  const [isChecked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState({});

  const handleSignup = async () => {
    setErrors({});
    if (!isChecked) {
      setErrors({terms: 'Please accept Terms & Conditions'});
      return;
    }

    const formData = {
      fullName,
      userName,
      email,
      phoneNumber,
      password,
      confirmPassword,
    };

    setLoading(true);
    const {ok, data} = await signupApi(formData);
    setLoading(false);

    if (ok) {
      navigation.navigate('OTP', {email});
    } else {
      setErrors(data.errors || {});
    }
  };

  return (
    <View style={{flex: 1, backgroundColor: '#fff'}}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <Image style={styles.logo} source={img.App} />
        <Text style={styles.title}>{Strings.signUp}</Text>

        <InputBox
          placeholder={'Full Name'}
          style={styles.input}
          icon={img.user}
          value={fullName}
          onChangeText={text => {
            setFullName(text);
            if (errors.fullName) setErrors(prev => ({...prev, fullName: ''}));
          }}
          error={errors.fullName}
          inputContainer1={styles.inputContainer}
        />
        <InputBox
          placeholder={'Username'}
          style={styles.input}
          icon={img.user}
          value={userName}
          onChangeText={text => {
            setUserName(text);
            if (errors.userName) setErrors(prev => ({...prev, userName: ''}));
          }}
          error={errors.userName}
          inputContainer1={styles.inputContainer}
        />
        <InputBox
          placeholder={'Email'}
          style={styles.input}
          icon={img.mail}
          value={email}
          onChangeText={text => {
            setEmail(text);
            if (errors.email) setErrors(prev => ({...prev, email: ''}));
          }}
          error={errors.email}
          inputContainer1={styles.inputContainer}
        />
        <InputBox
          placeholder={'Phone Number'}
          style={styles.input}
          icon={img.call}
          value={phoneNumber}
          keyboardType="phone-pad"
          onChangeText={text => {
            setPhoneNumber(text);
            if (errors.phoneNumber)
              setErrors(prev => ({...prev, phoneNumber: ''}));
          }}
          error={errors.phoneNumber}
          inputContainer1={styles.inputContainer}
        />
        {/* <InputBox
          placeholder={"Password"}
          style={styles.input}
          icon={img.lock}
          value={password}
          secureTextEntry
          onChangeText={(text) => {
            setPassword(text);
            if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
          }}
          error={errors.password}
          inputContainer1={styles.inputContainer}
        />
        <InputBox
          placeholder={"Confirm Password"}
          style={styles.input}
          icon={img.lock}
          value={confirmPassword}
          secureTextEntry
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
          }}
          error={errors.confirmPassword}
          inputContainer1={styles.inputContainer}
        /> */}

        <InputBox
          placeholder={'Password'}
          style={styles.input}
          icon={img.lock}
          value={password}
          onChangeText={text => {
            setPassword(text);
            if (errors.password) setErrors(prev => ({...prev, password: ''}));
          }}
          error={errors.password}
          secureTextEntry
          inputContainer1={styles.inputContainer}
        />

        <InputBox
          placeholder={'Confirm Password'}
          style={styles.input}
          icon={img.lock}
          value={confirmPassword}
          onChangeText={text => {
            setConfirmPassword(text);
            if (errors.confirmPassword)
              setErrors(prev => ({...prev, confirmPassword: ''}));
          }}
          error={errors.confirmPassword}
          secureTextEntry
          inputContainer1={styles.inputContainer}
        />

        <View style={styles.row}>
          <TouchableOpacity onPress={() => setChecked(!isChecked)}>
            <View
              style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
              {isChecked && <Text>✓</Text>}
            </View>
          </TouchableOpacity>

          <Text style={styles.text}>
            I Accept <Text style={styles.link}>{Strings.terms_Condition}</Text>
          </Text>
        </View>

        {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

        <Button
          title={Strings.signUp}
          onPress={handleSignup}
          style={styles.button}
        />
        <SocialLogin />

        <View style={styles.no_acc}>
          <Text style={styles.singup_Free}>{Strings.already_acc}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.singup_Free, {color: Colors.pink}]}>
              {Strings.Login}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Loader */}
      <Loader visible={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 25,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  logo: {
    justifyContent: 'center',
    alignSelf: 'center',
    resizeMode: 'contain',
    width: width * 0.8,
    height: height * 0.3,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 25,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.lightGray1,
    width: width * 0.8,
  },
  link: {
    color: '#f89db2',
    fontWeight: 'bold',
  },
  no_acc: {
    flexDirection: 'row',
    justifyContent: 'center',
    top: 10,
  },
  singup_Free: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#ff9eb5',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 40,
    marginTop: 20,
    width: width * 0.8,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: Colors.lightGray,
  },
  checkboxChecked: {
    backgroundColor: '#f89db2',
  },
  inputContainer: {
    width: width * 0.87,
    alignSelf: 'center',
    marginBottom: 4,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 4,
    marginBottom: -8,
    alignSelf: 'flex-start',
    marginLeft: 10,
  },
});

export default SignUp;
