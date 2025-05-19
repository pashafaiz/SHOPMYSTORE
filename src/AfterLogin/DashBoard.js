import React, { useEffect, useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  ScrollView,
  RefreshControl,
  Animated,
  ActivityIndicator,
  Platform,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../Components/Header';
import { categoryData, sliderData } from '../constants/Dummy_Data';
import Strings from '../constants/Strings';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FastImage from 'react-native-fast-image';
import Trace from '../utils/Trace';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProducts,
  submitProduct,
  deleteProduct,
  setCurrentIndex,
  setModalVisible,
  setCurrentProduct,
  clearFilters,
  setUserData,
  addRecentlyViewedProduct,
} from '../redux/slices/dashboardSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// Define theme colors
const PRODUCT_BG_COLOR = '#f5f9ff';
const CATEGORY_BG_COLOR = 'rgba(91, 156, 255, 0.2)';
const SELECTED_CATEGORY_BG_COLOR = '#5b9cff';
const PRIMARY_THEME_COLOR = '#5b9cff';
const SECONDARY_THEME_COLOR = '#ff6b8a';
const TEXT_THEME_COLOR = '#1a2b4a';
const SUBTEXT_THEME_COLOR = '#5a6b8a';
const BORDER_THEME_COLOR = 'rgba(91, 156, 255, 0.3)';
const BACKGROUND_GRADIENT = ['#8ec5fc', '#fff'];

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375));
const numColumns = 3;
const itemSize = width / numColumns - scale(20);
const trendingItemSize = width * 0.4;

