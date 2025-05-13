import React, { useEffect, useRef } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Keyboard,
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
import Colors from '../constants/Colors';
import Filterbar from '../Components/Filterbar';
import Strings from '../constants/Strings';
// import ProductModal from '../Products/ProductModal';
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
  setSearch,
  selectSuggestion,
  setIsExpanded,
  setCurrentIndex,
  setActiveFilter,
  setModalVisible,
  setCurrentProduct,
  setSelectedCategory,
  setSelectedPrice,
  setSelectedSort,
  clearFilters,
  setUserData,
} from '../redux/slices/dashboardSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375));
const numColumns = 3;
const itemSize = width / numColumns - scale(20);
const trendingItemSize = width * 0.4; // Size for trending products to show at least 2.4 items

const DashBoard = ({ navigation: stackNavigation, onScroll }) => {
  const dispatch = useDispatch();
  const {
    search,
    products,
    filteredProducts,
    suggestions,
    isExpanded,
    currentIndex,
    activeFilter,
    token,
    userId,
    modalVisible,
    currentProduct,
    loading,
    isActionLoading,
    refreshing,
    selectedCategory,
    selectedPrice,
    selectedSort,
    error,
  } = useSelector((state) => state.dashboard);

  const navigation = useNavigation();

  useEffect(() => {
    console.log('Navigation Object:', navigation);
    console.log('Has openDrawer:', typeof navigation.openDrawer === 'function');
  }, [navigation]);

  // Refs
  const flatListRef = useRef(null);
  const sliderInterval = useRef(null);
  const productsLoaded = useRef(false);

  // Animation values for header
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

  // Handle refresh
  const onRefresh = async () => {
    Trace('Refreshing Dashboard Products');
    dispatch(fetchProducts());
  };

  // Handle product submission
  const handleSubmitProduct = async (productData) => {
    Trace('Submitting Product', { productData });
    dispatch(submitProduct({ productData, userId, currentProduct }));
    dispatch(setModalVisible(false));
  };

  // Handle product deletion
  const handleDeleteProduct = async (productId) => {
    Trace('Deleting Product', { productId });
    dispatch(deleteProduct(productId));
  };

  // Initialize component
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
      Trace('Fetching Products on Mount#pragma once');
      dispatch(fetchProducts());
      productsLoaded.current = true;
    }

    return () => {
      if (sliderInterval.current) {
        clearInterval(sliderInterval.current);
      }
    };
  }, [dispatch]);

  // Auto-scroll slider
  useEffect(() => {
    if (sliderData.length === 0) return;

    sliderInterval.current = setInterval(() => {
      const nextIndex = (currentIndex + 1) % sliderData.length;
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      }
      dispatch(setCurrentIndex(nextIndex));
    }, 3000);

    return () => {
      if (sliderInterval.current) {
        clearInterval(sliderInterval.current);
      }
    };
  }, [currentIndex, dispatch]);

  // Handle error with Toast
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

  // Render product item
  const RenderProductList = ({ item, index }) => {
    const mediaUrl = item.media || 'https://via.placeholder.com/120';
    const hasDiscount = item.discount > 0;
    const originalPrice = item.originalPrice || item.price;
    const discountedPrice = item.price;
    const discountPercentage = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);

    return (
      <View style={styles.itemBox}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            Trace('Product Clicked', { productId: item.id });
            stackNavigation.navigate('ProductDetail', { 
              productId: item.id,
              product: item
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
            <Text style={styles.itemText} numberOfLines={1}>{item.name}</Text>
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

  // Render trending product item
  const RenderTrendingProduct = ({ item, index }) => {
    const mediaUrl = item.media || 'https://via.placeholder.com/120';
    const hasDiscount = item.discount > 0;
    const originalPrice = item.originalPrice || item.price;
    const discountedPrice = item.price;
    const discountPercentage = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);

    return (
      <TouchableOpacity style={styles.trendingItemBox}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            Trace('Trending Product Clicked', { productId: item.id });
            stackNavigation.navigate('ProductDetail', { 
              productId: item.id,
              product: item
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
            <Text style={styles.trendingItemText} numberOfLines={1}>{item.name}</Text>
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
      </TouchableOpacity>
    );
  };

  const RenderSliderList = ({ item }) => {
    const translateX = useRef(new Animated.Value(width)).current;
    
    useEffect(() => {
      Animated.spring(translateX, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View style={[styles.slide, { transform: [{ translateX }] }]}>
        <FastImage
          source={item.image}
          style={styles.sliderImage}
          resizeMode={FastImage.resizeMode.cover}
        />
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.8)']}
          style={styles.sliderOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <Text style={styles.sliderTitle}>{item.title}</Text>
          <Text style={styles.sliderSubtitle}>Shop the latest collection</Text>
          <TouchableOpacity 
            style={styles.shopNowButton}
            onPress={() => {
              Trace('Shop Now Clicked');
              stackNavigation.navigate('Categories');
            }}
          >
            <Text style={styles.shopNowText}>SHOP NOW</Text>
          </TouchableOpacity>
        </LinearGradient>
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
    } else if (iconName === "notifications") {
       navigation.navigate("Notifications")
    }
    else{
      navigation.navigate("NotificationsScreen")
    }
  };

  return (
    <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing || loading}
            onRefresh={onRefresh} 
            colors={['#7B61FF']} 
            tintColor="#7B61FF" 
            progressViewOffset={scale(100)} 
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } }}],
          { useNativeDriver: false }
        ) && onScroll}
        scrollEnabled={!isActionLoading}
        contentContainerStyle={styles.scrollContainer}
      >
        <Animated.View style={[styles.headerContainer, {
          transform: [{ translateY: headerTranslateY }],
          opacity: headerOpacity
        }]}>
          <Header
            isSearch={true}
            searchValue={search}
            onSearchChange={(text) => dispatch(setSearch(text))}
            showLeftIcon={true}
            leftIcon="menu"
            onLeftPress={() => handleHeaderIconPress('menu')}
            showRightIcon1={true}
            rightIcon1="notifications-outline"
            onRightPress1={() => handleHeaderIconPress('notifications')}
            showRightIcon2={true}
            rightIcon2='chatbubble-ellipses-outline'
            onRightIcon2Press={()=>handleHeaderIconPress("message")}
          />
        </Animated.View>

        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <ScrollView
              style={styles.suggestionScroll}
              nestedScrollEnabled={true}
              onScroll={({ nativeEvent }) => {
                if (!isExpanded && nativeEvent.contentOffset.y > 0) {
                  dispatch(setIsExpanded(true));
                }
              }}
            >
              {(isExpanded ? suggestions : suggestions.slice(0, 5)).map((item) => (
                <TouchableOpacity
                  key={item.id?.toString() || Math.random().toString()}
                  onPress={() => dispatch(selectSuggestion(item.name))}
                  style={styles.suggestionItem}
                  disabled={isActionLoading}
                >
                  <Text style={styles.suggestionText}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {!isExpanded && suggestions.length > 5 && (
              <Text style={styles.loadMoreText}>⬇ Scroll to load more...</Text>
            )}
          </View>
        )}

        <View style={styles.filtersWrapper}>
          <View style={styles.filterContainer}>
            <View style={styles.filterItem}>
              <Filterbar
                title="Category"
                isVisible={activeFilter === 'category'}
                onToggle={() => dispatch(setActiveFilter(activeFilter === 'category' ? null : 'category'))}
                options={[...new Set(products.map(product => product.category))].filter(Boolean)}
                selectedOption={selectedCategory}
                onOptionSelect={(value) => {
                  dispatch(setSelectedCategory(value === selectedCategory ? '' : value));
                  dispatch(setActiveFilter(null));
                }}
              />
            </View>
            <View style={styles.filterItem}>
              <Filterbar
                title="Price Range"
                isVisible={activeFilter === 'price'}
                onToggle={() => dispatch(setActiveFilter(activeFilter === 'price' ? null : 'price'))}
                options={['Under ₹500', '₹500 - ₹1000', '₹1000 - ₹2000', 'Over ₹2000']}
                selectedOption={selectedPrice}
                onOptionSelect={(value) => {
                  dispatch(setSelectedPrice(value === selectedPrice ? '' : value));
                  dispatch(setActiveFilter(null));
                }}
              />
            </View>
            <View style={styles.filterItem}>
              <Filterbar
                title="Sort By"
                isVisible={activeFilter === 'sort'}
                onToggle={() => dispatch(setActiveFilter(activeFilter === 'sort' ? null : 'sort'))}
                options={['Newest First', 'Price: Low to High', 'Price: High to Low', 'Popular']}
                selectedOption={selectedSort}
                onOptionSelect={(value) => {
                  dispatch(setSelectedSort(value === selectedSort ? '' : value));
                  dispatch(setActiveFilter(null));
                }}
              />
            </View>
          </View>
          {(selectedCategory || selectedPrice || selectedSort) && (
            <View style={styles.clearFiltersContainer}>
              <TouchableOpacity 
                style={styles.clearFiltersButton}
                onPress={() => dispatch(clearFilters())}
              >
                <Icon name="close" size={scale(16)} color="#7B61FF" />
              </TouchableOpacity>
            </View>
          )}
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
              renderItem={({ item }) => <RenderSliderList item={item} />}
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
                    currentIndex === index && styles.paginationDotActive
                  ]} 
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Products</Text>
          <TouchableOpacity onPress={() => {
            Trace('See All Trending Products Clicked');
            stackNavigation.navigate('Categories');
          }}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredProducts.slice(0, 10)}
          keyExtractor={(item, index) => `trending-${item.id}-${index}`}
          renderItem={({ item, index }) => <RenderTrendingProduct item={item} index={index} />}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendingListContainer}
          snapToInterval={trendingItemSize + scale(10)}
          decelerationRate="fast"
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <TouchableOpacity onPress={() => {
            Trace('View All Products Clicked');
            stackNavigation.navigate('Categories', { products });
          }}>
            <AntDesign name="arrowsalt" size={scale(20)} color="#7B61FF" />
          </TouchableOpacity>
        </View>

        {filteredProducts.length === 0 ? (
          <View style={styles.noProductsContainer}>
            <Icon name="error-outline" size={scale(50)} color="#FF3E6D" />
            <Text style={styles.noProductsText}>No Products Found</Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {filteredProducts.slice(0, 6).map((item, index) => (
              <RenderProductList key={item.id} item={item} index={index} />
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Product Modal */}
      {/* <ProductModal
        visible={modalVisible}
        onClose={() => dispatch(setModalVisible(false))}
        onSubmit={handleSubmitProduct}
        product={currentProduct}
        onDelete={handleDeleteProduct}
      /> */}

      {/* Loading overlay */}
      {/* {isActionLoading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#7B61FF" />
          <Text style={styles.loaderText}>Loading...</Text>
        </View>
      )} */}
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
    backgroundColor: 'rgba(10, 10, 30, 0.9)',
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
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: scale(10) },
    shadowOpacity: 0.3,
    shadowRadius: scale(15),
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
  },
  sliderTitle: {
    fontSize: scaleFont(22),
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: scale(5),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  sliderSubtitle: {
    fontSize: scaleFont(14),
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: scale(15),
  },
  shopNowButton: {
    backgroundColor: '#7B61FF',
    paddingVertical: scale(8),
    paddingHorizontal: scale(20),
    borderRadius: scale(20),
    alignSelf: 'flex-start',
  },
  shopNowText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: scaleFont(12),
    letterSpacing: 1,
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
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: scale(4),
  },
  paginationDotActive: {
    backgroundColor: '#7B61FF',
    width: scale(20),
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
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  seeAll: {
    fontSize: scaleFont(14),
    color: '#7B61FF',
    fontWeight: '600',
  },
  trendingListContainer: {
    paddingHorizontal: scale(15),
    paddingBottom: scale(10),
  },
  trendingItemBox: {
    width: trendingItemSize,
    marginRight: scale(10),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: scale(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
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
  },
  trendingItemText: {
    fontSize: scaleFont(12),
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: scale(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
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
    backgroundColor: '#FF3E6D',
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(12),
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: scaleFont(10),
    fontWeight: 'bold',
  },
  productInfo: {
    padding: scale(10),
  },
  itemText: {
    fontSize: scaleFont(12),
    color: '#FFFFFF',
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
    color: '#7B61FF',
  },
  originalPriceText: {
    fontSize: scaleFont(8),
    color: '#B0B0D0',
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
  suggestionsContainer: {
    backgroundColor: 'rgba(30, 30, 63, 0.9)',
    marginHorizontal: scale(15),
    padding: scale(10),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.3,
    shadowRadius: scale(4),
    elevation: 5,
    maxHeight: height * 0.3,
  },
  suggestionScroll: {
    maxHeight: scale(220),
  },
  suggestionItem: {
    paddingVertical: scale(8),
    borderBottomWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.2)',
    borderRadius: scale(5),
    paddingHorizontal: scale(15),
    marginVertical: scale(2),
  },
  suggestionText: {
    fontSize: scaleFont(16),
    color: '#E5E7EB',
  },
  loadMoreText: {
    fontSize: scaleFont(14),
    color: '#A0A0A0',
    textAlign: 'center',
    marginTop: scale(8),
    fontStyle: 'italic',
  },
  filtersWrapper: {
    flexDirection: 'column',
    marginHorizontal: scale(10),
    marginVertical: scale(10),
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterItem: {
    flex: 1,
    marginHorizontal: scale(4),
    minWidth: scale(70),
  },
  clearFiltersContainer: {
    alignItems: 'center',
    marginTop: scale(8),
  },
  clearFiltersButton: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: 'rgba(123, 97, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noProductsContainer: {
    alignItems: 'center',
    paddingVertical: scale(50),
  },
  noProductsText: {
    fontSize: scaleFont(18),
    color: '#FFFFFF',
    marginTop: scale(15),
    fontWeight: '500',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    elevation: 20,
  },
  loaderText: {
    marginTop: scale(10),
    fontSize: scaleFont(16),
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default DashBoard;