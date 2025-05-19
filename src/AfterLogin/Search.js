import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FastImage from 'react-native-fast-image';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../Components/Header';
import {
  setSearch,
  fetchProducts,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  addRecentlyViewedProduct,
  clearRecentlyViewedProducts,
} from '../redux/slices/dashboardSlice';
import Trace from '../utils/Trace';
import Toast from 'react-native-toast-message';
import { TOAST_POSITION, TOAST_TOP_OFFSET } from '../constants/GlobalConstants';

const { width, height } = Dimensions.get('window');
const scaleFactor = Math.min(width, 375) / 375;
const scale = (size) => Math.round(size * scaleFactor);
const scaleFont = (size) => {
  const fontScale = Math.min(width, height) / 375;
  const scaledSize = size * fontScale * (Platform.OS === 'ios' ? 0.9 : 0.85);
  return Math.round(scaledSize);
};

// Theme constants
const PRODUCT_BG_COLOR = '#f5f9ff';
const CATEGORY_BG_COLOR = 'rgba(91, 156, 255, 0.2)';
const PRIMARY_THEME_COLOR = '#5b9cff';
const SECONDARY_THEME_COLOR = '#ff6b8a';
const TEXT_THEME_COLOR = '#1a2b4a';
const SUBTEXT_THEME_COLOR = '#5a6b8a';
const BORDER_THEME_COLOR = 'rgba(91, 156, 255, 0.3)';
const BACKGROUND_GRADIENT = ['#8ec5fc', '#fff'];

const itemSize = width / 3 - scale(15); // Adjusted for 3 products per row
const recentProductSize = width * 0.35; // Unchanged for recent products

