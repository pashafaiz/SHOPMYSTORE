import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import InputBox from '../Contructor/InputBox';
import Strings from '../constants/Strings';
import Colors from '../constants/Colors';
import img from '../assets/Images/img';
const { width, height } = Dimensions.get('window');
import { useNavigation } from '@react-navigation/native';
import SocialLogin from '../Contructor/SocialLogin';
import Button from '../Contructor/Button';


const SignUp = () => {
    const navigation = useNavigation();
    const [isChecked, setChecked] = useState(false);



    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Image style={styles.logo} source={img.App} />
            <Text style={styles.title}>{Strings.signUp}</Text>

            <InputBox placeholder={"FullName"} style={styles.input} icon={img.user} />
            <InputBox placeholder={"UserName"} style={styles.input} icon={img.user} />
            <InputBox placeholder={"Email"} style={styles.input} icon={img.mail} />
            <InputBox placeholder={"Password"} style={styles.input} icon={img.lock} />
            <InputBox placeholder={"confirmPassword"} style={styles.input} icon={img.lock} />

            <View style={styles.row}>
                <TouchableOpacity onPress={() => setChecked(!isChecked)}>
                    <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                        {isChecked && (
                            <Text>✓</Text>
                        )}
                    </View>
                </TouchableOpacity>

                <Text style={styles.text}>
                    I Accept <Text style={styles.link}>{Strings.terms_Condition}</Text>
                </Text>
            </View>

            <Button title={Strings.signUp} onPress={() => alert('Signup pressed')} style={styles.button} />
            <SocialLogin />

            <View style={styles.no_acc}>
                <Text style={styles.singup_Free}>
                    {Strings.already_acc}
                </Text>
                <TouchableOpacity onPress={() => { navigation.navigate("Login") }}>
                    <Text style={[styles.singup_Free, { color: Colors.pink, }]}>
                        {Strings.Login}
                    </Text>
                </TouchableOpacity>
            </View>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 40,
        paddingHorizontal: 25,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    logo: {
        justifyContent: "center",
        alignSelf: "center",
        resizeMode: "contain",
        width: width * 0.8,
        height: height * 0.3,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 25,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#eee',
        borderWidth: 1,
        borderRadius: 12,
        padding: 10,
        marginVertical: 6,
        width: '100%',
        backgroundColor: '#fafafa',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.lightGray1,
        width: width * 0.8,
    },
    link: {
        color: '#f89db2',
        fontWeight: 'bold',
    },
    login: {
        marginTop: 15,
        fontSize: 13,
        color: '#444',
    },
    no_acc: {
        flexDirection: "row",
        justifyContent: "center",
        top: 10
    },
    singup_Free: {
        fontSize: 16
    },
    button: {
        backgroundColor: '#ff9eb5',
        paddingVertical: 16,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 40,
        marginTop: 20,
        width: width * 0.8,
    },
    row: {
        width: '100%',
        flexDirection: 'row',
        alignItems: "center"
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 2,
        borderColor: Colors.lightGray
    },
    checkboxChecked: {
        backgroundColor: '#f89db2',
    },
});

export default SignUp;
