import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  FlatList,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import Header from '../Components/Header';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChatMessages, sendChatMessage, clearError } from '../redux/slices/supportSlice';
import { MAX_CHAT_MESSAGE_LENGTH } from '../constants/GlobalConstants';

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = size => size * scaleFactor;
const scaleFont = size => Math.round(size * (Math.min(width, height) / 375));

const Message = ({ item }) => {
  const messageAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(messageAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.botMessage,
        {
          opacity: messageAnim,
          transform: [
            { translateY: messageAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={item.isUser ? ['#AD4DFF', '#7B61FF'] : ['#4B5EAA', '#6B7280']}
        style={styles.messageBubble}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
};

const Chat = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { chatMessages, loading, error } = useSelector(state => state.support);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    dispatch(fetchChatMessages());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK', onPress: () => dispatch(clearError()) },
      ]);
    }
  }, [error, dispatch]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const sendMessage = () => {
    if (!inputText.trim()) return;

    dispatch(sendChatMessage({ text: inputText }))
      .unwrap()
      .then(() => {
        setInputText('');
      })
      .catch((err) => {
        console.error('Send message failed:', err);
      });
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Animated.View
        style={[
          styles.mainContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          },
        ]}
      >
        <Header
          showLeftIcon={true}
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
          title="Live Chat"
        />
        {loading && chatMessages.length === 0 ? (
          <Text style={styles.loadingText}>Loading messages...</Text>
        ) : (
          <FlatList
            ref={flatListRef}
            data={chatMessages}
            renderItem={({ item }) => <Message item={item} />}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.chatContainer}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
            onLayout={scrollToBottom}
          />
        )}
        <View style={styles.inputContainer}>
          <LinearGradient
            colors={['#AD4DFF', '#7B61FF']}
            style={styles.inputGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor="#D1D5DB"
              multiline
              maxLength={MAX_CHAT_MESSAGE_LENGTH}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendMessage}
              activeOpacity={0.9}
              disabled={loading}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FFD93D']}
                style={styles.sendButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Icon name="send" size={scale(20)} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1E',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  mainContainer: {
    flex: 1,
  },
  chatContainer: {
    paddingHorizontal: scale(15),
    paddingVertical: scale(20),
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: scale(8),
    maxWidth: '75%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: scale(12),
    borderRadius: scale(15),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  messageText: {
    fontSize: scaleFont(14),
    color: '#FFFFFF',
    marginBottom: scale(5),
  },
  timestamp: {
    fontSize: scaleFont(10),
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  inputContainer: {
    padding: scale(10),
    backgroundColor: 'rgba(30, 30, 63, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(173, 77, 255, 0.3)',
  },
  inputGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scale(25),
    padding: scale(5),
    shadowColor: '#AD4DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  input: {
    flex: 1,
    fontSize: scaleFont(14),
    color: '#FFFFFF',
    padding: scale(10),
    maxHeight: scale(100),
  },
  sendButton: {
    borderRadius: scale(20),
    overflow: 'hidden',
  },
  sendButtonGradient: {
    padding: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: scaleFont(14),
    color: '#D8B4FE',
    textAlign: 'center',
    marginTop: scale(20),
  },
});

export default Chat;