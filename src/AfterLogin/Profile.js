// import React, {useState, useEffect, useCallback} from 'react';
// import {
//   View,
//   Text,
//   Image,
//   TextInput,
//   StyleSheet,
//   Dimensions,
//   TouchableOpacity,
//   Pressable,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import {useFocusEffect} from '@react-navigation/native';
// import {launchCamera, launchImageLibrary} from 'react-native-image-picker';

// import Colors from '../constants/Colors';
// import img from '../assets/Images/img';
// import Header from '../Components/Header';
// import CustomModal from '../Components/CustomModal';
// import Button from '../Components/Button';
// import Loader from '../Components/Loader';
// import {editProfileApi} from '../../apiClient';

// const {width, height} = Dimensions.get('window');

// const Profile = ({navigation}) => {
//   const [user, setUser] = useState(null);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [editModalVisible, setEditModalVisible] = useState(false);
//   const [imageModalVisible, setImageModalVisible] = useState(false);
//   const [previewModalVisible, setPreviewModalVisible] = useState(false);

//   const [fullName, setFullName] = useState('');
//   const [userName, setUserName] = useState('');
//   const [profileImage, setProfileImage] = useState(null);

//   const [loading, setLoading] = useState(false);
//   const [successMessage, setSuccessMessage] = useState('');
//   const [errorMessage, setErrorMessage] = useState('');

//   const getUser = async () => {
//     const storedUser = await AsyncStorage.getItem('user');
//     if (storedUser) {
//       const parsedUser = JSON.parse(storedUser);
//       setUser(parsedUser);
//       setFullName(parsedUser.fullName || '');
//       setUserName(parsedUser.userName || '');
//       setProfileImage(parsedUser.profileImage || null);
//     }
//   };

//   useFocusEffect(
//     useCallback(() => {
//       getUser();
//     }, []),
//   );

//   const handleLogout = async () => {
//     await AsyncStorage.removeItem('user');
//     await AsyncStorage.removeItem('userToken');
//     setModalVisible(false);
//     navigation.reset({index: 0, routes: [{name: 'Login'}]});
//   };

//   const handleUpdateProfile = async () => {
//     try {
//       setLoading(true);
//       setEditModalVisible(false);
//       setErrorMessage('');
//       setSuccessMessage('');

//       const token =
//         (await AsyncStorage.getItem('userToken')) ||
//         (await AsyncStorage.getItem('token'));

//       if (!token) {
//         setLoading(false);
//         setErrorMessage('No token found');
//         return;
//       }

//       const {ok, data} = await editProfileApi(token, fullName, userName);
//       setLoading(false);

//       if (ok) {
//         const updatedUser = {...user, fullName, userName, profileImage};
//         await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
//         setUser(updatedUser);
//         setSuccessMessage(data?.msg || 'Profile updated successfully');
//         setTimeout(() => setSuccessMessage(''), 3000);
//       } else {
//         setErrorMessage(data?.msg || data?.errors?.userName || 'Update failed');
//         setTimeout(() => setErrorMessage(''), 3000);
//       }
//     } catch (err) {
//       setLoading(false);
//       setErrorMessage('Something went wrong');
//       setTimeout(() => setErrorMessage(''), 3000);
//     }
//   };

//   const openCamera = () => {
//     launchCamera({mediaType: 'photo'}, async response => {
//       if (!response.didCancel && response.assets?.length) {
//         const uri = response.assets[0].uri;
//         setProfileImage(uri);
//         setImageModalVisible(false);

//         const updatedUser = {...user, profileImage: uri};
//         setUser(updatedUser);
//         await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
//       }
//     });
//   };

//   const openGallery = () => {
//     launchImageLibrary({mediaType: 'photo'}, async response => {
//       if (!response.didCancel && response.assets?.length) {
//         const uri = response.assets[0].uri;
//         setProfileImage(uri);
//         setImageModalVisible(false);

//         const updatedUser = {...user, profileImage: uri};
//         setUser(updatedUser);
//         await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
//       }
//     });
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.profileDesign}>
//         <Header
//           title="Profile"
//           onLeftPress={() => navigation.goBack()}
//           rightIcon1={img.setting}
//           onRightPress1={() => alert('Settings coming soon')}
//           showRightIcon1
//         />
//       </View>

