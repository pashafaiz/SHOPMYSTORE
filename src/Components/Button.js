import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';

const Button = ({ title = "Login", onPress, style }) => {
    return (
        <TouchableOpacity style={style} onPress={onPress}>
            <Text style={styles.buttonText}>{title}</Text>
        </TouchableOpacity>
    );
};

export default Button;

const styles = StyleSheet.create({

    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});
