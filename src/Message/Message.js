import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  PermissionsAndroid,
  StatusBar,
  Animated,
  Easing,
  ActionSheetIOS,
  Linking,
  Pressable,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesignIcon from 'react-native-vector-icons/AntDesign';
import IoniconsIcon from 'react-native-vector-icons/Ionicons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import RNFS from 'react-native-fs';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
} from '../redux/slices/chatSlice';
import { DEFAULT_IMAGE_URL } from '../constants/GlobalConstants';

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const audioRecorderPlayer = new AudioRecorderPlayer();

const Message = ({ route }) => {
  const { user, recipientId } = route?.params || { user: {}, recipientId: '' };
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const dispatch = useDispatch();
  const { messages, loading, error } = useSelector((state) => state.chat);
  const flatListRef = useRef(null);
  const [message, setMessage] = useState('');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState(null);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const typingAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);
  const [animatedMessages, setAnimatedMessages] = useState([]);

  useEffect(() => {
    if (!recipientId) {
      Alert.alert('Error', 'Recipient ID is missing.');
      navigation.goBack();
      return;
    }

    dispatch(fetchMessages({ recipientId, page: 1, limit: 20 }));

    let interval;
    if (isFocused) {
      interval = setInterval(() => {
        dispatch(fetchMessages({ recipientId, page: 1, limit: 20 }));
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [dispatch, recipientId, navigation, isFocused]);

  useEffect(() => {
    const updatedMessages = messages.map((msg) => ({
      ...msg,
      id: msg.id?.toString() || Math.random().toString(),
      animation: new Animated.Value(0),
      reactionAnim: new Animated.Value(msg.reactions?.length > 0 ? 1 : 0),
    }));

    setAnimatedMessages(updatedMessages);

    updatedMessages.forEach((msg) => {
      Animated.parallel([
        Animated.timing(msg.animation, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(msg.reactionAnim, {
          toValue: msg.reactions?.length > 0 ? 1 : 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [messages]);

  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(typingAnim, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      typingAnim.setValue(0);
    }
  }, [isTyping, typingAnim]);

  const checkAudioPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const permission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        return permission;
      }
      return true;
    } catch (err) {
      console.warn('Permission check error:', err);
      return false;
    }
  };

  const requestAudioPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to record voice messages.',
            buttonPositive: 'OK',
            buttonNegative: 'Cancel',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } catch (err) {
      console.warn('Permission request error:', err);
      Alert.alert('Permission Error', 'Failed to get microphone permissions.');
      return false;
    }
  };

  const requestCameraPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to your camera',
            buttonPositive: 'OK',
            buttonNegative: 'Cancel',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } catch (err) {
      console.warn('Camera permission error:', err);
      return false;
    }
  };

  const getRecordPath = () => {
    const timestamp = new Date().getTime();
    const extension = Platform.OS === 'ios' ? 'm4a' : 'mp3';
    return `${RNFS.DocumentDirectoryPath}/record_${timestamp}.${extension}`;
  };

  const handleSend = async () => {
    if (!message.trim() && !selectedImage) return;

    try {
      const content = selectedImage ? `Image: ${selectedImage.uri}` : message;
      await dispatch(
        sendMessage({ recipientId, content })
      ).unwrap();
      setMessage('');
      setSelectedImage(null);
      setSelectedMessages([]);
      setIsSelectionMode(false);
      Keyboard.dismiss();
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      });

      if (!result.didCancel && result.assets?.length) {
        setSelectedImage(result.assets[0]);
        setImageModalVisible(true);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleCameraCapture = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Camera access is required to take photos.');
        return;
      }

      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      });

      if (!result.didCancel && result.assets?.length) {
        setSelectedImage(result.assets[0]);
        setImageModalVisible(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const showAttachmentMenu = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library', 'Record Voice'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleCameraCapture();
          } else if (buttonIndex === 2) {
            handleImagePick();
          } else if (buttonIndex === 3) {
            handleRecordPress();
          }
        }
      );
    } else {
      setShowAttachmentOptions(true);
    }
  };

  const handleSendImage = () => {
    handleSend();
    setImageModalVisible(false);
  };

  const startRecording = async () => {
    try {
      const hasPermission = await checkAudioPermission();
      if (!hasPermission) {
        const granted = await requestAudioPermission();
        if (!granted) {
          Alert.alert('Permission Denied', 'Microphone access is required.');
          return;
        }
      }

      const path = getRecordPath();
      setRecording(true);
      setRecordTime(0);

      const audioSet = {
        AudioEncoderAndroid: 3,
        AudioSourceAndroid: 1,
        AVEncoderAudioQualityKeyIOS: 0,
        AVNumberOfChannelsKeyIOS: 2,
        AVFormatIDKeyIOS: 'aac',
      };

      await audioRecorderPlayer.startRecorder(path, audioSet);

      const timer = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
      setRecordingTimer(timer);
    } catch (error) {
      console.error('Recording start error:', error);
      setRecording(false);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopRecording = async () => {
    try {
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }

      if (recording) {
        const result = await audioRecorderPlayer.stopRecorder();
        audioRecorderPlayer.removeRecordBackListener();
        setRecording(false);

        if (result && recordTime > 0) {
          const content = `Voice message (${recordTime}s): ${result}`;
          await dispatch(
            sendMessage({ recipientId, content })
          ).unwrap();
          setSelectedMessages([]);
          setIsSelectionMode(false);
        }
      }
    } catch (error) {
      console.error('Recording stop error:', error);
      Alert.alert('Error', 'Failed to save recording');
    }
  };

  const handleRecordPress = async () => {
    if (recording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleCall = () => {
    Alert.alert('Call Support', 'Would you like to call our support team?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call',
        onPress: () => {
          const phoneNumber = 'tel:+1234567890';
          Linking.canOpenURL(phoneNumber)
            .then((supported) => {
              if (!supported) {
                Alert.alert('Error', 'Phone calls are not supported');
              } else {
                return Linking.openURL(phoneNumber);
              }
            })
            .catch((err) => console.error('Error opening phone:', err));
        },
      },
    ]);
  };

  const handlePlayVoice = async (id, content) => {
    const match = content.match(/Voice message \(\d+s\): (.*)/);
    const audioPath = match ? match[1] : null;

    if (!audioPath) {
      Alert.alert('Error', 'Invalid voice message format.');
      return;
    }

    if (playingVoiceId === id) {
      await audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
      setPlayingVoiceId(null);
      return;
    }

    try {
      setPlayingVoiceId(id);
      await audioRecorderPlayer.startPlayer(audioPath);

      audioRecorderPlayer.addPlayBackListener((e) => {
        if (e.currentPosition >= e.duration) {
          audioRecorderPlayer.stopPlayer();
          audioRecorderPlayer.removePlayBackListener();
          setPlayingVoiceId(null);
        }
      });
    } catch (error) {
      console.error('Playback error:', error);
      Alert.alert('Error', 'Failed to play voice message');
      setPlayingVoiceId(null);
    }
  };

  const deleteMessages = (messageIds = selectedMessages) => {
    if (messageIds.length === 0) return;

    Alert.alert(
      'Delete Message',
      `Are you sure you want to delete ${messageIds.length > 1 ? 'these messages' : 'this message'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const id of messageIds) {
                await dispatch(deleteMessage(id)).unwrap();
              }
              setSelectedMessages([]);
              setIsSelectionMode(false);
            } catch (error) {
              console.error('Delete message error:', error);
              Alert.alert('Error', 'Failed to delete messages');
            }
          },
        },
      ]
    );
  };

  const handleMessageLongPress = (message) => {
    if (message.sender?._id === user?._id) {
      setIsSelectionMode(true);
      setSelectedMessages((prev) => {
        if (prev.includes(message.id)) {
          const newSelection = prev.filter((id) => id !== message.id);
          if (newSelection.length === 0) setIsSelectionMode(false);
          return newSelection;
        }
        return [...prev, message.id];
      });
    }
  };

  const handleMessageTap = (message) => {
    if (message.sender?._id === user?._id && isSelectionMode) {
      setSelectedMessages((prev) => {
        if (prev.includes(message.id)) {
          const newSelection = prev.filter((id) => id !== message.id);
          if (newSelection.length === 0) setIsSelectionMode(false);
          return newSelection;
        }
        return [...prev, message.id];
      });
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      const message = messages.find((msg) => msg.id === messageId);
      if (!message) return;

      const currentReactions = message.reactions || [];
      const newReactions = currentReactions.includes(emoji)
        ? currentReactions.filter((r) => r !== emoji)
        : [...currentReactions, emoji];

      await dispatch(
        updateMessage({ messageId, content: message.content, reactions: newReactions })
      ).unwrap();
      setSelectedMessages([]);
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Reaction error:', error);
      Alert.alert('Error', 'Failed to update reaction');
    }
  };

  const renderMessage = ({ item }) => {
    const isSelected = selectedMessages.includes(item.id);
    const isFirstSelected = item.id === selectedMessages[0];
    const isUserMessage = item.sender?._id === user?._id;

    if (!item.sender?._id || !user?._id) {
      console.warn('Missing sender or user ID:', { senderId: item.sender?._id, userId: user?._id });
      return null;
    }

    return (
      <Animated.View
        style={{
          opacity: item.animation || 1,
          transform: [
            {
              translateY: item.animation?.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }) || 0,
            },
            {
              scale: item.animation?.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              }) || 1,
            },
          ],
        }}
      >
        {isFirstSelected && selectedMessages.length > 1 && (
          <View style={styles.messageActionBar}>
            <Text style={styles.selectionCount}>
              {selectedMessages.length} selected
            </Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteMessages()}
              activeOpacity={0.7}
            >
              <Icon name="delete" size={scale(20)} color="#FF3E6D" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        {isFirstSelected && selectedMessages.length === 1 && (
          <Animated.View
            style={[
              styles.reactionBar,
              {
                opacity: item.animation || 1,
                transform: [
                  {
                    scale: item.animation?.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }) || 1,
                  },
                ],
              },
            ]}
          >
            {['👍', '❤️', '😂', '😮', '😢'].map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionButton}
                onPress={() => handleReaction(item.id, emoji)}
                activeOpacity={0.7}
              >
                <Animated.Text
                  style={[
                    styles.reactionEmoji,
                    {
                      transform: [
                        {
                          scale: item.reactionAnim?.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.3],
                          }) || 1,
                        },
                        {
                          rotate: item.reactionAnim?.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '15deg'],
                          }) || '0deg',
                        },
                      ],
                    },
                  ]}
                >
                  {emoji}
                </Animated.Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.reactionButton}
              onPress={() => deleteMessages([item.id])}
              activeOpacity={0.7}
            >
              <Animated.View
                style={{
                  transform: [
                    {
                      scale: item.reactionAnim?.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.2],
                      }) || 1,
                    },
                  ],
                }}
              >
                <Icon name="delete" size={scale(20)} color="#FF3E6D" />
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        )}
        <Pressable
          onPress={() => handleMessageTap(item)}
          onLongPress={() => handleMessageLongPress(item)}
          delayLongPress={300}
        >
          <View
            style={[
              styles.messageContainer,
              isUserMessage ? styles.userMessageContainer : styles.botMessageContainer,
              isSelected && styles.selectedMessage,
            ]}
          >
            {!isUserMessage && (
              <Image
                source={{
                  uri: item.sender?.profilePicture || DEFAULT_IMAGE_URL,
                }}
                style={styles.avatar}
              />
            )}
            <View
              style={[
                styles.messageContent,
                isUserMessage ? styles.userMessageContent : styles.botMessageContent,
              ]}
            >
              {item.content?.startsWith('Image:') && (
                <Image
                  source={{ uri: item.content.replace('Image: ', '') }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              )}
              {item.content?.startsWith('Voice message') && (
                <TouchableOpacity
                  style={[
                    styles.playButton,
                    playingVoiceId === item.id && styles.playingButton,
                  ]}
                  onPress={() => handlePlayVoice(item.id, item.content)}
                  activeOpacity={0.7}
                >
                  <View style={styles.voiceMessageContent}>
                    <Icon
                      name={playingVoiceId === item.id ? 'pause' : 'play'}
                      size={scale(16)}
                      color="#FFFFFF"
                    />
                    <View style={styles.voiceWave}>
                      {[1, 2, 3, 4, 5].map((_, i) => (
                        <Animated.View
                          key={i}
                          style={[
                            styles.voiceWaveBar,
                            playingVoiceId === item.id && styles.voiceWaveBarActive,
                            {
                              height: scale(4 + Math.random() * 12),
                              transform: [
                                {
                                  scaleY: playingVoiceId === item.id
                                    ? item.animation?.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [1, 1.5],
                                      }) || 1
                                    : 1,
                                },
                              ],
                            },
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={styles.playButtonText}>
                      {item.content.match(/(\d+)s/)?.[1] || '0'}s
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              {!item.content?.startsWith('Image:') &&
                !item.content?.startsWith('Voice message') && (
                  <Text
                    style={[
                      styles.messageText,
                      isUserMessage ? styles.userMessageText : styles.botMessageText,
                    ]}
                  >
                    {item.content || 'No content'}
                  </Text>
                )}
              <Text
                style={[
                  styles.messageTimestamp,
                  isUserMessage ? styles.userTimestamp : styles.botTimestamp,
                ]}
              >
                {new Date(item.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              {item.reactions?.length > 0 && (
                <Animated.View
                  style={[
                    styles.reactionContainer,
                    {
                      opacity: item.reactionAnim || 1,
                      transform: [
                        {
                          scale: item.reactionAnim?.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1],
                          }) || 1,
                        },
                        {
                          translateY: item.reactionAnim?.interpolate({
                            inputRange: [0, 1],
                            outputRange: [5, 0],
                          }) || 0,
                        },
                      ],
                    },
                  ]}
                >
                  {item.reactions.map((emoji, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => handleReaction(item.id, emoji)}
                    >
                      <Animated.Text
                        style={[
                          styles.reactionEmoji,
                          {
                            transform: [
                              {
                                scale: item.reactionAnim?.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.8, 1.2],
                                }) || 1,
                              },
                            ],
                          },
                        ]}
                      >
                        {emoji}
                      </Animated.Text>
                    </TouchableOpacity>
                  ))}
                </Animated.View>
              )}
            </View>
            {isUserMessage && (
              <Image
                source={{
                  uri: item.sender?.profilePicture || DEFAULT_IMAGE_URL,
                }}
                style={styles.avatar}
              />
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const renderTypingIndicator = () => (
    <Animated.View
      style={{
        opacity: typingAnim,
        transform: [
          {
            translateY: typingAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
        ],
      }}
    >
      <View style={styles.typingContainer}>
        <Image
          source={{ uri: user?.profilePicture || DEFAULT_IMAGE_URL }}
          style={styles.typingAvatar}
        />
        <View style={styles.typingBubble}>
          <Animated.View
            style={[
              styles.typingDot,
              {
                opacity: typingAnim,
                transform: [
                  {
                    translateY: typingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.typingDot,
              {
                opacity: typingAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 0.5, 1],
                }),
                transform: [
                  {
                    translateY: typingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.typingDot,
              {
                opacity: typingAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.5],
                }),
                transform: [
                  {
                    translateY: typingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );

  useEffect(() => {
    return () => {
      if (recording) {
        stopRecording();
      }
      if (playingVoiceId) {
        audioRecorderPlayer.stopPlayer();
        audioRecorderPlayer.removePlayBackListener();
      }
    };
  }, [recording, playingVoiceId]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? scale(80) : scale(20)}
      >
        <LinearGradient
          colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']}
          style={styles.gradientContainer}
        >
          <StatusBar barStyle="light-content" backgroundColor="#1A0B3B" />
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <AntDesignIcon name="arrowleft" size={scale(24)} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerUser}>
              <Image
                source={{
                  uri: user?.profilePicture || DEFAULT_IMAGE_URL,
                }}
                style={styles.headerAvatar}
              />
              <View>
                <Text style={styles.headerName}>{user?.fullName || 'Support'}</Text>
                <Text style={styles.headerStatus}>
                  {isTyping ? 'typing...' : user?.isOnline ? 'online' : 'offline'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.callButton}
              onPress={handleCall}
              activeOpacity={0.7}
            >
              <IoniconsIcon name="call" size={scale(20)} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.messagesContainer}>
            {loading && (
              <Text style={styles.loadingText}>Loading messages...</Text>
            )}
            {error && <Text style={styles.errorText}>{error}</Text>}
            <FlatList
              ref={flatListRef}
              data={animatedMessages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageList}
              ListFooterComponent={isTyping ? renderTypingIndicator : null}
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              inverted // Ensures latest messages are at the bottom
            />
          </View>

          <Animated.View
            style={[
              styles.inputContainerWrapper,
              {
                opacity: typingAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.95],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={['#2A2A5A', '#3A3A7A']}
              style={styles.inputContainer}
            >
              <TouchableOpacity
                style={styles.optionButton}
                onPress={showAttachmentMenu}
                activeOpacity={0.7}
              >
                <FeatherIcon name="paperclip" size={scale(24)} color="#A855F7" />
              </TouchableOpacity>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={message}
                onChangeText={setMessage}
                placeholder="Type a message..."
                placeholderTextColor="#B0B0D0"
                onSubmitEditing={handleSend}
                multiline
                textAlignVertical="center"
              />
              {message || selectedImage ? (
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleSend}
                  activeOpacity={0.7}
                >
                  <Icon name="send" size={scale(24)} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.recordButton}
                  onPress={handleRecordPress}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={recording ? 'stop' : 'microphone'}
                    size={scale(24)}
                    color={recording ? '#FF3E6D' : '#A855F7'}
                  />
                  {recording && (
                    <Text style={styles.recordingTime}>{recordTime}s</Text>
                  )}
                </TouchableOpacity>
              )}
            </LinearGradient>
          </Animated.View>
        </LinearGradient>

        <Modal
          visible={imageModalVisible}
          transparent={true}
          onRequestClose={() => setImageModalVisible(false)}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <LinearGradient
              colors={['#2A2A5A', '#3A3A7A']}
              style={styles.modalContainer}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Preview</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setImageModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text>yyyyyyyyyyyyyyyy</Text>
                </TouchableOpacity>
              </View>
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              )}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setImageModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sendImageButton}
                  onPress={handleSendImage}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sendImageButtonText}>Send</Text>
                  <Icon name="send" size={scale(16)} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </Modal>

        {showAttachmentOptions && Platform.OS === 'android' && (
          <Modal
            transparent={true}
            visible={showAttachmentOptions}
            onRequestClose={() => setShowAttachmentOptions(false)}
            animationType="slide"
          >
            <TouchableOpacity
              style={styles.attachmentModalOverlay}
              activeOpacity={1}
              onPress={() => setShowAttachmentOptions(false)}
            >
              <View style={styles.attachmentModalContainer}>
                <TouchableOpacity
                  style={styles.attachmentOption}
                  onPress={() => {
                    setShowAttachmentOptions(false);
                    handleCameraCapture();
                  }}
                  activeOpacity={0.7}
                >
                  <Icon name="camera" size={scale(24)} color="#A855F7" />
                  <Text style={styles.attachmentOptionText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.attachmentOption}
                  onPress={() => {
                    setShowAttachmentOptions(false);
                    handleImagePick();
                  }}
                  activeOpacity={0.7}
                >
                  <Icon name="image" size={scale(24)} color="#A855F7" />
                  <Text style={styles.attachmentOptionText}>Choose from Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.attachmentOption}
                  onPress={() => {
                    setShowAttachmentOptions(false);
                    handleRecordPress();
                  }}
                  activeOpacity={0.7}
                >
                  <Icon name="microphone" size={scale(24)} color="#A855F7" />
                  <Text style={styles.attachmentOptionText}>Record Voice</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.attachmentCancelButton}
                  onPress={() => setShowAttachmentOptions(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.attachmentCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const scale = (size) => {
  const scaledSize = size * scaleFactor;
  return Math.min(Math.max(scaledSize, size * 0.8), size * 1.2);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0B3B',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(15),
    paddingTop: Platform.OS === 'ios' ? scale(10) : scale(15),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(26, 11, 59, 0.9)',
  },
  backButton: {
    padding: scale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(20),
  },
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: scale(10),
  },
  headerAvatar: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    marginRight: scale(15),
    borderWidth: 2,
    borderColor: '#4A2A8D',
  },
  headerName: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerStatus: {
    fontSize: scale(12),
    color: '#AAA',
    marginTop: scale(2),
  },
  callButton: {
    backgroundColor: '#4A2A8D',
    padding: scale(10),
    borderRadius: scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  messagesContainer: {
    flex: 1,
  },
  messageList: {
    padding: scale(15),
    paddingBottom: scale(20),
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: scale(8),
    maxWidth: '85%',
    alignItems: 'flex-end',
  },
  selectedMessage: {
    backgroundColor: 'rgba(74, 42, 141, 0.3)',
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#4A2A8D',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    marginHorizontal: scale(8),
  },
  messageContent: {
    borderRadius: scale(12),
    padding: scale(10),
    maxWidth: width * 0.65,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userMessageContent: {
    backgroundColor: '#7B61FF',
    borderBottomRightRadius: scale(4),
  },
  botMessageContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderBottomLeftRadius: scale(4),
  },
  messageText: {
    fontSize: scale(14),
    lineHeight: scale(20),
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  botMessageText: {
    color: '#E5E7EB',
  },
  messageTimestamp: {
    fontSize: scale(10),
    marginTop: scale(4),
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  botTimestamp: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'left',
  },
  messageImage: {
    width: scale(200),
    height: scale(200),
    borderRadius: scale(8),
    marginBottom: scale(5),
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: scale(8),
    borderRadius: scale(20),
  },
  playingButton: {
    backgroundColor: '#4A2A8D',
  },
  voiceMessageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceWave: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: scale(8),
  },
  voiceWaveBar: {
    width: scale(2),
    backgroundColor: '#FFFFFF',
    marginHorizontal: scale(1),
    borderRadius: scale(2),
  },
  voiceWaveBarActive: {
    backgroundColor: '#A855F7',
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: scale(12),
    marginLeft: scale(5),
  },
  reactionContainer: {
    flexDirection: 'row',
    marginTop: scale(5),
    flexWrap: 'wrap',
  },
  reactionEmoji: {
    fontSize: scale(16),
    marginRight: scale(5),
    marginTop: scale(2),
  },
  reactionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: scale(8),
    borderRadius: scale(20),
    marginVertical: scale(5),
    alignSelf: 'center',
  },
  reactionButton: {
    padding: scale(5),
    marginHorizontal: scale(5),
  },
  messageActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 42, 141, 0.5)',
    padding: scale(8),
    borderRadius: scale(8),
    marginBottom: scale(5),
    alignSelf: 'center',
  },
  selectionCount: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 62, 109, 0.2)',
    padding: scale(8),
    borderRadius: scale(8),
  },
  deleteButtonText: {
    color: '#FF3E6D',
    fontSize: scale(12),
    marginLeft: scale(5),
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(10),
  },
  typingAvatar: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    marginRight: scale(8),
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: scale(8),
    borderRadius: scale(12),
  },
  typingDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: '#A855F7',
    marginHorizontal: scale(2),
  },
  inputContainerWrapper: {
    padding: scale(15),
    backgroundColor: 'rgba(26, 11, 59, 0.9)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scale(25),
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  optionButton: {
    padding: scale(8),
  },
  input: {
    flex: 1,
    fontSize: scale(14),
    color: '#FFFFFF',
    paddingVertical: scale(8),
    paddingHorizontal: scale(10),
    maxHeight: scale(100),
  },
  sendButton: {
    backgroundColor: '#A855F7',
    padding: scale(10),
    borderRadius: scale(20),
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(10),
    borderRadius: scale(20),
  },
  recordingTime: {
    color: '#FF3E6D',
    fontSize: scale(12),
    marginLeft: scale(5),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    borderRadius: scale(15),
    padding: scale(20),
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: scale(15),
  },
  modalTitle: {
    fontSize: scale(18),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    padding: scale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(20),
  },
  modalImage: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: scale(10),
    marginBottom: scale(20),
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FF3E6D',
    padding: scale(12),
    borderRadius: scale(8),
    alignItems: 'center',
    marginRight: scale(10),
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: '600',
  },
  sendImageButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#A855F7',
    padding: scale(12),
    borderRadius: scale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendImageButtonText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: '600',
    marginRight: scale(5),
  },
  attachmentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  attachmentModalContainer: {
    backgroundColor: '#2A2A5A',
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    padding: scale(20),
    paddingBottom: scale(30),
  },
  attachmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(15),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  attachmentOptionText: {
    fontSize: scale(16),
    color: '#FFFFFF',
    marginLeft: scale(15),
  },
  attachmentCancelButton: {
    marginTop: scale(20),
    backgroundColor: '#FF3E6D',
    padding: scale(12),
    borderRadius: scale(8),
    alignItems: 'center',
  },
  attachmentCancelText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: '600',
  },
  loadingText: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: scale(10),
  },
  errorText: {
    color: '#FF3E6D',
    textAlign: 'center',
    marginVertical: scale(10),
  },
});

export default Message