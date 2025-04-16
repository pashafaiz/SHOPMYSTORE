// import React, { Component } from 'react';
// import { View, StyleSheet, StatusBar, SafeAreaView, Platform, LogBox, ActivityIndicator } from 'react-native';
// import Navigator from './src/Navigation/Navigator'; // yeh login/signup screens ke liye
// import { NavigationContainer } from '@react-navigation/native';

// export default class App extends Component {

//   render() {
//     // const { isLoading, isLoggedIn } = this.state;

//     // if (isLoading) {
//     //   return (
//     //     <View style={styles.loaderContainer}>
//     //       <ActivityIndicator size="large" color="tomato" />
//     //     </View>
//     //   );
//     // }

//     return (
//         <View style={{ flex: 1, backgroundColor: 'white' }}>
//           <StatusBar barStyle="dark-content" translucent={false} />
//           <SafeAreaView style={styles.container}>
//           <NavigationContainer> 
//              <Navigator/>
//           </NavigationContainer>
//           </SafeAreaView>
//         </View>
//     );
//   }
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
//   },
//   loaderContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

// import React, { useEffect, useState } from 'react';
// import { View, StyleSheet, StatusBar, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
// import Navigator from './src/Navigation/Navigator';
// import { NavigationContainer } from '@react-navigation/native';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const App = () => {
//   const [initialRoute, setInitialRoute] = useState(null);

//   useEffect(() => {
//     const checkLoginStatus = async () => {
//       try {
//         const token = await AsyncStorage.getItem('userToken');
//         if (token) {
//           setInitialRoute('BottomTabs');
//         } else {
//           setInitialRoute('Login');
//         }
//       } catch (err) {
//         console.log('Error reading token:', err);
//         setInitialRoute('Login');
//       }
//     };

//     checkLoginStatus();
//   }, []);

//   if (!initialRoute) {
//     return (
//       <View style={styles.loaderContainer}>
//         <ActivityIndicator size="large" color="tomato" />
//       </View>
//     );
//   }

//   return (
//     <View style={{ flex: 1, backgroundColor: 'white' }}>
//       <StatusBar barStyle="dark-content" translucent={false} />
//       <SafeAreaView style={styles.container}>
//         <NavigationContainer>
//           <Navigator initialRoute={initialRoute} />
//         </NavigationContainer>
//       </SafeAreaView>
//     </View>
//   );
// };

// export default App;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
//   },
//   loaderContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });




import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, SafeAreaView, Platform, ActivityIndicator, LogBox } from 'react-native';
import Navigator from './src/Navigation/Navigator';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

export default function App() {
  LogBox.ignoreAllLogs(true);
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          setInitialRoute('BottomTabs');
        } else {
          setInitialRoute('Login');
        }
      } catch (e) {
        console.log('Error reading token', e);
        setInitialRoute('Login');
      }
    };

    checkToken();
  }, []);

  if (!initialRoute) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="tomato" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar barStyle="dark-content" translucent={false} />
      <SafeAreaView style={styles.container}>
        <NavigationContainer>
          <Navigator initialRouteName={initialRoute} />
        </NavigationContainer>
        <Toast />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
