import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Image, Text, TouchableOpacity } from 'react-native';
import Colors from '../constants/Colors';
import img from '../assets/Images/img'; // using your existing image keys

const InputBox = ({
  placeholder,
  icon,
  style,
  inputContainer1,
  onChangeText,
  value,
  secureTextEntry,
  error
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry;

  return (
    <View style={{ flex: 1 }}>
      <View style={[
        styles.inputContainer,
        inputContainer1,
        error && { borderColor: 'red' }
      ]}>
        <View style={styles.iconWrapper}>
          <Image source={icon} style={styles.icon} />
        </View>

        <TextInput
          style={[styles.textInput, style]}
          placeholder={placeholder}
          placeholderTextColor="#9e9e9e"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
        />

        {isPassword && (
          <TouchableOpacity activeOpacity={0.7} style={[styles.iconWrapper,{marginRight:0}]}  onPress={() => setShowPassword(!showPassword)}>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.White,
    borderWidth: 1,
    borderColor: Colors.lightPurple,
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 10,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.LightPink,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.lightPurple,
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: Colors.pink,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.lightGray1,
  },
  eyeIcon: {
    width: 20,
    height:20,
    tintColor: Colors.pink,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    paddingVertical: 5,
  },
});

