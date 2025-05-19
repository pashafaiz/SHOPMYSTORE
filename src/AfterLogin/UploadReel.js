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
import Header from '../Components/Header';

const { width, height } = Dimensions.get('window');

// Responsive scaling functions
const scaleSize = (size) => Math.round(size * (width / 375));
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375));

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

  const handleVideoPick = async (type) => {
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

  const handleProgress = (progress) => {
    dispatch(setCurrentTime(progress.currentTime));
    Animated.timing(progressAnim, {
      toValue: progress.currentTime / duration,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  const handleLoad = (meta) => {
    dispatch(setDuration(meta.duration));
  };

  const handleEnd = () => {
    dispatch(setPaused(true));
    if (videoRef.current) {
      videoRef.current.seek(0);
    }
    dispatch(setCurrentTime(0));
    progressAnim.setValue(0);
  };

  const handleSeek = (event) => {
    if (!video || !duration || !videoRef.current) return;

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
    if (!video || !video.uri) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a valid video first',
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

    dispatch(
      uploadReel({
        video: {
          uri: video.uri,
          type: video.type || 'video/mp4',
          fileName: video.fileName || `reel_${Date.now()}.mp4`,
        },
        caption,
      }),
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const glowShadow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [scaleSize(1), scaleSize(6)],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.6],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient
      colors={BACKGROUND_GRADIENT}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <Header
        title={"Upload video"}
        showLeftIcon={true}
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        transparent
        style={styles.header}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.videoContainer}>
          {video ? (
            <Animated.View
              style={[
                styles.videoWrapper,
                {
                  shadowRadius: glowShadow,
                  shadowOpacity: glowOpacity,
                  shadowColor: PRIMARY_THEME_COLOR,
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleVideoPress}
                style={styles.videoTouchable}
              >
                <Video
                  ref={videoRef}
                  source={{ uri: video.uri }}
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
                onPress={() => dispatch(removeVideo())}
              >
                <Ionicons
                  name="close-circle"
                  size={scaleSize(28)}
                  color={SECONDARY_THEME_COLOR}
                  style={styles.removeIcon}
                />
              </TouchableOpacity>

              {showProgress && (
                <TouchableOpacity
                  style={styles.progressBarContainer}
                  onPress={handleSeek}
                  activeOpacity={1}
                >
                  <View style={styles.progressBarBackground}>
                    <Animated.View
                      style={[styles.progressBarFill, { width: progressWidth }]}
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
                        transform: [{ rotate: `${uploadProgress * 3.6}deg` }],
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
                size={scaleSize(64)}
                color={PRIMARY_THEME_COLOR}
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
          placeholderTextColor={SUBTEXT_THEME_COLOR}
          value={caption}
          onChangeText={(text) => dispatch(setCaption(text))}
          multiline
          maxLength={150}
          editable={!loading}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleVideoPick('camera')}
            disabled={loading}
          >
            <LinearGradient
              colors={[CATEGORY_BG_COLOR, PRIMARY_THEME_COLOR]}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="camera" size={scaleSize(24)} color={TEXT_THEME_COLOR} />
              <Text style={styles.buttonText}>Record</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.galleryButton]}
            onPress={() => handleVideoPick('gallery')}
            disabled={loading}
          >
            <Ionicons name="images" size={scaleSize(24)} color={TEXT_THEME_COLOR} />
            <Text style={styles.buttonText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!video || loading || !caption.trim()) && styles.disabledButton,
          ]}
          onPress={handleUpload}
          disabled={!video || loading || !caption.trim()}
        >
          {loading ? (
            <ActivityIndicator size="small" color={TEXT_THEME_COLOR} />
          ) : (
            <>
              <Ionicons
                name="cloud-upload"
                size={scaleSize(24)}
                color={TEXT_THEME_COLOR}
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
    paddingBottom: scaleSize(30),
  },
  videoContainer: {
    alignItems: 'center',
    marginBottom: scaleSize(20),
  },
  videoWrapper: {
    width: width * 0.85,
    height: width * 0.85,
    maxHeight: height * 0.6,
    borderRadius: scaleSize(15),
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: PRODUCT_BG_COLOR,
    borderWidth: scaleSize(2),
    borderColor: BORDER_THEME_COLOR,
    shadowOffset: { width: 0, height: scaleSize(3) },
    shadowOpacity: 0.15,
    shadowRadius: scaleSize(6),
    elevation: 4,
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
    top: scaleSize(8),
    right: scaleSize(8),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: scaleSize(16),
    padding: scaleSize(4),
  },
  removeIcon: {
    shadowColor: SECONDARY_THEME_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: scaleSize(4),
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
    height: scaleSize(5),
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scaleSize(3),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: PRIMARY_THEME_COLOR,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scaleSize(6),
  },
  timeText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(13),
    fontWeight: '600',
  },
  progressCircle: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  progressBackground: {
    width: scaleSize(80),
    height: scaleSize(80),
    borderRadius: scaleSize(40),
    borderWidth: scaleSize(3),
    borderColor: CATEGORY_BG_COLOR,
    position: 'absolute',
  },
  progressFill: {
    width: scaleSize(80),
    height: scaleSize(80),
    borderRadius: scaleSize(40),
    borderWidth: scaleSize(3),
    borderColor: PRIMARY_THEME_COLOR,
    borderStyle: 'solid',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    position: 'absolute',
  },
  progressText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(16),
    fontWeight: '800',
  },
  placeholder: {
    width: width * 0.85,
    height: width * 0.85,
    maxHeight: height * 0.6,
    borderRadius: scaleSize(15),
    backgroundColor: PRODUCT_BG_COLOR,
    borderWidth: scaleSize(3),
    borderColor: BORDER_THEME_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaleSize(25),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleSize(3) },
    shadowOpacity: 0.15,
    shadowRadius: scaleSize(6),
    elevation: 4,
  },
  placeholderText: {
    fontSize: scaleFont(20),
    color: TEXT_THEME_COLOR,
    marginTop: scaleSize(20),
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: scaleFont(15),
    color: SUBTEXT_THEME_COLOR,
    marginTop: scaleSize(8),
    fontWeight: '500',
    textAlign: 'center',
  },
  captionInput: {
    borderWidth: scaleSize(2),
    borderColor: BORDER_THEME_COLOR,
    borderRadius: scaleSize(15),
    padding: scaleSize(18),
    fontSize: scaleFont(17),
    color: TEXT_THEME_COLOR,
    backgroundColor: PRODUCT_BG_COLOR,
    marginBottom: scaleSize(20),
    minHeight: scaleSize(130),
    textAlignVertical: 'top',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleSize(20),
    gap: scaleSize(20),
  },
  actionButton: {
    flex: 1,
    borderRadius: scaleSize(12),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleSize(3) },
    shadowOpacity: 0.15,
    shadowRadius: scaleSize(6),
    // elevation: 4,
  },
  actionButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scaleSize(16),
    gap: scaleSize(12),
  },
  galleryButton: {
    backgroundColor: PRODUCT_BG_COLOR,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scaleSize(16),
    gap: scaleSize(12),
  },
  buttonText: {
    fontSize: scaleFont(17),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
  },
  uploadButton: {
    backgroundColor: PRIMARY_THEME_COLOR,
    paddingVertical: scaleSize(18),
    borderRadius: scaleSize(15),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSize(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleSize(3) },
    shadowOpacity: 0.15,
    shadowRadius: scaleSize(6),
    // elevation: 4,
  },
  disabledButton: {
    backgroundColor: CATEGORY_BG_COLOR,
    shadowOpacity: 0,
  },
  uploadButtonText: {
    fontSize: scaleFont(18),
    color: TEXT_THEME_COLOR,
    fontWeight: '800',
  },
});

export default UploadReel;