import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, Dimensions, Alert } from 'react-native';
import Colors from '../constants/Colors';
import img from '../assets/Images/img';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions, StackActions, useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const Profile = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [userData, setUserData] = useState({
    fullName: 'John Doe',
    username: 'johndoe',
    mobile: '9876543210',
    profileImage: img.profile_placeholder,
  });

  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('user');
  
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (e) {
      console.log('Logout error', e);
    }
  };
  

  return (
    <View style={styles.container}>
      <View style={styles.profileBox}>
        <Image source={userData.profileImage} style={styles.profileImg} />
        <TouchableOpacity style={styles.editImg}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <Text style={styles.name}>{userData.fullName}</Text>
        <Text style={styles.username}>@{userData.username}</Text>
        <Text style={styles.mobile}>📞 {userData.mobile}</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => setModalVisible(true)}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Are you sure?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={styles.okBtn}>
                <Text style={[styles.btnText, { color: 'white' }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.White,
    alignItems: 'center',
    paddingTop: 60,
  },
  profileBox: {
    alignItems: 'center',
  },
  profileImg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.lightGray,
  },
  editImg: {
    position: 'absolute',
    bottom: 10,
    right: width / 2 - 70,
    backgroundColor: Colors.pink,
    padding: 6,
    borderRadius: 8,
  },
  editText: {
    fontSize: 12,
    color: 'white',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 15,
  },
  username: {
    fontSize: 16,
    color: Colors.lightGray1,
    marginTop: 4,
  },
  mobile: {
    fontSize: 16,
    marginTop: 8,
    color: Colors.Black,
  },
  logoutBtn: {
    marginTop: 50,
    backgroundColor: Colors.pink,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 25,
    width: width * 0.8,
    borderRadius: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelBtn: {
    padding: 12,
    flex: 1,
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: Colors.lightGray,
    borderRadius: 10,
  },
  okBtn: {
    padding: 12,
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.pink,
    borderRadius: 10,
  },
  btnText: {
    fontSize: 16,
  },
});
