import React, { useEffect, useRef, useState, useContext } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  RefreshControl,
  Animated,
  AppState,
  Share,
  Linking,
  Platform,
  TextInput,
  Modal,
  ActivityIndicator,
  Easing,
} from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProductDetails,
  toggleLike,
  addToCart,
  removeFromCart,
  loadRecentlyViewed,
  saveRecentlyViewed,
  clearRecentlyViewed,
  setCurrentMediaIndex,
  setVideoProgress,
  setVideoDuration,
  clearError,
  setRefreshing,
} from '../redux/slices/productDetailSlice';
import Rating from '../Components/Rating';
import SizeSelector from '../Components/SizeSelector';
import ColorSelector from '../Components/ColorSelector';
import QuantitySelector from '../Components/QuantitySelector';
import ProductHighlights from '../Components/ProductHighlights';
import ProductSpecifications from '../Components/ProductSpecifications';
import Header from '../Components/Header';
import {
  BASE_URL,
  PRODUCTS_ENDPOINT,
  TOAST_POSITION,
  TOAST_TOP_OFFSET,
  DEFAULT_IMAGE_URL,
  HTTP_METHODS,
} from '../constants/GlobalConstants';
import { ThemeContext } from '../constants/ThemeContext';
import Trace from '../utils/Trace';

// Define theme colors
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

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375) * 0.85);

