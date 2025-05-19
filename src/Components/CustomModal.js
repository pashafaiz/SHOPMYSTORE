import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { CATEGORY_BG_COLOR } from '../constants/GlobalConstants';

// Theme constants
const PRODUCT_BG_COLOR = '#f5f9ff';
const PRIMARY_THEME_COLOR = '#5b9cff';
const SECONDARY_THEME_COLOR = '#ff6b8a';
const TEXT_THEME_COLOR = '#1a2b4a';
const SUBTEXT_THEME_COLOR = '#5a6b8a';
const BORDER_THEME_COLOR = 'rgba(91, 156, 255, 0.3)';
const BACKGROUND_GRADIENT = ['#8ec5fc', '#fff'];

const { width } = Dimensions.get('window');
const scaleSize = (size) => Math.round(size * (width / 375));
const scaleFont = (size) => Math.round(size * (Math.min(width, Dimensions.get('window').height) / 375));

const CustomModal = ({
  visible,
  onRequestClose,
  title,
  children,
  buttons = [],
  containerStyle = {},
  overlayStyle = {},
  titleStyle = {},
  dismissOnOverlayPress = true,
}) => {
  const scaleValue = useSharedValue(0.95);
  const opacityValue = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scaleValue.value) }],
    opacity: opacityValue.value,
  }));

  React.useEffect(() => {
    if (visible) {
      scaleValue.value = 1;
      opacityValue.value = 1;
    }
  }, [visible, scaleValue, opacityValue]);

  const handleOverlayPress = () => {
    if (dismissOnOverlayPress && onRequestClose) {
      onRequestClose();
    }
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onRequestClose}>
      <TouchableWithoutFeedback onPress={handleOverlayPress}>
        <View style={[styles.overlay, overlayStyle]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <SafeAreaView>
              <Animated.View style={[animatedStyle, { alignSelf: 'center' }]}>
                <LinearGradient
                  colors={BACKGROUND_GRADIENT}
                  style={[styles.container, containerStyle]}
                >
                  <ScrollView
                    contentContainerStyle={{ alignItems: 'center' }}
                    keyboardShouldPersistTaps="handled"
                  >
                    {title && (
                      <Text style={[styles.title, titleStyle]}>{title}</Text>
                    )}
                    {children}
                    <View
                      style={[
                        styles.buttonRow,
                        buttons.length === 1 && { justifyContent: 'center' },
                      ]}
                    >
                      {buttons.map((btn, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={btn.onPress}
                          style={[styles.button, btn.style]}
                        >
                          <View
                            style={styles.buttonGradient}
                          >
                            <Text style={[styles.buttonText, btn.textStyle]}>
                              {btn.text}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </LinearGradient>
              </Animated.View>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: scaleSize(20),
    width: width * 0.8,
    borderRadius: scaleSize(15),
    alignItems: 'center',
    backgroundColor: PRODUCT_BG_COLOR,
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleSize(5) },
    shadowOpacity: 0.2,
    shadowRadius: scaleSize(10),
  },
  title: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    marginBottom: scaleSize(15),
    textAlign: 'center',
    color: TEXT_THEME_COLOR,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: scaleSize(15),
    width: '100%',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: scaleSize(5),
    borderRadius: scaleSize(8),
    overflow: 'hidden',
  },
  buttonGradient: {
    // padding: scaleSize(12),
    alignItems: 'center',
  },
  buttonText: {
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
});

export default CustomModal;