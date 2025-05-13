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
  REELS_LOADER_COLOR,
  REELS_REFRESH_TINT_COLOR,
  REELS_MODAL_BG_COLOR,
  REELS_MODAL_TEXT_COLOR,
  REELS_BUTTON_COLOR,
  EMPTY_REELS_TEXT,
  TOAST_POSITION,
  TOAST_TOP_OFFSET,
  USER_TOKEN_KEY,
  PREMIUM_BADGE_COLOR,
} from '../constants/GlobalConstants';
import Toast from 'react-native-toast-message';
import ConfettiCannon from 'react-native-confetti-cannon';

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
    outputRange: [PREMIUM_BADGE_COLOR, '#FFD700'],
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
            count={200}
            origin={{ x: width / 2, y: height / 2 }}
            explosionSpeed={500}
            fallSpeed={3000}
            fadeOut
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
              size={scale(40)}
              color="#FFFFFF"
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
          <Ionicons name="heart" size={scale(100)} color="#FF3E6D" />
        </Animated.View>

        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
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
                    <FontAwesome name="diamond" size={scale(12)} color="#fff" />
                  </Animated.View>
                )}
              </TouchableOpacity>
              <Pressable style={styles.followButton}>
                <Text style={styles.followText}>Follow</Text>
              </Pressable>
            </View>
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
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={scale(32)}
                color={isLiked ? '#FF3E6D' : '#FFFFFF'}
                onPress={() => handleLike(item._id, isLiked)}
              />
              <Text style={styles.iconText}>{item.likes.toString()}</Text>
            </Animated.View>

            <Pressable
              onPress={() => openCommentModal(item._id)}
              style={styles.iconContainer}
            >
              <Ionicons name="chatbubble-outline" size={scale(28)} color="#FFFFFF" />
              <Text style={styles.iconText}>{item.comments.toString()}</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setSelectedReelId(item?._id);
                setShareModalVisible(true);
              }}
              style={styles.iconContainer}
            >
              <Ionicons name="paper-plane-outline" size={scale(28)} color="#FFFFFF" />
              <Text style={styles.iconText}>Share</Text>
            </Pressable>

            <Pressable
              onPress={() => handleSave(item._id)}
              style={styles.iconContainer}
            >
              <Ionicons
                name={savedReels[item._id] ? 'bookmark' : 'bookmark-outline'}
                size={scale(28)}
                color="#FFFFFF"
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
                size={scale(28)}
                color="#FFFFFF"
              />
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
              <FontAwesome name="diamond" size={scale(10)} color="#fff" />
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
              <ActivityIndicator size="small" color="#7B61FF" />
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
      const timer = setTimeout(() => setShowConfetti(false), 3000);
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
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(doubleTapAnim, {
            toValue: 0,
            duration: 500,
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
        <ActivityIndicator size="large" color="#7B61FF" />
        <Text style={styles.loaderText}>Loading Reels...</Text>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.container}>
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
            tintColor="#7B61FF"
            colors={['#7B61FF']}
            progressBackgroundColor="#1C1C2E"
          />
        }
        ListEmptyComponent={
          !loading && !refreshing && (
            <View style={styles.emptyContainer}>
              <Ionicons name="sad-outline" size={scale(60)} color="#FFFFFF" />
              <Text style={styles.emptyText}>
                {error ? `Error: ${error}` : EMPTY_REELS_TEXT}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => fetchReelsData()}
              >
                <LinearGradient
                  colors={['#7B61FF', '#AD4DFF']}
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
                  <Ionicons name="close" size={scale(28)} color="#7B61FF" />
                </Pressable>
              </View>

              {commentsLoading[selectedReelId] && !comments[selectedReelId]?.length ? (
                <View style={styles.commentLoaderContainer}>
                  <ActivityIndicator size="large" color="#7B61FF" />
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
                      tintColor="#7B61FF"
                      colors={['#7B61FF']}
                      progressBackgroundColor="#1C1C2E"
                    />
                  }
                  ListEmptyComponent={
                    <View style={styles.emptyCommentContainer}>
                      <Ionicons name="chatbubble-outline" size={scale(50)} color="#888" />
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
                    <FontAwesome name="diamond" size={scale(10)} color="#fff" />
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
                  placeholderTextColor="#888"
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
                    colors={['#7B61FF', '#AD4DFF']}
                    style={styles.buttonGradient}
                  >
                    <Ionicons 
                      name="send" 
                      size={scale(24)} 
                      color="#FFFFFF" 
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
          <LinearGradient
            colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']}
            style={styles.deleteCommentBox}
          >
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
                  colors={['#7B61FF', '#AD4DFF']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      <Modal
        visible={shareModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.centeredModalContainer}>
          <LinearGradient
            colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']}
            style={styles.shareBox}
          >
            <Text style={styles.modalTitle}>Share Reel</Text>
            <Pressable
              onPress={() => handleShare(reels.find((reel) => reel._id === selectedReelId))}
              style={styles.shareOption}
            >
              <Ionicons name="share-social-outline" size={scale(26)} color="#7B61FF" />
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
              <Ionicons name="link-outline" size={scale(26)} color="#7B61FF" />
              <Text style={styles.shareOptionText}>Copy Link</Text>
            </Pressable>
            <Pressable
              onPress={() => setShareModalVisible(false)}
              style={[styles.shareOption, styles.cancelOption]}
            >
              <Text style={styles.closeBtn}>Cancel</Text>
            </Pressable>
          </LinearGradient>
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
  },
  video: {
    position: 'absolute',
    borderRadius: scale(12),
    overflow: 'hidden',
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
    transform: [{ translateX: -scale(30) }, { translateY: -scale(30) }],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: scale(25),
    padding: scale(12),
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: scale(20),
    width: '100%',
  },
  bottomLeft: {
    position: 'absolute',
    left: scale(20),
    width: '65%',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  avatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    marginRight: scale(10),
    borderWidth: 1,
    borderColor: '#7B61FF',
  },
  username: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: scaleFont(16),
  },
  premiumBadge: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(8),
  },
  followButton: {
    marginLeft: scale(10),
    paddingVertical: scale(6),
    paddingHorizontal: scale(14),
    backgroundColor: 'rgba(123,97,255,0.2)',
    borderRadius: scale(15),
    borderWidth: 1,
    borderColor: '#7B61FF',
  },
  followText: {
    color: '#7B61FF',
    fontSize: scaleFont(12),
    fontWeight: '700',
  },
  caption: {
    color: '#FFFFFF',
    fontSize: scaleFont(14),
    marginBottom: scale(12),
    lineHeight: scaleFont(20),
  },
  stats: {
    color: '#E5E7EB',
    fontSize: scaleFont(12),
    fontWeight: '700',
    opacity: 0.9,
  },
  rightButtons: {
    position: 'absolute',
    right: scale(20),
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: scale(20),
    padding: scale(10),
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: scaleFont(12),
    marginTop: scale(6),
    fontWeight: '700',
  },
  doubleTapHeart: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -scale(50) }, { translateY: -scale(50) }],
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  commentBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: scale(16),
    borderTopLeftRadius: scale(25),
    borderTopRightRadius: scale(25),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(12),
    paddingBottom: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  commentList: {
    maxHeight: height * 0.6,
  },
  commentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: scale(12),
    marginBottom: scale(12),
    borderRadius: scale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  commentContent: {
    flexDirection: 'row',
    flex: 1,
  },
  commentAvatarContainer: {
    position: 'relative',
  },
  commentAvatar: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    marginRight: scale(12),
    borderWidth: 1,
    borderColor: '#7B61FF',
  },
  premiumCommentAvatar: {
    borderColor: PREMIUM_BADGE_COLOR,
  },
  premiumCommentBadge: {
    position: 'absolute',
    bottom: 0,
    right: scale(10),
    width: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    backgroundColor: PREMIUM_BADGE_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1C1C2E',
  },
  commentTextContainer: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(6),
  },
  commentUser: {
    fontWeight: '700',
    fontSize: scaleFont(16),
    color: '#FFFFFF',
    marginRight: scale(8),
  },
  premiumLabel: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(4),
    borderWidth: 1,
    borderColor: PREMIUM_BADGE_COLOR,
  },
  premiumLabelText: {
    color: PREMIUM_BADGE_COLOR,
    fontSize: scaleFont(10),
    fontWeight: 'bold',
  },
  commentText: {
    fontSize: scaleFont(14),
    color: '#E5E7EB',
    lineHeight: scaleFont(20),
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(12),
    paddingTop: scale(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  currentUserAvatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    marginRight: scale(10),
    borderWidth: 1,
    borderColor: '#7B61FF',
  },
  premiumCurrentUserAvatar: {
    borderColor: PREMIUM_BADGE_COLOR,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: scale(25),
    padding: scale(12),
    paddingTop: scale(12),
    marginRight: scale(10),
    fontSize: scaleFont(15),
    color: '#FFFFFF',
    maxHeight: scale(120),
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  premiumCommentInput: {
    borderColor: PREMIUM_BADGE_COLOR,
  },
  postButton: {
    padding: scale(12),
    borderRadius: scale(20),
  },
  buttonGradient: {
    padding: scale(12),
    borderRadius: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: scaleFont(24),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    color: '#7B61FF',
    fontWeight: '700',
    fontSize: scaleFont(16),
    textAlign: 'center',
  },
  centeredModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  shareBox: {
    padding: scale(16),
    borderRadius: scale(20),
    width: '85%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  deleteCommentBox: {
    padding: scale(16),
    borderRadius: scale(20),
    width: '85%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  deleteCommentText: {
    fontSize: scaleFont(16),
    color: '#E5E7EB',
    textAlign: 'center',
    marginVertical: scale(20),
  },
  deleteCommentButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteCommentButton: {
    flex: 1,
    paddingVertical: scale(12),
    alignItems: 'center',
    borderRadius: scale(15),
    marginHorizontal: scale(5),
  },
  cancelButtonText: {
    color: '#7B61FF',
    fontSize: scaleFont(16),
    fontWeight: '700',
  },
  deleteButton: {
    borderRadius: scale(15),
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFont(16),
    fontWeight: '700',
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(15),
    paddingHorizontal: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  cancelOption: {
    borderBottomWidth: 0,
    justifyContent: 'center',
    marginTop: scale(10),
  },
  shareOptionText: {
    fontSize: scaleFont(16),
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: scale(12),
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentLoaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scale(40),
    minHeight: scale(200),
  },
  loaderText: {
    color: '#FFFFFF',
    fontSize: scaleFont(16),
    marginTop: scale(10),
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: height * 0.8,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: scaleFont(18),
    textAlign: 'center',
    marginBottom: scale(20),
    marginHorizontal: scale(20),
    fontWeight: '700',
  },
  emptyCommentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scale(20),
  },
  emptyCommentText: {
    color: '#888',
    fontSize: scaleFont(16),
    textAlign: 'center',
    marginTop: scale(10),
    fontWeight: '700',
  },
  retryButton: {
    borderRadius: scale(25),
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFont(16),
    fontWeight: '700',
  },
  pendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(8),
  },
  pendingText: {
    color: '#7B61FF',
    fontSize: scaleFont(12),
    marginLeft: scale(8),
    fontWeight: '700',
  },
});

export default Reels;