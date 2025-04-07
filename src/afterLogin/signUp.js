import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import img from '../assets/Images/img';
import Strings from '../constants/Strings';
import fonts from '../constants/fonts'
import Colors from '../constants/Colors';

const signUp = () => {
    return (
        <ScrollView style={{ flex: 1, backgroundColor: "white" }}>
            {/* <ScrollView> */}

            <Image style={styles.logo} source={img.App} />
            <View style={{}}>
                <Image style={styles.welcome} source={img.welcome} />
                <Text style={styles.login}>{Strings.Login}</Text>
            </View>
            {/* </ScrollView> */}

        </ScrollView>
    )
}

export default signUp;

const styles = StyleSheet.create({
    logo: {
        justifyContent: "center",
        alignSelf: "center",
        resizeMode: "contain",
        width: "100%",
        height: "100%",
    },
    login: {
        alignSelf: "center",
        // fontFamily: fonts.Balboo2,
        lineHeight: 137,
        fontSize: 30,
        fontWeight: 600,
        color: Colors.Black,
    },
    welcome: {
        resizeMode: "contain",
        width: "40%",
        height: "20%",
        alignSelf: "flex-end",
        // marginRight: 30,
        // bottom: 80,
        transform: [{ rotate: '-20deg' }]
    }
});
