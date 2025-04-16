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

const { width } = Dimensions.get('window');

const CustomModal = ({
  visible,
  onRequestClose,
  title,
  children,
  buttons = [],
  containerStyle = {},
  overlayStyle = {},
  titleStyle = {},
  dismissOnOverlayPress = false, // ✅ New prop
}) => {
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
              <ScrollView
                contentContainerStyle={[styles.container, containerStyle]}
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
    backgroundColor: 'white',
    padding: 25,
    width: width * 0.8,
    borderRadius: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    width: '100%',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#ddd',
  },
  buttonText: {
    fontSize: 16,
  },
});
