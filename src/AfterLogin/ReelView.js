import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
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
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Share from 'react-native-share';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchComments,
  postComment,
  toggleLike,
  toggleSave,
  setReelData,
  clearMessages,
} from '../redux/slices/reelSlice';
import Trace from '../utils/Trace';
import {
  BASE_URL,
  BASE_WIDTH,
  BASE_HEIGHT,
  PRIMARY_COLOR,
  TEXT_COLOR,
  REELS_LOADER_COLOR,
  REELS_MODAL_BG_COLOR,
  REELS_MODAL_TEXT_COLOR,
  REELS_BUTTON_COLOR,
  ANIMATION_DELAY,
  DEFAULT_IMAGE_URL,
} from '../constants/GlobalConstants';

const { width, height } = Dimensions.get('window');
const scaleFactor = width / BASE_WIDTH;
const scale = size => Math.round(size * scaleFactor);
const scaleFont = size => Math.round(size * (Math.min(width, height) / BASE_HEIGHT));

const ReelView = ({ route }) => {
  const { reel } = route.params;
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {
    comments,
    liked,
    saved,
    likesCount,
    commentsCount,
    loadingComments,
    errorMessage,
    successMessage,
  } = useSelector((state) => state.reel);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [buffering, setBuffering] = useState(false);
  const [showMuteIcon, setShowMuteIcon] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState(width / height);
  const videoRef = useRef(null);
  const likeAnim = useRef(new Animated.Value(1)).current;
  const doubleTapAnim = useRef(new Animated.Value(0)).current;
  const muteIconOpacity = useRef(new Animated.Value(0)).current;
  const tapTimeoutRef = useRef(null);
  const lastTapRef = useRef({ time: 0 });

  // Initialize reel data
  useEffect(() => {
    dispatch(setReelData({ likes: reel.likes || 0, comments: reel.comments || 0 }));
    dispatch(fetchComments(reel._id));
  }, [dispatch, reel._id, reel.likes, reel.comments]);

  // Clear messages after display
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        dispatch(clearMessages());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage, dispatch]);

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

  // Post a comment
  const handlePostComment = useCallback(() => {
    if (!newComment.trim()) return;
    dispatch(postComment({ reelId: reel._id, text: newComment })).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        setNewComment('');
        dispatch(fetchComments(reel._id));
      }
    });
  }, [newComment, reel._id, dispatch]);

  // Handle like
  const handleLike = useCallback(() => {
    dispatch(toggleLike());
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
  }, [likeAnim, dispatch]);

  // Handle tap (single tap for mute/unmute, double tap for like)
  const handleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (now - lastTapRef.current.time < DOUBLE_PRESS_DELAY) {
      // Double tap: Like the reel
      if (!liked) {
        handleLike();
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
      lastTapRef.current = { time: now };
    } else {
      // Single tap: Schedule mute/unmute after delay
      lastTapRef.current = { time: now };
      tapTimeoutRef.current = setTimeout(() => {
        setMuted(prev => {
          const newMuted = !prev;
          showMuteIconAnimation();
          Trace('Mute Toggled', { muted: newMuted });
          return newMuted;
        });
      }, DOUBLE_PRESS_DELAY);
    }
  }, [liked, handleLike, doubleTapAnim, showMuteIconAnimation]);

  // Handle long press to pause
  const handleLongPress = useCallback(() => {
    setPaused(true);
    Trace('Video Paused');
  }, []);

  // Handle release to resume
  const handlePressOut = useCallback(() => {
    setPaused(false);
    Trace('Video Resumed');
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    dispatch(toggleSave());
    Trace('Save Toggled', { saved: !saved });
  }, [dispatch, saved]);

  // Share reel
  const handleShare = useCallback(async () => {
    try {
      const shareOptions = {
        message: `Check out this reel: ${reel.caption}`,
        url: reel.videoUrl,
      };
      await Share.open(shareOptions);
      Trace('Reel Shared');
    } catch (error) {
      Trace('Share Error', { error: error.message });
    }
    setShareModalVisible(false);
  }, [reel]);

  // Handle video load to get natural dimensions
  const handleVideoLoad = useCallback(({ naturalSize }) => {
    if (naturalSize.width && naturalSize.height) {
      setVideoAspectRatio(naturalSize.width / naturalSize.height);
      Trace('Video Loaded', { aspectRatio: naturalSize.width / naturalSize.height });
    }
  }, []);

  const videoUri = reel.videoUrl.startsWith('http')
    ? reel.videoUrl
    : `${BASE_URL.replace('/api', '')}/${reel.videoUrl.replace(/^\/+/, '')}`;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={scale(28)} color={TEXT_COLOR} />
      </TouchableOpacity>
      <TouchableWithoutFeedback
        onPress={handleTap}
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
      >
        <View style={styles.reelContainer}>
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={[styles.video, { aspectRatio: videoAspectRatio }]}
            resizeMode="contain"
            repeat
            muted={muted}
            paused={paused}
            onBuffer={({ isBuffering }) => setBuffering(isBuffering)}
            onError={e => Trace('Video Error', { error: e })}
            onLoad={handleVideoLoad}
            bufferConfig={{
              minBufferMs: 2000,
              maxBufferMs: 5000,
              bufferForPlaybackMs: 1000,
              bufferForPlaybackAfterRebufferMs: 1500,
            }}
            quality="high"
          />
          {buffering && (
            <ActivityIndicator
              size={scale(40)}
              color={REELS_LOADER_COLOR}
              style={styles.bufferIndicator}
            />
          )}

          {/* Mute/Unmute Icon */}
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
                color={TEXT_COLOR}
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
            <Ionicons name="heart" size={scale(80)} color={TEXT_COLOR} />
          </Animated.View>

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.overlay}
          >
            <View style={styles.bottomLeft}>
              <View style={styles.userInfo}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => navigation.navigate('UserProfile', { userId: reel.user?._id })}
                >
                  <Image
                    source={{ uri: reel.user?.avatar || DEFAULT_IMAGE_URL }}
                    style={styles.avatar}
                  />
                  <Text style={styles.username}>
                    @{reel.user?.userName || 'unknown'}
                  </Text>
                </TouchableOpacity>
                <Pressable style={styles.followButton}>
                  <Text style={styles.followText}>Follow</Text>
                </Pressable>
              </View>
              <Text style={styles.caption}>{reel.caption || ''}</Text>
              <Text style={styles.stats}>
                {likesCount} Likes · {commentsCount} Comments
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
                  name={liked ? 'heart' : 'heart-outline'}
                  size={scale(30)}
                  color={liked ? '#FF3E6D' : TEXT_COLOR}
                  onPress={handleLike}
                />
                <Text style={styles.iconText}>{likesCount.toString()}</Text>
              </Animated.View>

              <Pressable
                onPress={() => {
                  dispatch(fetchComments(reel._id));
                  setCommentModalVisible(true);
                }}
                style={styles.iconContainer}
              >
                <Ionicons name="chatbubble-outline" size={scale(26)} color={TEXT_COLOR} />
                <Text style={styles.iconText}>{commentsCount.toString()}</Text>
              </Pressable>

              <Pressable
                onPress={() => setShareModalVisible(true)}
                style={styles.iconContainer}
              >
                <Ionicons name="paper-plane-outline" size={scale(26)} color={TEXT_COLOR} />
                <Text style={styles.iconText}>Share</Text>
              </Pressable>

              <Pressable onPress={handleSave} style={styles.iconContainer}>
                <Ionicons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={scale(26)}
                  color={TEXT_COLOR}
                />
              </Pressable>

              <Pressable
                onPress={() => {
                  setMuted(prev => {
                    const newMuted = !prev;
                    showMuteIconAnimation();
                    Trace('Mute Toggled', { muted: newMuted });
                    return newMuted;
                  });
                }}
                style={styles.iconContainer}
              >
                <Ionicons
                  name={muted ? 'volume-mute' : 'volume-high'}
                  size={scale(26)}
                  color={TEXT_COLOR}
                />
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      </TouchableWithoutFeedback>

      <Modal visible={commentModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.commentBox}>
            <Text style={styles.modalTitle}>Comments</Text>
            {loadingComments ? (
              <ActivityIndicator size={scale(30)} color={PRIMARY_COLOR} />
            ) : (
              <FlatList
                data={comments}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <Text style={styles.commentUser}>{item.userName}</Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                  </View>
                )}
                keyExtractor={item => item._id}
                style={styles.commentList}
              />
            )}
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Add a comment..."
                placeholderTextColor="#A0A0A0"
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

      <Modal visible={shareModalVisible} animationType="fade" transparent>
        <View style={styles.centeredModalContainer}>
          <View style={styles.shareBox}>
            <Text style={styles.modalTitle}>Share Reel</Text>
            <Pressable onPress={handleShare} style={styles.shareOption}>
              <Text style={styles.shareOptionText}>Share via...</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Trace('Copy Link Clicked');
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
    backgroundColor: '#000000',
  },
  backButton: {
    position: 'absolute',
    top: scale(20),
    left: scale(15),
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: scale(20),
    padding: scale(8),
  },
  reelContainer: {
    flex: 1,
    width,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    maxHeight: '100%',
  },
  bufferIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -scale(20) }, { translateY: -scale(20) }],
  },
  muteIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -scale(20) }, { translateY: -scale(20) }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: scale(16),
  },
  bottomLeft: {
    position: 'absolute',
    bottom: scale(80),
    left: scale(10),
    width: '70%',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  avatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    marginRight: scale(8),
    borderWidth: 1,
    borderColor: TEXT_COLOR,
  },
  username: {
    color: TEXT_COLOR,
    fontWeight: 'bold',
    fontSize: scaleFont(16),
  },
  followButton: {
    marginLeft: scale(10),
    paddingVertical: scale(4),
    paddingHorizontal: scale(10),
    borderWidth: 1,
    borderColor: TEXT_COLOR,
    borderRadius: scale(12),
  },
  followText: {
    color: TEXT_COLOR,
    fontSize: scaleFont(12),
  },
  caption: {
    color: TEXT_COLOR,
    fontSize: scaleFont(14),
    marginBottom: scale(4),
  },
  stats: {
    color: TEXT_COLOR,
    fontSize: scaleFont(12),
    opacity: 0.8,
  },
  rightButtons: {
    position: 'absolute',
    right: scale(10),
    bottom: scale(80),
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: scale(20),
  },
  iconText: {
    color: TEXT_COLOR,
    fontSize: scaleFont(12),
    marginTop: scale(4),
  },
  doubleTapHeart: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -scale(40) }, { translateY: -scale(40) }],
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: REELS_MODAL_BG_COLOR,
  },
  commentBox: {
    backgroundColor: '#FFFFFF',
    padding: scale(20),
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    maxHeight: height * 0.7,
  },
  commentList: {
    maxHeight: height * 0.5,
  },
  commentItem: {
    marginBottom: scale(10),
  },
  commentUser: {
    fontWeight: 'bold',
    fontSize: scaleFont(14),
  },
  commentText: {
    fontSize: scaleFont(14),
    color: '#666666',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(10),
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: scale(10),
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: scale(20),
    padding: scale(10),
    marginRight: scale(10),
    fontSize: scaleFont(14),
    color: '#000000',
  },
  postButton: {
    padding: scale(10),
  },
  postButtonText: {
    color: REELS_BUTTON_COLOR,
    fontWeight: 'bold',
    fontSize: scaleFont(14),
  },
  modalTitle: {
    fontSize: scaleFont(18),
    fontWeight: 'bold',
    marginBottom: scale(10),
    color: '#000000',
  },
  closeBtn: {
    marginTop: scale(20),
    color: REELS_BUTTON_COLOR,
    fontWeight: 'bold',
    fontSize: scaleFont(14),
    textAlign: 'center',
  },
  centeredModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: REELS_MODAL_BG_COLOR,
  },
  shareBox: {
    backgroundColor: '#FFFFFF',
    padding: scale(25),
    borderRadius: scale(15),
    width: '80%',
    alignItems: 'center',
  },
  shareOption: {
    padding: scale(10),
    width: '100%',
    alignItems: 'center',
  },
  shareOptionText: {
    fontSize: scaleFont(16),
    color: '#000000',
  },
});

export default ReelView;