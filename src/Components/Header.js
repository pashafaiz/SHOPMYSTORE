// import { Dimensions, Image, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
// import React from 'react';
// import img from '../assets/Images/img';
// import Colors from '../constants/Colors';

// const { width } = Dimensions.get('window');

// const Header = ({
//     title = '',
//     showLeftIcon = false,
//     leftIcon,
//     onLeftPress,
//     showRightIcon1 = false,
//     rightIcon1,
//     onRightPress1,
//     showRightIcon2 = false,
//     rightIcon2,
//     onRightPress2,
// }) => {
//     return (
//         <View style={styles.header}>
//             <View style={styles.headerContent}>


//                 <View style={styles.left}>
//                     {showLeftIcon && leftIcon && (
//                         <TouchableOpacity onPress={onLeftPress} style={styles.leftIconWrapper}>
//                             <Image source={leftIcon} style={styles.leftIcon} />
//                         </TouchableOpacity>
//                     )}
//                 </View>

//                 {/* Title */}
//                 <View style={styles.center}>
//                     <Text style={styles.title}>{title}</Text>
//                 </View>

//                 {/* Right Icons */}
//                 <View style={styles.right}>
//                     {showRightIcon1 && rightIcon1 && (
//                         <TouchableOpacity onPress={onRightPress1}>
//                             <Image source={rightIcon1} style={styles.rightIcon} />
//                         </TouchableOpacity>
//                     )}
//                     {showRightIcon2 && rightIcon2 && (
//                         <TouchableOpacity onPress={onRightPress2}>
//                             <Image source={rightIcon2} style={styles.rightIcon} />
//                         </TouchableOpacity>
//                     )}
//                 </View>

//             </View>
//         </View>
//     );
// };

// export default Header;

// const styles = StyleSheet.create({
//     header: {
//         width: '100%',
//         paddingVertical: 15,
//         backgroundColor: Colors.LightPink,
//     },
//     headerContent: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingHorizontal: 15,
//     },
//     left: {
//         flex: 1,
//     },
//     center: {
//         flex: 2,
//         alignItems: 'center',
//     },
//     right: {
//         flex: 1,
//         flexDirection: 'row',
//         justifyContent: 'flex-end',
//     },
//     leftIconWrapper: {
//         backgroundColor: Colors.pink,
//         borderRadius: 20,
//         padding: 8,
//         alignSelf: 'flex-start',
//     },
//     leftIcon: {
//         width: 20,
//         height: 20,
//         resizeMode: 'contain',
//         tintColor: Colors.White,
//     },
//     title: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: Colors.lightGray1,
//     },
//     rightIcon: {
//         width: 20,
//         height: 20,
//         marginLeft: 15,
//         resizeMode: 'contain',
//         tintColor: Colors.lightGray1,
//     },
// });




import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput
} from 'react-native';
import img from '../assets/Images/img';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

const Header = ({
    title = '',
    isSearch = false,
    searchValue = '',
    onSearchChange = () => { },
    searchPlaceholder = 'Search Here',
    showLeftIcon = false,
    leftIcon,
    onLeftPress,
    showRightIcon1 = false,
    rightIcon1,
    onRightPress1,
    showRightIcon2 = false,
    rightIcon2,
    onRightPress2,
}) => {
    return (
        <View style={styles.header}>
            <View style={styles.headerContent}>
                <View style={styles.left}>
                    {showLeftIcon && leftIcon && (
                        <TouchableOpacity onPress={onLeftPress} style={styles.leftIconWrapper}>
                            <Image source={leftIcon} style={styles.leftIcon} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.center}>
                    {isSearch ? (
                        <View style={styles.searchBox}>
                            <TextInput
                                value={searchValue}
                                onChangeText={onSearchChange}
                                placeholder={searchPlaceholder}
                                style={styles.searchInput}
                                placeholderTextColor="#666"
                            />
                            <Image source={img.search} style={styles.searchIcon} />
                        </View>
                    ) : (
                        <Text style={styles.title}>{title}</Text>
                    )}
                </View>

                {/* Right Icons */}
                <View style={styles.right}>
                    {showRightIcon1 && rightIcon1 && (
                        <TouchableOpacity onPress={onRightPress1}>
                            <Image source={rightIcon1} style={styles.rightIcon} />
                        </TouchableOpacity>
                    )}
                    {showRightIcon2 && rightIcon2 && (
                        <TouchableOpacity onPress={onRightPress2}>
                            <Image source={rightIcon2} style={styles.rightIcon} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

export default Header;

const styles = StyleSheet.create({
    header: {
        width: '100%',
        paddingVertical: 10,
        backgroundColor: Colors.lightPurple,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
    },
    left: {
        flex: 1,
    },
    center: {
        flex: 3,
        alignItems: 'center',
    },
    right: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    leftIconWrapper: {
        backgroundColor: Colors.pink,
        borderRadius: 25,
        padding: 10,
        alignSelf: 'flex-start',
    },
    leftIcon: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
        tintColor: Colors.White,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.lightGray1,
    },
    rightIcon: {
        width: 20,
        height: 20,
        marginLeft: 15,
        resizeMode: 'contain',
        tintColor: Colors.lightGray1,
    },
    searchBox: {
        backgroundColor: '#f1f1f1',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        width: width * 0.6,
        height: 40,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    searchIcon: {
        width: 18,
        height: 18,
        tintColor: '#000',
        resizeMode: 'contain',
    },
});
