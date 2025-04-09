import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import img from '../assets/Images/img';

const SearchInput = () => {
    const [text, setText] = useState('');

    const handleClear = () => {
        setText('');
    };

    return (
        <View style={styles.container}>
            {text.length > 0 && (
                <TouchableOpacity onPress={handleClear} style={styles.backIcon}>
                    <Image style={styles.icon} source={img.back_Icon} />
                </TouchableOpacity>
            )}
            <TextInput
                style={styles.input}
                placeholder="SEARCH HERE"
                value={text}
                onChangeText={setText}
                placeholderTextColor="#666"
            />
        </View>
    );
};

export default SearchInput;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#f1f1f1',
        borderRadius: 12,
        paddingHorizontal: 10,
        alignItems: 'center',
        margin: 20,
        height: 50,
    },
    icon: {
        resizeMode: "contain",
        width: "40%",
        height: "38%"
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
});
