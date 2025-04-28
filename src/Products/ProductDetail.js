import React, { useEffect, useRef } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconCommunity from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Colors from '../constants/Colors';
import img from '../assets/Images/img';
import Trace from '../utils/Trace';
import Header from '../Components/Header';
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

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375));

// Configuration: Choose the clearing behavior for recently viewed products
const CLEAR_RECENTLY_VIEWED_ON_APP_KILL = false;
const CLEAR_RECENTLY_VIEWED_AFTER_HOUR = true;

const ProductDetail = ({ route, navigation }) => {
  const { productId } = route.params || {};
  const dispatch = useDispatch();
  const {
    product,
    user,
    relatedProducts,
    recentlyViewed,
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

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (!CLEAR_RECENTLY_VIEWED_ON_APP_KILL) return;

    const handleAppStateChange = async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        Trace('App has been reopened, clearing recently viewed');
        dispatch(clearRecentlyViewed());
      }
      appState.current = nextAppState;
      Trace('AppState changed:', appState.current);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [dispatch]);

  useEffect(() => {
    Trace('Component mounted with productId:', productId);
    if (productId) {
      dispatch(fetchProductDetails({ productId }));
      dispatch(loadRecentlyViewed());
    }
  }, [productId, dispatch]);

  useEffect(() => {
    if (product && !loading && !error) {
      dispatch(saveRecentlyViewed({ productId, product }));
    }
  }, [product, productId, loading, error, dispatch]);

  useEffect(() => {
    if (error) {
      setTimeout(() => navigation.goBack(), 2000);
    }
  }, [error, navigation]);

  const onRefresh = async () => {
    dispatch(setRefreshing(true));
    if (productId) {
      await dispatch(fetchProductDetails({ productId }));
    }
    dispatch(setRefreshing(false));
  };

  const handleAddToCart = async () => {
    if (!userId) {
      Toast.show({
        type: 'error',
        text1: 'Please login to add items to cart',
        position: 'top',
        topOffset: scale(20),
      });
      return;
    }

    if (!token || !productId) {
      Trace('Missing token or productId:', { token, productId });
      Toast.show({
        type: 'error',
        text1: 'Invalid request parameters',
        position: 'top',
        topOffset: scale(20),
      });
      return;
    }

    if (isInCart) {
      dispatch(removeFromCart({ productId, token }));
    } else {
      dispatch(addToCart({ productId, token }));
    }
  };

  const handleToggleLike = async () => {
    if (!userId) {
      Toast.show({
        type: 'error',
        text1: 'Please login to like products',
        position: 'top',
        topOffset: scale(20),
      });
      return;
    }

    if (!token || !productId) {
      Trace('Missing token or productId:', { token, productId });
      Toast.show({
        type: 'error',
        text1: 'Invalid request parameters',
        position: 'top',
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

  const renderMediaItem = ({ item, index }) => {
    try {
      const mediaUrl = typeof item.url === 'string' ? item.url : (item.url?.[0] || 'https://via.placeholder.com/150');
      Trace(`Rendering media item ${index}:`, { item, mediaUrl });

      return (
        <View style={styles.mediaItem}>
          {item.mediaType === 'video' ? (
            <>
              <Video
                source={{ uri: mediaUrl }}
                style={styles.media}
                resizeMode="contain"
                muted
                repeat
                onProgress={handleVideoProgress}
                onLoad={handleVideoLoad}
              />
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBackground}>
                  <LinearGradient
                    colors={['#7B61FF', '#A78BFA']}
                    style={[styles.progressFill, { width: `${videoProgress * 100}%` }]}
                  />
                </View>
              </View>
            </>
          ) : (
            <Image
              source={{ uri: mediaUrl }}
              style={styles.media}
              resizeMode="contain"
              defaultSource={{ uri: 'https://via.placeholder.com/150' }}
            />
          )}
        </View>
      );
    } catch (error) {
      Trace(`Error rendering media item ${index}:`, error);
      return (
        <View style={styles.mediaItem}>
          <Text style={styles.errorText}>Failed to load media</Text>
        </View>
      );
    }
  };

  const renderRelatedProduct = ({ item }) => {
    try {
      const scaleAnim = new Animated.Value(1);

      const onPressIn = () => {
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          useNativeDriver: true,
        }).start();
      };

      const onPressOut = () => {
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      };

      const mediaUrl = typeof item.media === 'string' ? item.media : 'https://via.placeholder.com/100';
      Trace(`Rendering related product ${item._id || item.id}:`, { item, mediaUrl });

      return (
        <Animated.View style={[styles.relatedProductCard, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={() => {
              if (!item._id && !item.id) {
                Trace('Missing product ID for related product:', item);
                Toast.show({
                  type: 'error',
                  text1: 'Missing Product ID',
                  position: 'top',
                  topOffset: scale(20),
                });
                return;
              }
              navigation.push('ProductDetail', { productId: item._id || item.id });
            }}
            activeOpacity={0.95}
            disabled={isActionLoading}
          >
            <Image
              source={{ uri: mediaUrl }}
              style={styles.relatedProductImage}
              resizeMode="contain"
              defaultSource={{ uri: 'https://via.placeholder.com/100' }}
            />
            <View style={styles.relatedProductInfo}>
              <Text style={styles.relatedProductName} numberOfLines={1}>
                {item.name || 'Unknown Product'}
              </Text>
              <Text style={styles.relatedProductPrice}>₹{item.price || 'N/A'}</Text>
              {item.category && (
                <Text style={styles.relatedProductCategory} numberOfLines={1}>
                  {item.category}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    } catch (error) {
      Trace(`Error rendering related product ${item._id || item.id}:`, error);
      return (
        <View style={styles.relatedProductCard}>
          <Text style={styles.errorText}>Failed to load product</Text>
        </View>
      );
    }
  };

  const renderSkeleton = () => {
    try {
      return (
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonMedia} />
          <View style={styles.skeletonDetails}>
            <View style={styles.skeletonUserInfo}>
              <View style={styles.skeletonUserImage} />
              <View style={[styles.skeletonText, { width: '40%' }]} />
            </View>
            <View style={[styles.skeletonText, { width: '60%' }]} />
            <View style={[styles.skeletonText, { width: '20%', marginVertical: scale(10) }]} />
            <View style={[styles.skeletonText, { width: '80%' }]} />
            <View style={[styles.skeletonText, { width: '70%' }]} />
          </View>
        </View>
      );
    } catch (error) {
      Trace('Error rendering skeleton:', error);
      return (
        <View style={styles.skeletonContainer}>
          <Text style={styles.errorText}>Loading...</Text>
        </View>
      );
    }
  };

  const renderActionLoader = () => {
    return (
      <View style={styles.loaderOverlay}>
        <ActivityIndicator size="large" color="#7B61FF" />
        <Text style={styles.loaderText}>Loading...</Text>
      </View>
    );
  };

  const handleMediaScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / width);
    dispatch(setCurrentMediaIndex(index));
  };

  const navigateToUserProfile = () => {
    if (user?._id) {
      navigation.navigate('UserProfile', { userId: user._id });
    }
  };

  Trace('Rendering ProductDetail with states:', { loading, refreshing, isActionLoading, product });

  if (loading && !refreshing) {
    return renderSkeleton();
  }

  if (!product) {
    return (
      <LinearGradient colors={['#0A0A1E', '#1E1E3F']} style={styles.errorContainer}>
        <Header
          showLeftIcon={true}
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
          isSearch={false}
          title="Product"
          showRightIcon1={false}
          showRightIcon2={false}
        />
        <Icon name="error-outline" size={scale(50)} color="#FF3E6D" />
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const userProfileImage = typeof user?.profileImage === 'string' ? user.profileImage : 'https://via.placeholder.com/40';
  Trace('User profile image:', userProfileImage);

  return (
    <LinearGradient colors={['#0A0A1E', '#1E1E3F']} style={styles.container}>
      <Header
        showLeftIcon={true}
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        isSearch={false}
        title={product.name || "Product"}
        showRightIcon1={false}
        showRightIcon2={false}
      />
      <ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
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
      >
        <View style={styles.mediaContainer}>
          <FlatList
            data={product.media || []}
            renderItem={renderMediaItem}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleMediaScroll}
            scrollEventThrottle={16}
          />
          {product.media && product.media.length > 1 && (
            <View style={styles.mediaIndicator}>
              <Text style={styles.mediaIndicatorText}>
                {currentMediaIndex + 1}/{product.media.length}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.detailsContainer}>
          <TouchableOpacity
            style={styles.userInfo}
            onPress={navigateToUserProfile}
            activeOpacity={0.7}
            disabled={isActionLoading}
          >
            <Image
              source={userProfileImage ? { uri: userProfileImage } : img.user}
              style={styles.userImage}
            />
            <Text style={styles.userName}>@{user?.userName || 'unknown'}</Text>
            <Icon name="chevron-right" size={scale(20)} color="#A0A0A0" />
          </TouchableOpacity>

          <View style={styles.titleRow}>
            <Text style={styles.name}>{product.name || 'Product'}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>₹{product.price || 'N/A'}</Text>
              {product.originalPrice && (
                <Text style={styles.originalPrice}>₹{product.originalPrice}</Text>
              )}
            </View>
          </View>

          {product.category && (
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          )}

          <Text style={styles.description}>{product.description || 'No description available'}</Text>

          <View style={styles.actionBar}>
            <TouchableOpacity
              style={[styles.actionButton, styles.likeButton, isLiked && styles.likedButton]}
              onPress={handleToggleLike}
              disabled={isActionLoading}
            >
              <Icon
                name={isLiked ? 'favorite' : 'favorite-border'}
                size={scale(20)}
                color={isLiked ? '#FF3E6D' : '#A0A0A0'}
              />
              <Text style={styles.actionButtonText}>
                {isLiked ? 'In WishList' : 'Add to Wishlist'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cartButton]}
              onPress={handleAddToCart}
              disabled={isActionLoading}
            >
              <IconCommunity
                name={isInCart ? 'cart-check' : 'cart-plus'}
                size={scale(20)}
                color="#A0A0A0"
              />
              <Text style={styles.actionButtonText}>
                {isInCart ? 'In Cart' : 'Add to Cart'}
              </Text>
            </TouchableOpacity>
          </View>

          {product.tags && product.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {product.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {relatedProducts.length > 0 && (
          <View style={styles.relatedProductsContainer}>
            <Text style={styles.sectionTitle}>You May Also Like</Text>
            <FlatList
              data={relatedProducts}
              renderItem={renderRelatedProduct}
              keyExtractor={(item) => item._id || item.id || Math.random().toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedProductsList}
            />
          </View>
        )}

        {recentlyViewed.length > 0 && (
          <View style={styles.recentlyViewedContainer}>
            <Text style={styles.sectionTitle}>Recently Viewed</Text>
            <FlatList
              data={recentlyViewed.filter((item) => item.id !== productId)}
              renderItem={renderRelatedProduct}
              keyExtractor={(item) => item.id || Math.random().toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedProductsList}
            />
          </View>
        )}
      </ScrollView>

      {isActionLoading && renderActionLoader()}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skeletonContainer: {
    flex: 1,
    backgroundColor: '#0A0A1E',
  },
  skeletonMedia: {
    width: width,
    height: width * 0.9,
    backgroundColor: '#1A1A2E',
  },
  skeletonDetails: {
    padding: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: scale(15),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  skeletonUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(15),
  },
  skeletonUserImage: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: scale(10),
  },
  skeletonText: {
    height: scale(14),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(4),
    marginBottom: scale(5),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  errorText: {
    marginTop: scale(15),
    fontSize: scaleFont(18),
    color: '#FFFFFF',
    fontWeight: '500',
  },
  retryButton: {
    marginTop: scale(20),
    paddingVertical: scale(12),
    paddingHorizontal: scale(30),
    backgroundColor: '#7B61FF',
    borderRadius: scale(8),
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  mediaContainer: {
    height: width * 0.9,
    position: 'relative',
    backgroundColor: '#000',
  },
  mediaItem: {
    width: width,
    height: width * 0.9,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: scale(15),
    left: scale(15),
    right: scale(15),
    height: scale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingVertical: scale(10),
    marginBottom: scale(10),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(8),
    paddingHorizontal: scale(15),
    borderRadius: scale(8),
    marginRight: scale(10),
  },
  likeButton: {
    backgroundColor: 'transparent',
  },
  likedButton: {
    backgroundColor: 'transparent',
  },
  cartButton: {
    backgroundColor: 'transparent',
  },
  actionButtonText: {
    color: '#E5E7EB',
    fontSize: scaleFont(14),
    fontWeight: '500',
    marginLeft: scale(6),
  },
  detailsContainer: {
    padding: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: scale(15),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(15),
  },
  userImage: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    marginRight: scale(10),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  userName: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: '#E5E7EB',
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: scale(10),
  },
  name: {
    fontSize: scaleFont(22),
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: scale(10),
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: scaleFont(22),
    color: '#7B61FF',
    fontWeight: '700',
  },
  originalPrice: {
    fontSize: scaleFont(16),
    color: '#A0A0A0',
    textDecorationLine: 'line-through',
  },
  categoryContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(123, 97, 255, 0.2)',
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(15),
    marginBottom: scale(15),
  },
  categoryText: {
    fontSize: scaleFont(12),
    color: '#7B61FF',
    fontWeight: '600',
  },
  description: {
    fontSize: scaleFont(15),
    lineHeight: scaleFont(22),
    color: '#E5E7EB',
    marginBottom: scale(15),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: scale(15),
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
    color: '#7B61FF',
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: scale(15),
    marginHorizontal: scale(20),
  },
  relatedProductsContainer: {
    paddingVertical: scale(15),
  },
  recentlyViewedContainer: {
    paddingVertical: scale(15),
    marginBottom: scale(20),
  },
  relatedProductsList: {
    paddingLeft: scale(20),
  },
  relatedProductCard: {
    width: scale(150),
    marginRight: scale(15),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: scale(10),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  relatedProductImage: {
    width: '100%',
    height: scale(120),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  relatedProductInfo: {
    padding: scale(10),
  },
  relatedProductName: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: scale(5),
  },
  relatedProductPrice: {
    fontSize: scaleFont(15),
    color: '#7B61FF',
    fontWeight: '700',
  },
  relatedProductCategory: {
    fontSize: scaleFont(12),
    color: '#A0A0A0',
    marginTop: scale(4),
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  loaderText: {
    marginTop: scale(10),
    fontSize: scaleFont(16),
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default ProductDetail;