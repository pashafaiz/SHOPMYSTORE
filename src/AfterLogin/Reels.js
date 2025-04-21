

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  TouchableWithoutFeedback,
  Text,
  Animated,
  Pressable,
  Modal,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Share from 'react-native-share';
import LinearGradient from 'react-native-linear-gradient';
import { getReelsApi, BASE_URL, postCommentApi, getCommentsApi } from '../../apiClient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { height, width } = Dimensions.get('window');

const Reels = () => {
  const navigation = useNavigation();
  const [reelsData, setReelsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedReels, setLikedReels] = useState({});
  const [savedReels, setSavedReels] = useState({});
  const [muted, setMuted] = useState(true);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [selectedReelId, setSelectedReelId] = useState(null);
  const [buffering, setBuffering] = useState({});
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const flatListRef = useRef(null);
  const videoRefs = useRef({});
  const likeAnim = useRef(new Animated.Value(1)).current;
  const doubleTapAnim = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef({ time: 0, id: null });

  // Fetch reels
  const fetchReels = useCallback(async () => {
    setLoading(true);
    try {
      const { ok, data } = await getReelsApi();
      if (ok && Array.isArray(data.reels)) {
        setReelsData(data.reels);
      } else {
        console.error('Invalid reels format:', data);
        setReelsData([]);
      }
    } catch (error) {
      console.error('Reels fetch error:', error);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

  // Pause all reels when screen loses focus
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      return () => {
        setIsScreenFocused(false);
        Object.values(videoRefs.current).forEach((ref) => {
          if (ref) ref.seek(0);
        });
      };
    }, [])
  );

  // Fetch comments for a reel
  const fetchComments = useCallback(async (reelId) => {
    try {
      const { ok, data } = await getCommentsApi(reelId);
      if (ok) {
        setComments(data.comments || []);
      } else {
        console.warn('Failed to fetch comments:', data.msg);
      }
    } catch (error) {
      console.error('Comments fetch error:', error);
    }
  }, []);

  // Post a comment
  const postComment = useCallback(async () => {
    if (!newComment.trim() || !selectedReelId) return;
    try {
      const { ok, data } = await postCommentApi(selectedReelId, { text: newComment });
      if (ok) {
        fetchComments(selectedReelId);
        setNewComment('');
      } else {
        console.warn('Failed to post comment:', data.msg);
      }
    } catch (error) {
      console.error('Post comment error:', error);
    }
  }, [newComment, selectedReelId, fetchComments]);

  // Handle like
  const handleLike = useCallback(
    (id) => {
      setLikedReels((prev) => ({ ...prev, [id]: !prev[id] }));
      Animated.sequence([
        Animated.timing(likeAnim, {
          toValue: 1.4,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(likeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [likeAnim]
  );

  // Handle tap (single tap for mute/unmute, double tap for like)
  const handleTap = useCallback(
    (id) => {
      const now = Date.now();
      const DOUBLE_PRESS_DELAY = 300;
      const UNMUTE_DELAY = 2000; // 2 seconds for unmute

      if (
        lastTapRef.current.id === id &&
        now - lastTapRef.current.time < DOUBLE_PRESS_DELAY
      ) {
        // Double tap: Like the reel
        if (!likedReels[id]) {
          handleLike(id);
          Animated.sequence([
            Animated.timing(doubleTapAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(doubleTapAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
        lastTapRef.current = { time: now, id };
      } else {
        // Single tap: Mute or schedule unmute
        if (!muted) {
          // Mute immediately
          setMuted(true);
        } else {
          // Already muted, schedule unmute after 2 seconds
          setTimeout(() => {
            setMuted(false);
          }, UNMUTE_DELAY);
        }
        lastTapRef.current = { time: now, id };
      }
    },
    [likedReels, handleLike, doubleTapAnim, muted]
  );

  const handleSave = useCallback((id) => {
    setSavedReels((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Share reel
  const handleShare = useCallback(async (reel) => {
    try {
      const shareOptions = {
        message: `Check out this reel: ${reel.caption}`,
        url: reel.videoUrl,
      };
      await Share.open(shareOptions);
    } catch (error) {
      console.error('Share error:', error);
    }
    setShareModalVisible(false);
  }, []);

  // Handle scroll to update current index and reset video position
  const onViewableItemsChanged = useRef(({ viewableItems, changed }) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setCurrentIndex(newIndex);

      // Reset video position for the newly visible reel
      if (videoRefs.current[reelsData[newIndex]?._id]) {
        videoRefs.current[reelsData[newIndex]._id].seek(0);
      }

      // Reset position of videos that are no longer visible
      changed.forEach(({ item, isViewable }) => {
        if (!isViewable && videoRefs.current[item._id]) {
          videoRefs.current[item._id].seek(0);
        }
      });
    }
  }).current;

  // Render each reel
  const renderItem = useCallback(
    ({ item, index }) => {
      const isActive = currentIndex === index && isScreenFocused;
      const videoUri = item.videoUrl.startsWith('http')
        ? item.videoUrl
        : `${BASE_URL.replace('/api', '')}/${item.videoUrl.replace(/^\/+/, '')}`;

      return (
        <TouchableWithoutFeedback onPress={() => handleTap(item._id)}>
          <View style={styles.reelContainer}>
            <Video
              ref={(ref) => (videoRefs.current[item._id] = ref)}
              source={{ uri: videoUri }}
              style={styles.video}
              resizeMode="cover"
              repeat
              muted={muted}
              paused={!isActive}
              onBuffer={({ isBuffering }) => {
                setBuffering((prev) => ({ ...prev, [item._id]: isBuffering }));
              }}
              onError={(e) => console.log('Video error:', e)}
              bufferConfig={{
                minBufferMs: 2000,
                maxBufferMs: 5000,
                bufferForPlaybackMs: 1000,
                bufferForPlaybackAfterRebufferMs: 1500,
              }}
              quality="high"
            />
            {buffering[item._id] && (
              <ActivityIndicator
                size="large"
                color="white"
                style={styles.bufferIndicator}
              />
            )}

            {/* Double-tap like animation */}
            <Animated.View
              style={[
                styles.doubleTapHeart,
                {
                  opacity: doubleTapAnim,
                  transform: [{ scale: doubleTapAnim }],
                },
              ]}
            >
              <Ionicons name="heart" size={80} color="white" />
            </Animated.View>

            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.overlay}
            >
              <View style={styles.bottomLeft}>
                <View style={styles.userInfo}>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => navigation.navigate('UploadReel')}
                  >
                    <Image
                      source={{ uri: item.user?.avatar || 'https://via.placeholder.com/40' }}
                      style={styles.avatar}
                    />
                    <Text style={styles.username}>
                      @{item.user?.userName || 'unknown'}
                    </Text>
                  </TouchableOpacity>
                  <Pressable style={styles.followButton}>
                    <Text style={styles.followText}>Follow</Text>
                  </Pressable>
                </View>
                <Text style={styles.caption}>{item.caption || ''}</Text>
                <Text style={styles.stats}>
                  {likedReels[item._id] ? item.likes + 1 : item.likes || 0} Likes ·{' '}
                  {item.comments || 0} Comments
                </Text>
              </View>

              <View style={styles.rightButtons}>
                <Animated.View
                  style={[
                    styles.iconContainer,
                    { transform: [{ scale: likeAnim }] },
                  ]}
                >
                  <Ionicons
                    name={likedReels[item._id] ? 'heart' : 'heart-outline'}
                    size={30}
                    color={likedReels[item._id] ? 'red' : 'white'}
                    onPress={() => handleLike(item._id)}
                  />
                  <Text style={styles.iconText}>
                    {(likedReels[item._id] ? item.likes + 1 : item.likes || 0).toString()}
                  </Text>
                </Animated.View>

                <Pressable
                  onPress={() => {
                    setSelectedReelId(item._id);
                    fetchComments(item._id);
                    setCommentModalVisible(true);
                  }}
                  style={styles.iconContainer}
                >
                  <Ionicons name="chatbubble-outline" size={26} color="white" />
                  <Text style={styles.iconText}>{(item.comments || 0).toString()}</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setSelectedReelId(item._id);
                    setShareModalVisible(true);
                  }}
                  style={styles.iconContainer}
                >
                  <Ionicons name="paper-plane-outline" size={26} color="white" />
                  <Text style={styles.iconText}>Share</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleSave(item._id)}
                  style={styles.iconContainer}
                >
                  <Ionicons
                    name={savedReels[item._id] ? 'bookmark' : 'bookmark-outline'}
                    size={26}
                    color="white"
                  />
                </Pressable>

                <Pressable
                  onPress={() => setMuted((prev) => !prev)}
                  style={styles.iconContainer}
                >
                  <Ionicons
                    name={muted ? 'volume-mute' : 'volume-high'}
                    size={26}
                    color="white"
                  />
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        </TouchableWithoutFeedback>
      );
    },
    [
      currentIndex,
      likedReels,
      savedReels,
      muted,
      buffering,
      handleLike,
      handleTap,
      handleSave,
      likeAnim,
      doubleTapAnim,
      fetchComments,
      isScreenFocused,
      reelsData,
    ]
  );

  // Optimize FlatList rendering
  const getItemLayout = (data, index) => ({
    length: height - 50,
    offset: (height - 50) * index,
    index,
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="white" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={reelsData}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height - 50}
        snapToAlignment="start"
        decelerationRate="fast"
        initialNumToRender={1} // Render one reel at a time
        maxToRenderPerBatch={2}
        windowSize={3} // Reduced to minimize overlap
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 90, // Stricter snapping
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchReels} />
        }
        snapToOffsets={reelsData.map((_, index) => index * (height - 50))} // Explicit snap points
      />

      {/* Comment Modal */}
      <Modal visible={commentModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.commentBox}>
            <Text style={styles.modalTitle}>Comments</Text>
            <FlatList
              data={comments}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Text style={styles.commentUser}>{item.userName}</Text>
                  <Text style={styles.commentText}>{item.text}</Text>
                </View>
              )}
              keyExtractor={(item) => item._id}
              style={styles.commentList}
            />
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Add a comment..."
                placeholderTextColor="gray"
              />
              <Pressable onPress={postComment} style={styles.postButton}>
                <Text style={styles.postButtonText}>Post</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => setCommentModalVisible(false)}>
              <Text style={styles.closeBtn}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal visible={shareModalVisible} animationType="fade" transparent>
        <View style={styles.centeredModalContainer}>
          <View style={styles.shareBox}>
            <Text style={styles.modalTitle}>Share Reel</Text>
            <Pressable
              onPress={() => handleShare(reelsData.find((reel) => reel._id === selectedReelId))}
              style={styles.shareOption}
            >
              <Text style={styles.shareOptionText}>Share via...</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                // Copy link logic (use react-native-clipboard)
                setShareModalVisible(false);
              }}
              style={styles.shareOption}
            >
              <Text style={styles.shareOptionText}>Copy Link</Text>
            </Pressable>
            <Pressable onPress={() => setShareModalVisible(false)}>
              <Text style={styles.closeBtn}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  reelContainer: {
    height: height - 50,
    width,
    backgroundColor: 'black',
  },
  video: {
    height: '100%',
    width: '100%',
    position: 'absolute',
  },
  bufferIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  bottomLeft: {
    position: 'absolute',
    bottom: 80,
    left: 10,
    width: '70%',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'white',
  },
  username: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  followButton: {
    marginLeft: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 12,
  },
  followText: {
    color: 'white',
    fontSize: 12,
  },
  caption: {
    color: 'white',
    fontSize: 14,
    marginBottom: 4,
  },
  stats: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
  },
  rightButtons: {
    position: 'absolute',
    right: 10,
    bottom: 80,
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  doubleTapHeart: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  commentBox: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
  },
  commentList: {
    maxHeight: height * 0.5,
  },
  commentItem: {
    marginBottom: 10,
  },
  commentUser: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  commentText: {
    fontSize: 14,
    color: 'gray',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
  },
  postButton: {
    padding: 10,
  },
  postButtonText: {
    color: 'blue',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  closeBtn: {
    marginTop: 20,
    color: 'blue',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  centeredModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  shareBox: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    width: '80%',
    alignItems: 'center',
  },
  shareOption: {
    padding: 10,
    width: '100%',
    alignItems: 'center',
  },
  shareOptionText: {
    fontSize: 16,
    color: 'black',
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Reels;