const DashBoard = ({ navigation: stackNavigation, onScroll }) => {
  const dispatch = useDispatch();
  const {
    products,
    filteredProducts,
    currentIndex,
    token,
    userId,
    modalVisible,
    currentProduct,
    loading,
    isActionLoading,
    refreshing,
    error,
  } = useSelector((state) => state.dashboard);

  const navigation = useNavigation();

  useEffect(() => {
    console.log('Navigation Object:', navigation);
    console.log('Has openDrawer:', typeof navigation.openDrawer === 'function');
  }, [navigation]);

  const flatListRef = useRef(null);
  const sliderInterval = useRef(null);
  const productsLoaded = useRef(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const onRefresh = async () => {
    Trace('Refreshing Dashboard Products');
    dispatch(fetchProducts());
  };

  const handleSubmitProduct = async (productData) => {
    Trace('Submitting Product', { productData });
    dispatch(submitProduct({ productData, userId, currentProduct }));
    dispatch(setModalVisible(false));
  };

  const handleDeleteProduct = async (productId) => {
    Trace('Deleting Product', { productId });
    dispatch(deleteProduct(productId));
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const userToken = await AsyncStorage.getItem('userToken');
        if (storedUser && userToken) {
          const parsedUser = JSON.parse(storedUser);
          dispatch(setUserData({ userId: parsedUser.id || '', token: userToken }));
        }
      } catch (err) {
        Trace('Failed to load user data', { error: err.message });
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load user data',
          position: 'top',
          topOffset: scale(20),
        });
      }
    };

    loadUserData();

    if (!productsLoaded.current) {
      Trace('Fetching Products on Mount');
      dispatch(fetchProducts());
      productsLoaded.current = true;
    }

    return () => {
      if (sliderInterval.current) {
        clearInterval(sliderInterval.current);
      }
    };
  }, [dispatch]);

  useEffect(() => {
    if (sliderData.length === 0) return;

    const slide = () => {
      const nextIndex = (currentIndex + 1) % sliderData.length;
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      }
      dispatch(setCurrentIndex(nextIndex));
    };

    sliderInterval.current = setInterval(slide, 4000);

    return () => {
      if (sliderInterval.current) {
        clearInterval(sliderInterval.current);
      }
    };
  }, [currentIndex, dispatch]);

  useEffect(() => {
    if (error) {
      Trace('Dashboard Error', { error });
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error,
        position: 'top',
        topOffset: scale(20),
        visibilityTime: 3000,
      });
    }
  }, [error]);

  const premiumCategories = [
    { id: '1', name: "Men's" },
    { id: '2', name: "Girl's" },
    { id: '3', name: 'Kids' },
    { id: '4', name: 'Accessories' },
    { id: '5', name: 'Luxury' },
    { id: '6', name: "Mobile's" },
    { id: '7', name: "Brand's" },
    { id: '8', name: 'Trending' },
  ];

  const RenderCategorySlider = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.categoryItem}
        onPress={() => {
          Trace('Category Selected', { category: item.name });
          stackNavigation.navigate('CategoryProducts', { category: item.name });
        }}
        disabled={isActionLoading}
      >
        <Text style={styles.categoryText}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const RenderProductList = ({ item, index }) => {
    const mediaUrl = item.media || 'https://via.placeholder.com/120';
    const hasDiscount = item.discount > 0;
    const originalPrice = item.originalPrice || item.price;
    const discountedPrice = item.price;
    const discountPercentage = Math.round(
      ((originalPrice - discountedPrice) / originalPrice) * 100
    );

    return (
      <View style={styles.itemBox}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            Trace('Product Clicked', { productId: item.id });
            dispatch(addRecentlyViewedProduct(item));
            stackNavigation.navigate('ProductDetail', {
              productId: item.id,
              product: item,
            });
          }}
          disabled={isActionLoading}
        >
          <View style={styles.product_Img}>
            <FastImage
              source={{ uri: mediaUrl }}
              style={styles.productImage}
              resizeMode={FastImage.resizeMode.cover}
              defaultSource={{ uri: 'https://via.placeholder.com/120' }}
            />
            {hasDiscount && (
              <View style={styles.discountBadge}>
                <Text style={styles.badgeText}>{discountPercentage}% OFF</Text>
              </View>
            )}
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.itemText} numberOfLines={1}>
              {item.name || 'Unnamed Product'}
            </Text>
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>₹{discountedPrice || 'N/A'}</Text>
              {hasDiscount && (
                <Text style={styles.originalPriceText}>₹{originalPrice}</Text>
              )}
            </View>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name={star <= Math.round(item.rating || 0) ? 'star' : 'star-border'}
                  size={scale(12)}
                  color="#FFD700"
                />
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const RenderTrendingProduct = ({ item, index }) => {
    const mediaUrl = item.media || 'https://via.placeholder.com/120';
    const hasDiscount = item.discount > 0;
    const originalPrice = item.originalPrice || item.price;
    const discountedPrice = item.price;
    const discountPercentage = Math.round(
      ((originalPrice - discountedPrice) / originalPrice) * 100
    );

    return (
      <View style={styles.trendingItemBox}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            Trace('Trending Product Clicked', { productId: item.id });
            dispatch(addRecentlyViewedProduct(item));
            stackNavigation.navigate('ProductDetail', {
              productId: item.id,
              product: item,
            });
          }}
          disabled={isActionLoading}
        >
          <View style={styles.trendingProductImg}>
            <FastImage
              source={{ uri: mediaUrl }}
              style={styles.trendingProductImage}
              resizeMode={FastImage.resizeMode.cover}
              defaultSource={{ uri: 'https://via.placeholder.com/120' }}
            />
            {hasDiscount && (
              <View style={styles.discountBadge}>
                <Text style={styles.badgeText}>{discountPercentage}% OFF</Text>
              </View>
            )}
          </View>
          <View style={styles.trendingProductInfo}>
            <Text style={styles.trendingItemText} numberOfLines={1}>
              {item.name || 'Unnamed Product'}
            </Text>
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>₹{discountedPrice || 'N/A'}</Text>
              {hasDiscount && (
                <Text style={styles.originalPriceText}>₹{originalPrice}</Text>
              )}
            </View>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name={star <= Math.round(item.rating || 0) ? 'star' : 'star-border'}
                  size={scale(12)}
                  color="#FFD700"
                />
              ))}
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shopNowButton}
          onPress={() => {
            Trace('Shop Now Button Clicked', { productId: item.id });
            dispatch(addRecentlyViewedProduct(item));
            stackNavigation.navigate('ProductDetail', {
              productId: item.id,
              product: item,
            });
          }}
          disabled={isActionLoading}
        >
          <Text style={styles.shopNowText}>Shop Now</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const RenderSliderList = ({ item, index }) => {
    const translateX = useRef(new Animated.Value(width)).current;
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(translateX, {
        toValue: 0,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();

      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    }, [index]);

    const progressWidth = progress.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    return (
      <Animated.View style={[styles.slide]}>
        <FastImage
          source={item.image}
          style={styles.sliderImage}
          resizeMode={FastImage.resizeMode.contain}
        />
        <View style={styles.sliderOverlay}>
          <TouchableOpacity
            style={styles.sliderShopNowButton}
            onPress={() => {
              Trace('Shop Now Clicked');
              stackNavigation.navigate('Categories');
            }}
          >
            <Text style={styles.shopNowText}>SHOP NOW</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
      </Animated.View>
    );
  };

  const handleHeaderIconPress = (iconName) => {
    if (iconName === 'menu') {
      Trace('Opening Drawer');
      if (typeof navigation.openDrawer === 'function') {
        navigation.openDrawer();
      } else {
        console.error('Cannot open drawer: openDrawer is not available');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Unable to open menu. Please try again.',
          position: 'top',
          topOffset: scale(20),
        });
      }
    } else if (iconName === 'notifications') {
      navigation.navigate('Notifications');
    } else {
      navigation.navigate('NotificationsScreen');
    }
  };

  return (
    <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={onRefresh}
            colors={[PRIMARY_THEME_COLOR]}
            tintColor={PRIMARY_THEME_COLOR}
            progressViewOffset={scale(100)}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEnabled={!isActionLoading}
        contentContainerStyle={styles.scrollContainer}
      >
        <Animated.View
          style={[
            styles.headerContainer,
            {
              transform: [{ translateY: headerTranslateY }],
              opacity: headerOpacity,
            },
          ]}
        >
          <Header
            showLeftIcon={true}
            isSearch={true}
            onSearchPress={() => {
              navigation.navigate('Search');
            }}
            leftIcon="menu"
            onLeftPress={() => handleHeaderIconPress('menu')}
            showRightIcon1={true}
            rightIcon1="notifications-outline"
            onRightPress1={() => handleHeaderIconPress('notifications')}
            showRightIcon2={true}
            rightIcon2="chatbubble-ellipses-outline"
            onRightIcon2Press={() => handleHeaderIconPress('message')}
          />
        </Animated.View>

        <View style={styles.categorySliderContainer}>
          <FlatList
            data={premiumCategories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <RenderCategorySlider item={item} />}
            contentContainerStyle={styles.categorySliderContent}
          />
        </View>

        {sliderData.length > 0 && (
          <View style={styles.sliderContainer}>
            <FlatList
              ref={flatListRef}
              data={sliderData}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => `slider-${index}`}
              renderItem={({ item, index }) => <RenderSliderList item={item} index={index} />}
              snapToInterval={width - scale(40)}
              decelerationRate="fast"
              onScrollToIndexFailed={({ index }) => {
                flatListRef.current?.scrollToOffset({
                  offset: index * (width - scale(40)),
                  animated: true,
                });
              }}
            />
            <View style={styles.pagination}>
              {sliderData.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    currentIndex === index && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Products</Text>
          <TouchableOpacity
            onPress={() => {
              Trace('See All Trending Products Clicked');
              stackNavigation.navigate('Categories');
            }}
          >
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={products.slice(0, 10)}
          keyExtractor={(item, index) => `trending-${item.id}-${index}`}
          renderItem={({ item, index }) => <RenderTrendingProduct item={item} index={index} />}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendingListContainer}
          snapToInterval={trendingItemSize + scale(30)}
          decelerationRate="fast"
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <TouchableOpacity
            onPress={() => {
              Trace('View All Products Clicked');
              stackNavigation.navigate('Categories', { products });
            }}
          >
            <AntDesign name="arrowsalt" size={scale(20)} color={PRIMARY_THEME_COLOR} />
          </TouchableOpacity>
        </View>

        {products.length === 0 ? (
          <View style={styles.noProductsContainer}>
            <Icon name="error-outline" size={scale(50)} color={SECONDARY_THEME_COLOR} />
            <Text style={styles.noProductsText}>No Products Found</Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {products.slice(0, 6).map((item, index) => (
              <RenderProductList key={item.id} item={item} index={index} />
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingTop: scale(60),
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: PRODUCT_BG_COLOR,
  },
  sliderContainer: {
    height: height * 0.25,
    marginBottom: scale(20),
    position: 'relative',
  },
  slide: {
    width: width - scale(40),
    height: '100%',
    marginHorizontal: scale(20),
    borderRadius: scale(15),
    overflow: 'hidden',
    elevation: 5,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: scale(5) },
    shadowOpacity: 0.2,
    shadowRadius: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderImage: {
    width: '100%',
    height: '100%',
  },
  sliderOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: scale(20),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sliderShopNowButton: {
    backgroundColor: PRIMARY_THEME_COLOR,
    paddingVertical: scale(8),
    paddingHorizontal: scale(20),
    borderRadius: scale(20),
    alignSelf: 'flex-start',
  },
  shopNowButton: {
    backgroundColor: '#76c1f8',
    borderRadius: scale(10),
    width: scale(90),
    height: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: scale(-15),
    right: scale(0),
    zIndex: 20,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.3,
    shadowRadius: scale(4),
  },
  shopNowText: {
    color: TEXT_THEME_COLOR,
    fontWeight: 'bold',
    fontSize: scaleFont(10),
    textAlign: 'center',
  },
  pagination: {
    position: 'absolute',
    bottom: scale(15),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  paginationDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: BORDER_THEME_COLOR,
    marginHorizontal: scale(4),
  },
  paginationDotActive: {
    backgroundColor: PRIMARY_THEME_COLOR,
    width: scale(20),
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: scale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: PRIMARY_THEME_COLOR,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    marginBottom: scale(15),
    marginTop: scale(10),
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
    letterSpacing: 0.5,
  },
  seeAll: {
    fontSize: scaleFont(14),
    color: PRIMARY_THEME_COLOR,
    fontWeight: '600',
  },
  trendingListContainer: {
    paddingHorizontal: scale(15),
    paddingBottom: scale(10),
    overflow: 'visible',
  },
  trendingItemBox: {
    width: trendingItemSize,
    marginRight: scale(10),
    marginBottom: scale(20),
    backgroundColor: 'rgba(142, 197, 252, 0.2)',
    borderRadius: scale(12),
    overflow: 'visible',
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowRadius: scale(10),
  },
  trendingProductImg: {
    width: '100%',
    height: scale(140),
    position: 'relative',
  },
  trendingProductImage: {
    width: '100%',
    height: '100%',
  },
  trendingProductInfo: {
    padding: scale(10),
    paddingBottom: scale(20),
  },
  trendingItemText: {
    fontSize: scaleFont(12),
    color: TEXT_THEME_COLOR,
    fontWeight: '600',
    marginBottom: scale(5),
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: scale(15),
  },
  itemBox: {
    width: itemSize,
    marginBottom: scale(15),
    backgroundColor: 'rgba(142, 197, 252, 0.2)',
    borderRadius: scale(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowRadius: scale(10),
  },
  product_Img: {
    width: '100%',
    height: scale(120),
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: scale(10),
    left: scale(10),
    backgroundColor: SECONDARY_THEME_COLOR,
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(12),
  },
  badgeText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(10),
    fontWeight: 'bold',
  },
  productInfo: {
    padding: scale(10),
  },
  itemText: {
    fontSize: scaleFont(12),
    color: TEXT_THEME_COLOR,
    fontWeight: '600',
    marginBottom: scale(5),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(5),
  },
  priceText: {
    fontSize: scaleFont(11),
    fontWeight: '700',
    color: PRIMARY_THEME_COLOR,
  },
  originalPriceText: {
    fontSize: scaleFont(8),
    color: SUBTEXT_THEME_COLOR,
    textDecorationLine: 'line-through',
    marginLeft: scale(5),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomSpacer: {
    height: scale(30),
  },
  categorySliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: scale(10),
    marginVertical: scale(10),
  },
  categorySliderContent: {
    paddingHorizontal: scale(10),
  },
  categoryItem: {
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(20),
    paddingVertical: scale(8),
    paddingHorizontal: scale(15),
    marginRight: scale(10),
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
  },
  categoryText: {
    fontSize: scaleFont(14),
    color: TEXT_THEME_COLOR,
    fontWeight: '600',
  },
  noProductsContainer: {
    alignItems: 'center',
    paddingVertical: scale(50),
  },
  noProductsText: {
    fontSize: scaleFont(18),
    color: TEXT_THEME_COLOR,
    marginTop: scale(15),
    fontWeight: '500',
  },
});

export default DashBoard;