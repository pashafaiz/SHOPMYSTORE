import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image,
  RefreshControl
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSellerChats, fetchChatMessages, sendMessage } from '../redux/slices/sellerSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../Components/Header';
import moment from 'moment';
import { COLORS, SIZES, FONTS, scale, scaleFont, commonStyles } from '../utils/theme';

const SellerChats = ({ navigation }) => {
  const dispatch = useDispatch();
  const { chats, loading, error } = useSelector((state) => state.seller);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      dispatch(fetchSellerChats({ page, limit: 10 }));
    }, [page])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    dispatch(fetchSellerChats({ page: 1, limit: 10 }));
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (chats.length >= page * 10) {
      setPage(page + 1);
    }
  };

  const handleChatPress = (chatId) => {
    dispatch(fetchChatMessages(chatId));
    navigation.navigate('ChatScreen', { chatId });
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity 
      style={[commonStyles.card, styles.chatItem]}
      onPress={() => handleChatPress(item._id)}
    >
      <Image 
        source={{ uri: item.customer.profilePicture }} 
        style={styles.avatar} 
      />
      <View style={styles.chatContent}>
        <Text style={styles.customerName}>{item.customer.userName}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.messages.length > 0 ? item.messages[item.messages.length - 1].content : 'No messages yet'}
        </Text>
      </View>
      <View style={styles.chatMeta}>
        <Text style={styles.time}>
          {item.lastMessage ? moment(item.lastMessage).format('hh:mm A') : ''}
        </Text>
        {item.messages.some(msg => !msg.read && msg.sender !== item.seller) && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>New</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && !chats.length && !refreshing) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={commonStyles.errorContainer}>
        <Text style={commonStyles.errorText}>{error}</Text>
        <TouchableOpacity onPress={handleRefresh} style={commonStyles.retryButton}>
          <Text style={commonStyles.retryText}>Retry</Text>
          <Icon name="refresh" size={18} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient colors={COLORS.GRADIENT} style={commonStyles.container}>
      <Header 
        title="Customer Chats" 
      />
      <View style={styles.contentContainer}>
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh} 
              colors={[COLORS.PRIMARY]} 
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={commonStyles.emptyContainer}>
              <Icon name="chat" size={50} color={COLORS.SUBTEXT} />
              <Text style={commonStyles.emptyText}>No chats yet</Text>
            </View>
          }
        />
      </View>
    </LinearGradient>
  );
};

const ChatScreen = ({ route }) => {
  const { chatId } = route.params;
  const dispatch = useDispatch();
  const { currentChat, loading, error } = useSelector((state) => state.seller);
  const [message, setMessage] = useState('');

  useEffect(() => {
    dispatch(fetchChatMessages(chatId));
  }, [chatId, dispatch]);

  const handleSendMessage = () => {
    if (message.trim()) {
      dispatch(sendMessage({ chatId, content: message }));
      setMessage('');
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.sender === currentChat?.seller ? styles.sentMessage : styles.receivedMessage
    ]}>
      <Text style={styles.messageText}>{item.content}</Text>
      <Text style={styles.messageTime}>
        {moment(item.timestamp).format('hh:mm A')}
      </Text>
    </View>
  );

  return (
    <LinearGradient colors={COLORS.GRADIENT} style={commonStyles.container}>
      <Header 
        title="Chat" 
        showLeftIcon={true} 
        onLeftPress={() => navigation.goBack()}
        showRightIcon1={true}
      />
      <View style={styles.chatContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        ) : error ? (
          <View style={commonStyles.errorContainer}>
            <Text style={commonStyles.errorText}>{error}</Text>
            <TouchableOpacity 
              onPress={() => dispatch(fetchChatMessages(chatId))}
              style={commonStyles.retryButton}
            >
              <Text style={commonStyles.retryText}>Retry</Text>
              <Icon name="refresh" size={18} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={currentChat?.messages || []}
              renderItem={renderMessage}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.messagesList}
              inverted
            />
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={message}
                onChangeText={setMessage}
                placeholder="Type a message..."
                placeholderTextColor={COLORS.SUBTEXT}
                multiline
              />
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={handleSendMessage}
              >
                <Icon name="send" size={24} color={COLORS.PRIMARY} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: scale(15),
  },
  listContainer: {
    paddingBottom: scale(20),
  },
  chatItem: {
    flexDirection: 'row',
    padding: scale(15),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    marginBottom: scale(10),
  },
  avatar: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    marginRight: scale(15),
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  customerName: {
    ...FONTS.h3,
    fontWeight: '600',
    color: COLORS.TEXT,
  },
  lastMessage: {
    ...FONTS.body3,
    color: COLORS.SUBTEXT,
    marginTop: scale(5),
  },
  chatMeta: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  time: {
    ...FONTS.body4,
    color: COLORS.SUBTEXT,
  },
  unreadBadge: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: scale(10),
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    marginTop: scale(5),
  },
  unreadText: {
    color: '#fff',
    ...FONTS.body4,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
    padding: scale(15),
  },
  messagesList: {
    padding: scale(15),
  },
  messageContainer: {
    maxWidth: '80%',
    padding: scale(10),
    borderRadius: scale(12),
    marginBottom: scale(10),
    shadowColor: COLORS.TEXT,
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 3,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.PRIMARY,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  messageText: {
    ...FONTS.body3,
    color: '#333',
  },
  sentMessageText: {
    color: '#fff',
  },
  messageTime: {
    ...FONTS.body4,
    color: COLORS.SUBTEXT,
    marginTop: scale(5),
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: scale(10),
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    borderRadius: scale(12),
    margin: scale(10),
    shadowColor: COLORS.TEXT,
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  input: {
    flex: 1,
    borderRadius: scale(20),
    paddingHorizontal: scale(15),
    paddingVertical: scale(10),
    maxHeight: scale(100),
    backgroundColor: COLORS.CARD_BACKGROUND,
    color: COLORS.TEXT,
  },
  sendButton: {
    marginLeft: scale(10),
    alignSelf: 'center',
  },
});

export { SellerChats, ChatScreen };