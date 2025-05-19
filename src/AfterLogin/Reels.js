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
  KeyboardAvoidingView,
  Platform,
  Easing,
} from 'react-native';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Share from 'react-native-share';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchReels,
  fetchComments,
  postComment,
  deleteComment,
  likeReel,
  unlikeReel,
  setRefreshing,
  setCommentsRefreshing,
  clearError,
} from '../redux/slices/reelsSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BASE_URL,
  ALLOWED_ASPECT_RATIOS,
  USER_TOKEN_KEY,
  TOAST_POSITION,
  TOAST_TOP_OFFSET,
} from '../constants/GlobalConstants';
import Toast from 'react-native-toast-message';
import ConfettiCannon from 'react-native-confetti-cannon';

// Define theme colors (move to GlobalConstants.js if possible)
const PRODUCT_BG_COLOR = '#f5f9ff';
const CATEGORY_BG_COLOR = 'rgba(91, 156, 255, 0.2)';
const SELECTED_CATEGORY_BG_COLOR = '#5b9cff';
const PREMIUM_BADGE_COLOR = '#fef08a';
const PREMIUM_TEXT_COLOR = '#1a2b4a';
const PRIMARY_THEME_COLOR = '#5b9cff';
const SECONDARY_THEME_COLOR = '#ff6b8a';
const TEXT_THEME_COLOR = '#1a2b4a';
const SUBTEXT_THEME_COLOR = '#5a6b8a';
const BORDER_THEME_COLOR = 'rgba(91, 156, 255, 0.3)';
const BACKGROUND_GRADIENT = ['#8ec5fc', '#fff'];
const REELS_LOADER_COLOR = '#5b9cff';
const REELS_REFRESH_TINT_COLOR = '#5b9cff';
const REELS_MODAL_BG_COLOR = '#f5f9ff';
const REELS_MODAL_TEXT_COLOR = '#1a2b4a';
const REELS_BUTTON_COLOR = '#5b9cff';
const EMPTY_REELS_TEXT = 'No reels available. Try again!';

const { height, width } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375));

