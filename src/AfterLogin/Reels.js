// import React, {useEffect, useRef, useState} from 'react';
// import {
//   View,
//   FlatList,
//   Dimensions,
//   StyleSheet,
//   TouchableWithoutFeedback,
//   Text,
//   Animated,
//   Pressable,
//   Modal,
//   ActivityIndicator,
//   RefreshControl,
// } from 'react-native';
// import Video from 'react-native-video';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import {getReelsApi, BASE_URL} from '../../apiClient'; // Make sure this is set up properly

// const {height, width} = Dimensions.get('window');

// const Reels = () => {
//   const [reelsData, setReelsData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [likedReels, setLikedReels] = useState({});
//   const [savedReels, setSavedReels] = useState({});
//   const [muted, setMuted] = useState(true);
//   const [commentModalVisible, setCommentModalVisible] = useState(false);
//   const [shareModalVisible, setShareModalVisible] = useState(false);
//   const likeAnim = useRef(new Animated.Value(1)).current;

//   useEffect(() => {
//     fetchReels();
//   }, []);

//   const fetchReels = async () => {
//     setLoading(true);
//     try {
//       const {ok, data} = await getReelsApi();
//       if (ok && Array.isArray(data.reels)) {
//         setReelsData(data.reels);
//       } else {
//         console.error('Invalid reels format:', data);
//         setReelsData([]);
//       }
//     } catch (error) {
//       console.error('Reels fetch error:', error);
//     }
//     setLoading(false);
//     setRefreshing(false);
//   };

//   const handleLike = id => {
//     setLikedReels(prev => ({...prev, [id]: !prev[id]}));
//     Animated.sequence([
//       Animated.timing(likeAnim, {
//         toValue: 1.4,
//         duration: 150,
//         useNativeDriver: true,
//       }),
//       Animated.timing(likeAnim, {
//         toValue: 1,
//         duration: 150,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   };

//   const handleSave = id => {
//     const newSaved = !savedReels[id];
//     setSavedReels(prev => ({...prev, [id]: newSaved}));
//   };

//   const renderItem = ({item, index}) => {
//     const isActive = currentIndex === index;
//     const videoUri = item.videoUrl.startsWith('http')
//     ? item.videoUrl
//     : `${BASE_URL.replace('/api', '')}/${item.videoUrl.replace(/^\/+/, '')}`;
  
//     console.log('Video URL:--->', videoUri);

//     return (
//       <TouchableWithoutFeedback onPress={() => handleLike(item._id)}>
//         <View style={styles.reelContainer}>
//           <Video
//             source={{uri: videoUri}}
//             style={styles.video}
//             resizeMode="cover"
//             repeat
//             muted={muted}
//             paused={!isActive}
//             controls={false} // Optional
//             ignoreSilentSwitch="ignore" // iOS silent mode
//             onError={e => console.log('Video error:', e)}
//           />

//           <View style={styles.overlay}>
//             <View style={styles.bottomLeft}>
//               <Text style={styles.username}>
//                 @{item.user?.userName || 'unknown'}
//               </Text>
//               <Text style={styles.caption}>{item.caption || ''}</Text>
//             </View>

//             <View style={styles.rightButtons}>
//               <Animated.View
//                 style={[
//                   styles.iconContainer,
//                   {transform: [{scale: likeAnim}]},
//                 ]}>
//                 <Ionicons
//                   name={likedReels[item._id] ? 'heart' : 'heart-outline'}
//                   size={30}
//                   color={likedReels[item._id] ? 'red' : 'white'}
//                   onPress={() => handleLike(item._id)}
//                 />
//                 <Text style={styles.iconText}>Like</Text>
//               </Animated.View>

//               <Pressable
//                 onPress={() => setCommentModalVisible(true)}
//                 style={styles.iconContainer}>
//                 <Ionicons name="chatbubble-outline" size={26} color="white" />
//                 <Text style={styles.iconText}>Comment</Text>
//               </Pressable>

//               <Pressable
//                 onPress={() => setShareModalVisible(true)}
//                 style={styles.iconContainer}>
//                 <Ionicons name="paper-plane-outline" size={26} color="white" />
//                 <Text style={styles.iconText}>Share</Text>
//               </Pressable>

//               <Pressable
//                 onPress={() => handleSave(item._id)}
//                 style={styles.iconContainer}>
//                 <Ionicons
//                   name={savedReels[item._id] ? 'bookmark' : 'bookmark-outline'}
//                   size={26}
//                   color="white"
//                 />
//               </Pressable>

//               <Pressable
//                 onPress={() => setMuted(prev => !prev)}
//                 style={styles.iconContainer}>
//                 <Ionicons
//                   name={muted ? 'volume-mute' : 'volume-high'}
//                   size={26}
//                   color="white"
//                 />
//               </Pressable>
//             </View>
//           </View>
//         </View>
//       </TouchableWithoutFeedback>
//     );
//   };

//   if (loading) {
//     return (
//       <View style={styles.loaderContainer}>
//         <ActivityIndicator size="large" color="white" />
//       </View>
//     );
//   }

//   return (
//     <>
//       <FlatList
//         data={reelsData}
//         renderItem={renderItem}
//         keyExtractor={item => item._id}
//         pagingEnabled
//         showsVerticalScrollIndicator={false}
//         onScroll={e => {
//           const index = Math.round(e.nativeEvent.contentOffset.y / height);
//           setCurrentIndex(index);
//         }}
//         decelerationRate="fast"
//         snapToInterval={height}
//         snapToAlignment="start"
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={fetchReels} />
//         }
//       />

