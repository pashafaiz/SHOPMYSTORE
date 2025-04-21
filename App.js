


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
