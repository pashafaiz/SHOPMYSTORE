import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import img from '../assets/Images/img';

const { width, height } = Dimensions.get('window');
const scaleFactor = Math.min(width, 375) / 375;
const scale = (size) => Math.round(size * scaleFactor);
const scaleFont = (size) => {
  const fontScale = Math.min(width, height) / 375;
  const scaledSize = size * fontScale * (Platform.OS === 'ios' ? 0.9 : 0.85);
  return Math.round(scaledSize);
};

// Theme constants
const PRODUCT_BG_COLOR = '#f5f9ff';
const CATEGORY_BG_COLOR = 'rgba(91, 156, 255, 0.2)';
const PRIMARY_THEME_COLOR = '#5b9cff';
const SECONDARY_THEME_COLOR = '#ff6b8a';
const TEXT_THEME_COLOR = '#1a2b4a';
const SUBTEXT_THEME_COLOR = '#5a6b8a';
const BORDER_THEME_COLOR = 'rgba(91, 156, 255, 0.3)';

const InputBox = ({
  placeholder,
  icon,
  onChangeText,
  value,
  secureTextEntry,
  error,
  iconColor = PRIMARY_THEME_COLOR,
  placeholderTextColor = SUBTEXT_THEME_COLOR,
  containerStyle,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry;

  return (
    <View style={[styles.container, { backgroundColor: PRODUCT_BG_COLOR }]}>
      <View
        style={[
          styles.inputContainer,
          containerStyle,
          error && { borderColor: SECONDARY_THEME_COLOR },
        ]}
      >
        {icon && (
          <View style={styles.iconWrapper}>
            <Image source={icon} style={[styles.icon, { tintColor: iconColor }]} />
          </View>
        )}

        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          selectionColor={PRIMARY_THEME_COLOR}
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
              style={[styles.eyeIcon, { tintColor: iconColor }]}
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
    marginBottom: scale(16),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scale(56),
    backgroundColor: CATEGORY_BG_COLOR,
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    borderRadius: scale(16),
    paddingHorizontal: scale(12),
    shadowColor: PRIMARY_THEME_COLOR,
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    // elevation: 3,
  },
  iconWrapper: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(10),
    backgroundColor: CATEGORY_BG_COLOR,
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  icon: {
    width: scale(22),
    height: scale(22),
    tintColor: PRIMARY_THEME_COLOR,
  },
  textInput: {
    flex: 1,
    fontSize: scaleFont(16),
    color: TEXT_THEME_COLOR,
    paddingVertical: 0,
    height: '100%',
  },
  eyeIcon: {
    width: scale(22),
    height: scale(22),
    tintColor: PRIMARY_THEME_COLOR,
  },
  errorText: {
    color: SECONDARY_THEME_COLOR,
    fontSize: scaleFont(11),
    marginTop: scale(-10),
    marginLeft: 0,
  },
});