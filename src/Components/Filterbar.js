import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import Colors from '../constants/Colors';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { height: screenHeight } = Dimensions.get('window');
const { width } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = (size) => size * scaleFactor;

const Filterbar = ({ 
  title, 
  options, 
  selectedOption, 
  onOptionSelect,
  clearOption = () => {},
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [buttonLayout, setButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const buttonRef = useRef(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const positionAnim = useRef(new Animated.Value(10)).current;

  const openModal = () => {
    buttonRef.current.measure((fx, fy, width, height, px, py) => {
      setButtonLayout({ x: px, y: py, width, height });
      setModalVisible(true);
    });
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(positionAnim, {
        toValue: 10,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => setModalVisible(false));
  };

  useEffect(() => {
    if (modalVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(positionAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ]).start();
    }
  }, [modalVisible]);

  const getModalPosition = () => {
    const modalHeight = options?.length * scale(40) + scale(20);
    const spaceBelow = screenHeight - buttonLayout.y - buttonLayout.height;
    
    return {
      top: spaceBelow > modalHeight 
        ? buttonLayout.y + buttonLayout.height + scale(5)
        : buttonLayout.y - modalHeight - scale(5),
      left: buttonLayout.x,
      width: buttonLayout.width,
    };
  };

  const handleOptionPress = (option) => {
    if (selectedOption === option) {
      clearOption();
    } else {
      onOptionSelect(option);
    }
    closeModal();
  };

  return (
    <View style={[styles.container, style]} ref={buttonRef} collapsable={false}>
      <TouchableOpacity
        onPress={openModal}
        style={[
          styles.button,
          selectedOption && styles.buttonActive,
        ]}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>
          {selectedOption || title}
        </Text>
        <Icon 
          name={modalVisible ? 'arrow-drop-up' : 'arrow-drop-down'} 
          size={scale(20)} 
          color={Colors.White} 
        />
      </TouchableOpacity>

      <Modal
        transparent
        visible={modalVisible}
        animationType="none"
        onRequestClose={closeModal}
      >
        <TouchableOpacity 
          style={styles.overlay} 
          onPress={closeModal} 
          activeOpacity={1}
        >
          <Animated.View
            style={[
              styles.modal,
              getModalPosition(),
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateY: positionAnim },
                ],
              },
            ]}
          >
            {options?.map((option, index) => {
              const optionValue = option.value || option;
              const optionLabel = option.label || option;
              return (
                <TouchableOpacity
                  key={optionValue}
                  style={[
                    styles.option,
                    selectedOption === optionValue && styles.optionSelected,
                  ]}
                  onPress={() => handleOptionPress(optionValue)}
                >
                  <Text style={styles.optionText}>{optionLabel}</Text>
                  {selectedOption === optionValue && (
                    <Icon name="check" size={scale(16)} color={Colors.purple} />
                  )}
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      marginRight: scale(10),
      zIndex: 100,
    },
    button: {
      backgroundColor: '#0A0A1E',
      borderRadius: scale(20),
      paddingHorizontal: scale(15),
      paddingVertical: scale(8),
      borderWidth: 1,
      borderColor: 'rgba(123, 97, 255, 0.7)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minWidth: scale(100),
    },
    buttonActive: {
      backgroundColor: 'rgba(123, 97, 255, 0.7)',
      borderColor: Colors.purple,
    },
    buttonText: {
      fontSize: scale(8),
      color: Colors.White,
      fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
      marginRight: scale(5),
      fontWeight: '500',
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(45, 40, 66, 0.8)',
    },
    modal: {
      position: 'absolute',
      backgroundColor: '#2E1A5C',
      borderRadius: scale(10),
      paddingVertical: scale(5),
      minWidth: scale(120),
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      borderWidth: 1,
      borderColor: 'rgba(123, 97, 255, 0.7)',
    },
    option: {
      paddingVertical: scale(10),
      paddingHorizontal: scale(15),
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    optionSelected: {
      backgroundColor: 'rgba(123, 97, 255, 0.3)',
    },
    optionText: {
      fontSize: scale(14),
      color: Colors.White,
      fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
      fontWeight: '500',
    },
  });
export default Filterbar;