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
          chat.latestMessageContent?.toLowerCase().includes(search.toLowerCase())
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
      colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']}
      style={styles.container}
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
              tintColor="#FFFFFF"
              colors={['#FFFFFF']}
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
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    marginLeft: 5,
  },
  listContent: {
    paddingBottom: 20,
  },
  messageItem: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 15,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineAvatar: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#1A0B3B',
  },
  messageInfo: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  time: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  messageText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 5,
  },
  loadingText: {
    color: 'white',
    textAlign: 'center',
    marginVertical: 10,
  },
  errorText: {
    color: '#FF3E6D',
    textAlign: 'center',
    marginVertical: 10,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
});

export default NotificationScreen;