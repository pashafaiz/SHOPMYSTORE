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
  dismissOnOverlayPress = false,
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
              <Animated.View style={animatedStyle}>
                <LinearGradient
                  colors={['#2A2A5A', '#3A3A7A']}
                  style={[styles.container, containerStyle]}
                >
                  <ScrollView
                    contentContainerStyle={{ alignItems: 'center' }}
                    keyboardShouldPersistTaps="handled"
                  >
                    {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
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
                          <Text style={[styles.buttonText, btn.textStyle]}>{btn.text}</Text>
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

export default CustomModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: scaleSize(25),
    width: width * 0.8,
    borderRadius: scaleSize(20),
    alignItems: 'center',
  },
  title: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    marginBottom: scaleSize(20),
    textAlign: 'center',
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: scaleSize(20),
    width: '100%',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: scaleSize(12),
    alignItems: 'center',
    marginHorizontal: scaleSize(5),
    borderRadius: scaleSize(10),
    backgroundColor: '#ddd',
  },
  buttonText: {
    fontSize: scaleFont(16),
    color: '#FFFFFF',
  },
});