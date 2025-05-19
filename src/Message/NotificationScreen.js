import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  Dimensions,
  Animated,
  Platform,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChatList } from '../redux/slices/chatSlice';
import Header from '../Components/Header';
import { DEFAULT_IMAGE_URL } from '../constants/GlobalConstants';

const { width } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, Dimensions.get('window').height) / 375));

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

const NotificationScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();
  const { chats, loading, error } = useSelector((state) => state.chat);
  const [animation] = useState(new Animated.Value(0));
  const [filteredChats, setFilteredChats] = useState([]);

  useEffect(() => {
    dispatch(fetchChatList({ page: 1, limit: 20 }));
    Animated.timing(animation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [dispatch]);

  useEffect(() => {
    if (search) {
      const filtered = chats.filter(
        (chat) =>
          chat.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          chat.latestMessageContent?.toLowerCase().includes(search.toLowerCase()),
      );
      setFilteredChats(filtered);
    } else {
      setFilteredChats(chats);
    }
  }, [search, chats]);

  const onRefresh = () => {
    setRefreshing(true);
    dispatch(fetchChatList({ page: 1, limit: 20 })).finally(() => {
      setRefreshing(false);
    });
  };

  const handleHeaderIconPress = (icon) => {
    if (icon === 'back') {
      navigation.goBack();
    } else if (icon === 'camera') {
      alert('Camera feature coming soon...');
    }
  };

  const renderChatItem = ({ item, index }) => {
    const translateY = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [50 * (index + 1), 0],
    });

    const opacity = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Animated.View
        style={[
          styles.messageItem,
          {
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.messageContent}
          activeOpacity={0.7}
          onPress={() =>
            navigation.navigate('Message', {
              user: {
                _id: item.userId,
                fullName: item.fullName || 'Unknown User',
                userName: item.userName || 'unknown',
                profilePicture: item.profilePicture || DEFAULT_IMAGE_URL,
              },
              recipientId: item.userId,
            })
          }
        >
          <View style={[styles.avatarContainer, item.isOnline && styles.onlineAvatar]}>
            <Image
              source={{ uri: item.profilePicture || DEFAULT_IMAGE_URL }}
              style={styles.avatar}
            />
            {item.isOnline && <View style={styles.onlineIndicator} />}
          </View>
          <View style={styles.messageInfo}>
            <View style={styles.messageHeader}>
              <Text style={styles.userName}>{item.fullName || 'Unknown User'}</Text>
              <Text style={styles.time}>{item.timeAgo || 'N/A'}</Text>
            </View>
            <Text style={styles.messageText} numberOfLines={1}>
              {item.latestMessageContent || 'No messages yet'}
            </Text>
            {item.messageCount > 0 && (
              <Text style={styles.messageCount}>Messages: {item.messageCount}</Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <LinearGradient
      colors={BACKGROUND_GRADIENT}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <Header
        isSearch={true}
        searchValue={search}
        onSearchChange={(text) => setSearch(text)}
        showLeftIcon={true}
        leftIcon="arrow-back"
        onLeftPress={() => handleHeaderIconPress('back')}
        showRightIcon1={true}
        rightIcon1="camera"
        onRightPress1={() => handleHeaderIconPress('camera')}
        textStyle={{ color: TEXT_THEME_COLOR }}
      />

      <View style={styles.content}>
        <Text style={styles.title}>Messages</Text>
        {loading && !refreshing && <Text style={styles.loadingText}>Loading...</Text>}
        {error && <Text style={styles.errorText}>{error}</Text>}
        {!loading && !error && filteredChats.length === 0 && (
          <Text style={styles.emptyText}>No chats available</Text>
        )}
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.userId?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={PRIMARY_THEME_COLOR}
              colors={[PRIMARY_THEME_COLOR]}
              progressBackgroundColor={PRODUCT_BG_COLOR}
            />
          }
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: scale(15),
  },
  title: {
    fontSize: scaleFont(26),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
    marginBottom: scale(25),
    marginLeft: scale(5),
  },
  listContent: {
    paddingBottom: scale(30),
  },
  messageItem: {
    marginBottom: scale(15),
    borderRadius: scale(18),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRODUCT_BG_COLOR,
    padding: scale(18),
    borderRadius: scale(18),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: scale(15),
  },
  avatar: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
  },
  onlineAvatar: {
    borderWidth: scale(2),
    borderColor: PRIMARY_THEME_COLOR,
  },
  onlineIndicator: {
    width: scale(14),
    height: scale(14),
    borderRadius: scale(7),
    backgroundColor: PRIMARY_THEME_COLOR,
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: scale(2),
    borderColor: PRODUCT_BG_COLOR,
  },
  messageInfo: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(6),
  },
  userName: {
    fontSize: scaleFont(17),
    fontWeight: '600',
    color: TEXT_THEME_COLOR,
  },
  time: {
    fontSize: scaleFont(13),
    color: SUBTEXT_THEME_COLOR,
  },
  messageText: {
    fontSize: scaleFont(15),
    color: TEXT_THEME_COLOR,
  },
  messageCount: {
    fontSize: scaleFont(13),
    color: SUBTEXT_THEME_COLOR,
    marginTop: scale(6),
  },
  loadingText: {
    color: TEXT_THEME_COLOR,
    textAlign: 'center',
    marginVertical: scale(15),
    fontSize: scaleFont(16),
  },
  errorText: {
    color: SECONDARY_THEME_COLOR,
    textAlign: 'center',
    marginVertical: scale(15),
    fontSize: scaleFont(16),
  },
  emptyText: {
    color: SUBTEXT_THEME_COLOR,
    textAlign: 'center',
    marginVertical: scale(25),
    fontSize: scaleFont(17),
  },
});

export default NotificationScreen;