//       {/* <TouchableOpacity
//         onPress={() => setImageModalVisible(true)}
//         onLongPress={() => setPreviewModalVisible(true)}
//         delayLongPress={3000}
//         activeOpacity={0.8}>
//         <View style={styles.outerBorder}>
//           <View style={styles.innerBorder}>
//             <Image
//               source={profileImage ? {uri: profileImage} : img.user}
//               style={styles.profileImage}
//             />
//           </View>
//         </View>
//       </TouchableOpacity> */}

//       <Pressable
//         onPress={() => setImageModalVisible(true)}
//         onLongPress={() => setPreviewModalVisible(true)}
//         delayLongPress={800}
//         style={styles.imagePressable}>
//         <View style={styles.outerBorder}>
//           <View style={styles.innerBorder}>
//             <Image
//               source={profileImage ? {uri: profileImage} : img.user}
//               style={styles.profileImage}
//             />
//           </View>
//         </View>
//       </Pressable>

//       <Text style={styles.name}>{user?.fullName || 'Your Name'}</Text>

//       <View style={styles.mainInput}>
//         <View style={styles.inputBox}>
//           <Text style={styles.label}>Your Email</Text>
//           <TextInput
//             style={styles.input}
//             value={user?.email || ''}
//             editable={false}
//           />
//         </View>

//         <View style={styles.inputBox}>
//           <Text style={styles.label}>Phone Number</Text>
//           <TextInput
//             style={styles.input}
//             value={user?.phoneNumber || ''}
//             editable={false}
//             keyboardType="phone-pad"
//           />
//         </View>

//         <View style={styles.inputBox}>
//           <Text style={styles.label}>Username</Text>
//           <TextInput
//             style={styles.input}
//             value={user?.userName || ''}
//             editable={false}
//           />
//         </View>
//       </View>

//       <View style={styles.buttonContainer}>
//         <Button
//           title="Edit Details"
//           onPress={() => setEditModalVisible(true)}
//           style={styles.logoutButton}
//         />
//         <Button
//           title="Logout"
//           onPress={() => setModalVisible(true)}
//           style={styles.logoutButton}
//         />
//       </View>

//       {/* Logout Modal */}
//       <CustomModal
//         visible={modalVisible}
//         onRequestClose={() => setModalVisible(false)}
//         title="Are you sure?"
//         buttons={[
//           {text: 'Cancel', onPress: () => setModalVisible(false)},
//           {
//             text: 'OK',
//             onPress: handleLogout,
//             style: {backgroundColor: Colors.pink},
//             textStyle: {color: 'white'},
//           },
//         ]}
//       />

//       {/* Edit Profile Modal */}
//       <CustomModal
//         visible={editModalVisible}
//         onRequestClose={() => setEditModalVisible(false)}
//         title="Edit Profile"
//         overlayStyle={{justifyContent: 'flex-end'}}
//         containerStyle={{
//           width,
//           padding: 30,
//           borderBottomLeftRadius: 0,
//           borderBottomRightRadius: 0,
//         }}
//         buttons={[
//           {text: 'Cancel', onPress: () => setEditModalVisible(false)},
//           {
//             text: 'Save',
//             onPress: handleUpdateProfile,
//             style: {backgroundColor: Colors.pink},
//             textStyle: {color: 'white'},
//           },
//         ]}>
//         <TextInput
//           style={[styles.input, {marginBottom: 10}]}
//           placeholder="Full Name"
//           value={fullName}
//           onChangeText={setFullName}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Username"
//           autoCapitalize="none"
//           value={userName}
//           onChangeText={setUserName}
//         />
//       </CustomModal>

//       {/* Profile Image Picker Modal */}
//       <CustomModal
//         visible={imageModalVisible}
//         onRequestClose={() => setImageModalVisible(false)}
//         title="Update Profile Picture"
//         overlayStyle={{justifyContent: 'flex-end'}}
//         containerStyle={{
//           width,
//           padding: 30,
//           borderBottomLeftRadius: 0,
//           borderBottomRightRadius: 0,
//         }}
//         buttons={[
//           {text: 'Choose from Gallery', onPress: openGallery},
//           {text: 'Open Camera', onPress: openCamera},
//           {text: 'Cancel', onPress: () => setImageModalVisible(false)},
//         ]}
//       />

