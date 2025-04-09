import { Image, ScrollView, StyleSheet, Text, TextInput, View, Dimensions, TouchableOpacity } from 'react-native'
import React from 'react'
import img from '../assets/Images/img';
import Strings from '../constants/Strings';
import fonts from '../constants/fonts'
import Colors from '../constants/Colors';
import InputBox from '../Components/InputBox';
import Button from '../Components/Button';
import SocialLogin from '../Components/SocialLogin';
const { width, height } = Dimensions.get('window');
import { useNavigation } from '@react-navigation/native';

const Login = () => {
    const navigation = useNavigation();
    return (
        <View style={{ flex: 1, backgroundColor: "white" }}>
            <Image style={styles.logo} source={img.App} />
            <ScrollView style={{ bottom: 60 }}>
                <View style={{ flex: 1 }}>
                    <Image style={styles.welcome} source={img.welcome} />
                    <Text style={styles.login}>{Strings.Login}</Text>
                    <InputBox
                        placeholder="Email/Username"
                        style={styles.input}
                        inputContainer1={styles.inputContainer}
                        icon={img.mail}
                    />
                    <InputBox
                        placeholder="Password"
                        style={styles.input}
                        inputContainer1={styles.inputContainer}
                        icon={img.lock}
                    />
                </View>
                <Button title={Strings.Login} onPress={() => alert('Login pressed')} style={styles.button} />
                <TouchableOpacity style={styles.forgotPass}>
                    <Text >
                        {Strings.forgot_Pass}
                    </Text>
                </TouchableOpacity>
                <View style={styles.no_acc}>
                    <Text style={styles.singup_Free}>
                        {Strings.no_acc}
                    </Text>
                    <TouchableOpacity onPress={() => { navigation.navigate("SignUp") }}>
                        <Text style={[styles.singup_Free, { color: Colors.pink, }]}>
                            {Strings.singup_Free}
                        </Text>
                    </TouchableOpacity>
                </View>
                <SocialLogin />
            </ScrollView>

        </View>
    )
}

export default Login;

const styles = StyleSheet.create({
    logo: {
        justifyContent: "center",
        alignSelf: "center",
        resizeMode: "contain",
        width: width * 0.9,
        height: height * 0.4,
    },
    login: {
        alignSelf: "center",
        // fontFamily: fonts.Balboo2,
        lineHeight: height * 0.08,
        fontSize: 30,
        fontWeight: '600',
        color: Colors.Black,
    },
    welcome: {
        resizeMode: "contain",
        width: width * 0.5,
        height: height * 0.06,
        alignSelf: "flex-end",
        transform: [{ rotate: '-20deg' }]
    },
    email: {
        borderWidth: 2,
        borderRadius: 10,
        width: width * 0.8,
        alignSelf: "center",
        borderColor: Colors.lightGray1
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.lightGray1,
        width: width * 0.8,
    },
    inputContainer: {
        width: width * 0.9,
        alignSelf: "center",
    },
    button: {
        backgroundColor: '#ff9eb5',
        paddingVertical: 16,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 40,
        marginTop: 20,
    },
    forgotPass: {
        alignSelf: "flex-end",
        padding: 16,
        marginRight: 24
    },
    no_acc: {
        flexDirection: "row",
        justifyContent: "center",
        top: 10
    },
    singup_Free: {
        fontSize: 16
    }
})
