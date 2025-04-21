
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { uploadReelApi } from '../../apiClient';
import { Platform } from 'react-native';

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;

const log = (message, data = {}) => {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), message, ...data }, null, 2));
};

const UploadReel = () => {
  const navigation = useNavigation();
  const [video, setVideo] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleVideoPick = async (type) => {
    const options = {
      mediaType: 'video',
      videoQuality: 'medium',
      durationLimit: 60, // Limit to 60 seconds
    };

    try {
      if (type === 'camera') {
        launchCamera(options, (response) => {
          if (response.didCancel) {
            log('Video Picker Cancelled');
            return;
          }
          if (response.errorCode) {
            log('Video Picker Error', { error: response.errorMessage });
            Toast.show({ type: 'error', text1: 'Failed to capture video' });
            return;
          }
          if (response.assets?.length) {
            const asset = response.assets[0];
            log('Video Captured', { uri: asset.uri });
            setVideo({
              uri: asset.uri,
              type: asset.type || 'video/mp4',
              fileName: asset.fileName || `reel_${Date.now()}.mp4`,
            });
          }
        });
      } else {
        launchImageLibrary(options, (response) => {
          if (response.didCancel) {
            log('Video Picker Cancelled');
            return;
          }
          if (response.errorCode) {
            log('Video Picker Error', { error: response.errorMessage });
            Toast.show({ type: 'error', text1: 'Failed to select video' });
            return;
          }
          if (response.assets?.length) {
            const asset = response.assets[0];
            log('Video Selected', { uri: asset.uri });
            setVideo({
              uri: asset.uri,
              type: asset.type || 'video/mp4',
              fileName: asset.fileName || `reel_${Date.now()}.mp4`,
            });
          }
        });
      }
    } catch (err) {
      log('Video Pick Error', { error: err.message });
      Toast.show({ type: 'error', text1: 'Something went wrong' });
    }
  };

  const handleUpload = async () => {
    if (!video) {
      Toast.show({ type: 'error', text1: 'Please select a video' });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        log('No Token Found');
        Toast.show({ type: 'error', text1: 'Authentication required' });
        return;
      }

      const formData = new FormData();
      formData.append('video', {
        uri: Platform.OS === 'android' ? video.uri : video.uri.replace('file://', ''),
        name: video.fileName,
        type: video.type,
      });
      formData.append('caption', caption.trim());

      const { ok, data } = await uploadReelApi(token, formData, (percent) => {
        setUploadProgress(percent);
      });

      log('Upload Reel Response', { ok, data });

      if (ok) {
        Toast.show({ type: 'success', text1: 'Reel uploaded successfully' });
        setVideo(null);
        setCaption('');
        navigation.goBack();
      } else {
        Toast.show({ type: 'error', text1: data.msg || 'Failed to upload reel' });
      }
    } catch (err) {
      log('Upload Reel Error', { error: err.message });
      Toast.show({ type: 'error', text1: 'Something went wrong' });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Reel</Text>
      </View>

      <View style={styles.videoContainer}>
        {video ? (
          <Image
            source={{ uri: video.uri }}
            style={styles.videoPreview}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="videocam-outline" size={50} color="gray" />
            <Text style={styles.placeholderText}>No video selected</Text>
          </View>
        )}
      </View>

      {loading && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Uploading: {uploadProgress}%</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
          </View>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleVideoPick('camera')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Record Video</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleVideoPick('gallery')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.captionInput}
        placeholder="Add a caption..."
        placeholderTextColor="gray"
        value={caption}
        onChangeText={setCaption}
        multiline
        maxLength={150}
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.uploadButton, loading && styles.disabledButton]}
        onPress={handleUpload}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.uploadButtonText}>Upload Reel</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20 * scaleFactor,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20 * scaleFactor,
  },
  headerTitle: {
    fontSize: 20 * scaleFactor,
    fontWeight: 'bold',
    color: 'black',
    marginLeft: 10 * scaleFactor,
  },
  videoContainer: {
    height: height * 0.4,
    backgroundColor: '#E5E7EB',
    borderRadius: 10 * scaleFactor,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20 * scaleFactor,
  },
  videoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10 * scaleFactor,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16 * scaleFactor,
    color: 'gray',
    marginTop: 10 * scaleFactor,
  },
  progressContainer: {
    marginBottom: 20 * scaleFactor,
  },
  progressText: {
    fontSize: 14 * scaleFactor,
    color: 'black',
    marginBottom: 5 * scaleFactor,
  },
  progressBar: {
    height: 10 * scaleFactor,
    backgroundColor: '#E5E7EB',
    borderRadius: 5 * scaleFactor,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20 * scaleFactor,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    padding: 12 * scaleFactor,
    borderRadius: 8 * scaleFactor,
    alignItems: 'center',
    marginHorizontal: 5 * scaleFactor,
  },
  buttonText: {
    fontSize: 16 * scaleFactor,
    color: 'white',
    fontWeight: '600',
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8 * scaleFactor,
    padding: 10 * scaleFactor,
    fontSize: 16 * scaleFactor,
    color: 'black',
    backgroundColor: 'white',
    marginBottom: 20 * scaleFactor,
    minHeight: 80 * scaleFactor,
    textAlignVertical: 'top',
  },
  uploadButton: {
    backgroundColor: '#10B981',
    padding: 15 * scaleFactor,
    borderRadius: 8 * scaleFactor,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#6B7280',
  },
  uploadButtonText: {
    fontSize: 18 * scaleFactor,
    color: 'white',
    fontWeight: '600',
  },
});

export default UploadReel;