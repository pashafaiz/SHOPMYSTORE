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

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375));

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
    isActionLoading,
    currentMediaIndex,
    isLiked,
    isInCart,
    videoProgress,
    videoDuration,
    error,
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
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(true);
  const videoRef = useRef(null);
  const scrollViewRef = useRef();
  const flatListRef = useRef();

  const [currentMediaType, setCurrentMediaType] = useState('image');

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;

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
        } else {
          Toast.show({
            type: 'error',
            text1: data.msg || 'Failed to fetch reviews',
            position: TOAST_POSITION,
            topOffset: scale(20),
          });
        }
      } catch (error) {
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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    if (productId) {
      dispatch(fetchProductDetails({ productId }));
      if (userId) {
        dispatch(loadRecentlyViewed({ userId }));
      }
    }
  }, [productId, userId, dispatch]);

  useEffect(() => {
    if (product && !loading && userId) {
      dispatch(saveRecentlyViewed({ productId, product, userId }));
    }
  }, [product, productId, loading, userId, dispatch]);

  // Handle app state changes to pause/resume video
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
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
    if (productId) {
      await dispatch(fetchProductDetails({ productId }));
      if (userId) {
        await dispatch(loadRecentlyViewed({ userId }));
      }
    }
    dispatch(setRefreshing(false));
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
      setIsReviewSubmitting(true);
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
        Toast.show({
          type: 'error',
          text1: 'Network error submitting review',
          position: TOAST_POSITION,
          topOffset: scale(20),
        });
      } finally {
        setIsReviewSubmitting(false);
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
    
    const media = product?.media?.[index];
    if (media?.mediaType === 'video') {
      setCurrentMediaType('video');
      setIsVideoPaused(false);
    } else {
      setCurrentMediaType('image');
      setIsVideoPaused(true);
    }
  };

  const renderMediaItem = ({ item, index }) => {
    try {
      const mediaUrl = typeof item?.url === 'string' && item.url ? item.url : DEFAULT_IMAGE_URL;
      const mediaType = item?.mediaType || 'image';

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
                      size={scale(24)}
                      color="#FFFFFF"
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
                      colors={['#7B61FF', '#AD4DFF']}
                      style={styles.progressBackground}
                    >
                      <LinearGradient
                        colors={['#AD4DFF', '#7B61FF']}
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
              onError={(e) => console.log('Image error:', e.nativeEvent.error)}
            />
          )}
        </View>
      );
    } catch (error) {
      console.log('Error rendering media item:', error);
      return (
        <View style={styles.mediaItem}>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>Failed to load media</Text>
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

      const mediaUrl =
        typeof item?.media === 'string' && item.media
          ? item.media
          : Array.isArray(item?.media) && item.media.length > 0
          ? typeof item.media[0] === 'string'
            ? item.media[0]
            : item.media[0]?.url || DEFAULT_IMAGE_URL
          : DEFAULT_IMAGE_URL;

      const isVideo = item?.mediaType === 'video' || /\.(mp4|mov|avi)$/i.test(mediaUrl);

      return (
        <Animated.View style={[styles.relatedProductCard(theme), { transform: [{ scale: scaleAnim }] }]}>
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
            disabled={isActionLoading}
          >
            <LinearGradient
              colors={['rgba(123, 97, 255, 0.2)', 'rgba(173, 77, 255, 0.2)']}
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
                    onError={(e) => console.log('Related product image error:', e.nativeEvent.error)}
                  />
                )}
                {item.isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
                {item.discount && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>{item.discount}% OFF</Text>
                  </View>
                )}
              </View>
              <View style={styles.relatedProductInfo}>
                <Text style={[styles.relatedProductBrand, { color: theme.textSecondary }]}>{item.brand || 'Unknown Brand'}</Text>
                <Text style={[styles.relatedProductName, { color: theme.textPrimary }]} numberOfLines={1}>
                  {item.name || 'Unknown Product'}
                </Text>
                <View style={styles.relatedProductRating}>
                  <Rating rating={item.rating || 0} size={12} />
                  <Text style={[styles.relatedProductReviewCount, { color: theme.textTertiary }]}>({item.reviewCount || 0})</Text>
                </View>
                <View style={styles.relatedProductPriceContainer}>
                  <Text style={[styles.relatedProductPrice, { color: theme.textPrimary }]}>₹{item.price || 'N/A'}</Text>
                  {item.originalPrice && (
                    <Text style={[styles.relatedProductOriginalPrice, { color: theme.textTertiary }]}>₹{item.originalPrice}</Text>
                  )}
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      );
    } catch (error) {
      console.log('Error rendering related product:', error);
      return (
        <View style={styles.relatedProductCard(theme)}>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>Failed to load product</Text>
        </View>
      );
    }
  };

  const renderReviewItem = ({ item }) => {
    const isExpanded = expandedReviews[item.id] || false;
    const lineClamp = isExpanded ? undefined : 3;

    return (
      <View style={styles.reviewItem(theme)}>
        <View style={styles.reviewHeader}>
          <Text style={[styles.reviewUser, { color: theme.textPrimary }]}>{item.user}</Text>
          <Rating rating={item.rating} size={14} />
        </View>
        <Text style={[styles.reviewDate, { color: theme.textTertiary }]}>{item.date}</Text>
        <Text
          style={[styles.reviewComment, { color: theme.textPrimary }]}
          numberOfLines={lineClamp}
          ellipsizeMode="tail"
        >
          {item.comment}
        </Text>
        {item.comment.length > 100 && (
          <TouchableOpacity onPress={() => toggleReviewExpansion(item.id)}>
            <Text style={[styles.seeMoreText, { color: theme.textSecondary }]}>
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
          <Text style={[styles.reviewsTitle, { color: theme.textPrimary }]}>Customer Reviews</Text>
          <TouchableOpacity onPress={onWriteReview}>
            <Text style={[styles.writeReviewText, { color: theme.textSecondary }]}>Write a Review</Text>
          </TouchableOpacity>
        </View>

        {reviews.length === 0 ? (
          <Text style={[styles.noReviewsText, { color: theme.textSecondary }]}>No reviews yet</Text>
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
            <Text style={[styles.seeAllReviewsText, { color: theme.textSecondary }]}>
              {showAllReviews ? 'Show Less Reviews' : `See All Reviews (${reviews.length})`}
            </Text>
            <Icon
              name={showAllReviews ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderActionLoader = () => {
    return (
      <View style={styles.loaderOverlay}>
        <ActivityIndicator size="large" color="#7B61FF" />
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
    (item) => (item.id !== productId && item._id !== productId)
  );

  return (
    <LinearGradient colors={theme.background} style={styles.container}>
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
        textStyle={{ color: theme.textPrimary }}
      />

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}>
        <ScrollView
          ref={scrollViewRef}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#7B61FF']}
              tintColor="#7B61FF"
            />
          }
          scrollEnabled={!isActionLoading}
          contentContainerStyle={styles.scrollContainer}
        >
          <LinearGradient colors={theme.background} style={styles.mediaContainer}>
            <FlatList
              ref={flatListRef}
              data={
                product?.media && Array.isArray(product.media)
                  ? product.media
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

            {product?.media && Array.isArray(product.media) && product.media.length > 1 && (
              <View style={styles.mediaIndicator}>
                <Text style={styles.mediaIndicatorText}>
                  {currentMediaIndex + 1}/{product.media.length}
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.likeButtonFloating} onPress={handleToggleLike}>
              <Icon
                name={isLiked ? 'favorite' : 'favorite-border'}
                size={scale(24)}
                color={isLiked ? '#FF3E6D' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </LinearGradient>

          <LinearGradient colors={theme.background} style={styles.detailsContainer(theme)}>
            <View style={styles.brandRatingContainer}>
              <Text style={[styles.brandText, { color: theme.textSecondary }]}>{product?.brand || 'Unknown Brand'}</Text>
              <Rating rating={product?.rating || 0} size={16} />
              <Text style={[styles.reviewCountText, { color: theme.textTertiary }]}>({product?.reviewCount || 0} reviews)</Text>
            </View>

            <Text style={[styles.name, { color: theme.textPrimary }]}>{product?.name || 'Product'}</Text>

            <View style={styles.priceContainer}>
              <Text style={[styles.price, { color: theme.textPrimary }]}>₹{product?.price || 'N/A'}</Text>
              {product?.originalPrice && (
                <Text style={[styles.originalPrice, { color: theme.textTertiary }]}>₹{product.originalPrice}</Text>
              )}
              {product?.discount && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>{product.discount}% OFF</Text>
                </View>
              )}
            </View>

            {product?.category && (
              <View style={styles.categoryContainer}>
                <Text style={[styles.categoryText, { color: theme.textSecondary }]}>{product.category}</Text>
              </View>
            )}

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
              disabled={isActionLoading}
            >
              <Image
                source={{ uri: userProfileImage }}
                style={styles.userImage}
                defaultSource={{ uri: DEFAULT_IMAGE_URL }}
                onError={(e) => console.log('User image error:', e.nativeEvent.error)}
              />
              <View style={styles.userInfoText}>
                <Text style={[styles.sellerText, { color: theme.textSecondary }]}>Seller</Text>
                <Text style={[styles.userName, { color: theme.textPrimary }]}>@{user?.userName || 'unknown'}</Text>
              </View>
              <TouchableOpacity style={styles.callButton} onPress={handleCallSeller}>
                <Ionicons name="call" size={scale(18)} color="#FFFFFF" />
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            <View style={styles.divider} />

            <ProductHighlights highlights={product?.highlights || []} />

            <View style={styles.divider} />
          </LinearGradient>

          <LinearGradient colors={theme.background} style={styles.tabsContainer(theme)}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'description' && styles.activeTab]}
              onPress={() => setActiveTab('description')}
            >
              <Text style={[styles.tabText, activeTab === 'description' ? { color: theme.textPrimary } : { color: theme.textSecondary }]}>
                Description
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'specifications' && styles.activeTab]}
              onPress={() => setActiveTab('specifications')}
            >
              <Text style={[styles.tabText, activeTab === 'specifications' ? { color: theme.textPrimary } : { color: theme.textSecondary }]}>
                Specifications
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
              onPress={() => setActiveTab('reviews')}
            >
              <Text style={[styles.tabText, activeTab === 'reviews' ? { color: theme.textPrimary } : { color: theme.textSecondary }]}>
                Reviews
              </Text>
            </TouchableOpacity>
          </LinearGradient>

          <LinearGradient colors={theme.background} style={styles.tabContent(theme)}>
            {activeTab === 'description' && (
              <View style={styles.descriptionContainer}>
                <Text style={[styles.descriptionTitle, { color: theme.textPrimary }]}>Product Description</Text>
                <Text style={[styles.description, { color: theme.textPrimary }]}>
                  {product?.description || 'No description available'}
                </Text>

                {product?.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    <Text style={[styles.tagsTitle, { color: theme.textPrimary }]}>Tags:</Text>
                    <View style={styles.tagsList}>
                      {product.tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={[styles.tagText, { color: theme.textSecondary }]}>{tag}</Text>
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
          </LinearGradient>

          {relatedProducts && Array.isArray(relatedProducts) && relatedProducts.length > 0 && (
            <LinearGradient colors={theme.background} style={styles.relatedProductsContainer(theme)}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Similar Products</Text>
                <TouchableOpacity>
                  <Text style={[styles.seeAllText, { color: theme.textSecondary }]}>See All</Text>
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
            </LinearGradient>
          )}

          {filteredRecentlyViewed && Array.isArray(filteredRecentlyViewed) && filteredRecentlyViewed.length > 0 && (
            <LinearGradient colors={theme.background} style={styles.recentlyViewedContainer(theme)}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recently Viewed</Text>
                <TouchableOpacity>
                  <Text style={[styles.seeAllText, { color: theme.textSecondary }]}>See All</Text>
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
            </LinearGradient>
          )}
        </ScrollView>
      </Animated.View>

      <LinearGradient colors={theme.background} style={styles.actionBar}>
        <TouchableOpacity
          style={styles.wishlistButton}
          onPress={handleToggleLike}
          disabled={isActionLoading}
        >
          <Icon
            name={isLiked ? 'favorite' : 'favorite-border'}
            size={scale(24)}
            color={isLiked ? '#FF3E6D' : theme.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cartButton}
          onPress={handleAddToCart}
          disabled={isActionLoading}
        >
          <LinearGradient
            colors={['#7B61FF', '#AD4DFF']}
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
          disabled={isActionLoading}
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
            colors={['#7B61FF', '#AD4DFF']}
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
          <LinearGradient colors={theme.background} style={styles.modalContent(theme)}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Write a Review</Text>

            <View style={styles.ratingContainer}>
              <Text style={[styles.ratingLabel, { color: theme.textPrimary }]}>Your Rating:</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                    <Icon
                      name={star <= reviewRating ? 'star' : 'star-border'}
                      size={scale(30)}
                      color="#FFD700"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={[styles.commentLabel, { color: theme.textPrimary }]}>Your Comment:</Text>
            <TextInput
              style={[styles.commentInput, { color: theme.textPrimary, borderColor: theme.glassBorder }]}
              multiline
              numberOfLines={4}
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder="Write your review here..."
              placeholderTextColor={theme.textTertiary}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setReviewModalVisible(false)}
              >
                <LinearGradient
                  colors={['#7B61FF', '#AD4DFF']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitReview}>
                <LinearGradient
                  colors={['#7B61FF', '#AD4DFF']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.submitButtonText}>Submit</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      {(loading || isActionLoading || isReviewSubmitting) && renderActionLoader()}
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
    marginBottom: scale(16),
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
    bottom: scale(15),
    left: scale(15),
    right: scale(15),
    flexDirection: 'row',
    alignItems: 'center',
  },
  playPauseButton: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(10),
  },
  progressBarContainer: {
    flex: 1,
    height: scale(4),
    borderRadius: scale(2),
  },
  progressBackground: {
    flex: 1,
    borderRadius: scale(2),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  mediaIndicator: {
    position: 'absolute',
    bottom: scale(15),
    right: scale(15),
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(10),
  },
  mediaIndicatorText: {
    color: '#FFFFFF',
    fontSize: scaleFont(12),
    fontWeight: '700',
  },
  likeButtonFloating: {
    position: 'absolute',
    top: scale(15),
    right: scale(15),
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  detailsContainer: theme => ({
    padding: scale(16),
    borderRadius: scale(12),
    marginHorizontal: scale(16),
    marginBottom: scale(16),
    backgroundColor: theme.glassBg,
    borderWidth: 1,
    borderColor: theme.glassBorder,
  }),
  brandRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  brandText: {
    fontSize: scaleFont(14),
    fontWeight: '700',
    marginRight: scale(10),
  },
  reviewCountText: {
    fontSize: scaleFont(12),
    marginLeft: scale(5),
  },
  name: {
    fontSize: scaleFont(24),
    fontWeight: '800',
    marginBottom: scale(12),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  price: {
    fontSize: scaleFont(22),
    fontWeight: '800',
    marginRight: scale(10),
  },
  originalPrice: {
    fontSize: scaleFont(16),
    textDecorationLine: 'line-through',
    marginRight: scale(10),
  },
  discountBadge: {
    backgroundColor: '#FF3E6D',
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(4),
  },
  discountBadgeText: {
    fontSize: scaleFont(12),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  categoryContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(123, 97, 255, 0.2)',
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(15),
    marginBottom: scale(12),
  },
  categoryText: {
    fontSize: scaleFont(12),
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: scale(12),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(10),
  },
  userImage: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    marginRight: scale(10),
    backgroundColor: '#F0F0F0',
  },
  userInfoText: {
    flex: 1,
  },
  sellerText: {
    fontSize: scaleFont(12),
  },
  userName: {
    fontSize: scaleFont(16),
    fontWeight: '700',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B61FF',
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(20),
  },
  callButtonText: {
    fontSize: scaleFont(14),
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: scale(5),
  },
  tabsContainer: theme => ({
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: scale(16),
    marginBottom: scale(16),
    backgroundColor: theme.glassBg,
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: theme.glassBorder,
    padding: scale(8),
  }),
  tab: {
    flex: 1,
    paddingVertical: scale(12),
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#7B61FF',
  },
  tabText: {
    fontSize: scaleFont(14),
    fontWeight: '700',
  },
  tabContent: theme => ({
    padding: scale(16),
    marginHorizontal: scale(16),
    borderRadius: scale(12),
    marginBottom: scale(16),
    backgroundColor: theme.glassBg,
    borderWidth: 1,
    borderColor: theme.glassBorder,
  }),
  descriptionContainer: {
    marginBottom: scale(12),
  },
  descriptionTitle: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    marginBottom: scale(8),
  },
  description: {
    fontSize: scaleFont(14),
    lineHeight: scaleFont(22),
  },
  tagsContainer: {
    marginTop: scale(12),
  },
  tagsTitle: {
    fontSize: scaleFont(14),
    fontWeight: '700',
    marginBottom: scale(8),
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: 'rgba(123, 97, 255, 0.2)',
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(15),
    marginRight: scale(8),
    marginBottom: scale(8),
  },
  tagText: {
    fontSize: scaleFont(12),
  },
  reviewsContainer: {
    marginBottom: scale(12),
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  reviewsTitle: {
    fontSize: scaleFont(16),
    fontWeight: '700',
  },
  writeReviewText: {
    fontSize: scaleFont(14),
    fontWeight: '700',
  },
  noReviewsText: {
    fontSize: scaleFont(14),
    textAlign: 'center',
    marginVertical: scale(10),
  },
  reviewItem: theme => ({
    borderRadius: scale(8),
    padding: scale(12),
    marginBottom: scale(12),
    backgroundColor: theme.glassBg,
    borderWidth: 1,
    borderColor: theme.glassBorder,
  }),
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(5),
  },
  reviewUser: {
    fontSize: scaleFont(14),
    fontWeight: '700',
  },
  reviewDate: {
    fontSize: scaleFont(12),
    marginBottom: scale(8),
  },
  reviewComment: {
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
    marginBottom: scale(5),
  },
  seeMoreText: {
    fontSize: scaleFont(12),
    fontWeight: '700',
    textAlign: 'right',
  },
  seeAllReviewsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(10),
    borderRadius: scale(8),
    marginTop: scale(12),
  },
  seeAllReviewsText: {
    fontSize: scaleFont(14),
    fontWeight: '700',
    marginRight: scale(5),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    marginBottom: scale(12),
  },
  sectionTitle: {
    fontSize: scaleFont(24),
    fontWeight: '800',
  },
  seeAllText: {
    fontSize: scaleFont(14),
    fontWeight: '700',
  },
  relatedProductsContainer: theme => ({
    paddingVertical: scale(16),
    marginBottom: scale(16),
    backgroundColor: theme.glassBg,
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: theme.glassBorder,
    marginHorizontal: scale(16),
  }),
  recentlyViewedContainer: theme => ({
    paddingVertical: scale(16),
    marginBottom: scale(80),
    backgroundColor: theme.glassBg,
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: theme.glassBorder,
    marginHorizontal: scale(16),
  }),
  relatedProductsList: {
    paddingHorizontal: scale(16),
  },
  relatedProductCard: theme => ({
    width: scale(160),
    marginRight: scale(12),
    borderRadius: scale(12),
    overflow: 'hidden',
    backgroundColor: theme.glassBg,
    borderWidth: 1,
    borderColor: theme.glassBorder,
  }),
  relatedProductGradient: {
    borderRadius: scale(12),
  },
  relatedProductImageContainer: {
    position: 'relative',
  },
  relatedProductImage: {
    width: '100%',
    height: scale(150),
    backgroundColor: '#F0F0F0',
  },
  newBadge: {
    position: 'absolute',
    top: scale(10),
    left: scale(10),
    backgroundColor: '#FF3E6D',
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(12),
  },
  newBadgeText: {
    fontSize: scaleFont(10),
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  discountBadge: {
    position: 'absolute',
    top: scale(10),
    right: scale(10),
    backgroundColor: '#FF3E6D',
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(4),
  },
  discountBadgeText: {
    fontSize: scaleFont(10),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  relatedProductInfo: {
    padding: scale(10),
  },
  relatedProductBrand: {
    fontSize: scaleFont(12),
    fontWeight: '700',
  },
  relatedProductName: {
    fontSize: scaleFont(14),
    fontWeight: '700',
    marginVertical: scale(5),
  },
  relatedProductRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(5),
  },
  relatedProductReviewCount: {
    fontSize: scaleFont(12),
    marginLeft: scale(5),
  },
  relatedProductPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  relatedProductPrice: {
    fontSize: scaleFont(14),
    fontWeight: '700',
    marginRight: scale(5),
  },
  relatedProductOriginalPrice: {
    fontSize: scaleFont(12),
    textDecorationLine: 'line-through',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(10),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  wishlistButton: {
    padding: scale(10),
    borderRadius: scale(8),
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
    fontSize: scaleFont(14),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buyButton: {
    flex: 1,
    borderRadius: scale(8),
  },
  buyButtonText: {
    fontSize: scaleFont(14),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: theme => ({
    width: width * 0.9,
    padding: scale(16),
    borderRadius: scale(12),
    backgroundColor: theme.glassBg,
    borderWidth: 1,
    borderColor: theme.glassBorder,
  }),
  modalTitle: {
    fontSize: scaleFont(24),
    fontWeight: '800',
    marginBottom: scale(12),
    textAlign: 'center',
  },
  ratingContainer: {
    marginBottom: scale(12),
  },
  ratingLabel: {
    fontSize: scaleFont(14),
    fontWeight: '700',
    marginBottom: scale(8),
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  commentLabel: {
    fontSize: scaleFont(14),
    fontWeight: '700',
    marginBottom: scale(8),
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: scale(8),
    padding: scale(10),
    fontSize: scaleFont(14),
    marginBottom: scale(12),
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    borderRadius: scale(8),
    marginRight: scale(12),
  },
  cancelButtonText: {
    fontSize: scaleFont(14),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  submitButton: {
    flex: 1,
    borderRadius: scale(8),
  },
  submitButtonText: {
    fontSize: scaleFont(14),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loaderText: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    marginTop: scale(10),
  },
  errorText: {
    fontSize: scaleFont(14),
    textAlign: 'center',
  },
});

export default ProductDetail;