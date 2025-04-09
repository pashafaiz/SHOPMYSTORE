import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Dimensions,
    UIManager,
    findNodeHandle,
} from 'react-native';
import Colors from '../constants/Colors';

const { height: screenHeight } = Dimensions.get('window');

const Filterbar = ({ title, isVisible, onToggle, options, selectedOption, onOptionSelect }) => {
    const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0, height: 0 });
    const [modalVisible, setModalVisible] = useState(false);
    const [modalHeight, setModalHeight] = useState(0);
    const buttonRef = useRef(null);

    const openModal = () => {
        const handle = findNodeHandle(buttonRef.current);
        if (handle) {
            UIManager.measure(handle, (fx, fy, width, height, px, py) => {
                setButtonPosition({ x: px, y: py, height });
                setModalVisible(true);
                onToggle();
            });
        }
    };

    const closeModal = () => {
        setModalVisible(false);
        onToggle();
    };

    const getModalTop = () => {
        const belowSpace = screenHeight - (buttonPosition.y + buttonPosition.height);
        const aboveSpace = buttonPosition.y;

        if (belowSpace >= modalHeight) {
            return buttonPosition.y + buttonPosition.height;
        }

        if (aboveSpace >= modalHeight) {
            return buttonPosition.y - modalHeight;
        }

        return belowSpace >= aboveSpace
            ? Math.min(screenHeight - modalHeight - 10, buttonPosition.y + buttonPosition.height)
            : Math.max(10, buttonPosition.y - modalHeight);
    };

    return (
        <View>
            <TouchableOpacity
                onPress={openModal}
                ref={buttonRef}
                style={styles.button}
                activeOpacity={0.7}
            >
                <Text style={styles.buttonText}>{selectedOption || title} ⌄</Text>
            </TouchableOpacity>

            <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={closeModal}>
                <TouchableOpacity style={styles.overlay} onPress={closeModal} activeOpacity={1}>
                    <View
                        style={[
                            styles.modal,
                            {
                                position: 'absolute',
                                top: getModalTop(),
                                left: buttonPosition.x,
                            },
                        ]}
                        onLayout={(e) => setModalHeight(e.nativeEvent.layout.height)}
                    >
                        {options.map((opt, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={styles.option}
                                onPress={() => {
                                    onOptionSelect(opt);
                                    closeModal();
                                }}
                            >
                                <Text style={styles.optionText}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

export default Filterbar;

const styles = StyleSheet.create({
    button: {
        backgroundColor: Colors.lightGray,
        borderRadius: 25,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 2,
        borderColor: Colors.lightPurple,
        marginRight: 15,
    },
    buttonText: {
        fontSize: 12,
        color: Colors.lightGray1,
        textAlign: 'center',
    },
    overlay: {
        flex: 1,
    },
    modal: {
        backgroundColor: Colors.White,
        padding: 10,
        borderRadius: 8,
        minWidth: 10,
        elevation: 5,
        zIndex: 999,
        marginLeft: 10
    },
    option: {
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    optionText: {
        fontSize: 16,
        color: Colors.lightGray1,
    },
});
