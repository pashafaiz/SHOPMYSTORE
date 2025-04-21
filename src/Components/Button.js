// import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// import React from 'react';

// const Button = ({ title = "Login", onPress, style,textStyle }) => {
//     return (
//         <TouchableOpacity style={style} onPress={onPress}>
//             <Text style={[styles.buttonText,textStyle]}>{title}</Text>
//         </TouchableOpacity>
//     );
// };

// export default Button;

// const styles = StyleSheet.create({

//     buttonText: {
//         color: '#fff',
//         fontSize: 18,
//         fontWeight: '600',
//     },
// });


import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';

const Button = ({ title, onPress, style, textStyle, icon }) => {
  return (
    <TouchableOpacity style={style} onPress={onPress}>
      <View style={styles.content}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text style={[styles.buttonText, textStyle]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default Button;

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8, // space between icon and text
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
