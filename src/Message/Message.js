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
  ActivityIndicator,
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
const scale = (size) => {
  const scaledSize = size * scaleFactor;
  return Math.min(Math.max(scaledSize, size * 0.8), size * 1.2);
};
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375));

// Theme constants
const PRODUCT_BG_COLOR = '#f5f9ff';
const CATEGORY_BG_COLOR = 'rgba(91, 156, 255, 0.2)';
const SELECTED_CATEGORY_BG_COLOR = '#5b9cff';
const PRIMARY_THEME_COLOR = '#5b9cff';
const SECONDARY_THEME_COLOR = '#ff6b8a';
const TEXT_THEME_COLOR = '#1a2b4a';
const SUBTEXT_THEME_COLOR = '#5a6b8a';
const BORDER_THEME_COLOR = 'rgba(91, 156, 255, 0.3)';
const BACKGROUND_GRADIENT = ['#8ec5fc', '#fff'];

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
        ]),
      ).start();
    } else {
      typingAnim.setValue(0);
    }
  }, [isTyping, typingAnim]);

  const checkAudioPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const permission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
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
          },
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
          },
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
      await dispatch(sendMessage({ recipientId, content })).unwrap();
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
        },
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
          await dispatch(sendMessage({ recipientId, content })).unwrap();
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
      ],
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
        updateMessage({ messageId, content: message.content, reactions: newReactions }),
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
              <Icon name="delete" size={scale(20)} color={SECONDARY_THEME_COLOR} />
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
                <Icon name="delete" size={scale(20)} color={SECONDARY_THEME_COLOR} />
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
                      color={TEXT_THEME_COLOR}
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
          colors={BACKGROUND_GRADIENT}
          style={styles.gradientContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <StatusBar barStyle="dark-content" backgroundColor={PRODUCT_BG_COLOR} />
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <AntDesignIcon name="arrowleft" size={scale(24)} color={PRIMARY_THEME_COLOR} />
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
              <IoniconsIcon name="call" size={scale(20)} color={PRIMARY_THEME_COLOR} />
            </TouchableOpacity>
          </View>

          <View style={styles.messagesContainer}>
            {loading && messages.length === 0 && (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={PRIMARY_THEME_COLOR} />
              </View>
            )}
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
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
              colors={[PRODUCT_BG_COLOR, PRODUCT_BG_COLOR]}
              style={styles.inputContainer}
            >
              <TouchableOpacity
                style={styles.optionButton}
                onPress={showAttachmentMenu}
                activeOpacity={0.7}
              >
                <FeatherIcon name="paperclip" size={scale(24)} color={PRIMARY_THEME_COLOR} />
              </TouchableOpacity>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={message}
                onChangeText={setMessage}
                placeholder="Type a message..."
                placeholderTextColor={SUBTEXT_THEME_COLOR}
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
                  <Icon name="send" size={scale(24)} color={TEXT_THEME_COLOR} />
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
                    color={recording ? SECONDARY_THEME_COLOR : PRIMARY_THEME_COLOR}
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
              colors={[PRODUCT_BG_COLOR, PRODUCT_BG_COLOR]}
              style={styles.modalContainer}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Preview</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setImageModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <AntDesignIcon name="close" size={scale(24)} color={TEXT_THEME_COLOR} />
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
                  <Icon name="send" size={scale(16)} color={TEXT_THEME_COLOR} />
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
                  <Icon name="camera" size={scale(24)} color={PRIMARY_THEME_COLOR} />
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
                  <Icon name="image" size={scale(24)} color={PRIMARY_THEME_COLOR} />
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
                  <Icon name="microphone" size={scale(24)} color={PRIMARY_THEME_COLOR} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRODUCT_BG_COLOR,
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
    borderBottomWidth: scale(2),
    borderBottomColor: BORDER_THEME_COLOR,
    backgroundColor: PRODUCT_BG_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    elevation: 4,
  },
  backButton: {
    padding: scale(10),
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(24),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: scale(12),
  },
  headerAvatar: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    marginRight: scale(15),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  headerName: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
  },
  headerStatus: {
    fontSize: scaleFont(14),
    color: SUBTEXT_THEME_COLOR,
    marginTop: scale(3),
  },
  callButton: {
    backgroundColor: CATEGORY_BG_COLOR,
    padding: scale(12),
    borderRadius: scale(24),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(5),
    elevation: 3,
  },
  messagesContainer: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: scale(20),
    paddingBottom: scale(30),
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: scale(10),
    maxWidth: '85%',
    alignItems: 'flex-end',
  },
  selectedMessage: {
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(18),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    marginHorizontal: scale(10),
  },
  messageContent: {
    borderRadius: scale(18),
    padding: scale(12),
    maxWidth: width * 0.65,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    elevation: 4,
  },
  userMessageContent: {
    backgroundColor: PRIMARY_THEME_COLOR,
    borderBottomRightRadius: scale(4),
  },
  botMessageContent: {
    backgroundColor: PRODUCT_BG_COLOR,
    borderBottomLeftRadius: scale(4),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  messageText: {
    fontSize: scaleFont(15),
    lineHeight: scale(22),
  },
  userMessageText: {
    color: TEXT_THEME_COLOR,
  },
  botMessageText: {
    color: TEXT_THEME_COLOR,
  },
  messageTimestamp: {
    fontSize: scaleFont(11),
    marginTop: scale(6),
    color: SUBTEXT_THEME_COLOR,
  },
  userTimestamp: {
    textAlign: 'right',
  },
  botTimestamp: {
    textAlign: 'left',
  },
  messageImage: {
    width: scale(220),
    height: scale(220),
    borderRadius: scale(10),
    marginBottom: scale(8),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CATEGORY_BG_COLOR,
    padding: scale(10),
    borderRadius: scale(24),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  playingButton: {
    backgroundColor: SELECTED_CATEGORY_BG_COLOR,
  },
  voiceMessageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceWave: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: scale(10),
  },
  voiceWaveBar: {
    width: scale(2),
    backgroundColor: SUBTEXT_THEME_COLOR,
    marginHorizontal: scale(1),
    borderRadius: scale(2),
  },
  voiceWaveBarActive: {
    backgroundColor: PRIMARY_THEME_COLOR,
  },
  playButtonText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(13),
    marginLeft: scale(8),
  },
  reactionContainer: {
    flexDirection: 'row',
    marginTop: scale(6),
    flexWrap: 'wrap',
  },
  reactionEmoji: {
    fontSize: scaleFont(17),
    marginRight: scale(6),
    marginTop: scale(3),
  },
  reactionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: CATEGORY_BG_COLOR,
    padding: scale(10),
    borderRadius: scale(24),
    marginVertical: scale(8),
    alignSelf: 'center',
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  reactionButton: {
    padding: scale(6),
    marginHorizontal: scale(6),
  },
  messageActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: CATEGORY_BG_COLOR,
    padding: scale(10),
    borderRadius: scale(24),
    marginBottom: scale(8),
    alignSelf: 'center',
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  selectionCount: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(15),
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 138, 0.2)',
    padding: scale(10),
    borderRadius: scale(12),
    borderWidth: scale(2),
    borderColor: SECONDARY_THEME_COLOR,
  },
  deleteButtonText: {
    color: SECONDARY_THEME_COLOR,
    fontSize: scaleFont(13),
    marginLeft: scale(6),
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(15),
  },
  typingAvatar: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    marginRight: scale(10),
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: PRODUCT_BG_COLOR,
    padding: scale(10),
    borderRadius: scale(18),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  typingDot: {
    width: scale(7),
    height: scale(7),
    borderRadius: scale(3.5),
    backgroundColor: PRIMARY_THEME_COLOR,
    marginHorizontal: scale(3),
  },
  inputContainerWrapper: {
    padding: scale(20),
    backgroundColor: PRODUCT_BG_COLOR,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scale(30),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    elevation: 4,
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  optionButton: {
    padding: scale(10),
  },
  input: {
    flex: 1,
    fontSize: scaleFont(15),
    color: TEXT_THEME_COLOR,
    paddingVertical: 'top',
    paddingHorizontal: scale(12),
    maxHeight: scale(100),
  },
  sendButton: {
    backgroundColor: PRIMARY_THEME_COLOR,
    padding: scale(12),
    borderRadius: scale(24),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
    borderRadius: scale(24),
  },
  recordingTime: {
    color: SECONDARY_THEME_COLOR,
    fontSize: scaleFont(13),
    marginLeft: scale(8),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    borderRadius: scale(24),
    padding: scale(25),
    alignItems: 'center',
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: scale(20),
  },
  modalTitle: {
    fontSize: scaleFont(20),
    fontWeight: '600',
    color: TEXT_THEME_COLOR,
  },
  modalCloseButton: {
    padding: scale(10),
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(24),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  modalImage: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: scale(12),
    marginBottom: scale(25),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: CATEGORY_BG_COLOR,
    padding: scale(14),
    borderRadius: scale(12),
    alignItems: 'center',
    marginRight: scale(12),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  cancelButtonText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  sendImageButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: PRIMARY_THEME_COLOR,
    padding: scale(14),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  sendImageButtonText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginRight: scale(8),
  },
  attachmentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  attachmentModalContainer: {
    backgroundColor: PRODUCT_BG_COLOR,
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    padding: scale(25),
    paddingBottom: scale(40),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  attachmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(18),
    borderBottomWidth: scale(1),
    borderBottomColor: BORDER_THEME_COLOR,
  },
  attachmentOptionText: {
    fontSize: scaleFont(17),
    color: TEXT_THEME_COLOR,
    marginLeft: scale(15),
  },
  attachmentCancelButton: {
    marginTop: scale(25),
    backgroundColor: CATEGORY_BG_COLOR,
    padding: scale(14),
    borderRadius: scale(12),
    alignItems: 'center',
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  attachmentCancelText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  errorText: {
    color: SECONDARY_THEME_COLOR,
    textAlign: 'center',
    marginVertical: scale(15),
    fontSize: scaleFont(16),
  },
});

export default Message;