const Search = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {
    search,
    filteredProducts,
    recentSearches = [],
    recentlyViewedProducts = [],
    loading,
    error,
  } = useSelector((state) => state.dashboard);
  const [localSearch, setLocalSearch] = useState(search);

  // Load recent searches and recently viewed products from AsyncStorage
  useEffect(() => {
    const loadRecentData = async () => {
      try {
        const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const now = Date.now();

        // Load recent searches
        const storedSearches = await AsyncStorage.getItem('recentSearches');
        if (storedSearches) {
          const parsedSearches = JSON.parse(storedSearches);
          if (Array.isArray(parsedSearches)) {
            // Filter out searches older than 1 day
            const validSearches = parsedSearches
              .filter((item) => now - item.timestamp < ONE_DAY_MS)
              .map((item) => item.term);
            if (validSearches.length > 0) {
              dispatch(addRecentSearch(validSearches));
            }
            // Update AsyncStorage with valid searches
            await AsyncStorage.setItem(
              'recentSearches',
              JSON.stringify(
                parsedSearches.filter((item) => now - item.timestamp < ONE_DAY_MS)
              )
            );
          } else {
            Trace('Invalid recent searches format', { storedSearches });
            await AsyncStorage.removeItem('recentSearches');
          }
        }

        // Load recently viewed products
        const storedProducts = await AsyncStorage.getItem('recentlyViewedProducts');
        if (storedProducts) {
          const parsedProducts = JSON.parse(storedProducts);
          if (Array.isArray(parsedProducts)) {
            // Filter out products older than 1 day
            const validProducts = parsedProducts.filter(
              (item) => now - item.timestamp < ONE_DAY_MS
            );
            validProducts.forEach((product) =>
              dispatch(addRecentlyViewedProduct(product))
            );
            // Update AsyncStorage with valid products
            await AsyncStorage.setItem(
              'recentlyViewedProducts',
              JSON.stringify(validProducts)
            );
          } else {
            Trace('Invalid recently viewed products format', { storedProducts });
            await AsyncStorage.removeItem('recentlyViewedProducts');
          }
        }
      } catch (err) {
        Trace('Failed to load recent data', { error: err.message });
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load recent data',
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      }
    };
    loadRecentData();
    dispatch(fetchProducts());
  }, [dispatch]);

  // Debounced search handler
  const handleSearch = useCallback(
    (text) => {
      dispatch(setSearch(text));
      if (text.trim()) {
        dispatch(addRecentSearch(text.trim()));
      }
    },
    [dispatch]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(localSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, handleSearch]);

  // Handle error from Redux
  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error,
        position: TOAST_POSITION,
        topOffset: TOAST_TOP_OFFSET,
      });
    }
  }, [error]);

  const handleClearSearch = () => {
    setLocalSearch('');
    dispatch(setSearch(''));
  };

  const handleRecentSearchClick = (term) => {
    setLocalSearch(term);
    dispatch(setSearch(term));
  };

  const handleRemoveRecentSearch = (term) => {
    dispatch(removeRecentSearch(term));
  };

  const handleClearAllSearches = () => {
    dispatch(clearRecentSearches());
  };

  const handleClearAllRecentlyViewed = () => {
    dispatch(clearRecentlyViewedProducts());
  };

  const RenderProductItem = ({ item }) => {
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
          activeOpacity={0.8}
          onPress={() => {
            dispatch(addRecentlyViewedProduct(item));
            navigation.navigate('ProductDetail', {
              productId: item.id,
              product: item,
              fromScreen: 'Search',
            });
          }}
          disabled={loading}
        >
          <View style={styles.productImg}>
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
            <Text style={styles.itemText} numberOfLines={2}>
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
                <Ionicons
                  key={star}
                  name={star <= Math.round(item.rating || 0) ? 'star' : 'star-outline'}
                  size={scale(12)}
                  color="#FFD700"
                />
              ))}
            </View>
            <TouchableOpacity style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const RenderRecentSearch = ({ item }) => (
    <View style={styles.recentSearchItem}>
      <TouchableOpacity onPress={() => handleRecentSearchClick(item.term)}>
        <Text style={styles.recentSearchText}>{item.term}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleRemoveRecentSearch(item.term)}>
        <Ionicons name="close" size={scale(16)} color={SECONDARY_THEME_COLOR} />
      </TouchableOpacity>
    </View>
  );

  const RenderRecentlyViewedProduct = ({ item }) => {
    const mediaUrl = item.media || 'https://via.placeholder.com/120';
    const hasDiscount = item.discount > 0;
    const originalPrice = item.originalPrice || item.price;
    const discountedPrice = item.price;
    const discountPercentage = Math.round(
      ((originalPrice - discountedPrice) / originalPrice) * 100
    );

    return (
      <View style={styles.recentProductItem}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Trace('Recently Viewed Product Clicked', { productId: item.id });
            dispatch(addRecentlyViewedProduct(item));
            navigation.navigate('ProductDetail', {
              productId: item.id,
              product: item,
              fromScreen: 'Search',
            });
          }}
        >
          <View style={styles.recentProductImg}>
            <FastImage
              source={{ uri: mediaUrl }}
              style={styles.recentProductImage}
              resizeMode={FastImage.resizeMode.cover}
              defaultSource={{ uri: 'https://via.placeholder.com/120' }}
            />
            {hasDiscount && (
              <View style={styles.discountBadge}>
                <Text style={styles.badgeText}>{discountPercentage}% OFF</Text>
              </View>
            )}
          </View>
          <Text style={styles.recentProductText} numberOfLines={1}>
            {item.name || 'Unnamed Product'}
          </Text>
          <Text style={styles.recentProductPrice}>₹{discountedPrice || 'N/A'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.container}>
      <Header
        title="Search Products"
        showLeftIcon={true}
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        textStyle={styles.headerText}
        containerStyle={styles.header}
      />
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={scale(20)}
            color={SUBTEXT_THEME_COLOR}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products or categories"
            placeholderTextColor={SUBTEXT_THEME_COLOR}
            value={localSearch}
            onChangeText={setLocalSearch}
            autoFocus={true}
          />
          {localSearch ? (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Ionicons name="close" size={scale(20)} color={SUBTEXT_THEME_COLOR} />
            </TouchableOpacity>
          ) : null}
        </View>

        {recentSearches.length > 0 && (
          <View style={styles.recentSearchesContainer}>
            <View style={styles.recentSearchesHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={handleClearAllSearches}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recentSearches}
              keyExtractor={(item, index) => `recent-${item.term}-${index}`}
              renderItem={RenderRecentSearch}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentSearchesList}
            />
          </View>
        )}

        {recentlyViewedProducts.length > 0 && (
          <View style={styles.recentlyViewedContainer}>
            <View style={styles.recentlyViewedHeader}>
              <Text style={styles.sectionTitle}>Recently Viewed Products</Text>
              <TouchableOpacity onPress={handleClearAllRecentlyViewed}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recentlyViewedProducts}
              keyExtractor={(item, index) => `recent-product-${item.id}-${index}`}
              renderItem={RenderRecentlyViewedProduct}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentlyViewedList}
            />
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_THEME_COLOR} />
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-off" size={scale(50)} color={SECONDARY_THEME_COLOR} />
            <Text style={styles.noResultsText}>No products found</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => `product-${item.id || Math.random().toString()}`}
            renderItem={RenderProductItem}
            numColumns={3} // Changed to 3 columns
            contentContainerStyle={styles.productsGrid}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.columnWrapper} // Added for even spacing
          />
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRODUCT_BG_COLOR,
  },
  header: {
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(20),
    margin: scale(20),
    padding: scale(15),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    // elevation: 5,
  },
  headerText: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: scale(15),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(20),
    paddingHorizontal: scale(15),
    marginBottom: scale(15),
    borderWidth: scale(1),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.15,
    shadowRadius: scale(6),
    // elevation: 3,
  },
  searchIcon: {
    marginRight: scale(10),
  },
  searchInput: {
    flex: 1,
    fontSize: scaleFont(16),
    color: TEXT_THEME_COLOR,
    paddingVertical: scale(12),
  },
  clearButton: {
    padding: scale(5),
  },
  recentSearchesContainer: {
    marginBottom: scale(15),
  },
  recentSearchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(10),
  },
  recentlyViewedContainer: {
    marginBottom: scale(15),
  },
  recentlyViewedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(10),
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
  },
  clearAllText: {
    fontSize: scaleFont(14),
    color: PRIMARY_THEME_COLOR,
    fontWeight: '600',
  },
  recentSearchesList: {
    paddingHorizontal: scale(5),
  },
  recentlyViewedList: {
    paddingHorizontal: scale(5),
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(12),
    padding: scale(10),
    marginRight: scale(10),
    borderWidth: scale(1),
    borderColor: BORDER_THEME_COLOR,
  },
  recentSearchText: {
    fontSize: scaleFont(14),
    color: TEXT_THEME_COLOR,
    marginRight: scale(10),
  },
  recentProductItem: {
    width: recentProductSize,
    marginRight: scale(10),
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(16),
    padding: scale(8),
    borderWidth: scale(1),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    // elevation: 2,
  },
  recentProductImg: {
    width: '100%',
    height: scale(90),
    position: 'relative',
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  recentProductImage: {
    width: '100%',
    height: '100%',
  },
  recentProductText: {
    fontSize: scaleFont(12),
    color: TEXT_THEME_COLOR,
    fontWeight: '600',
    marginVertical: scale(5),
    textAlign: 'center',
  },
  recentProductPrice: {
    fontSize: scaleFont(12),
    color: PRIMARY_THEME_COLOR,
    fontWeight: '700',
    textAlign: 'center',
  },
  productsGrid: {
    paddingBottom: scale(20),
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: scale(0),
  },
  itemBox: {
    width: itemSize,
    marginVertical: scale(5),
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(16),
    overflow: 'hidden',
    borderWidth: scale(1),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(6),
    // elevation: 3,
  },
  productImg: {
    width: '100%',
    height: scale(120),
    position: 'relative',
    borderTopLeftRadius: scale(16),
    borderTopRightRadius: scale(16),
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: scale(8),
    right: scale(8),
    backgroundColor: SECONDARY_THEME_COLOR,
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(10),
  },
  badgeText: {
    color: '#fff',
    fontSize: scaleFont(8),
    fontWeight: 'bold',
  },
  productInfo: {
    padding: scale(8),
    alignItems: 'center',
  },
  itemText: {
    fontSize: scaleFont(12),
    color: TEXT_THEME_COLOR,
    fontWeight: '600',
    marginBottom: scale(6),
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(6),
  },
  priceText: {
    fontSize: scaleFont(14),
    fontWeight: '700',
    color: PRIMARY_THEME_COLOR,
  },
  originalPriceText: {
    fontSize: scaleFont(10),
    color: SUBTEXT_THEME_COLOR,
    textDecorationLine: 'line-through',
    marginLeft: scale(6),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  viewButton: {
    backgroundColor: PRIMARY_THEME_COLOR,
    borderRadius: scale(16),
    paddingVertical: scale(6),
    paddingHorizontal: scale(12),
    alignSelf: 'center',
  },
  viewButtonText: {
    color: '#fff',
    fontSize: scaleFont(10),
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scale(50),
  },
  noResultsText: {
    fontSize: scaleFont(18),
    color: TEXT_THEME_COLOR,
    marginTop: scale(15),
    fontWeight: '500',
  },
});

export default Search;