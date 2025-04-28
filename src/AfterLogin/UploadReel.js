import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
  Animated,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import {
  uploadReel,
  setVideo,
  removeVideo,
  setCaption,
  setPaused,
  setCurrentTime,
  setDuration,
  setShowProgress,
  resetUploadState,
} from '../redux/slices/uploadReelSlice';
import Colors from '../constants/Colors';
import Header from '../Components/Header';
import {
  BACKGROUND_COLORS,
  REELS_BUTTON_COLOR,
  REELS_MODAL_TEXT_COLOR,
} from '../constants/GlobalConstants';

const { width, height } = Dimensions.get('window');

// Responsive scaling functions
const scaleSize = size => Math.round(size * (width / 375));
const scaleFont = size => Math.round(size * (Math.min(width, height) / 375));

// Constants
const MAX_VIDEO_DURATION = 60; // 60 seconds
const MAX_VIDEO_SIZE_MB = 60; // 60MB
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

const UploadReel = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {
    video,
    caption,
    loading,
    uploadProgress,
    paused,
    currentTime,
    duration,
    showProgress,
    error,
    success,
  } = useSelector((state) => state.uploadReel);
  const videoRef = useRef(null);
  const glowAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef(null);

  // Glowing animation for video border
  const startGlow = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  // Handle navigation and state reset after successful upload
  useEffect(() => {
    if (success) {
      dispatch(resetUploadState());
      navigation.goBack();
    }
  }, [success, dispatch, navigation]);

  useEffect(() => {
    if (showProgress) {
      timeoutRef.current = setTimeout(() => {
        dispatch(setShowProgress(false));
      }, 3000);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [showProgress, dispatch]);

  useEffect(() => {
    if (video) {
      startGlow();
    }
  }, [video]);

  const handleVideoPick = async type => {
    const options = {
      mediaType: 'video',
      videoQuality: 'high',
      durationLimit: MAX_VIDEO_DURATION,
    };

    try {
      const pickerResult =
        type === 'camera'
          ? await launchCamera(options)
          : await launchImageLibrary(options);

      if (pickerResult.didCancel) return;

      if (pickerResult.errorCode) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: pickerResult.errorMessage || 'Failed to select video',
        });
        return;
      }

      if (pickerResult.assets?.length) {
        const asset = pickerResult.assets[0];

        if (asset.duration > MAX_VIDEO_DURATION) {
          throw new Error(
            `Video must be ${MAX_VIDEO_DURATION} seconds or shorter`,
          );
        }

        if (asset.fileSize > MAX_VIDEO_SIZE_BYTES) {
          throw new Error(`Video must be ${MAX_VIDEO_SIZE_MB}MB or smaller`);
        }

        const videoData = {
          uri: asset.uri,
          type: asset.type || 'video/mp4',
          fileName: asset.fileName || `reel_${Date.now()}.mp4`,
          duration: asset.duration,
          fileSize: asset.fileSize,
        };

        dispatch(setVideo(videoData));
        dispatch(setDuration(asset.duration));

        Toast.show({
          type: 'success',
          text1: 'Video selected',
          text2: `${Math.round(asset.duration)}s • ${(
            asset.fileSize /
            (1024 * 1024)
          ).toFixed(1)}MB`,
        });
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: err.message,
      });
    }
  };

  const handleVideoPress = () => {
    dispatch(setPaused(!paused));
    dispatch(setShowProgress(true));
  };

  const handleProgress = progress => {
    dispatch(setCurrentTime(progress.currentTime));
    Animated.timing(progressAnim, {
      toValue: progress.currentTime / duration,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  const handleLoad = meta => {
    dispatch(setDuration(meta.duration));
  };

  const handleEnd = () => {
    dispatch(setPaused(true));
    videoRef.current.seek(0);
    dispatch(setCurrentTime(0));
    progressAnim.setValue(0);
  };

  const handleSeek = event => {
    if (!video || !duration) return;

    const progressBarWidth = width * 0.85 - scaleSize(30);
    const touchX = event.nativeEvent.locationX;
    let seekPercentage = touchX / progressBarWidth;
    seekPercentage = Math.max(0, Math.min(1, seekPercentage));
    const seekPosition = seekPercentage * duration;

    videoRef.current.seek(seekPosition);
    dispatch(setCurrentTime(seekPosition));
    progressAnim.setValue(seekPercentage);
    dispatch(setShowProgress(true));

    if (!paused) {
      dispatch(setPaused(false));
    }
  };

  const handleUpload = () => {
    if (!video) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a video first',
      });
      return;
    }

    if (!caption.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Caption is required',
      });
      return;
    }

    dispatch(uploadReel({ video, caption }));
  };

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const glowShadow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [scaleSize(2), scaleSize(8)],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient
      colors={BACKGROUND_COLORS}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled">
        <Header
          title="Create Reel"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.videoContainer}>
          {video ? (
            <Animated.View
              style={[
                styles.videoWrapper,
                {
                  shadowRadius: glowShadow,
                  shadowOpacity: glowOpacity,
                },
              ]}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleVideoPress}
                style={styles.videoTouchable}>
                <Video
                  ref={videoRef}
                  source={{uri: video.uri}}
                  style={styles.video}
                  resizeMode="cover"
                  paused={paused}
                  repeat={false}
                  onProgress={handleProgress}
                  onLoad={handleLoad}
                  onEnd={handleEnd}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => dispatch(removeVideo())}>
                <Ionicons
                  name="close-circle"
                  size={scaleSize(32)}
                  color="#FF3E6D"
                  style={styles.removeIcon}
                />
              </TouchableOpacity>

              {showProgress && (
                <TouchableOpacity
                  style={styles.progressBarContainer}
                  onPress={handleSeek}
                  activeOpacity={1}>
                  <View style={styles.progressBarBackground}>
                    <Animated.View
                      style={[styles.progressBarFill, {width: progressWidth}]}
                    />
                  </View>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                  </View>
                </TouchableOpacity>
              )}

              {loading && (
                <View style={styles.progressCircle}>
                  <View style={styles.progressBackground} />
                  <View
                    style={[
                      styles.progressFill,
                      {
                        transform: [{rotate: `${uploadProgress * 3.6}deg`}],
                      },
                    ]}
                  />
                  <Text style={styles.progressText}>{uploadProgress}%</Text>
                </View>
              )}
            </Animated.View>
          ) : (
            <View style={styles.placeholder}>
              <Ionicons
                name="videocam-outline"
                size={scaleSize(60)}
                color={REELS_MODAL_TEXT_COLOR}
              />
              <Text style={styles.placeholderText}>
                Select or Record a Video
              </Text>
              <Text style={styles.placeholderSubtext}>
                Max {MAX_VIDEO_DURATION}s • {MAX_VIDEO_SIZE_MB}MB
              </Text>
            </View>
          )}
        </View>

        <TextInput
          style={styles.captionInput}
          placeholder="Add a caption (required)"
          placeholderTextColor="#A0A0A0"
          value={caption}
          onChangeText={(text) => dispatch(setCaption(text))}
          multiline
          maxLength={150}
          editable={!loading}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cameraButton]}
            onPress={() => handleVideoPick('camera')}
            disabled={loading}>
            <Ionicons name="camera" size={scaleSize(24)} color={REELS_MODAL_TEXT_COLOR} />
            <Text style={styles.buttonText}>Record</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.galleryButton]}
            onPress={() => handleVideoPick('gallery')}
            disabled={loading}>
            <Ionicons name="images" size={scaleSize(24)} color="#000" />
            <Text style={[styles.buttonText, styles.galleryButtonText]}>
              Gallery
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!video || loading || !caption.trim()) && styles.disabledButton,
          ]}
          onPress={handleUpload}
          disabled={!video || loading || !caption.trim()}>
          {loading ? (
            <ActivityIndicator size="small" color={REELS_MODAL_TEXT_COLOR} />
          ) : (
            <>
              <Ionicons
                name="cloud-upload"
                size={scaleSize(24)}
                color={REELS_MODAL_TEXT_COLOR}
              />
              <Text style={styles.uploadButtonText}>Upload Reel</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: scaleSize(20),
    paddingTop: scaleSize(10),
    paddingBottom: scaleSize(20),
  },
  videoContainer: {
    alignItems: 'center',
    marginBottom: scaleSize(15),
  },
  videoWrapper: {
    width: width * 0.85,
    height: width * 0.85,
    maxHeight: height * 0.6,
    borderRadius: scaleSize(12),
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#FFFFFF',
    shadowOffset: {width: 0, height: 0},
    elevation: scaleSize(10),
    backgroundColor: '#000',
  },
  videoTouchable: {
    flex: 1,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: scaleSize(10),
    right: scaleSize(10),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: scaleSize(20),
    padding: scaleSize(5),
  },
  removeIcon: {
    shadowColor: '#FF3E6D',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: scaleSize(5),
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: scaleSize(15),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  progressBarBackground: {
    height: scaleSize(4),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: scaleSize(2),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scaleSize(5),
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: scaleFont(12),
    fontWeight: '600',
  },
  progressCircle: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  progressBackground: {
    width: scaleSize(100),
    height: scaleSize(100),
    borderRadius: scaleSize(50),
    borderWidth: scaleSize(4),
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'absolute',
  },
  progressFill: {
    width: scaleSize(100),
    height: scaleSize(100),
    borderRadius: scaleSize(50),
    borderWidth: scaleSize(4),
    borderColor: '#FFFFFF',
    borderStyle: 'solid',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    position: 'absolute',
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: scaleFont(18),
    fontWeight: '800',
  },
  placeholder: {
    width: width * 0.85,
    height: width * 0.85,
    maxHeight: height * 0.6,
    borderRadius: scaleSize(12),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: scaleSize(2),
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaleSize(20),
  },
  placeholderText: {
    fontSize: scaleFont(18),
    color: '#FFFFFF',
    marginTop: scaleSize(15),
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: scaleFont(14),
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: scaleSize(5),
    fontWeight: '500',
    textAlign: 'center',
  },
  captionInput: {
    borderWidth: scaleSize(1),
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: scaleSize(12),
    padding: scaleSize(16),
    fontSize: scaleFont(16),
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: scaleSize(15),
    minHeight: scaleSize(120),
    textAlignVertical: 'top',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleSize(15),
    gap: scaleSize(15),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scaleSize(14),
    borderRadius: scaleSize(10),
    gap: scaleSize(10),
    shadowColor: '#FFFFFF',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: scaleSize(8),
    elevation: scaleSize(5),
  },
  cameraButton: {
    backgroundColor: Colors.lightPurple,
  },
  galleryButton: {
    backgroundColor: '#FFFFFF',
  },
  buttonText: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  galleryButtonText: {
    color: '#000',
  },
  uploadButton: {
    backgroundColor: '#7B61FF',
    paddingVertical: scaleSize(16),
    borderRadius: scaleSize(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSize(12),
    shadowColor: '#7B61FF',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: scaleSize(10),
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    shadowOpacity: 0,
  },
  uploadButtonText: {
    fontSize: scaleFont(18),
    color: '#FFFFFF',
    fontWeight: '800',
  },
});

export default UploadReel;