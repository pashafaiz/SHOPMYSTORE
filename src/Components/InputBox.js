import { View, TextInput, StyleSheet, Image } from 'react-native';
import React from 'react'
import Colors from '../constants/Colors';

const InputBox = ({ placeholder, icon, style, inputContainer1 }) => {
    return (
        <View style={[styles.inputContainer, inputContainer1]}>
            <View style={styles.iconWrapper}>
                <Image source={icon} style={styles.icon} />
            </View>
            <TextInput
                style={style}
                placeholder={placeholder}
                placeholderTextColor="#9e9e9e"
            />
        </View>
    )
}

export default InputBox

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.White,
        borderWidth: 1,
        borderColor: Colors.lightPurple,
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 10,
        paddingVertical: 10,
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
        borderColor: Colors.lightPurple
    },
    icon: {
        width: 20,
        height: 20,
        tintColor: Colors.pink
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: Colors.lightGray1,
    },
});