// ReelItem component
const ReelItem = ({
  item,
  index,
  currentIndex,
  isScreenFocused,
  pausedReels,
  muted,
  buffering,
  videoAspectRatios,
  showMuteIcon,
  muteIconOpacity,
  showConfetti,
  savedReels,
  likeAnim,
  doubleTapAnim,
  premiumBadgeAnim,
  insets,
  handleTap,
  handleLongPress,
  handlePressOut,
  handleLike,
  handleSave,
  openCommentModal,
  showMuteIconAnimation,
  navigation,
  videoRefs,
  confettiRef,
  setBuffering,
  setVideoAspectRatios,
  setSelectedReelId,
  setShareModalVisible,
}) => {
  const isActive = currentIndex === index && isScreenFocused;
  const isPaused = pausedReels[item._id] || false;
  const videoUri = item.videoUrl;
  const isLiked = item.isLiked;

  const aspectRatio = videoAspectRatios[item._id] || 9 / 16;
  const videoHeight = Math.min(width / aspectRatio, height - insets.top - insets.bottom);
  const videoWidth = videoHeight * aspectRatio;
  const offsetX = (width - videoWidth) / 2;
  const offsetY = (height - insets.top - insets.bottom - videoHeight) / 2;

  const premiumBadgeScale = premiumBadgeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });
  const premiumBadgeColor = premiumBadgeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [PREMIUM_BADGE_COLOR, '#e4d96f'],
  });

  return (
    <TouchableWithoutFeedback
      onPress={() => handleTap(item._id, isLiked)}
      onLongPress={() => handleLongPress(item._id)}
      onPressOut={() => handlePressOut(item._id)}
    >
      <View style={[styles.reelContainer, { height: height - insets.top - insets.bottom }]}>
        {showConfetti && (
          <ConfettiCannon
            ref={confettiRef}
            count={150}
            origin={{ x: width / 2, y: height / 2 }}
            explosionSpeed={400}
            fallSpeed={2500}
            fadeOut
            colors={[PRIMARY_THEME_COLOR, SECONDARY_THEME_COLOR, PREMIUM_BADGE_COLOR]}
          />
        )}

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
            Toast.show({
              type: 'error',
              text1: 'Video Error',
              text2: 'Failed to load video.',
              position: TOAST_POSITION,
              topOffset: TOAST_TOP_OFFSET,
            });
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
              size={scale(36)}
              color={TEXT_THEME_COLOR}
            />
          </Animated.View>
        )}

        <Animated.View
          style={[
            styles.doubleTapHeart,
            {
              opacity: doubleTapAnim,
              transform: [
                { scale: doubleTapAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.5] }) },
              ],
            },
          ]}
        >
          <Ionicons name="heart" size={scale(80)} color={SECONDARY_THEME_COLOR} />
        </Animated.View>

        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.5)']}
          style={[styles.overlay, { paddingBottom: insets.bottom + scale(20) }]}
        >
          <View style={[styles.bottomLeft, { bottom: insets.bottom + scale(100) }]}>
            <View style={styles.userInfo}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center' }}
                onPress={() => navigation.navigate('UserProfile', { userId: item.user?._id })}
              >
                <Image
                  source={{ uri: item.user?.avatar }}
                  style={styles.avatar}
                />
                <View>
                  <Text style={styles.username}>
                    {item.user?.userName}
                  </Text>
                  {item.user?.isPremium && (
                    <Animated.View style={[
                      styles.premiumBadge,
                      {
                        transform: [{ scale: premiumBadgeScale }],
                        backgroundColor: premiumBadgeColor,
                      }
                    ]}>
                      <FontAwesome name="diamond" size={scale(10)} color={PREMIUM_TEXT_COLOR} />
                    </Animated.View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
            <Pressable style={styles.followButton}>
              <Text style={styles.followText}>Follow</Text>
            </Pressable>
            <Text style={styles.caption} numberOfLines={2} ellipsizeMode="tail">
              {item.caption}
            </Text>
            <Text style={styles.stats}>
              {item.likes} Likes · {item.comments} Comments
            </Text>
          </View>

          <View style={[styles.rightButtons, { bottom: insets.bottom + scale(100) }]}>
            <Animated.View
              style={[styles.iconContainer, { transform: [{ scale: likeAnim }] }]}
            >
              <View style={styles.iconBackground}>
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={scale(24)}
                  color={isLiked ? SECONDARY_THEME_COLOR : TEXT_THEME_COLOR}
                  onPress={() => handleLike(item._id, isLiked)}
                />
              </View>
              <Text style={styles.iconText}>{item.likes.toString()}</Text>
            </Animated.View>

            <Pressable
              onPress={() => openCommentModal(item._id)}
              style={styles.iconContainer}
            >
              <View style={styles.iconBackground}>
                <Ionicons name="chatbubble-outline" size={scale(24)} color={TEXT_THEME_COLOR} />
              </View>
              <Text style={styles.iconText}>{item.comments.toString()}</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setSelectedReelId(item?._id);
                setShareModalVisible(true);
              }}
              style={styles.iconContainer}
            >
              <View style={styles.iconBackground}>
                <Ionicons name="paper-plane-outline" size={scale(24)} color={TEXT_THEME_COLOR} />
              </View>
              <Text style={styles.iconText}>Share</Text>
            </Pressable>

            <Pressable
              onPress={() => handleSave(item._id)}
              style={styles.iconContainer}
            >
              <View style={styles.iconBackground}>
                <Ionicons
                  name={savedReels[item._id] ? 'bookmark' : 'bookmark-outline'}
                  size={scale(24)}
                  color={TEXT_THEME_COLOR}
                />
              </View>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    </TouchableWithoutFeedback>
  );
};

