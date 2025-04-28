import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  TextInput,
  Image,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Share from 'react-native-share';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchReels,
  fetchComments,
  postComment,
  setRefreshing,
} from '../redux/slices/reelsSlice';
import {
  BASE_URL,
  ALLOWED_ASPECT_RATIOS,
  REELS_LOADER_COLOR,
  REELS_REFRESH_TINT_COLOR,
  REELS_MODAL_BG_COLOR,
  REELS_MODAL_TEXT_COLOR,
  REELS_BUTTON_COLOR,
  EMPTY_REELS_TEXT,
} from '../constants/GlobalConstants';

const { height, width } = Dimensions.get('window');

const Reels = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { reels, comments, loading, refreshing, error } = useSelector((state) => state.reels);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedReels, setLikedReels] = useState({});
  const [savedReels, setSavedReels] = useState({});
  const [muted, setMuted] = useState(true);
  const [pausedReels, setPausedReels] = useState({});
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedReelId, setSelectedReelId] = useState(null);
  const [buffering, setBuffering] = useState({});
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [showMuteIcon, setShowMuteIcon] = useState(false);
  const [videoAspectRatios, setVideoAspectRatios] = useState({});
  const flatListRef = useRef(null);
  const videoRefs = useRef({});
  const likeAnim = useRef(new Animated.Value(1)).current;
  const doubleTapAnim = useRef(new Animated.Value(0)).current;
  const muteIconOpacity = useRef(new Animated.Value(0)).current;
  const tapTimeoutRef = useRef(null);
  const lastTapRef = useRef({ time: 0, id: null });

  // Show mute/unmute icon with animation
  const showMuteIconAnimation = useCallback(() => {
    setShowMuteIcon(true);
    Animated.sequence([
      Animated.timing(muteIconOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(muteIconOpacity, {
        toValue: 0,
        duration: 200,
        delay: 800,
        useNativeDriver: true,
      }),
    ]).start(() => setShowMuteIcon(false));
  }, [muteIconOpacity]);

  // Fetch reels
  const fetchReelsData = useCallback(
    (isRefresh = false) => {
      if (isRefresh) {
        dispatch(setRefreshing(true));
      }
      dispatch(fetchReels());
    },
    [dispatch]
  );

  useEffect(() => {
    fetchReelsData();
  }, [fetchReelsData]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    fetchReelsData(true);
  }, [fetchReelsData]);

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
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(doubleTapAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(doubleTapAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]).start();
        }
        clearTimeout(tapTimeoutRef.current);
        lastTapRef.current = { time: now, id };
      } else {
        // Single tap: Schedule mute/unmute after delay
        lastTapRef.current = { time: now, id };
        tapTimeoutRef.current = setTimeout(() => {
          setMuted((prev) => {
            const newMuted = !prev;
            showMuteIconAnimation();
            return newMuted;
          });
        }, DOUBLE_PRESS_DELAY);
      }
    },
    [likedReels, handleLike, doubleTapAnim, showMuteIconAnimation]
  );

  // Handle long press to pause
  const handleLongPress = useCallback(
    (id) => {
      setPausedReels((prev) => ({ ...prev, [id]: true }));
    },
    []
  );

  // Handle release to resume
  const handlePressOut = useCallback(
    (id) => {
      setPausedReels((prev) => ({ ...prev, [id]: false }));
    },
    []
  );

  const handleSave = useCallback((id) => {
    setSavedReels((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Share reel
  const handleShare = useCallback(
    async (reel) => {
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
    },
    []
  );

  // Handle viewable items changed for updating currentIndex
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }) => {
      if (viewableItems.length > 0) {
        const newIndex = viewableItems[0].index;
        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
          setCurrentIndex(newIndex);
          console.log('Snapped to index:', newIndex);
          if (videoRefs.current[reels[newIndex]?._id]) {
            videoRefs.current[reels[newIndex]._id].seek(0);
          }
        }
      }
    },
    [currentIndex, reels]
  );

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 80,
      minimumViewTime: 100,
    }),
    []
  );

  // Define item layout for FlatList
  const getItemLayout = useCallback(
    (data, index) => ({
      length: height - insets.top - insets.bottom,
      offset: (height - insets.top - insets.bottom) * index,
      index,
    }),
    [insets]
  );

  // Render each reel
  const renderItem = useCallback(
    ({ item, index }) => {
      const isActive = currentIndex === index && isScreenFocused;
      const isPaused = pausedReels[item._id] || false;
      const videoUri = item.videoUrl;

      // Calculate video dimensions
      const aspectRatio = videoAspectRatios[item._id] || 9 / 16;
      const videoHeight = Math.min(width / aspectRatio, height - insets.top - insets.bottom);
      const videoWidth = videoHeight * aspectRatio;
      const offsetX = (width - videoWidth) / 2;
      const offsetY = (height - insets.top - insets.bottom - videoHeight) / 2;

      return (
        <TouchableWithoutFeedback
          onPress={() => handleTap(item._id)}
          onLongPress={() => handleLongPress(item._id)}
          onPressOut={() => handlePressOut(item._id)}
        >
          <View style={[styles.reelContainer, { height: height - insets.top - insets.bottom }]}>
            <Video
              ref={(ref) => (videoRefs.current[item._id] = ref)}
              source={{ uri: videoUri }}
              style={[
                styles.video,
                {
                  width: videoWidth,
                  height: videoHeight,
                  left: offsetX,
                  top: offsetY,
                },
              ]}
              resizeMode="contain"
              repeat
              muted={muted}
              paused={!isActive || isPaused}
              onLoad={({ naturalSize }) => {
                const { width: videoWidth, height: videoHeight } = naturalSize;
                const naturalAspectRatio = videoWidth / videoHeight;
                const closestAspectRatio = ALLOWED_ASPECT_RATIOS.reduce((prev, curr) =>
                  Math.abs(curr - naturalAspectRatio) < Math.abs(prev - naturalAspectRatio)
                    ? curr
                    : prev
                );
                setVideoAspectRatios((prev) => ({
                  ...prev,
                  [item._id]: closestAspectRatio,
                }));
              }}
              onBuffer={({ isBuffering }) => {
                setBuffering((prev) => ({ ...prev, [item._id]: isBuffering }));
              }}
              onError={(e) => {
                console.error('Video error for', item._id, ':', e);
              }}
              bufferConfig={{
                minBufferMs: 2000,
                maxBufferMs: 5000,
                bufferForPlaybackMs: 1000,
                bufferForPlaybackAfterRebufferMs: 1500,
              }}
            />
            {buffering[item._id] && (
              <ActivityIndicator
                size="large"
                color={REELS_LOADER_COLOR}
                style={styles.bufferIndicator}
              />
            )}
            {showMuteIcon && (
              <Animated.View
                style={[
                  styles.muteIconContainer,
                  { opacity: muteIconOpacity },
                ]}
              >
                <Ionicons
                  name={muted ? 'volume-mute' : 'volume-high'}
                  size={40}
                  color={REELS_MODAL_TEXT_COLOR}
                />
              </Animated.View>
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
              <Ionicons name="heart" size={80} color={REELS_MODAL_TEXT_COLOR} />
            </Animated.View>

            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={[styles.overlay, { paddingBottom: insets.bottom + 16 }]}
            >
              <View style={[styles.bottomLeft, { bottom: insets.bottom + 80 }]}>
                <View style={styles.userInfo}>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => navigation.navigate('UserProfile', { userId: item.user?._id })}
                  >
                    <Image
                      source={{ uri: item.user?.avatar }}
                      style={styles.avatar}
                    />
                    <Text style={styles.username}>
                      @{item.user?.userName}
                    </Text>
                  </TouchableOpacity>
                  <Pressable style={styles.followButton}>
                    <Text style={styles.followText}>Follow</Text>
                  </Pressable>
                </View>
                <Text style={styles.caption}>{item.caption}</Text>
                <Text style={styles.stats}>
                  {likedReels[item._id] ? item.likes + 1 : item.likes} Likes ·{' '}
                  {item.comments} Comments
                </Text>
              </View>

              <View style={[styles.rightButtons, { bottom: insets.bottom + 80 }]}>
                <Animated.View
                  style={[styles.iconContainer, { transform: [{ scale: likeAnim }] }]}
                >
                  <Ionicons
                    name={likedReels[item._id] ? 'heart' : 'heart-outline'}
                    size={30}
                    color={likedReels[item._id] ? 'red' : REELS_MODAL_TEXT_COLOR}
                    onPress={() => handleLike(item._id)}
                  />
                  <Text style={styles.iconText}>
                    {(likedReels[item._id] ? item.likes + 1 : item.likes).toString()}
                  </Text>
                </Animated.View>

                <Pressable
                  onPress={() => {
                    setSelectedReelId(item._id);
                    dispatch(fetchComments(item._id));
                    setCommentModalVisible(true);
                  }}
                  style={styles.iconContainer}
                >
                  <Ionicons name="chatbubble-outline" size={26} color={REELS_MODAL_TEXT_COLOR} />
                  <Text style={styles.iconText}>{item.comments.toString()}</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setSelectedReelId(item._id);
                    setShareModalVisible(true);
                  }}
                  style={styles.iconContainer}
                >
                  <Ionicons name="paper-plane-outline" size={26} color={REELS_MODAL_TEXT_COLOR} />
                  <Text style={styles.iconText}>Share</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleSave(item._id)}
                  style={styles.iconContainer}
                >
                  <Ionicons
                    name={savedReels[item._id] ? 'bookmark' : 'bookmark-outline'}
                    size={26}
                    color={REELS_MODAL_TEXT_COLOR}
                  />
                </Pressable>

                <Pressable
                  onPress={() => {
                    setMuted((prev) => {
                      const newMuted = !prev;
                      showMuteIconAnimation();
                      return newMuted;
                    });
                  }}
                  style={styles.iconContainer}
                >
                  <Ionicons
                    name={muted ? 'volume-mute' : 'volume-high'}
                    size={26}
                    color={REELS_MODAL_TEXT_COLOR}
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
      pausedReels,
      buffering,
      handleLike,
      handleTap,
      handleLongPress,
      handlePressOut,
      handleSave,
      likeAnim,
      doubleTapAnim,
      dispatch,
      isScreenFocused,
      reels,
      navigation,
      videoAspectRatios,
      showMuteIcon,
      muteIconOpacity,
      showMuteIconAnimation,
      insets,
    ]
  );

  // Post a comment
  const handlePostComment = useCallback(() => {
    if (!newComment.trim() || !selectedReelId) return;
    dispatch(postComment({ reelId: selectedReelId, text: newComment }));
    setNewComment('');
  }, [dispatch, newComment, selectedReelId]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={REELS_LOADER_COLOR} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={reels}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        pagingEnabled
        snapToInterval={height - insets.top - insets.bottom}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        removeClippedSubviews={true}
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={REELS_REFRESH_TINT_COLOR}
            colors={[REELS_REFRESH_TINT_COLOR]}
            progressBackgroundColor="black"
          />
        }
        ListEmptyComponent={
          !loading && !refreshing && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {error ? `Error: ${error}` : EMPTY_REELS_TEXT}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => fetchReelsData()}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      {/* Comment Modal */}
      <Modal visible={commentModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.commentBox}>
            <Text style={styles.modalTitle}>Comments</Text>
            <FlatList
              data={comments[selectedReelId] || []}
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
              <Pressable onPress={handlePostComment} style={styles.postButton}>
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
              onPress={() => handleShare(reels.find((reel) => reel._id === selectedReelId))}
              style={styles.shareOption}
            >
              <Text style={styles.shareOptionText}>Share via...</Text>
            </Pressable>
            <Pressable
              onPress={() => {
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
    width,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    position: 'absolute',
  },
  bufferIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  muteIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
    width: '100%',
  },
  bottomLeft: {
    position: 'absolute',
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
    backgroundColor: REELS_MODAL_BG_COLOR,
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
    color: REELS_BUTTON_COLOR,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  closeBtn: {
    marginTop: 20,
    color: REELS_BUTTON_COLOR,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  centeredModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: REELS_MODAL_BG_COLOR,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: height * 0.8,
  },
  emptyText: {
    color: REELS_MODAL_TEXT_COLOR,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: REELS_BUTTON_COLOR,
    borderRadius: 10,
  },
  retryButtonText: {
    color: REELS_MODAL_TEXT_COLOR,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Reels;