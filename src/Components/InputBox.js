import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import img from '../assets/Images/img';

const InputBox = ({
  placeholder,
  icon,
  onChangeText,
  value,
  secureTextEntry,
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          error && { borderColor: '#FF4D4D' },
        ]}
      >
        {icon && (
          <View style={styles.iconWrapper}>
            <Image source={icon} style={styles.icon} />
          </View>
        )}

        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#A0A4B0"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          selectionColor="#7B61FF"
          autoCapitalize="none"
          keyboardType={isPassword ? 'default' : 'email-address'}
          returnKeyType="done"
          editable
          autoCorrect={false}
        />

        {isPassword && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.iconWrapper, { marginRight: 0 }]}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Image
              source={showPassword ? img.open : img.hide}
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default InputBox;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(123, 97, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,

  },
  icon: {
    width: 20,
    height: 20,
    tintColor: '#7B61FF',
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
    paddingVertical: 0,
    height: '100%',
  },
  eyeIcon: {
    width: 20,
    height: 20,
    tintColor: '#7B61FF',
  },
  errorText: {
    color: '#FF4D4D',
    fontSize: 10,
    marginTop: 4,
    marginLeft: 0,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
  },
});