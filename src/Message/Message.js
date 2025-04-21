import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  Appearance, 
  Modal, 
  Image, 
  KeyboardAvoidingView, 
  Platform, 
  Alert, 
  PermissionsAndroid 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const colorScheme = Appearance.getColorScheme();
const audioRecorderPlayer = new AudioRecorderPlayer();

const Message = () => {
  const navigation = useNavigation();
  const flatListRef = useRef(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hello! How can I help you today?', sender: 'bot', timestamp: '12:00 PM' },
    { id: '2', text: 'Hi! I d like to ask about my products.', sender: 'user', timestamp: '12:01 PM' },
  ]);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [recordPath, setRecordPath] = useState('');
  const [recordingTimer, setRecordingTimer] = useState(null);

  const requestAudioPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);
        
        return (
          granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
        );
      }
      return true; // iOS handles permissions differently
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  };

  const getRecordPath = () => {
    const timestamp = new Date().getTime();
    return `${AudioRecorderPlayer.DocumentDirectoryPath}/record_${timestamp}.mp3`;
  };

  const handleSend = () => {
    if (message.trim() || selectedImage) {
      const newMessage = {
        id: Date.now().toString(),
        text: message,
        image: selectedImage ? selectedImage.uri : null,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      setSelectedImage(null);
      scrollToBottom();
      
      setTimeout(() => {
        const botResponse = {
          id: (Date.now() + 1).toString(),
          text: selectedImage ? 'Nice image! How can I assist?' : 'Sure, let me check your products!',
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, botResponse]);
        scrollToBottom();
      }, 1000);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  const handleImagePick = () => {
    launchImageLibrary({ 
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800
    }, response => {
      if (!response.didCancel && response.assets?.length) {
        setSelectedImage(response.assets[0]);
        setImageModalVisible(true);
      }
    });
  };

  const handleSendImage = () => {
    handleSend();
    setImageModalVisible(false);
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestAudioPermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Please grant microphone and storage permissions to record audio.');
        return;
      }

      const path = getRecordPath();
      setRecordPath(path);
      setRecording(true);
      setRecordTime(0);

      const audioSet = {
        AudioEncoderAndroid: AudioRecorderPlayer.AudioEncoderAndroid.AAC,
        AudioSourceAndroid: AudioRecorderPlayer.AudioSourceAndroid.MIC,
        AVEncoderAudioQualityKeyIOS: AudioRecorderPlayer.AVEncoderAudioQualityKeyIOS.high,
        AVNumberOfChannelsKeyIOS: 2,
        AVFormatIDKeyIOS: AudioRecorderPlayer.AVEncodingOption.aac,
      };

      await audioRecorderPlayer.startRecorder(path, audioSet);
      
      // Start timer
      const timer = setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);
      setRecordingTimer(timer);

    } catch (error) {
      console.error('Recording start error:', error);
      stopRecording();
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }

      if (recording) {
        const path = await audioRecorderPlayer.stopRecorder();
        audioRecorderPlayer.removeRecordBackListener();
        setRecording(false);

        if (path && recordTime > 0) {
          const newMessage = {
            id: Date.now().toString(),
            text: `Voice message (${recordTime}s)`,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isVoice: true,
            duration: recordTime,
            audioPath: path,
          };
          setMessages(prev => [...prev, newMessage]);
          scrollToBottom();

          setTimeout(() => {
            const botResponse = {
              id: (Date.now() + 1).toString(),
              text: 'Received your voice message!',
              sender: 'bot',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, botResponse]);
            scrollToBottom();
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Recording stop error:', error);
      Alert.alert('Error', 'Failed to save recording. Please try again.');
    }
  };

  const handleRecord = async () => {
    if (recording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleCall = () => {
    Alert.alert('Call Initiated', 'Connecting to support...', [
      { text: 'Cancel', onPress: () => console.log('Call cancelled'), style: 'cancel' },
      { text: 'End Call', onPress: () => console.log('Call ended') },
    ]);
  };

  const handlePlayVoice = async (id, audioPath) => {
    if (playingVoiceId) {
      // If already playing, stop it
      await audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
      setPlayingVoiceId(null);
      return;
    }

    try {
      setPlayingVoiceId(id);
      await audioRecorderPlayer.startPlayer(audioPath);
      
      audioRecorderPlayer.addPlayBackListener((e) => {
        if (e.current_position === e.duration) {
          audioRecorderPlayer.stopPlayer();
          audioRecorderPlayer.removePlayBackListener();
          setPlayingVoiceId(null);
        }
      });
    } catch (error) {
      console.error('Playback error:', error);
      Alert.alert('Playback Error', 'Failed to play audio message.');
      setPlayingVoiceId(null);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageContainer, item.sender === 'user' ? styles.userMessage : styles.botMessage]}>
      {item.image && <Image source={{ uri: item.image }} style={styles.messageImage} />}
      {item.text && (
        <View>
          <Text style={styles.messageText}>{item.text}</Text>
          {item.isVoice && item.audioPath && (
            <TouchableOpacity 
              style={styles.playButton} 
              onPress={() => handlePlayVoice(item.id, item.audioPath)}
            >
              <Text style={styles.playButtonText}>
                {playingVoiceId === item.id ? '⏹️ Stop' : `▶️ Play (${item.duration}s)`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <Text style={styles.messageTimestamp}>{item.timestamp}</Text>
    </View>
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (recording) {
        stopRecording();
      }
      if (playingVoiceId) {
        audioRecorderPlayer.stopPlayer();
        audioRecorderPlayer.removePlayBackListener();
      }
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 120 * scaleFactor : 80 * scaleFactor}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
          <Text style={styles.callButtonText}>📞</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.optionButton} onPress={handleImagePick}>
          <Text style={styles.optionButtonText}>📷</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.optionButton} 
          onPress={handleRecord}
          disabled={recording && recordTime >= 60} // Max 60 seconds
        >
          <Text style={styles.optionButtonText}>
            {recording ? `⏺️ ${recordTime}s` : '🎤'}
          </Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          placeholderTextColor={colorScheme === 'dark' ? '#D1D5DB' : '#6B7280'}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={imageModalVisible}
        transparent={true}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedImage && (
              <Image 
                source={{ uri: selectedImage.uri }} 
                style={styles.modalImage} 
                resizeMode="contain"
              />
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setImageModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.sendImageButton]}
                onPress={handleSendImage}
              >
                <Text style={styles.modalButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colorScheme === 'dark' ? '#111827' : '#3B82F6',
    padding: 15 * scaleFactor,
    paddingTop: Platform.OS === 'ios' ? 50 * scaleFactor : 15 * scaleFactor,
    elevation: 5,
  },
  backButton: {
    fontSize: 22 * scaleFactor,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20 * scaleFactor,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  callButton: {
    padding: 5 * scaleFactor,
  },
  callButtonText: {
    fontSize: 18 * scaleFactor,
    color: '#FFFFFF',
  },
  messageList: {
    padding: 15 * scaleFactor,
    paddingBottom: 110 * scaleFactor,
  },
  messageContainer: {
    maxWidth: '75%',
    padding: 12 * scaleFactor,
    marginVertical: 6 * scaleFactor,
    borderRadius: 12 * scaleFactor,
    elevation: 2,
  },
  userMessage: {
    backgroundColor: colorScheme === 'dark' ? '#3B82F6' : '#BFDBFE',
    alignSelf: 'flex-end',
  },
  botMessage: {
    backgroundColor: colorScheme === 'dark' ? '#4B5563' : '#E5E7EB',
    alignSelf: 'flex-start',
  },
  messageImage: {
    width: 200 * scaleFactor,
    height: 200 * scaleFactor,
    borderRadius: 10 * scaleFactor,
    marginBottom: 5 * scaleFactor,
  },
  messageText: {
    fontSize: 15 * scaleFactor,
    color: colorScheme === 'dark' ? '#F9FAFB' : '#1F2937',
  },
  playButton: {
    padding: 8 * scaleFactor,
    backgroundColor: colorScheme === 'dark' ? '#1E40AF' : '#3B82F6',
    borderRadius: 10 * scaleFactor,
    marginTop: 5 * scaleFactor,
    alignSelf: 'flex-start',
  },
  playButtonText: {
    fontSize: 12 * scaleFactor,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  messageTimestamp: {
    fontSize: 11 * scaleFactor,
    color: colorScheme === 'dark' ? '#D1D5DB' : '#6B7280',
    textAlign: 'right',
    marginTop: 4 * scaleFactor,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10 * scaleFactor,
    backgroundColor: colorScheme === 'dark' ? '#111827' : '#FFFFFF',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    elevation: 6,
    borderTopWidth: 1,
    borderTopColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB',
  },
  optionButton: {
    padding: 8 * scaleFactor,
    marginRight: 5 * scaleFactor,
  },
  optionButtonText: {
    fontSize: 20 * scaleFactor,
    color: colorScheme === 'dark' ? '#F9FAFB' : '#1F2937',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? '#374151' : '#D1D5DB',
    borderRadius: 25 * scaleFactor,
    padding: 12 * scaleFactor,
    fontSize: 15 * scaleFactor,
    color: colorScheme === 'dark' ? '#F9FAFB' : '#1F2937',
    backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF',
    marginRight: 5 * scaleFactor,
  },
  sendButton: {
    backgroundColor: colorScheme === 'dark' ? '#3B82F6' : '#3B82F6',
    borderRadius: 25 * scaleFactor,
    paddingVertical: 12 * scaleFactor,
    paddingHorizontal: 15 * scaleFactor,
    justifyContent: 'center',
    elevation: 3,
  },
  sendButtonText: {
    fontSize: 15 * scaleFactor,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRadius: 15 * scaleFactor,
    padding: 20 * scaleFactor,
    width: width * 0.85,
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 300 * scaleFactor,
    borderRadius: 10 * scaleFactor,
    marginBottom: 20 * scaleFactor,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10 * scaleFactor,
    paddingHorizontal: 20 * scaleFactor,
    borderRadius: 20 * scaleFactor,
    marginHorizontal: 5 * scaleFactor,
    minWidth: 100 * scaleFactor,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colorScheme === 'dark' ? '#4B5563' : '#E5E7EB',
  },
  sendImageButton: {
    backgroundColor: colorScheme === 'dark' ? '#3B82F6' : '#3B82F6',
  },
  modalButtonText: {
    fontSize: 16 * scaleFactor,
    fontWeight: '600',
    color: colorScheme === 'dark' ? '#F9FAFB' : '#1F2937',
  },
});

export default Message;