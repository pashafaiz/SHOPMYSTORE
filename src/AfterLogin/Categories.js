import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'react-native-image-picker';
import { uploadReelApi } from '../../apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const Categories = () => {
  const [video, setVideo] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const pickVideo = () => {
    ImagePicker.launchImageLibrary({ mediaType: 'video' }, (response) => {
      if (response.didCancel || response.errorCode) {
        console.log('User cancelled or error: ', response.errorMessage);
        Toast.show({ type: 'error', text1: response.errorMessage || 'Video selection cancelled' });
      } else if (response.assets && response.assets.length > 0) {
        setVideo(response.assets[0]);
        Toast.show({ type: 'success', text1: 'Video selected ✅' });
      }
    });
  };

  const handleUpload = async () => {
    if (!video || !video.uri) {
      Toast.show({ type: 'error', text1: 'Please select a video first' });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const token =
        (await AsyncStorage.getItem('userToken')) ||
        (await AsyncStorage.getItem('token'));
console.log("----token---here--->",token);

      const res = await uploadReelApi(token, video, caption, setUploadProgress);
console.log("res-->",res);
alert("1")
      if (res.ok) {
        Toast.show({ type: 'success', text1: 'Reel uploaded successfully ✅' });
        setVideo(null);
        setCaption('');
        setUploadProgress(null);
      } else {
        const msg =
          res.data?.msg ||
          res.data?.errors?.video ||
          'Upload failed ❌';

        Toast.show({ type: 'error', text1: msg });
      }
    } catch (err) {
      console.error('Upload error:', err);
      Toast.show({ type: 'error', text1: 'Something went wrong ❌' });
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Reel</Text>

      <TouchableOpacity style={styles.selectBtn} onPress={pickVideo}>
        <Text style={styles.selectText}>{video ? 'Change Video' : 'Select Video'}</Text>
      </TouchableOpacity>

      {video && (
        <Text style={styles.fileName}>
          Selected: {video.fileName || video.uri.split('/').pop()}
        </Text>
      )}

      <TextInput
        style={styles.captionInput}
        placeholder="Enter caption..."
        value={caption}
        onChangeText={setCaption}
      />

      {uploadProgress !== null && (
        <Text style={styles.progressText}>Uploading: {uploadProgress}%</Text>
      )}

      <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.uploadText}>Upload</Text>}
      </TouchableOpacity>
    </View>
  );
};

export default Categories;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'center',
  },
  selectBtn: {
    backgroundColor: '#6a1b9a',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  selectText: {
    color: '#fff',
    textAlign: 'center',
  },
  fileName: {
    fontSize: 14,
    marginBottom: 10,
    color: '#555',
  },
  captionInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
    textAlign: 'center',
  },
  uploadBtn: {
    backgroundColor: '#ff6f00',
    padding: 14,
    borderRadius: 10,
  },
  uploadText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});

