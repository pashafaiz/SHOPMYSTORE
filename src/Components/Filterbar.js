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
import Icon from 'react-native-vector-icons/MaterialIcons';

// Theme colors aligned with CategoryProducts
const PRODUCT_BG_COLOR = '#f5f9ff';
const PRIMARY_THEME_COLOR = '#5b9cff';
const SECONDARY_THEME_COLOR = '#ff6b8a';
const TEXT_THEME_COLOR = '#1a2b4a';
const SUBTEXT_THEME_COLOR = '#5a6b8a';
const BORDER_THEME_COLOR = 'rgba(91, 156, 255, 0.3)';

const { height: screenHeight } = Dimensions.get('window');
const { width } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, Dimensions.get('window').height) / 375));

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

  const openModal = () => {
    if (buttonRef.current) {
      buttonRef.current.measure((fx, fy, width, height, px, py) => {
        setButtonLayout({ x: px, y: py, width, height });
        setModalVisible(true);
      });
    }
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
    ]).start(() => setModalVisible(false));
  };

  useEffect(() => {
    if (modalVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
      ]).start();
    }
  }, [modalVisible]);

  const getModalPosition = () => {
    const modalHeight = (options?.length || 1) * scale(45) + scale(20);
    const spaceBelow = screenHeight - buttonLayout.y - buttonLayout.height;

    return {
      top: spaceBelow > modalHeight
        ? buttonLayout.y + buttonLayout.height + scale(5)
        : buttonLayout.y - modalHeight - scale(5),
      left: Math.max(scale(10), buttonLayout.x),
      width: Math.max(buttonLayout.width, scale(160)),
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
        <View style={styles.buttonContent}>
          <Text style={styles.buttonText}>
            {selectedOption ? options.find(opt => opt.value === selectedOption)?.label || title : title}
          </Text>
          <Icon
            name={modalVisible ? 'arrow-drop-up' : 'arrow-drop-down'}
            size={scale(18)}
            color={selectedOption ? PRIMARY_THEME_COLOR : SUBTEXT_THEME_COLOR}
          />
        </View>
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
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.modalContent}>
              {options?.map((option, index) => {
                const optionValue = option.value || option;
                const optionLabel = option.label || option;
                return (
                  <TouchableOpacity
                    key={optionValue}
                    style={[
                      styles.option,
                      selectedOption === optionValue && styles.optionSelected,
                      index === options.length - 1 && styles.optionLast,
                    ]}
                    onPress={() => handleOptionPress(optionValue)}
                    activeOpacity={0.6}
                  >
                    <Text style={[
                      styles.optionText,
                      selectedOption === optionValue && styles.optionTextSelected
                    ]}>
                      {optionLabel}
                    </Text>
                    {selectedOption === optionValue && (
                      <Icon name="check" size={scale(16)} color={PRIMARY_THEME_COLOR} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: scale(8),
    marginBottom: scale(8),
  },
  button: {
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonActive: {
    borderColor: PRIMARY_THEME_COLOR,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonText: {
    fontSize: scaleFont(13),
    color: TEXT_THEME_COLOR,
    fontWeight: '500',
    marginRight: scale(4),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    position: 'absolute',
    borderRadius: scale(12),
    overflow: 'hidden',
    backgroundColor: PRODUCT_BG_COLOR,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalContent: {
    paddingVertical: scale(5),
  },
  option: {
    paddingVertical: scale(10),
    paddingHorizontal: scale(15),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: BORDER_THEME_COLOR,
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionSelected: {
    backgroundColor: 'rgba(91, 156, 255, 0.1)',
  },
  optionText: {
    fontSize: scaleFont(14),
    color: TEXT_THEME_COLOR,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  optionTextSelected: {
    color: PRIMARY_THEME_COLOR,
    fontWeight: '600',
  },
});

export default Filterbar;