//       {/* Full Preview Modal */}
//       <CustomModal
//         visible={previewModalVisible}
//         dismissOnOverlayPress={true}
//         onRequestClose={() => setPreviewModalVisible(false)}
//         overlayStyle={{
//           backgroundColor: 'rgba(67, 62, 62, 0.8)',
//           justifyContent: 'center',
//           alignItems: 'center',
//         }}
//         containerStyle={{
//           backgroundColor: 'transparent',
//           width: 200,
//           height: 200,
//           borderRadius: 100,
//           justifyContent: 'center',
//           alignItems: 'center',
//           alignSelf:"center"
//         }}
//        >
//         <Image
//           source={profileImage ? {uri: profileImage} : img.user}
//           style={{
//             width: 180,
//             height: 180,
//             borderRadius: 90,
//             borderWidth: 2,
//             borderColor: 'white',
//             backgroundColor: '#fff',
//           }}
//           resizeMode="cover"
//         />
//       </CustomModal>

//       {successMessage && (
//         <View style={[styles.toastContainer, {backgroundColor: '#d4edda'}]}>
//           <Text style={[styles.toastText, {color: '#155724'}]}>
//             {successMessage}
//           </Text>
//         </View>
//       )}
//       {errorMessage && (
//         <View style={[styles.toastContainer, {backgroundColor: '#f8d7da'}]}>
//           <Text style={[styles.toastText, {color: '#721c24'}]}>
//             {errorMessage}
//           </Text>
//         </View>
//       )}

//       <Loader visible={loading} />
//     </View>
//   );
// };

// export default Profile;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.LightPink,
//   },
//   profileDesign: {
//     height: height * 0.15,
//     backgroundColor: Colors.lightPurple,
//   },
//   outerBorder: {
//     width: 120,
//     height: 120,
//     borderRadius: 55,
//     borderWidth: 50,
//     borderColor: Colors.LightPink,
//     alignSelf: 'center',
//     justifyContent: 'center',
//     alignItems: 'center',
//     top: -40,
//   },
//   innerBorder: {
//     width: 104,
//     height: 104,
//     borderRadius: 52,
//     borderWidth: 2,
//     borderColor: 'black',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   profileImage: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     backgroundColor: '#fff',
//   },
//   imagePressable: {
//     alignSelf: 'center',
//     marginTop: -40,
//   },
//   name: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: Colors.dark,
//     textAlign: 'center',
//     marginTop: 10,
//     top: -40,
//   },
//   mainInput: {
//     paddingHorizontal: 30,
//   },
//   inputBox: {
//     marginBottom: 15,
//   },
//   label: {
//     fontSize: 12,
//     color: Colors.gray,
//     marginBottom: 4,
//     marginLeft: 5,
//   },
//   input: {
//     backgroundColor: Colors.lightPurple,
//     padding: 12,
//     borderRadius: 12,
//     fontSize: 15,
//     elevation: 2,
//   },
//   buttonContainer: {
//     marginTop: 20,
//   },
//   logoutButton: {
//     backgroundColor: '#ff9eb5',
//     paddingVertical: 16,
//     borderRadius: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginTop: 20,
//     width: width * 0.8,
//     alignSelf: 'center',
//   },
//   toastContainer: {
//     position: 'absolute',
//     bottom: 8,
//     alignSelf: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 25,
//     elevation: 5,
//     width: width * 0.8,
//   },
//   toastText: {
//     fontSize: 14,
//     fontWeight: '500',
//     textAlign: 'center',
//   },
//   previewImage: {
//     width: '100%',
//     height: height * 0.5,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//   },
// });




import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import Modal from 'react-native-modal';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import {
  GestureHandlerRootView,
  PanGestureHandler,
  PinchGestureHandler,
} from 'react-native-gesture-handler';

import Colors from '../constants/Colors';
import img from '../assets/Images/img';
import Header from '../Components/Header';
import CustomModal from '../Components/CustomModal';
import Button from '../Components/Button';
import Loader from '../Components/Loader';
import {editProfileApi} from '../../apiClient';

