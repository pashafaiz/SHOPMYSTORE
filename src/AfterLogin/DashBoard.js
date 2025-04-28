import React, { useEffect, useRef } from 'react';
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
import ProductModal from '../Products/ProductModal';
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

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375));
const numColumns = 3;
const itemSize = width / numColumns - scale(20);

const DashBoard = ({ navigation }) => {
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

  // Refs
  const flatListRef = useRef(null);

  // Animation values
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
  const categoryAnimations = categoryData.map(() => new Animated.Value(0));

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
    Trace('Fetching Products on Mount');
    dispatch(fetchProducts());

    const animations = categoryData.map((_, index) => {
      return Animated.spring(categoryAnimations[index], {
        toValue: 1,
        delay: index * 100,
        useNativeDriver: true,
        friction: 5,
      });
    });

    Animated.stagger(50, animations).start();
  }, [dispatch]);

  // Auto-scroll slider
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % sliderData.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      dispatch(setCurrentIndex(nextIndex));
    }, 3000);

    return () => clearInterval(interval);
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
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }, []);

    const onPressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    const mediaUrl = item.media || 'https://via.placeholder.com/120';
    const isNew = new Date(item.createdAt) > new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    return (
      <Animated.View 
        style={[
          styles.itemBox, 
          { 
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => {
            Trace('Product Clicked', { productId: item.id });
            navigation.navigate('ProductDetail', { 
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
            {isNew && (
              <View style={styles.productBadge}>
                <Text style={styles.badgeText}>New</Text>
              </View>
            )}
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.itemText} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.priceText}>₹{item.price || 'N/A'}</Text>
            <View style={styles.ratingContainer}>
              {[1,2,3,4,5].map((star) => (
                <Icon 
                  key={star} 
                  name={star <= 4 ? 'star' : 'star-border'} 
                  size={scale(12)} 
                  color="#FFD700" 
                />
              ))}
              <Text style={styles.ratingText}>(24)</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render slider item
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
              navigation.navigate('Categories');
            }}
          >
            <Text style={styles.shopNowText}>SHOP NOW</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    );
  };

  // Render category item
  const RenderCategoryList = ({ item }) => {
    const scaleAnim = new Animated.Value(1);

    const onPressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    const handleCategoryPress = () => {
      Trace('Category Clicked', { category: item.name });
      navigation.navigate('Categories', { category: item.name, products });
    };

    return (
      <Animated.View style={[styles.itemContainer, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={handleCategoryPress}
          disabled={isActionLoading}
        >
          <View style={styles.imageWrapper}>
            {item.gif ? (
              <FastImage
                source={item.gif}
                style={styles.categoryImage}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <FastImage
                source={item.image}
                style={styles.categoryImage}
                resizeMode={FastImage.resizeMode.contain}
              />
            )}
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {item.name}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Handle header icon press
  const handleHeaderIconPress = (iconName) => {
    Trace(`${iconName === 'menu' ? 'Menu' : 'Notifications'} icon pressed`);
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <LinearGradient colors={['#0A0A1E', '#1E1E3F']} style={styles.container}>
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonSlider} />
          <View style={styles.skeletonCategoryContainer}>
            {[...Array(3)].map((_, index) => (
              <View key={index} style={styles.skeletonCategoryItem}>
                <View style={styles.skeletonCategoryImage} />
                <View style={styles.skeletonCategoryText} />
              </View>
            ))}
          </View>
          <View style={styles.skeletonProductContainer}>
            {[...Array(6)].map((_, index) => (
              <View key={index} style={styles.skeletonProductItem}>
                <View style={styles.skeletonProductImage} />
                <View style={[styles.skeletonText, { width: '60%', marginTop: scale(10) }]} />
                <View style={[styles.skeletonText, { width: '40%', marginTop: scale(5) }]} />
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Main render
  return (
    <LinearGradient colors={['#0A0A1E', '#1E1E3F']} style={styles.container}>
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
          onLeftIconPress={() => handleHeaderIconPress('menu')}
          showRightIcon1={true}
          rightIcon1="notifications-outline"
          onRightIcon1Press={() => handleHeaderIconPress('notifications')}
        />
      </Animated.View>

      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#7B61FF']} 
            tintColor="#7B61FF" 
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } }}],
          { useNativeDriver: false }
        )}
        scrollEnabled={!isActionLoading}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Search suggestions */}
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

        {/* Filters */}
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

        {/* Slider */}
        <View style={styles.sliderContainer}>
          <FlatList
            ref={flatListRef}
            data={sliderData}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            renderItem={({ item }) => <RenderSliderList item={item} />}
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

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity onPress={() => {
            Trace('See All Categories Clicked');
            navigation.navigate('Categories');
          }}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={categoryData}
          keyExtractor={(item, index) => `category-${index}`}
          renderItem={({ item }) => <RenderCategoryList item={item} />}
          numColumns={numColumns}
          contentContainerStyle={styles.flatListContainer}
          scrollEnabled={false}
        />

        {/* Products */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <TouchableOpacity onPress={() => {
            Trace('View All Products Clicked');
            navigation.navigate('Categories', { products });
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

        {/* {filteredProducts.length > 6 && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => {
              Trace('View All Products Clicked');
              navigation.navigate('Categories', { products });
            }}
          >
            <LinearGradient
              colors={['#A855F7', '#7B61FF']}
              style={styles.viewAllButtonGradient}
            >
              <Text style={styles.viewAllButtonText}>View All Products</Text>
            </LinearGradient>
          </TouchableOpacity>
        )} */}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Product Modal */}
      <ProductModal
        visible={modalVisible}
        onClose={() => dispatch(setModalVisible(false))}
        onSubmit={handleSubmitProduct}
        product={currentProduct}
        onDelete={handleDeleteProduct}
      />

      {/* Loading overlay */}
      {isActionLoading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#7B61FF" />
          <Text style={styles.loaderText}>Loading...</Text>
        </View>
      )}
    </LinearGradient>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingTop: scale(60),
    paddingBottom: scale(30),
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(10, 10, 30, 0.9)',
    paddingTop: Platform.OS === 'ios' ? scale(40) : scale(10),
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
  flatListContainer: {
    paddingHorizontal: scale(10),
    paddingBottom: scale(10),
  },
  itemContainer: {
    width: itemSize,
    margin: scale(10),
    alignItems: 'center',
  },
  imageWrapper: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(35),
    backgroundColor: 'rgba(123, 97, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(10),
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.3)',
  },
  categoryImage: {
    width: '60%',
    height: '60%',
  },
  label: {
    fontSize: scaleFont(12),
    color: '#E5E7EB',
    fontWeight: '500',
    textAlign: 'center',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: scale(15),
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
    shadowOffset: { width: 0, height: scale(5) },
    shadowOpacity: 0.2,
    shadowRadius: scale(10),
    elevation: 3,
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
  productBadge: {
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
  priceText: {
    fontSize: scaleFont(14),
    fontWeight: '700',
    color: '#7B61FF',
    marginBottom: scale(5),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: scaleFont(10),
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: scale(5),
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
  skeletonContainer: {
    flex: 1,
    paddingTop: scale(10),
  },
  skeletonSlider: {
    height: height * 0.2,
    width: width * 0.9,
    alignSelf: 'center',
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: scale(20),
  },
  skeletonCategoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: scale(10),
  },
  skeletonCategoryItem: {
    alignItems: 'center',
    width: itemSize,
    marginVertical: scale(10),
  },
  skeletonCategoryImage: {
    width: scale(65),
    height: scale(65),
    borderRadius: scale(35),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  skeletonCategoryText: {
    width: '60%',
    height: scale(14),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(4),
    marginTop: scale(5),
  },
  skeletonProductContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: scale(15),
  },
  skeletonProductItem: {
    width: itemSize,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: scale(10),
    margin: scale(6),
    padding: scale(10),
    alignItems: 'center',
  },
  skeletonProductImage: {
    width: '100%',
    height: scale(120),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(8),
  },
  skeletonText: {
    height: scale(14),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(4),
  },
  viewAllButton: {
    marginHorizontal: scale(20),
    marginTop: scale(10),
    borderRadius: scale(8),
    overflow: 'hidden',
  },
  viewAllButtonGradient: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(30),
    alignItems: 'center',
  },
  viewAllButtonText: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default DashBoard;