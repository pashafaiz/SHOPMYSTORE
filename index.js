import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { enableScreens } from 'react-native-screens';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background:', remoteMessage);
  try {
    await AsyncStorage.setItem('pendingNotification', JSON.stringify(remoteMessage));
    console.log('Stored pending notification:', remoteMessage);
  } catch (error) {
    console.error('Error storing pending notification:', error);
  }
});

enableScreens();

AppRegistry.registerComponent(appName, () => App);