const ProductDetail = ({ route, navigation }) => {
  const { productId } = route.params || {};
  const dispatch = useDispatch();
  const { theme } = useContext(ThemeContext);
  const {
    product,
    user,
    relatedProducts,
    recentlyViewed,
    cartItems,
    userId,
    token,
    loading,
    refreshing,
    currentMediaIndex,
    isLiked,
    isInCart,
    videoProgress,
    videoDuration,
    error,
    currentProductId,
  } = useSelector((state) => state.productDetail);

  const scrollY = new Animated.Value(0);
  const appState = useRef(AppState.currentState);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isReviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [expandedReviews, setExpandedReviews] = useState({});
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(true);
  const videoRef = useRef(null);
  const scrollViewRef = useRef();
  const flatListRef = useRef();
  const [currentMediaType, setCurrentMediaType] = useState('image');

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  // Spin animation for loader
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Fetch reviews
  const [reviews, setReviews] = useState([]);
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}${PRODUCTS_ENDPOINT}/reviews/${productId}`,
          {
            method: HTTP_METHODS.GET,
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json',
            },
          }
        );
        const data = await response.json();
        if (response.ok) {
          setReviews(data.reviews || []);
          console.log('Reviews fetched:', data.reviews); // Debug log
        } else {
          Toast.show({
            type: 'error',
            text1: data.msg || 'Failed to fetch reviews',
            position: TOAST_POSITION,
            topOffset: scale(20),
          });
        }
      } catch (error) {
        console.log('Error fetching reviews:', error);
        Toast.show({
          type: 'error',
          text1: 'Network error fetching reviews',
          position: TOAST_POSITION,
          topOffset: scale(20),
        });
      }
    };

    if (productId) {
      fetchReviews();
    }
  }, [productId, token]);

  // Handle productId change to fetch product details
  useEffect(() => {
    if (productId) {
      dispatch(fetchProductDetails({ productId }));
      if (userId) {
        dispatch(loadRecentlyViewed({ userId }));
      }
    }
  }, [productId, userId, dispatch]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (product && !loading && userId) {
      dispatch(saveRecentlyViewed({ productId, product, userId }));
      console.log('Saving recently viewed:', { productId, product }); // Debug log
    }
  }, [product, productId, loading, userId, dispatch]);

  // Handle app state changes to pause/resume video
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (currentMediaType === 'video') {
          setIsVideoPaused(false);
        }
      } else if (nextAppState.match(/inactive|background/)) {
        setIsVideoPaused(true);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [currentMediaType]);

  // Pause video when component unmounts
  useEffect(() => {
    return () => {
      setIsVideoPaused(true);
    };
  }, []);

  const toggleReviewExpansion = (reviewId) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  const toggleShowAllReviews = () => {
    setShowAllReviews((prev) => !prev);
  };

  const onRefresh = async () => {
    dispatch(setRefreshing(true));
    try {
      if (productId) {
        await dispatch(fetchProductDetails({ productId }));
        if (userId) {
          await dispatch(loadRecentlyViewed({ userId }));
        }
      }
    } catch (error) {
      console.log('Refresh error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to refresh product details',
        position: TOAST_POSITION,
        topOffset: scale(20),
      });
    } finally {
      dispatch(setRefreshing(false));
    }
  };

  const handleAddToCart = async () => {
    if (!userId) {
      Toast.show({
        type: 'error',
        text1: 'Please login to add items to cart',
        position: TOAST_POSITION,
        topOffset: scale(20),
      });
      return;
    }

    if (!token || !productId) {
      Toast.show({
        type: 'error',
        text1: 'Invalid request parameters',
        position: TOAST_POSITION,
        topOffset: scale(20),
      });
      return;
    }

    if (isInCart) {
      navigation.navigate('Profile', { cart: true });
    } else {
      dispatch(addToCart({ productId, token, quantity, size: selectedSize, color: selectedColor }));
    }
  };

  const handleToggleLike = async () => {
    if (!userId) {
      Toast.show({
        type: 'error',
        text1: 'Please login to like products',
        position: TOAST_POSITION,
        topOffset: scale(20),
      });
      return;
    }

    if (!token || !productId) {
      Toast.show({
        type: 'error',
        text1: 'Invalid request parameters',
        position: TOAST_POSITION,
        topOffset: scale(20),
      });
      return;
    }

    dispatch(toggleLike({ productId, token }));
  };

  const handleVideoProgress = (data) => {
    dispatch(setVideoProgress(data.currentTime / data.seekableDuration));
  };

  const handleVideoLoad = (data) => {
    dispatch(setVideoDuration(data.duration));
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this amazing product: ${product?.name || 'Product'} - ₹${product?.price || 'N/A'}`,
        url: `https://shopmystore.com/products/${productId}`,
        title: product?.name || 'Product',
      });
    } catch (error) {
      console.log('Share error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error sharing product',
        text2: error.message,
        position: TOAST_POSITION,
        topOffset: scale(20),
      });
    }
  };

  const handleCallSeller = () => {
    if (user?.phone) {
      Linking.openURL(`tel:${user.phone}`);
    } else {
      Toast.show({
        type: 'error',
        text1: 'Seller contact not available',
        position: TOAST_POSITION,
        topOffset: scale(20),
      });
    }
  };

  const handleSubmitReview = () => {
    if (!userId) {
      setReviewModalVisible(false);
      Toast.show({
        type: 'error',
        text1: 'Please login to submit a review',
        position: TOAST_POSITION,
        topOffset: scale(20),
      });
      return;
    }

    if (reviewRating === 0 || !reviewComment.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Please provide a rating and comment',
        position: TOAST_POSITION,
        topOffset: scale(20),
      });
      return;
    }

    const submitReview = async () => {
      try {
        const response = await fetch(`${BASE_URL}${PRODUCTS_ENDPOINT}/reviews`, {
          method: HTTP_METHODS.POST,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId,
            rating: reviewRating,
            comment: reviewComment,
          }),
        });
        const data = await response.json();
        if (response.ok) {
          setReviews((prev) => [
            {
              id: data.review._id,
              user: user?.userName || 'Anonymous',
              rating: reviewRating,
              date: new Date().toISOString().split('T')[0],
              comment: reviewComment,
            },
            ...prev,
          ]);
          Toast.show({
            type: 'success',
            text1: 'Review submitted successfully',
            position: TOAST_POSITION,
            topOffset: scale(20),
          });
        } else {
          Toast.show({
            type: 'error',
            text1: data.msg || 'Failed to submit review',
            position: TOAST_POSITION,
            topOffset: scale(20),
          });
        }
      } catch (error) {
        console.log('Review submission error:', error);
        Toast.show({
          type: 'error',
          text1: 'Network error submitting review',
          position: TOAST_POSITION,
          topOffset: scale(20),
        });
      }
    };

    submitReview();
    setReviewModalVisible(false);
    setReviewRating(0);
    setReviewComment('');
  };

  const handleVideoSeek = (progress) => {
    if (videoRef.current && videoDuration) {
      const seekTime = progress * videoDuration;
      videoRef.current.seek(seekTime);
      dispatch(setVideoProgress(progress));
    }
  };

  const handleMediaScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / width);
    dispatch(setCurrentMediaIndex(index));

    const media = product?.media_streams?.[index];
    if (media?.mediaType === 'video') {
      setCurrentMediaType('video');
      setIsVideoPaused(false);
    } else {
      setCurrentMediaType('image');
      setIsVideoPaused(true);
    }
  };

  const renderMediaItem = ({ item, index }) => {
    Trace("----item---->", item);
    try {
      const mediaUrl = typeof item?.url === 'string' && item.url ? item.url : DEFAULT_IMAGE_URL;
      const mediaType = item?.mediaType || 'image';

      console.log(`Rendering media item ${index}:`, { mediaUrl, mediaType }); // Debug log

      return (
        <View style={styles.mediaItem}>
          {mediaType === 'video' ? (
            <>
              <Video
                ref={index === currentMediaIndex ? videoRef : null}
                source={{ uri: mediaUrl }}
                style={styles.media}
                resizeMode="contain"
                paused={index !== currentMediaIndex || isVideoPaused}
                repeat={false}
                onProgress={handleVideoProgress}
                onLoad={handleVideoLoad}
                onEnd={() => setIsVideoPaused(true)}
                onError={(e) => console.log('Video error:', e)}
              />
              {index === currentMediaIndex && (
                <View style={styles.videoControls}>
                  <TouchableOpacity
                    style={styles.playPauseButton}
                    onPress={() => setIsVideoPaused(!isVideoPaused)}
                  >
                    <Icon
                      name={isVideoPaused ? 'play-arrow' : 'pause'}
                      size={scale(20)}
                      color={TEXT_THEME_COLOR}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.progressBarContainer}
                    onPress={(e) => {
                      const x = e.nativeEvent.locationX;
                      const progress = x / (width - scale(30));
                      handleVideoSeek(progress);
                    }}
                  >
                    <LinearGradient
                      colors={[PRIMARY_THEME_COLOR, '#8ec5fc']}
                      style={styles.progressBackground}
                    >
                      <LinearGradient
                        colors={['#8ec5fc', PRIMARY_THEME_COLOR]}
                        style={[styles.progressFill, { width: `${videoProgress * 100}%` }]}
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <Image
              source={{ uri: mediaUrl }}
              style={styles.media}
              resizeMode="contain"
              defaultSource={{ uri: DEFAULT_IMAGE_URL }}
              onError={(e) => console.log('Image error:', e.nativeEvent.error, 'URL:', mediaUrl)}
            />
          )}
        </View>
      );
    } catch (error) {
      console.log('Error rendering media item:', error);
      return (
        <View style={styles.mediaItem}>
          <Text style={[styles.errorText, { color: SUBTEXT_THEME_COLOR }]}>Failed to load media</Text>
        </View>
      );
    }
  };

  const renderRelatedProduct = ({ item }) => {
    try {
      if (!item || (!item._id && !item.id)) {
        console.log('Skipping product due to missing ID:', item);
        return null;
      }

      const scaleAnim = new Animated.Value(1);

      const onPressIn = () => {
        Animated.spring(scaleAnim, {
          toValue: 0.97,
          useNativeDriver: true,
        }).start();
      };

      const onPressOut = () => {
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      };

      // Handle media URL for related products and recently viewed
      const mediaUrl =
        typeof item?.media === 'string' && item.media
          ? item.media
          : Array.isArray(item?.media) && item.media.length > 0
          ? item.media[0]?.url || DEFAULT_IMAGE_URL
          : DEFAULT_IMAGE_URL;

      console.log(`Rendering related/recently viewed product ${item.id || item._id}:`, { mediaUrl }); // Debug log

      const isVideo = item?.mediaType === 'video' || /\.(mp4|mov|avi)$/i.test(mediaUrl);

      return (
        <Animated.View style={[styles.relatedProductCard, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={() => {
              const id = item._id || item.id;
              if (!id) {
                Toast.show({
                  type: 'error',
                  text1: 'Missing Product ID',
                  position: TOAST_POSITION,
                  topOffset: scale(20),
                });
                return;
              }
              navigation.replace('ProductDetail', { productId: id });
            }}
            activeOpacity={0.95}
          >
            <LinearGradient
              colors={[CATEGORY_BG_COLOR, 'rgba(142, 197, 252, 0.2)']}
              style={styles.relatedProductGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.relatedProductImageContainer}>
                {isVideo ? (
                  <Video
                    source={{ uri: mediaUrl }}
                    style={styles.relatedProductImage}
                    resizeMode="contain"
                    paused={true}
                    onError={(e) => console.log('Related product video error:', e)}
                  />
                ) : (
                  <Image
                    source={{ uri: mediaUrl }}
                    style={styles.relatedProductImage}
                    resizeMode="contain"
                    defaultSource={{ uri: DEFAULT_IMAGE_URL }}
                    onError={(e) => console.log('Related product image error:', e.nativeEvent.error, 'URL:', mediaUrl)}
                  />
                )}
                {item.discount && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>{item.discount}% OFF</Text>
                  </View>
                )}
              </View>
              <View style={styles.relatedProductInfo}>
                <Text style={[styles.relatedProductBrand, { color: SUBTEXT_THEME_COLOR }]}>{item.brand || 'Unknown Brand'}</Text>
                <Text style={[styles.relatedProductName, { color: TEXT_THEME_COLOR }]} numberOfLines={1}>
                  {item.name || 'Unknown Product'}
                </Text>
                <View style={styles.relatedProductRating}>
                  <Rating rating={item.rating || 0} size={10} />
                  <Text style={[styles.relatedProductReviewCount, { color: SUBTEXT_THEME_COLOR }]}>({item.reviewCount || 0})</Text>
                </View>
                <View style={styles.relatedProductPriceContainer}>
                  <Text style={[styles.relatedProductPrice, { color: TEXT_THEME_COLOR }]}>₹{item.price || 'N/A'}</Text>
                  {item.originalPrice && (
                    <Text style={[styles.relatedProductOriginalPrice, { color: SUBTEXT_THEME_COLOR }]}>₹{item.originalPrice}</Text>
                  )}
                </View>
                {item.offer && (
                  <Text style={[styles.relatedProductOffer, { color: SECONDARY_THEME_COLOR }]} numberOfLines={1}>
                    {item.offer}
                  </Text>
                )}
                <Text style={[styles.relatedProductStock, { color: item.stock > 0 ? SUBTEXT_THEME_COLOR : SECONDARY_THEME_COLOR }]}>
                  {item.stock > 0 ? `In Stock: ${item.stock}` : 'Out of Stock'}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      );
    } catch (error) {
      console.log('Error rendering related product:', error);
      return (
        <View style={styles.relatedProductCard}>
          <Text style={[styles.errorText, { color: SUBTEXT_THEME_COLOR }]}>Failed to load product</Text>
        </View>
      );
    }
  };

  const renderReviewItem = ({ item }) => {
    const isExpanded = expandedReviews[item.id] || false;
    const lineClamp = isExpanded ? undefined : 3;

    return (
      <View style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          <Text style={[styles.reviewUser, { color: TEXT_THEME_COLOR }]}>{item.user}</Text>
          <Rating rating={item.rating} size={12} />
        </View>
        <Text style={[styles.reviewDate, { color: SUBTEXT_THEME_COLOR }]}>{item.date}</Text>
        <Text
          style={[styles.reviewComment, { color: TEXT_THEME_COLOR }]}
          numberOfLines={lineClamp}
          ellipsizeMode="tail"
        >
          {item.comment}
        </Text>
        {item.comment.length > 100 && (
          <TouchableOpacity onPress={() => toggleReviewExpansion(item.id)}>
            <Text style={[styles.seeMoreText, { color: PRIMARY_THEME_COLOR }]}>
              {isExpanded ? 'See Less' : 'See More'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const ReviewsSection = ({ reviews, onWriteReview }) => {
    const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 2);

    return (
      <View style={styles.reviewsContainer}>
        <View style={styles.reviewsHeader}>
          <Text style={[styles.reviewsTitle, { color: TEXT_THEME_COLOR }]}>Customer Reviews</Text>
          <TouchableOpacity onPress={onWriteReview}>
            <Text style={[styles.writeReviewText, { color: PRIMARY_THEME_COLOR }]}>Write a Review</Text>
          </TouchableOpacity>
        </View>

        {reviews.length === 0 ? (
          <Text style={[styles.noReviewsText, { color: SUBTEXT_THEME_COLOR }]}>No reviews yet</Text>
        ) : (
          <FlatList
            data={displayedReviews}
            renderItem={renderReviewItem}
            keyExtractor={(item) => item?.id?.toString()}
            scrollEnabled={false}
          />
        )}

        {reviews.length > 2 && (
          <TouchableOpacity
            style={styles.seeAllReviewsButton}
            onPress={toggleShowAllReviews}
          >
            <Text style={[styles.seeAllReviewsText, { color: PRIMARY_THEME_COLOR }]}>
              {showAllReviews ? 'Show Less Reviews' : `See All Reviews (${reviews.length})`}
            </Text>
            <Icon
              name={showAllReviews ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={18}
              color={PRIMARY_THEME_COLOR}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderLoader = () => {
    return (
      <View style={styles.loaderOverlay}>
        <ActivityIndicator size="large" color={PRIMARY_THEME_COLOR} />
      </View>
    );
  };

  const navigateToUserProfile = () => {
    if (user?._id) {
      navigation.navigate('UserProfile', { userId: user._id });
    }
  };

  const userProfileImage =
    typeof user?.profileImage === 'string' && user.profileImage
      ? user.profileImage
      : DEFAULT_IMAGE_URL;

  const filteredRecentlyViewed = recentlyViewed.filter(
    (item) => item.id !== productId && item._id !== productId
  );

  Trace("-----product---->", product);
  return (
    <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.container}>
      {(loading || refreshing) && renderLoader()}

      <Header
        showLeftIcon={true}
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        isSearch={false}
        title={product?.name || 'Product'}
        showRightIcon1={true}
        rightIcon1="share"
        onRightPress1={handleShare}
        showRightIcon2={false}
        textStyle={{ color: TEXT_THEME_COLOR }}
      />

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}>
        <ScrollView
          ref={scrollViewRef}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY_THEME_COLOR]}
              tintColor={PRIMARY_THEME_COLOR}
              progressViewOffset={scale(20)}
            />
          }
          contentContainerStyle={styles.scrollContainer}
        >
          {product && (
            <>
              <View style={styles.mediaContainer}>
                <FlatList
                  ref={flatListRef}
                  data={
                    product?.media_streams && Array.isArray(product.media_streams)
                      ? product.media_streams
                      : [{ url: DEFAULT_IMAGE_URL, mediaType: 'image' }]
                  }
                  renderItem={renderMediaItem}
                  keyExtractor={(_, index) => index.toString()}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={handleMediaScroll}
                  scrollEventThrottle={16}
                />

                {product?.media_streams && Array.isArray(product.media_streams) && product.media_streams.length > 1 && (
                  <View style={styles.mediaIndicator}>
                    <Text style={styles.mediaIndicatorText}>
                      {currentMediaIndex + 1}/{product.media_streams.length}
                    </Text>
                  </View>
                )}

                <TouchableOpacity style={styles.likeButtonFloating} onPress={handleToggleLike}>
                  <Icon
                    name={isLiked ? 'favorite' : 'favorite-border'}
                    size={scale(20)}
                    color={isLiked ? SECONDARY_THEME_COLOR : TEXT_THEME_COLOR}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.detailsContainer}>
                <View style={styles.brandRatingContainer}>
                  <Text style={[styles.brandText, { color: SUBTEXT_THEME_COLOR }]}>{product?.brand || 'Unknown Brand'}</Text>
                  <Rating rating={product?.rating || 0} size={14} />
                  <Text style={[styles.reviewCountText, { color: SUBTEXT_THEME_COLOR }]}>({product?.reviewCount || 0} reviews)</Text>
                </View>

                <Text style={[styles.name, { color: TEXT_THEME_COLOR }]}>{product?.name || 'Product'}</Text>

                <View style={styles.priceContainer}>
                  <Text style={[styles.price, { color: TEXT_THEME_COLOR }]}>₹{product?.price || 'N/A'}</Text>
                  {product?.originalPrice && (
                    <Text style={[styles.originalPrice, { color: SUBTEXT_THEME_COLOR }]}>₹{product.originalPrice}</Text>
                  )}
                  {product?.discount && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>{product.discount}% OFF</Text>
                    </View>
                  )}
                </View>

                {product?.category && (
                  <View style={styles.categoryContainer}>
                    <Text style={[styles.categoryText, { color: SUBTEXT_THEME_COLOR }]}>{product.category}</Text>
                  </View>
                )}

                {product?.offer && (
                  <Text style={[styles.offerText, { color: SECONDARY_THEME_COLOR }]}>{product.offer}</Text>
                )}

                <Text style={[styles.stockText, { color: product?.stock > 0 ? SUBTEXT_THEME_COLOR : SECONDARY_THEME_COLOR }]}>
                  {product?.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
                </Text>

                <View style={styles.divider} />

                <SizeSelector
                  sizes={product?.sizes || []}
                  selectedSize={selectedSize}
                  onSelect={setSelectedSize}
                />

                <ColorSelector
                  colors={product?.colors || []}
                  selectedColor={selectedColor}
                  onSelect={setSelectedColor}
                />

                <QuantitySelector
                  quantity={quantity}
                  onIncrement={() => setQuantity((prev) => Math.min(prev + 1, 10))}
                  onDecrement={() => setQuantity((prev) => Math.max(prev - 1, 1))}
                />

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.userInfo}
                  onPress={navigateToUserProfile}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: userProfileImage }}
                    style={styles.userImage}
                    defaultSource={{ uri: DEFAULT_IMAGE_URL }}
                    onError={(e) => console.log('User image error:', e.nativeEvent.error)}
                  />
                  <View style={styles.userInfoText}>
                    <Text style={[styles.sellerText, { color: SUBTEXT_THEME_COLOR }]}>Seller</Text>
                    <Text style={[styles.userName, { color: TEXT_THEME_COLOR }]}>@{user?.userName || 'unknown'}</Text>
                  </View>
                  <TouchableOpacity style={styles.callButton} onPress={handleCallSeller}>
                    <Ionicons name="call" size={scale(16)} color={TEXT_THEME_COLOR} />
                    <Text style={styles.callButtonText}>Call</Text>
                  </TouchableOpacity>
                </TouchableOpacity>

                <View style={styles.divider} />
              </View>

              <View style={styles.tabsContainer}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'description' && styles.activeTab]}
                  onPress={() => setActiveTab('description')}
                >
                  <Text style={[styles.tabText, activeTab === 'description' ? { color: TEXT_THEME_COLOR } : { color: SUBTEXT_THEME_COLOR }]}>
                    Description
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tab, activeTab === 'specifications' && styles.activeTab]}
                  onPress={() => setActiveTab('specifications')}
                >
                  <Text style={[styles.tabText, activeTab === 'specifications' ? { color: TEXT_THEME_COLOR } : { color: SUBTEXT_THEME_COLOR }]}>
                    Specifications
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
                  onPress={() => setActiveTab('reviews')}
                >
                  <Text style={[styles.tabText, activeTab === 'reviews' ? { color: TEXT_THEME_COLOR } : { color: SUBTEXT_THEME_COLOR }]}>
                    Reviews
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tabContent}>
                {activeTab === 'description' && (
                  <View style={styles.descriptionContainer}>
                    <Text style={[styles.descriptionTitle, { color: TEXT_THEME_COLOR }]}>Product Description</Text>
                    <Text style={[styles.description, { color: TEXT_THEME_COLOR }]}>
                      {product?.description || 'No description available'}
                    </Text>

                    {product?.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        <Text style={[styles.tagsTitle, { color: TEXT_THEME_COLOR }]}>Tags:</Text>
                        <View style={styles.tagsList}>
                          {product.tags.map((tag, index) => (
                            <View key={index} style={styles.tag}>
                              <Text style={[styles.tagText, { color: SUBTEXT_THEME_COLOR }]}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {activeTab === 'specifications' && (
                  <ProductSpecifications specifications={product?.specifications || []} />
                )}

                {activeTab === 'reviews' && (
                  <ReviewsSection
                    reviews={reviews}
                    onWriteReview={() => setReviewModalVisible(true)}
                  />
                )}
              </View>

              {relatedProducts && Array.isArray(relatedProducts) && relatedProducts.length > 0 && (
                <View style={styles.relatedProductsContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: TEXT_THEME_COLOR }]}>Similar Products</Text>
                    <TouchableOpacity>
                      <Text style={[styles.seeAllText, { color: PRIMARY_THEME_COLOR }]}>See All</Text>
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={relatedProducts.filter((item) => item && (item._id || item.id))}
                    renderItem={renderRelatedProduct}
                    keyExtractor={(item) => (item._id || item.id || Math.random().toString())}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.relatedProductsList}
                  />
                </View>
              )}

              {filteredRecentlyViewed && Array.isArray(filteredRecentlyViewed) && filteredRecentlyViewed.length > 0 && (
                <View style={styles.recentlyViewedContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: TEXT_THEME_COLOR }]}>Recently Viewed</Text>
                    <TouchableOpacity>
                      <Text style={[styles.seeAllText, { color: PRIMARY_THEME_COLOR }]}>See All</Text>
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={filteredRecentlyViewed}
                    renderItem={renderRelatedProduct}
                    keyExtractor={(item) => (item.id || item._id || Math.random().toString())}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.relatedProductsList}
                  />
                </View>
              )}
            </>
          )}
        </ScrollView>
      </Animated.View>

      <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.actionBar}>
        <TouchableOpacity
          style={styles.wishlistButton}
          onPress={handleToggleLike}
        >
          <Icon
            name={isLiked ? 'favorite' : 'favorite-border'}
            size={scale(20)}
            color={isLiked ? SECONDARY_THEME_COLOR : SUBTEXT_THEME_COLOR}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cartButton}
          onPress={handleAddToCart}
        >
          <LinearGradient
            colors={[PRIMARY_THEME_COLOR, '#8ec5fc']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.cartButtonText}>
              {isInCart ? 'Go to Cart' : 'Add to Cart'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buyButton}
          onPress={() =>
            navigation.navigate('Checkout', {
              productId,
              quantity,
              size: selectedSize,
              color: selectedColor,
            })
          }
        >
          <LinearGradient
            colors={[PRIMARY_THEME_COLOR, '#8ec5fc']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.buyButtonText}>Buy Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      <Modal
        visible={isReviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: TEXT_THEME_COLOR }]}>Write a Review</Text>

            <View style={styles.ratingContainer}>
              <Text style={[styles.ratingLabel, { color: TEXT_THEME_COLOR }]}>Your Rating:</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                    <Icon
                      name={star <= reviewRating ? 'star' : 'star-border'}
                      size={scale(26)}
                      color="#FFD700"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={[styles.commentLabel, { color: TEXT_THEME_COLOR }]}>Your Comment:</Text>
            <TextInput
              style={[styles.commentInput, { color: TEXT_THEME_COLOR, borderColor: BORDER_THEME_COLOR }]}
              multiline
              numberOfLines={4}
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder="Write your review here..."
              placeholderTextColor={SUBTEXT_THEME_COLOR}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setReviewModalVisible(false)}
              >
                <LinearGradient
                  colors={[PRIMARY_THEME_COLOR, '#8ec5fc']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitReview}>
                <LinearGradient
                  colors={[PRIMARY_THEME_COLOR, '#8ec5fc']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.submitButtonText}>Submit</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
  scrollContainer: {
    paddingBottom: scale(80),
  },
  mediaContainer: {
    height: width * 0.9,
    position: 'relative',
    marginBottom: scale(14),
  },
  mediaItem: {
    width: width,
    height: width * 0.9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  videoControls: {
    position: 'absolute',
    bottom: scale(12),
    left: scale(12),
    right: scale(12),
    flexDirection: 'row',
    alignItems: 'center',
  },
  playPauseButton: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: scale(35),
    height: scale(35),
    borderRadius: scale(17.5),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(8),
  },
  progressBarContainer: {
    flex: 1,
    height: scale(3),
    borderRadius: scale(1.5),
  },
  progressBackground: {
    flex: 1,
    borderRadius: scale(1.5),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  mediaIndicator: {
    position: 'absolute',
    bottom: scale(12),
    right: scale(12),
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(8),
  },
  mediaIndicatorText: {
    color: '#FFFFFF',
    fontSize: scaleFont(10),
    fontWeight: '600',
  },
  likeButtonFloating: {
    position: 'absolute',
    top: scale(12),
    right: scale(12),
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: scale(35),
    height: scale(35),
    borderRadius: scale(17.5),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  detailsContainer: {
    padding: scale(14),
    borderRadius: scale(10),
    marginHorizontal: scale(14),
    marginBottom: scale(14),
    backgroundColor: PRODUCT_BG_COLOR,
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
  },
  brandRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(10),
  },
  brandText: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    marginRight: scale(8),
  },
  reviewCountText: {
    fontSize: scaleFont(10),
    marginLeft: scale(4),
  },
  name: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    marginBottom: scale(10),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(10),
  },
  price: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    marginRight: scale(8),
  },
  originalPrice: {
    fontSize: scaleFont(14),
    textDecorationLine: 'line-through',
    marginRight: scale(8),
  },
  discountBadge: {
    backgroundColor: SECONDARY_THEME_COLOR,
    paddingHorizontal: scale(6),
    paddingVertical: scale(3),
    borderRadius: scale(3),
  },
  discountBadgeText: {
    fontSize: scaleFont(10),
    color: TEXT_THEME_COLOR,
    fontWeight: '600',
  },
  categoryContainer: {
    alignSelf: 'flex-start',
    backgroundColor: CATEGORY_BG_COLOR,
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(12),
    marginBottom: scale(10),
  },
  categoryText: {
    fontSize: scaleFont(10),
    fontWeight: '600',
  },
  offerText: {
    fontSize: scaleFont(12),
    fontWeight: '500',
    marginBottom: scale(10),
  },
  stockText: {
    fontSize: scaleFont(12),
    fontWeight: '500',
    marginBottom: scale(10),
  },
  divider: {
    height: 1,
    backgroundColor: BORDER_THEME_COLOR,
    marginVertical: scale(10),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(8),
  },
  userImage: {
    width: scale(45),
    height: scale(45),
    borderRadius: scale(22.5),
    marginRight: scale(8),
    backgroundColor: SUBTEXT_THEME_COLOR,
  },
  userInfoText: {
    flex: 1,
  },
  sellerText: {
    fontSize: scaleFont(10),
  },
  userName: {
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_THEME_COLOR,
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(15),
  },
  callButtonText: {
    fontSize: scaleFont(12),
    color: TEXT_THEME_COLOR,
    fontWeight: '600',
    marginLeft: scale(4),
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER_THEME_COLOR,
    marginHorizontal: scale(14),
    marginBottom: scale(14),
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
    padding: scale(6),
  },
  tab: {
    flex: 1,
    paddingVertical: scale(10),
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY_THEME_COLOR,
  },
  tabText: {
    fontSize: scaleFont(12),
    fontWeight: '600',
  },
  tabContent: {
    padding: scale(14),
    marginHorizontal: scale(14),
    borderRadius: scale(10),
    marginBottom: scale(14),
    backgroundColor: PRODUCT_BG_COLOR,
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
  },
  descriptionContainer: {
    marginBottom: scale(10),
  },
  descriptionTitle: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    marginBottom: scale(6),
  },
  description: {
    fontSize: scaleFont(12),
    lineHeight: scaleFont(18),
  },
  tagsContainer: {
    marginTop: scale(10),
  },
  tagsTitle: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    marginBottom: scale(6),
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: CATEGORY_BG_COLOR,
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(12),
    marginRight: scale(6),
    marginBottom: scale(6),
  },
  tagText: {
    fontSize: scaleFont(10),
  },
  reviewsContainer: {
    marginBottom: scale(10),
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(10),
  },
  reviewsTitle: {
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  writeReviewText: {
    fontSize: scaleFont(12),
    fontWeight: '600',
  },
  noReviewsText: {
    fontSize: scaleFont(12),
    textAlign: 'center',
    marginVertical: scale(8),
  },
  reviewItem: {
    borderRadius: scale(6),
    padding: scale(10),
    marginBottom: scale(10),
    backgroundColor: PRODUCT_BG_COLOR,
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(4),
  },
  reviewUser: {
    fontSize: scaleFont(12),
    fontWeight: '600',
  },
  reviewDate: {
    fontSize: scaleFont(10),
    marginBottom: scale(6),
  },
  reviewComment: {
    fontSize: scaleFont(12),
    lineHeight: scaleFont(18),
    marginBottom: scale(4),
  },
  seeMoreText: {
    fontSize: scaleFont(10),
    fontWeight: '600',
    textAlign: 'right',
  },
  seeAllReviewsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(8),
    borderRadius: scale(6),
    marginTop: scale(10),
  },
  seeAllReviewsText: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    marginRight: scale(4),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    marginBottom: scale(10),
  },
  sectionTitle: {
    fontSize: scaleFont(15),
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: scaleFont(12),
    fontWeight: '600',
  },
  relatedProductsContainer: {
    paddingVertical: scale(14),
    marginBottom: scale(14),
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
    marginHorizontal: scale(14),
  },
  recentlyViewedContainer: {
    paddingVertical: scale(14),
    marginBottom: scale(80),
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
    marginHorizontal: scale(14),
  },
  relatedProductsList: {
    paddingHorizontal: scale(14),
  },
  relatedProductCard: {
    width: scale(140),
    marginRight: scale(10),
    borderRadius: scale(10),
    overflow: 'hidden',
    backgroundColor: PRODUCT_BG_COLOR,
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
  },
  relatedProductGradient: {
    borderRadius: scale(10),
  },
  relatedProductImageContainer: {
    position: 'relative',
  },
  relatedProductImage: {
    width: '100%',
    height: scale(130),
    backgroundColor: SUBTEXT_THEME_COLOR,
  },
  discountBadge: {
    position: 'absolute',
    top: scale(8),
    right: scale(8),
    backgroundColor: SECONDARY_THEME_COLOR,
    paddingHorizontal: scale(6),
    paddingVertical: scale(3),
    borderRadius: scale(3),
  },
  discountBadgeText: {
    fontSize: scaleFont(9),
    color: TEXT_THEME_COLOR,
    fontWeight: '600',
  },
  relatedProductInfo: {
    padding: scale(8),
  },
  relatedProductBrand: {
    fontSize: scaleFont(10),
    fontWeight: '600',
  },
  relatedProductName: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    marginVertical: scale(4),
  },
  relatedProductRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  relatedProductReviewCount: {
    fontSize: scaleFont(10),
    marginLeft: scale(4),
  },
  relatedProductPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  relatedProductPrice: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    marginRight: scale(4),
  },
  relatedProductOriginalPrice: {
    fontSize: scaleFont(10),
    textDecorationLine: 'line-through',
  },
  relatedProductOffer: {
    fontSize: scaleFont(10),
    marginBottom: scale(4),
  },
  relatedProductStock: {
    fontSize: scaleFont(10),
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(8),
    borderTopWidth: 1,
    borderTopColor: BORDER_THEME_COLOR,
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
  },
  wishlistButton: {
    padding: scale(8),
    borderRadius: scale(6),
    marginRight: scale(12),
  },
  cartButton: {
    flex: 1,
    borderRadius: scale(8),
    marginRight: scale(12),
  },
  buttonGradient: {
    paddingVertical: scale(12),
    borderRadius: scale(8),
    alignItems: 'center',
  },
  cartButtonText: {
    fontSize: scaleFont(12),
    color: TEXT_THEME_COLOR,
    fontWeight: '700',
  },
  buyButton: {
    flex: 1,
    borderRadius: scale(8),
  },
  buyButtonText: {
    fontSize: scaleFont(12),
    color: TEXT_THEME_COLOR,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: width * 0.9,
    padding: scale(16),
    borderRadius: scale(12),
    backgroundColor: PRODUCT_BG_COLOR,
  },
  modalTitle: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    marginBottom: scale(16),
  },
  ratingContainer: {
    marginBottom: scale(16),
  },
  ratingLabel: {
    fontSize: scaleFont(12),
    fontWeight: '700',
    marginBottom: scale(8),
  },
  starsContainer: {
    flexDirection: 'row',
  },
  commentLabel: {
    fontSize: scaleFont(12),
    fontWeight: '700',
    marginBottom: scale(8),
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: scale(8),
    padding: scale(10),
    marginBottom: scale(16),
    height: scale(100),
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    marginRight: scale(10),
  },
  submitButton: {
    flex: 1,
  },
  cancelButtonText: {
    fontSize: scaleFont(12),
    color: TEXT_THEME_COLOR,
    fontWeight: '700',
    textAlign: 'center',
  },
  submitButtonText: {
    fontSize: scaleFont(12),
    color: TEXT_THEME_COLOR,
    fontWeight: '700',
    textAlign: 'center',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1000,
  },
  errorText: {
    fontSize: scaleFont(12),
    textAlign: 'center',
  },
});

export default ProductDetail;