//       {/* Comment Modal */}
//       <Modal visible={commentModalVisible} animationType="slide" transparent>
//         <View style={styles.modalContainer}>
//           <View style={styles.commentBox}>
//             <Text style={styles.modalTitle}>Comments</Text>
//             <Text style={styles.modalContent}>
//               Real comment system coming soon...
//             </Text>
//             <Pressable onPress={() => setCommentModalVisible(false)}>
//               <Text style={styles.closeBtn}>Close</Text>
//             </Pressable>
//           </View>
//         </View>
//       </Modal>

//       {/* Share Modal */}
//       <Modal visible={shareModalVisible} animationType="fade" transparent>
//         <View style={styles.centeredModalContainer}>
//           <View style={styles.shareBox}>
//             <Text style={styles.modalTitle}>Share Reel</Text>
//             <Text style={styles.modalContent}>
//               Share functionality coming soon...
//             </Text>
//             <Pressable onPress={() => setShareModalVisible(false)}>
//               <Text style={styles.closeBtn}>Close</Text>
//             </Pressable>
//           </View>
//         </View>
//       </Modal>
//     </>
//   );
// };

// export default Reels;

// const styles = StyleSheet.create({
//   reelContainer: {
//     height,
//     width,
//     backgroundColor: 'black',
//   },
//   video: {
//     height: '100%',
//     width: '100%',
//     position: 'absolute',
//   },
//   overlay: {
//     flex: 1,
//     justifyContent: 'space-between',
//     padding: 16,
//   },
//   bottomLeft: {
//     position: 'absolute',
//     bottom: 120,
//     left: 10,
//     width: '70%',
//   },
//   username: {
//     color: 'white',
//     fontWeight: 'bold',
//     fontSize: 16,
//     marginBottom: 4,
//   },
//   caption: {
//     color: 'white',
//     fontSize: 14,
//   },
//   rightButtons: {
//     position: 'absolute',
//     right: 10,
//     bottom: 100,
//     alignItems: 'center',
//   },
//   iconContainer: {
//     alignItems: 'center',
//     marginBottom: 25,
//   },
//   iconText: {
//     color: 'red',
//     fontSize: 12,
//     marginTop: 4,
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'flex-end',
//     backgroundColor: 'rgba(0,0,0,0.5)',
//   },
//   commentBox: {
//     backgroundColor: 'white',
//     padding: 20,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   modalContent: {
//     fontSize: 14,
//     color: 'gray',
//   },
//   closeBtn: {
//     marginTop: 20,
//     color: 'blue',
//     fontWeight: 'bold',
//   },
//   centeredModalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.6)',
//   },
//   shareBox: {
//     backgroundColor: 'white',
//     padding: 25,
//     borderRadius: 15,
//     width: '80%',
//     alignItems: 'center',
//   },
//   loaderContainer: {
//     flex: 1,
//     backgroundColor: 'black',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });









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
} from 'react-native';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Share from 'react-native-share';
import LinearGradient from 'react-native-linear-gradient';
import { getReelsApi, BASE_URL, postCommentApi, getCommentsApi } from '../../apiClient'; // Update with your APIs

const { height, width } = Dimensions.get('window');

const Reels = () => {
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
  const flatListRef = useRef(null);
  const likeAnim = useRef(new Animated.Value(1)).current;
  const doubleTapAnim = useRef(new Animated.Value(0)).current;

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

  // Fetch comments for a reel
  const fetchComments = useCallback(async (reelId) => {
    try {
      const { ok, data } = await getCommentsApi(reelId);
      if (ok) {
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Comments fetch error:', error);
    }
  }, []);

  // Post a comment
  const postComment = useCallback(async () => {
    if (!newComment.trim() || !selectedReelId) return;
    try {
      const { ok } = await postCommentApi(selectedReelId, { text: newComment });
      if (ok) {
        fetchComments(selectedReelId);
        setNewComment('');
      }
    } catch (error) {
      console.error('Post comment error:', error);
    }
  }, [newComment, selectedReelId, fetchComments]);

  // Handle like with double-tap support
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

  const handleDoubleTap = useCallback(
    (id) => {
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
    },
    [likedReels, handleLike, doubleTapAnim]
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

  // Handle scroll to update current index
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  // Render each reel
  const renderItem = useCallback(
    ({ item, index }) => {
      const isActive = currentIndex === index;
      const videoUri = item.videoUrl.startsWith('http')
        ? item.videoUrl
        : `${BASE_URL.replace('/api', '')}/${item.videoUrl.replace(/^\/+/, '')}`;

      return (
        <TouchableWithoutFeedback
          onPress={() => {
            let lastTap = 0;
            const now = Date.now();
            const DOUBLE_PRESS_DELAY = 300;
            if (now - lastTap < DOUBLE_PRESS_DELAY) {
              handleDoubleTap(item._id);
            } else {
              lastTap = now;
            }
          }}
        >
          <View style={styles.reelContainer}>
            <Video
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
                  <Image
                    source={{ uri: item.user?.avatar || 'https://via.placeholder.com/40' }}
                    style={styles.avatar}
                  />
                  <Text style={styles.username}>
                    @{item.user?.userName || 'unknown'}
                  </Text>
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
                  {/* <Text style={styles.iconText}>{(item.comments || 0).toString()}</Text> */}
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
      handleDoubleTap,
      handleSave,
      likeAnim,
      doubleTapAnim,
      fetchComments,
    ]
  );

  // Optimize FlatList rendering
  const getItemLayout = (data, index) => ({
    length: height,
    offset: height * index,
    index,
  });

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <>
      <FlatList
        ref={flatListRef}
        data={reelsData}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={5}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 80,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchReels} />
        }
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
    </>
  );
};

const styles = StyleSheet.create({
  reelContainer: {
    height,
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