// CommentItem component
const CommentItem = ({
  item,
  index,
  handleDeleteComment,
  selectedReelId,
  currentUserId,
  isPremiumUser,
}) => {
  const isPremiumComment = item.userId === currentUserId && isPremiumUser;
  const commentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(commentAnim, {
      toValue: 1,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, [index, commentAnim]);

  return (
    <Animated.View
      style={[
        styles.commentItem,
        {
          opacity: commentAnim,
          transform: [
            {
              translateY: commentAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        onLongPress={() => handleDeleteComment(selectedReelId, item._id, item.userId)}
        activeOpacity={0.8}
        style={styles.commentContent}
      >
        <View style={styles.commentAvatarContainer}>
          <Image
            source={{ uri: item.avatar || 'https://via.placeholder.com/40' }}
            style={[
              styles.commentAvatar,
              isPremiumComment && styles.premiumCommentAvatar,
            ]}
          />
          {isPremiumComment && (
            <View style={styles.premiumCommentBadge}>
              <FontAwesome name="diamond" size={scale(8)} color={PREMIUM_TEXT_COLOR} />
            </View>
          )}
        </View>

        <View style={styles.commentTextContainer}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentUser}>{item.userName}</Text>
            {isPremiumComment && (
              <View style={styles.premiumLabel}>
                <Text style={styles.premiumLabelText}>Premium</Text>
              </View>
            )}
          </View>
          <Text style={styles.commentText}>{item.text}</Text>
          {item.isPending && (
            <View style={styles.pendingIndicator}>
              <ActivityIndicator size="small" color={PRIMARY_THEME_COLOR} />
              <Text style={styles.pendingText}>Posting...</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const Reels = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { reels, comments, loading, refreshing, error, pendingComments, commentsLoading, commentsRefreshing } = useSelector((state) => state.reels);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedReels, setSavedReels] = useState({});
  const [muted, setMuted] = useState(true);
  const [pausedReels, setPausedReels] = useState({});
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [deleteCommentModalVisible, setDeleteCommentModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedReelId, setSelectedReelId] = useState(null);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [selectedCommentUserId, setSelectedCommentUserId] = useState(null);
  const [buffering, setBuffering] = useState({});
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [showMuteIcon, setShowMuteIcon] = useState(false);
  const [videoAspectRatios, setVideoAspectRatios] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState(null);
  const [currentUsername, setCurrentUsername] = useState(null);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const flatListRef = useRef(null);
  const videoRefs = useRef({});
  const commentInputRef = useRef(null);

  const likeAnim = useRef(new Animated.Value(1)).current;
  const doubleTapAnim = useRef(new Animated.Value(0)).current;
  const muteIconOpacity = useRef(new Animated.Value(0)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;
  const modalBackdropOpacity = useRef(new Animated.Value(0)).current;
  const commentInputAnim = useRef(new Animated.Value(0)).current;
  const premiumBadgeAnim = useRef(new Animated.Value(0)).current;

  const tapTimeoutRef = useRef(null);
  const lastTapRef = useRef({ time: 0, id: null });
  const confettiRef = useRef(null);

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const token = await AsyncStorage.getItem(USER_TOKEN_KEY);
        if (token) {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          setCurrentUserId(decoded.userId);
          setCurrentUsername(decoded.userName);
          setCurrentUserAvatar(decoded.avatar || 'https://via.placeholder.com/40');
          setIsPremiumUser(decoded.isPremium || false);

          if (decoded.isPremium) {
            Animated.loop(
              Animated.sequence([
                Animated.timing(premiumBadgeAnim, {
                  toValue: 1,
                  duration: 1000,
                  easing: Easing.inOut(Easing.ease),
                  useNativeDriver: true,
                }),
                Animated.timing(premiumBadgeAnim, {
                  toValue: 0,
                  duration: 1000,
                  easing: Easing.inOut(Easing.ease),
                  useNativeDriver: true,
                }),
              ])
            ).start();
          }
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    };
    getUserInfo();
  }, []);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (commentModalVisible) {
      Animated.parallel([
        Animated.timing(modalBackdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(modalSlideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.back(1)),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(modalBackdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalSlideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [commentModalVisible]);

  useEffect(() => {
    if (!commentModalVisible) {
      setNewComment('');
      commentInputRef.current?.clear();
    }
  }, [commentModalVisible]);

  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error,
        position: TOAST_POSITION,
        topOffset: TOAST_TOP_OFFSET,
      });
    }
  }, [error]);

  useEffect(() => {
    if (showConfetti && confettiRef.current) {
      confettiRef.current.start();
      const timer = setTimeout(() => setShowConfetti(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

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

  const onRefresh = useCallback(() => {
    fetchReelsData(true);
  }, [fetchReelsData]);

  const onRefreshComments = useCallback(() => {
    if (selectedReelId) {
      dispatch(setCommentsRefreshing({ reelId: selectedReelId, refreshing: true }));
      dispatch(fetchComments(selectedReelId));
    }
  }, [dispatch, selectedReelId]);

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

  const handleLike = useCallback(
    (id, isLiked) => {
      if (isLiked) {
        dispatch(unlikeReel(id));
      } else {
        dispatch(likeReel(id));
        Animated.sequence([
          Animated.timing(likeAnim, {
            toValue: 1.3,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(likeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
        if (isPremiumUser) {
          setShowConfetti(true);
        }
      }
    },
    [dispatch, likeAnim, isPremiumUser]
  );

  const handleTap = useCallback(
    (id) => {
      const now = Date.now();
      const DOUBLE_PRESS_DELAY = 300;

      if (
        lastTapRef.current.id === id &&
        now - lastTapRef.current.time < DOUBLE_PRESS_DELAY
      ) {
        Animated.sequence([
          Animated.timing(doubleTapAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(doubleTapAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
        handleLike(id, reels[currentIndex].isLiked);
        clearTimeout(tapTimeoutRef.current);
        lastTapRef.current = { time: now, id };
      } else {
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
    [handleLike, doubleTapAnim, showMuteIconAnimation, reels, currentIndex]
  );

  const handleLongPress = useCallback(
    (id) => {
      setPausedReels((prev) => ({ ...prev, [id]: true }));
    },
    []
  );

  const handlePressOut = useCallback(
    (id) => {
      setPausedReels((prev) => ({ ...prev, [id]: false }));
    },
    []
  );

  const handleSave = useCallback((id) => {
    setSavedReels((prev) => ({ ...prev, [id]: !prev[id] }));
    Toast.show({
      type: 'success',
      text1: 'Saved',
      text2: prev[id] ? 'Removed from saved reels' : 'Added to saved reels',
      position: TOAST_POSITION,
      topOffset: TOAST_TOP_OFFSET,
    });
  }, []);

  const handleShare = useCallback(
    async (reel) => {
      try {
        const shareOptions = {
          message: `Check out this reel: ${reel.caption}`,
          url: reel.videoUrl,
          title: 'Check out this Reel!',
        };
        await Share.share(shareOptions);
        Toast.show({
          type: 'success',
          text1: 'Shared',
          text2: 'Reel shared successfully!',
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      } catch (error) {
        console.error('Share error:', error);
        Toast.show({
          type: 'error',
          text1: 'Share Failed',
          text2: 'Could not share the reel.',
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      }
      setShareModalVisible(false);
    },
    []
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }) => {
      if (viewableItems.length > 0) {
        const newIndex = viewableItems[0].index;
        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
          setCurrentIndex(newIndex);
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

  const getItemLayout = useCallback(
    (data, index) => ({
      length: height - insets.top - insets.bottom,
      offset: (height - insets.top - insets.bottom) * index,
      index,
    }),
    [insets]
  );

  const handleDeleteComment = useCallback(
    (reelId, commentId, commentUserId) => {
      if (currentUserId !== commentUserId) {
        Toast.show({
          type: 'error',
          text1: 'Unauthorized',
          text2: 'You can only delete your own comments.',
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
        return;
      }
      setSelectedCommentId(commentId);
      setSelectedCommentUserId(commentUserId);
      setSelectedReelId(reelId);
      setDeleteCommentModalVisible(true);
    },
    [currentUserId]
  );

  const confirmDeleteComment = useCallback(() => {
    dispatch(deleteComment({ reelId: selectedReelId, commentId: selectedCommentId }))
      .unwrap()
      .then(() => {
        Toast.show({
          type: 'success',
          text1: 'Deleted',
          text2: 'Comment deleted successfully!',
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
        setDeleteCommentModalVisible(false);
        setSelectedCommentId(null);
        setSelectedCommentUserId(null);
      })
      .catch((err) => {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: err,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
        setDeleteCommentModalVisible(false);
        setSelectedCommentId(null);
        setSelectedCommentUserId(null);
      });
  }, [dispatch, selectedReelId, selectedCommentId]);

  const handlePostComment = useCallback(() => {
    if (!newComment.trim() || !selectedReelId) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Input',
        text2: 'Please enter a comment.',
        position: TOAST_POSITION,
        topOffset: TOAST_TOP_OFFSET,
      });
      return;
    }

    Animated.sequence([
      Animated.timing(commentInputAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(commentInputAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    dispatch(postComment({ reelId: selectedReelId, text: newComment }))
      .unwrap()
      .then(() => {
        setNewComment('');
        commentInputRef.current?.clear();
        commentInputRef.current?.blur();
        setTimeout(() => {
          commentInputRef.current?.clear();
          setNewComment('');
        }, 100);
        Toast.show({
          type: 'success',
          text1: 'Commented',
          text2: 'Your comment has been posted!',
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      })
      .catch((err) => {
        console.error('Post comment error:', err);
        dispatch(fetchComments(selectedReelId));
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to post comment. It may still appear after refresh.',
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      });
  }, [dispatch, newComment, selectedReelId, commentInputAnim]);

  const openCommentModal = useCallback(
    (reelId) => {
      setSelectedReelId(reelId);
      setCommentModalVisible(true);
      dispatch(fetchComments(reelId));
    },
    [dispatch]
  );

  const getCommentsForReel = useCallback(
    (reelId) => [
      ...(pendingComments[reelId] || []),
      ...(comments[reelId] || []),
    ].sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now())),
    [comments, pendingComments]
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={REELS_LOADER_COLOR} />
        <Text style={styles.loaderText}>Loading Reels...</Text>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={reels}
        renderItem={({ item, index }) => (
          <ReelItem
            item={item}
            index={index}
            currentIndex={currentIndex}
            isScreenFocused={isScreenFocused}
            pausedReels={pausedReels}
            muted={muted}
            buffering={buffering}
            videoAspectRatios={videoAspectRatios}
            showMuteIcon={showMuteIcon}
            muteIconOpacity={muteIconOpacity}
            showConfetti={showConfetti}
            savedReels={savedReels}
            likeAnim={likeAnim}
            doubleTapAnim={doubleTapAnim}
            premiumBadgeAnim={premiumBadgeAnim}
            insets={insets}
            handleTap={handleTap}
            handleLongPress={handleLongPress}
            handlePressOut={handlePressOut}
            handleLike={handleLike}
            handleSave={handleSave}
            openCommentModal={openCommentModal}
            showMuteIconAnimation={showMuteIconAnimation}
            navigation={navigation}
            videoRefs={videoRefs}
            confettiRef={confettiRef}
            setBuffering={setBuffering}
            setVideoAspectRatios={setVideoAspectRatios}
            setSelectedReelId={setSelectedReelId}
            setShareModalVisible={setShareModalVisible}
          />
        )}
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
            progressBackgroundColor={PRODUCT_BG_COLOR}
          />
        }
        ListEmptyComponent={
          !loading && !refreshing && (
            <View style={styles.emptyContainer}>
              <Ionicons name="sad-outline" size={scale(50)} color={SUBTEXT_THEME_COLOR} />
              <Text style={styles.emptyText}>
                {error ? `Error: ${error}` : EMPTY_REELS_TEXT}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => fetchReelsData()}
              >
                <LinearGradient
                  colors={[CATEGORY_BG_COLOR, PRIMARY_THEME_COLOR]}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )
        }
      />

      <Modal
        visible={commentModalVisible}
        animationType="none"
        transparent
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <Animated.View style={[styles.modalBackdrop, { opacity: modalBackdropOpacity }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <Animated.View
              style={[
                styles.commentBox,
                {
                  transform: [{ translateY: modalSlideAnim }],
                  maxHeight: height * 0.85,
                }
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Comments</Text>
                <Pressable
                  onPress={() => setCommentModalVisible(false)}
                  hitSlop={20}
                >
                  <Ionicons name="close" size={scale(24)} color={PRIMARY_THEME_COLOR} />
                </Pressable>
              </View>

              {commentsLoading[selectedReelId] && !comments[selectedReelId]?.length ? (
                <View style={styles.commentLoaderContainer}>
                  <ActivityIndicator size="large" color={REELS_LOADER_COLOR} />
                  <Text style={styles.loaderText}>Loading comments...</Text>
                </View>
              ) : (
                <FlatList
                  data={getCommentsForReel(selectedReelId)}
                  renderItem={({ item, index }) => (
                    <CommentItem
                      item={item}
                      index={index}
                      handleDeleteComment={handleDeleteComment}
                      selectedReelId={selectedReelId}
                      currentUserId={currentUserId}
                      isPremiumUser={isPremiumUser}
                    />
                  )}
                  keyExtractor={(item) => item._id}
                  style={styles.commentList}
                  contentContainerStyle={{ paddingBottom: scale(20) }}
                  refreshControl={
                    <RefreshControl
                      refreshing={commentsRefreshing[selectedReelId] || false}
                      onRefresh={onRefreshComments}
                      tintColor={REELS_REFRESH_TINT_COLOR}
                      colors={[REELS_REFRESH_TINT_COLOR]}
                      progressBackgroundColor={PRODUCT_BG_COLOR}
                    />
                  }
                  ListEmptyComponent={
                    <View style={styles.emptyCommentContainer}>
                      <Ionicons name="chatbubble-outline" size={scale(40)} color={SUBTEXT_THEME_COLOR} />
                      <Text style={styles.emptyCommentText}>Be the first to comment!</Text>
                    </View>
                  }
                />
              )}

              <Animated.View
                style={[
                  styles.commentInputContainer,
                  {
                    transform: [
                      {
                        translateX: commentInputAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -10],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {currentUserAvatar && (
                  <Image
                    source={{ uri: currentUserAvatar }}
                    style={[
                      styles.currentUserAvatar,
                      isPremiumUser && styles.premiumCurrentUserAvatar,
                    ]}
                  />
                )}
                {isPremiumUser && (
                  <View style={styles.premiumCommentBadge}>
                    <FontAwesome name="diamond" size={scale(8)} color={PREMIUM_TEXT_COLOR} />
                  </View>
                )}
                <TextInput
                  ref={commentInputRef}
                  style={[
                    styles.commentInput,
                    isPremiumUser && styles.premiumCommentInput,
                  ]}
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder="Add a comment..."
                  placeholderTextColor={SUBTEXT_THEME_COLOR}
                  maxLength={500}
                  multiline
                />
                <Pressable
                  onPress={handlePostComment}
                  style={({ pressed }) => [
                    styles.postButton,
                    {
                      opacity: newComment.trim() ? (pressed ? 0.7 : 1) : 0.5,
                    }
                  ]}
                  disabled={!newComment.trim()}
                >
                  <LinearGradient
                    colors={[CATEGORY_BG_COLOR, PRIMARY_THEME_COLOR]}
                    style={styles.buttonGradient}
                  >
                    <Ionicons
                      name="send"
                      size={scale(20)}
                      color={TEXT_THEME_COLOR}
                    />
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            </Animated.View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>

      <Modal
        visible={deleteCommentModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setDeleteCommentModalVisible(false)}
      >
        <View style={styles.centeredModalContainer}>
          <View style={styles.deleteCommentBox}>
            <Text style={styles.modalTitle}>Delete Comment</Text>
            <Text style={styles.deleteCommentText}>
              Are you sure you want to delete this comment?
            </Text>
            <View style={styles.deleteCommentButtonContainer}>
              <Pressable
                onPress={() => setDeleteCommentModalVisible(false)}
                style={styles.deleteCommentButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmDeleteComment}
                style={[styles.deleteCommentButton, styles.deleteButton]}
              >
                <LinearGradient
                  colors={[CATEGORY_BG_COLOR, SECONDARY_THEME_COLOR]}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={shareModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.centeredModalContainer}>
          <View style={styles.shareBox}>
            <Text style={styles.modalTitle}>Share Reel</Text>
            <Pressable
              onPress={() => handleShare(reels.find((reel) => reel._id === selectedReelId))}
              style={styles.shareOption}
            >
              <Ionicons name="share-social-outline" size={scale(22)} color={PRIMARY_THEME_COLOR} />
              <Text style={styles.shareOptionText}>Share via...</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Toast.show({
                  type: 'success',
                  text1: 'Link Copied',
                  text2: 'Reel link copied to clipboard.',
                  position: TOAST_POSITION,
                  topOffset: TOAST_TOP_OFFSET,
                });
                setShareModalVisible(false);
              }}
              style={styles.shareOption}
            >
              <Ionicons name="link-outline" size={scale(22)} color={PRIMARY_THEME_COLOR} />
              <Text style={styles.shareOptionText}>Copy Link</Text>
            </Pressable>
            <Pressable
              onPress={() => setShareModalVisible(false)}
              style={[styles.shareOption, styles.cancelOption]}
            >
              <Text style={styles.closeBtn}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  reelContainer: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PRODUCT_BG_COLOR,
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(5),
    elevation: 2,
  },
  video: {
    position: 'absolute',
    borderRadius: scale(10),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
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
    transform: [{ translateX: -scale(28) }, { translateY: -scale(28) }],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(20),
    padding: scale(10),
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: scale(15),
    width: '100%',
  },
  bottomLeft: {
    position: 'absolute',
    left: scale(15),
    width: '65%',
  },
  userInfo: {
    marginBottom: scale(8),
  },
  avatar: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    marginRight: scale(8),
    borderWidth: 1,
    borderColor: PRIMARY_THEME_COLOR,
  },
  username: {
    color: TEXT_THEME_COLOR,
    fontWeight: '700',
    fontSize: scaleFont(14),
  },
  premiumBadge: {
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scale(2),
  },
  followButton: {
    marginTop: scale(6),
    paddingVertical: scale(4),
    paddingHorizontal: scale(12),
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: PRIMARY_THEME_COLOR,
    alignSelf: 'flex-start',
  },
  followText: {
    color: PRIMARY_THEME_COLOR,
    fontSize: scaleFont(11),
    fontWeight: '600',
  },
  caption: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(13),
    marginBottom: scale(8),
    lineHeight: scaleFont(18),
  },
  stats: {
    color: SUBTEXT_THEME_COLOR,
    fontSize: scaleFont(11),
    fontWeight: '600',
    opacity: 0.9,
  },
  rightButtons: {
    position: 'absolute',
    right: scale(15),
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: scale(10),
    padding: scale(8),
  },
  iconBackground: {
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(20),
    padding: scale(8),
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
  },
  iconText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(10),
    marginTop: scale(4),
    fontWeight: '600',
  },
  doubleTapHeart: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -scale(40) }, { translateY: -scale(40) }],
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  commentBox: {
    backgroundColor: PRODUCT_BG_COLOR,
    padding: scale(14),
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: scale(5),
    elevation: 3,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(10),
    paddingBottom: scale(8),
    borderBottomWidth: 1,
    borderBottomColor: BORDER_THEME_COLOR,
  },
  commentList: {
    maxHeight: height * 0.6,
  },
  commentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: scale(10),
    marginBottom: scale(10),
    borderRadius: scale(10),
    backgroundColor: PRODUCT_BG_COLOR,
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 2,
  },
  commentContent: {
    flexDirection: 'row',
    flex: 1,
  },
  commentAvatarContainer: {
    position: 'relative',
  },
  commentAvatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    marginRight: scale(10),
    borderWidth: 1,
    borderColor: PRIMARY_THEME_COLOR,
  },
  premiumCommentAvatar: {
    borderColor: PREMIUM_BADGE_COLOR,
  },
  premiumCommentBadge: {
    position: 'absolute',
    bottom: 0,
    right: scale(8),
    width: scale(14),
    height: scale(14),
    borderRadius: scale(7),
    backgroundColor: PREMIUM_BADGE_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: TEXT_THEME_COLOR,
  },
  commentTextContainer: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  commentUser: {
    fontWeight: '700',
    fontSize: scaleFont(14),
    color: TEXT_THEME_COLOR,
    marginRight: scale(6),
  },
  premiumLabel: {
    backgroundColor: CATEGORY_BG_COLOR,
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
    borderWidth: 1,
    borderColor: PREMIUM_BADGE_COLOR,
  },
  premiumLabelText: {
    color: PREMIUM_TEXT_COLOR,
    fontSize: scaleFont(9),
    fontWeight: '600',
  },
  commentText: {
    fontSize: scaleFont(13),
    color: SUBTEXT_THEME_COLOR,
    lineHeight: scaleFont(18),
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(10),
    paddingTop: scale(10),
    borderTopWidth: 1,
    borderTopColor: BORDER_THEME_COLOR,
    position: 'relative',
  },
  currentUserAvatar: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    marginRight: scale(8),
    borderWidth: 1,
    borderColor: PRIMARY_THEME_COLOR,
  },
  premiumCurrentUserAvatar: {
    borderColor: PREMIUM_BADGE_COLOR,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
    borderRadius: scale(20),
    padding: scale(10),
    paddingTop: scale(10),
    marginRight: scale(8),
    fontSize: scaleFont(14),
    color: TEXT_THEME_COLOR,
    maxHeight: scale(100),
    backgroundColor: CATEGORY_BG_COLOR,
  },
  premiumCommentInput: {
    borderColor: PREMIUM_BADGE_COLOR,
  },
  postButton: {
    padding: scale(10),
    borderRadius: scale(18),
  },
  buttonGradient: {
    padding: scale(10),
    borderRadius: scale(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
  },
  closeBtn: {
    color: PRIMARY_THEME_COLOR,
    fontWeight: '600',
    fontSize: scaleFont(14),
    textAlign: 'center',
  },
  centeredModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  shareBox: {
    padding: scale(14),
    borderRadius: scale(15),
    width: '80%',
    backgroundColor: PRODUCT_BG_COLOR,
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(5),
    elevation: 3,
  },
  deleteCommentBox: {
    padding: scale(14),
    borderRadius: scale(15),
    width: '80%',
    backgroundColor: PRODUCT_BG_COLOR,
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(5),
    elevation: 3,
  },
  deleteCommentText: {
    fontSize: scaleFont(14),
    color: SUBTEXT_THEME_COLOR,
    textAlign: 'center',
    marginVertical: scale(15),
  },
  deleteCommentButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteCommentButton: {
    flex: 1,
    paddingVertical: scale(10),
    alignItems: 'center',
    borderRadius: scale(12),
    marginHorizontal: scale(4),
  },
  cancelButtonText: {
    color: PRIMARY_THEME_COLOR,
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  deleteButton: {
    borderRadius: scale(12),
  },
  deleteButtonText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(12),
    paddingHorizontal: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: BORDER_THEME_COLOR,
  },
  cancelOption: {
    borderBottomWidth: 0,
    justifyContent: 'center',
    marginTop: scale(8),
  },
  shareOptionText: {
    fontSize: scaleFont(14),
    color: TEXT_THEME_COLOR,
    fontWeight: '600',
    marginLeft: scale(10),
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PRODUCT_BG_COLOR,
  },
  commentLoaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scale(30),
    minHeight: scale(180),
  },
  loaderText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(14),
    marginTop: scale(8),
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: height * 0.8,
    backgroundColor: PRODUCT_BG_COLOR,
  },
  emptyText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(16),
    textAlign: 'center',
    marginBottom: scale(15),
    marginHorizontal: scale(15),
    fontWeight: '600',
  },
  emptyCommentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scale(15),
  },
  emptyCommentText: {
    color: SUBTEXT_THEME_COLOR,
    fontSize: scaleFont(14),
    textAlign: 'center',
    marginTop: scale(8),
    fontWeight: '600',
  },
  retryButton: {
    borderRadius: scale(20),
  },
  retryButtonText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  pendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(6),
  },
  pendingText: {
    color: PRIMARY_THEME_COLOR,
    fontSize: scaleFont(11),
    marginLeft: scale(6),
    fontWeight: '600',
  },
});

export default Reels;