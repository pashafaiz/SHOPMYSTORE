import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import img from '../assets/Images/img';
import Colors from '../constants/Colors';
import Strings from '../constants/Strings';

const { width } = Dimensions.get('window');

const SocialLogin = () => {
    return (
        <View style={styles.container}>
            <View style={styles.dividerContainer}>
                <View style={styles.line} />
                <Text style={styles.orText}>Or</Text>
                <View style={styles.line} />
            </View>
            <View>

                <TouchableOpacity style={styles.socialButton}>
                    <Image
                        source={img.google}
                        style={styles.icon}
                    />
                    <Text style={styles.buttonText}>{Strings.login_google}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialButton}>
                    <Image
                        source={img.facebook}
                        style={styles.icon}
                    />
                    <Text style={styles.buttonText}>{Strings.login_facebook}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default SocialLogin;

const styles = StyleSheet.create({
    container: {
        marginTop: 40,
        width: width * 0.7,
        alignSelf: 'center',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        alignSelf: "center"
    },
    line: {
        height: 2,
        backgroundColor: Colors.lightGray,
        width: 50,

    },
    orText: {
        marginHorizontal: 10,
        color: '#999',
        fontSize: 14,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.White,
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.lightGray,
        marginBottom: 20,
        shadowColor: Colors.Black,
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
        elevation: 1,
        justifyContent: "space-evenly"
    },
    icon: {
        width: 24,
        height: 24,
        resizeMode: 'contain',
        marginRight: 10,
    },
    buttonText: {
        fontSize: 16,
        color: Colors.lightGray1,
    },
});