const {width, height} = Dimensions.get('window');

const Profile = ({navigation}) => {
  const [user, setUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [fullName, setFullName] = useState('');
  const [userName, setUserName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pinchHandler = useAnimatedGestureHandler({
    onActive: event => {
      scale.value = event.scale;
    },
    onEnd: () => {
      scale.value = withSpring(1);
      
    },
  });

  // const pinchHandler = useAnimatedGestureHandler({
  //   onActive: (event) => {
  //     scale.value = event.scale;
  //   },
  // });
  

  const panHandler = useAnimatedGestureHandler({
    onActive: event => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    },
    onEnd: () => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {scale: scale.value},
      {translateX: translateX.value},
      {translateY: translateY.value},
    ],
  }));

  const getUser = async () => {
    const storedUser = await AsyncStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setFullName(parsedUser.fullName || '');
      setUserName(parsedUser.userName || '');
      setProfileImage(parsedUser.profileImage || null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getUser();
    }, []),
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('userToken');
    setModalVisible(false);
    navigation.reset({index: 0, routes: [{name: 'Login'}]});
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      setEditModalVisible(false);
      setErrorMessage('');
      setSuccessMessage('');

      const token =
        (await AsyncStorage.getItem('userToken')) ||
        (await AsyncStorage.getItem('token'));

      if (!token) {
        setLoading(false);
        setErrorMessage('No token found');
        return;
      }

      const {ok, data} = await editProfileApi(token, fullName, userName);
      setLoading(false);

      if (ok) {
        const updatedUser = {...user, fullName, userName, profileImage};
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSuccessMessage(data?.msg || 'Profile updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data?.msg || data?.errors?.userName || 'Update failed');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage('Something went wrong');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const openCamera = () => {
    launchCamera({mediaType: 'photo'}, async response => {
      if (!response.didCancel && response.assets?.length) {
        const uri = response.assets[0].uri;
        setProfileImage(uri);
        setImageModalVisible(false);
        const updatedUser = {...user, profileImage: uri};
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }
    });
  };

  const openGallery = () => {
    launchImageLibrary({mediaType: 'photo'}, async response => {
      if (!response.didCancel && response.assets?.length) {
        const uri = response.assets[0].uri;
        setProfileImage(uri);
        setImageModalVisible(false);
        const updatedUser = {...user, profileImage: uri};
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileDesign}>
        <Header
          title="Profile"
          onLeftPress={() => navigation.goBack()}
          rightIcon1={img.setting}
          onRightPress1={() => alert('Settings coming soon')}
          showRightIcon1
        />
      </View>

      <Pressable
        onPress={() => setImageModalVisible(true)}
        onLongPress={() => setPreviewModalVisible(true)}
        delayLongPress={800}
        style={styles.imagePressable}>
        <View style={styles.outerBorder}>
          <View style={styles.innerBorder}>
            <Image
              source={profileImage ? {uri: profileImage} : img.user}
              style={styles.profileImage}
            />
          </View>
        </View>
      </Pressable>

      <Text style={styles.name}>{user?.fullName || 'Your Name'}</Text>

      <View style={styles.mainInput}>
        <View style={styles.inputBox}>
          <Text style={styles.label}>Your Email</Text>
          <TextInput style={styles.input} value={user?.email || ''} editable={false} />
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={user?.phoneNumber || ''}
            editable={false}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={user?.userName || ''}
            editable={false}
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Edit Details" onPress={() => setEditModalVisible(true)} style={styles.logoutButton} />
        <Button title="Logout" onPress={() => setModalVisible(true)} style={styles.logoutButton} />
      </View>

      <CustomModal
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        title="Are you sure?"
        buttons={[
          {text: 'Cancel', onPress: () => setModalVisible(false)},
          {
            text: 'OK',
            onPress: handleLogout,
            style: {backgroundColor: Colors.pink},
            textStyle: {color: 'white'},
          },
        ]}
      />

      <CustomModal
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
        title="Edit Profile"
        overlayStyle={{justifyContent: 'flex-end'}}
        containerStyle={{
          width,
          padding: 30,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
        buttons={[
          {text: 'Cancel', onPress: () => setEditModalVisible(false)},
          {
            text: 'Save',
            onPress: handleUpdateProfile,
            style: {backgroundColor: Colors.pink},
            textStyle: {color: 'white'},
          },
        ]}>
        <TextInput
          style={[styles.input, {marginBottom: 10}]}
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          autoCapitalize="none"
          value={userName}
          onChangeText={setUserName}
        />
      </CustomModal>

      <CustomModal
        visible={imageModalVisible}
        onRequestClose={() => setImageModalVisible(false)}
        title="Update Profile Picture"
        overlayStyle={{justifyContent: 'flex-end'}}
        containerStyle={{
          width,
          padding: 30,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
        buttons={[
          {text: 'Choose from Gallery', onPress: openGallery},
          {text: 'Open Camera', onPress: openCamera},
          {text: 'Cancel', onPress: () => setImageModalVisible(false)},
        ]}
      />

      {/* Full Zoom Preview Modal with GestureHandler */}
      {/* <Modal
        isVisible={previewModalVisible}
        onBackdropPress={() => setPreviewModalVisible(false)}
        onBackButtonPress={() => setPreviewModalVisible(false)}
        useNativeDriver
        style={{margin: 0}}>
        <GestureHandlerRootView  onGestureEvent={panHandler}>
          <Animated.View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <PinchGestureHandler onGestureEvent={pinchHandler}>
              <Animated.Image
                source={{uri: profileImage || ''}}
                style={[
                  {
                    width: width * 0.8,
                    height: width * 0.8,
                    borderRadius: width * 0.4,
                    backgroundColor: 'white',
                  },
                  animatedStyle,
                ]}
                resizeMode="contain"
              />
            </PinchGestureHandler>
          </Animated.View>
        </GestureHandlerRootView >
      </Modal> */}

<CustomModal
  visible={previewModalVisible}
  onRequestClose={() => setPreviewModalVisible(false)}
  overlayStyle={{
    margin: 0,
    backgroundColor: '#000000cc',
    justifyContent: 'center',
    alignItems: 'center',
  }}
  containerStyle={{
    padding: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
    alignSelf: 'center',
    width: '100%',
    height: '100%',
  }}
  dismissOnOverlayPress={true}
>
  <GestureHandlerRootView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <PanGestureHandler onGestureEvent={panHandler}>
      <Animated.View>
        <PinchGestureHandler onGestureEvent={pinchHandler}>
          <Animated.Image
            source={{ uri: profileImage || '' }}
            style={[
              {
                width: width * 0.8,
                height: width * 0.8,
                borderRadius: width * 0.4,
              },
              animatedStyle,
            ]}
            resizeMode="cover"
          />
        </PinchGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  </GestureHandlerRootView>
</CustomModal>



      {successMessage && (
        <View style={[styles.toastContainer, {backgroundColor: '#d4edda'}]}>
          <Text style={[styles.toastText, {color: '#155724'}]}>{successMessage}</Text>
        </View>
      )}
      {errorMessage && (
        <View style={[styles.toastContainer, {backgroundColor: '#f8d7da'}]}>
          <Text style={[styles.toastText, {color: '#721c24'}]}>{errorMessage}</Text>
        </View>
      )}

      <Loader visible={loading} />
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.LightPink},
  profileDesign: {height: height * 0.15, backgroundColor: Colors.lightPurple},
  outerBorder: {
    width: 120,
    height: 120,
    borderRadius: 55,
    borderWidth: 50,
    borderColor: Colors.LightPink,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    top: -40,
  },
  innerBorder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    resizeMode: 'cover',
  },
  imagePressable: {alignSelf: 'center', marginTop: -40},
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark,
    textAlign: 'center',
    marginTop: 10,
    top: -40,
  },
  mainInput: {paddingHorizontal: 30},
  inputBox: {marginBottom: 15},
  label: {
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 4,
    marginLeft: 5,
  },
  input: {
    backgroundColor: Colors.lightPurple,
    padding: 12,
    borderRadius: 12,
    fontSize: 15,
    elevation: 2,
  },
  buttonContainer: {marginTop: 20},
  logoutButton: {
    backgroundColor: '#ff9eb5',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    width: width * 0.8,
    alignSelf: 'center',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 5,
    width: width * 0.8,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
