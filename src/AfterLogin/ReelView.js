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
import { postCommentApi, getCommentsApi, BASE_URL } from '../../apiClient';
import { useNavigation } from '@react-navigation/native';

const { height, width } = Dimensions.get('window');

const ReelView = ({ route }) => {
  const { reel } = route.params;
  const navigation = useNavigation();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [muted, setMuted] = useState(true);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [buffering, setBuffering] = useState(false);
  const videoRef = useRef(null);
  const likeAnim = useRef(new Animated.Value(1)).current;
  const doubleTapAnim = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef({ time: 0 });

  // Fetch comments for the reel
  const fetchComments = useCallback(async () => {
    try {
      const { ok, data } = await getCommentsApi(reel._id);
      if (ok) {
        setComments(data.comments || []);
      } else {
        console.warn('Failed to fetch comments:', data.msg);
      }
    } catch (error) {
      console.error('Comments fetch error:', error);
    }
  }, [reel._id]);

  // Post a comment
  const postComment = useCallback(async () => {
    if (!newComment.trim()) return;
    try {
      const { ok, data } = await postCommentApi(reel._id, { text: newComment });
      if (ok) {
        fetchComments();
        setNewComment('');
      } else {
        console.warn('Failed to post comment:', data.msg);
      }
    } catch (error) {
      console.error('Post comment error:', error);
    }
  }, [newComment, reel._id, fetchComments]);

  // Handle like
  const handleLike = useCallback(() => {
    setLiked((prev) => !prev);
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
  }, [likeAnim]);

  // Handle tap (single tap for mute/unmute, double tap for like)
  const handleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    const UNMUTE_DELAY = 2000;

    if (now - lastTapRef.current.time < DOUBLE_PRESS_DELAY) {
      if (!liked) {
        handleLike();
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
      lastTapRef.current = { time: now };
    } else {
      if (!muted) {
        setMuted(true);
      } else {
        setTimeout(() => {
          setMuted(false);
        }, UNMUTE_DELAY);
      }
      lastTapRef.current = { time: now };
    }
  }, [liked, handleLike, doubleTapAnim, muted]);

  // Handle save
  const handleSave = useCallback(() => {
    setSaved((prev) => !prev);
  }, []);

  // Share reel
  const handleShare = useCallback(async () => {
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
  }, [reel]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const videoUri = reel.videoUrl.startsWith('http')
    ? reel.videoUrl
    : `${BASE_URL.replace('/api', '')}/${reel.videoUrl.replace(/^\/+/, '')}`;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.reelContainer}>
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={styles.video}
            resizeMode="cover"
            repeat
            muted={muted}
            paused={false}
            onBuffer={({ isBuffering }) => setBuffering(isBuffering)}
            onError={(e) => console.log('Video error:', e)}
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
              size="large"
              color="white"
              style={styles.bufferIndicator}
            />
          )}

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
                  onPress={() => navigation.goBack()}
                >
                  <Image
                    source={{ uri: reel.user?.avatar || 'https://via.placeholder.com/40' }}
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
                {liked ? reel.likes + 1 : reel.likes || 0} Likes ·{' '}
                {reel.comments || 0} Comments
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
                  size={30}
                  color={liked ? 'red' : 'white'}
                  onPress={handleLike}
                />
                <Text style={styles.iconText}>
                  {(liked ? reel.likes + 1 : reel.likes || 0).toString()}
                </Text>
              </Animated.View>

              <Pressable
                onPress={() => {
                  fetchComments();
                  setCommentModalVisible(true);
                }}
                style={styles.iconContainer}
              >
                <Ionicons name="chatbubble-outline" size={26} color="white" />
                <Text style={styles.iconText}>{(reel.comments || 0).toString()}</Text>
              </Pressable>

              <Pressable
                onPress={() => setShareModalVisible(true)}
                style={styles.iconContainer}
              >
                <Ionicons name="paper-plane-outline" size={26} color="white" />
                <Text style={styles.iconText}>Share</Text>
              </Pressable>

              <Pressable
                onPress={handleSave}
                style={styles.iconContainer}
              >
                <Ionicons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
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

      <Modal visible={shareModalVisible} animationType="fade" transparent>
        <View style={styles.centeredModalContainer}>
          <View style={styles.shareBox}>
            <Text style={styles.modalTitle}>Share Reel</Text>
            <Pressable
              onPress={handleShare}
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
});

export default ReelView;