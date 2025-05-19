import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FastImage from 'react-native-fast-image';
import Trace from '../utils/Trace';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProducts,
  addRecentlyViewedProduct,
  setSelectedPrice,
  setSelectedSort,
  setSelectedRating,
  setSelectedDiscount,
  setSelectedBrand,
  clearFilters,
} from '../redux/slices/dashboardSlice';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../Components/Header';
import Toast from 'react-native-toast-message';
import Filterbar from '../Components/Filterbar';
import {
  PRICE_RANGES,
  SORT_OPTIONS,
  RATING_OPTIONS,
  DISCOUNT_OPTIONS,
  BRAND_OPTIONS,
} from '../constants/GlobalConstants';

// Theme colors
const PRODUCT_BG_COLOR = '#f5f9ff';
const PRIMARY_THEME_COLOR = '#5b9cff';
const SECONDARY_THEME_COLOR = '#ff6b8a';
const TEXT_THEME_COLOR = '#1a2b4a';
const SUBTEXT_THEME_COLOR = '#5a6b8a';
const BORDER_THEME_COLOR = 'rgba(91, 156, 255, 0.3)';
const BACKGROUND_GRADIENT = ['#8ec5fc', '#fff'];

const { width } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, Dimensions.get('window').height) / 375));
const numColumns = 2;
const itemSize = width / numColumns - scale(16); // Reduced margin for compactness

const CategoryProducts = () => {
  const dispatch = useDispatch();
  const {
    products,
    brands,
    loading,
    refreshing,
    error,
    selectedPrice,
    selectedSort,
    selectedRating,
    selectedDiscount,
    selectedBrand,
  } = useSelector((state) => state.dashboard);
  const navigation = useNavigation();
  const route = useRoute();
  const { category } = route.params;

  useEffect(() => {
    if (!products.length) {
      Trace('Fetching Products for Category Screen');
      dispatch(fetchProducts());
    }
  }, [dispatch]);

  const onRefresh = async () => {
    Trace('Refreshing Category Products');
    dispatch(fetchProducts());
  };

  // Filter products with error handling
  let filteredProducts = products.filter((product) => product.category === category);

  try {
    if (selectedPrice) {
      switch (selectedPrice) {
        case PRICE_RANGES.UNDER_500:
          filteredProducts = filteredProducts.filter((product) => product.price < 500);
          break;
        case PRICE_RANGES.RANGE_500_1000:
          filteredProducts = filteredProducts.filter((product) => product.price >= 500 && product.price <= 1000);
          break;
        case PRICE_RANGES.RANGE_1000_2000:
          filteredProducts = filteredProducts.filter((product) => product.price > 1000 && product.price <= 2000);
          break;
        case PRICE_RANGES.OVER_2000:
          filteredProducts = filteredProducts.filter((product) => product.price > 2000);
          break;
        default:
          break;
      }
    }

    if (selectedRating) {
      const ratingValue = parseInt(selectedRating, 10);
      if (!isNaN(ratingValue)) {
        filteredProducts = filteredProducts.filter((product) => Math.round(product.rating || 0) >= ratingValue);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Invalid Rating Filter',
          position: 'top',
          topOffset: 20,
        });
      }
    }

    if (selectedDiscount) {
      const discountValue = parseInt(selectedDiscount, 10);
      if (!isNaN(discountValue)) {
        filteredProducts = filteredProducts.filter((product) => (product.discount || 0) >= discountValue);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Invalid Discount Filter',
          position: 'top',
          topOffset: 20,
        });
      }
    }

    if (selectedBrand) {
      filteredProducts = filteredProducts.filter((product) => product.brand === selectedBrand);
    }

    if (selectedSort) {
      switch (selectedSort) {
        case SORT_OPTIONS.NEWEST:
          filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case SORT_OPTIONS.PRICE_LOW_HIGH:
          filteredProducts.sort((a, b) => a.price - b.price);
          break;
        case SORT_OPTIONS.PRICE_HIGH_LOW:
          filteredProducts.sort((a, b) => b.price - a.price);
          break;
        case SORT_OPTIONS.POPULAR:
          filteredProducts.sort((a, b) => (b.views || 0) - (a.views || 0));
          break;
        default:
          break;
      }
    }
  } catch (err) {
    Trace('Filter error:', err);
    Toast.show({
      type: 'error',
      text1: 'Filter Error',
      text2: 'Failed to apply filters. Please try again.',
      position: 'top',
      topOffset: 20,
    });
  }

  const handleClearFilters = () => {
    Trace('Clearing All Filters');
    dispatch(clearFilters());
  };

  const RenderProductList = ({ item, index }) => {
    const mediaUrl = item.media || 'https://via.placeholder.com/120';
    const hasDiscount = item.discount > 0;
    const originalPrice = item.price || 0;
    const discountPercentage = item.discount || 0;
    const discountedPrice = hasDiscount
      ? Math.round(originalPrice * (1 - discountPercentage / 100))
      : originalPrice;

    const scaleAnim = new Animated.Value(1);

    const onPressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        friction: 6,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={[
          styles.itemBox,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => {
            Trace('Product Clicked', { productId: item.id });
            dispatch(addRecentlyViewedProduct(item));
            navigation.navigate('ProductDetail', {
              productId: item.id,
              product: item,
            });
          }}
          disabled={loading}
        >
          <View style={styles.product_Img}>
            <FastImage
              source={{ uri: mediaUrl }}
              style={styles.productImage}
              resizeMode={FastImage.resizeMode.cover}
              defaultSource={{ uri: 'https://via.placeholder.com/120' }}
            />
            {hasDiscount && (
              <LinearGradient
                colors={[SECONDARY_THEME_COLOR, '#ff8aa0']}
                style={styles.discountBadge}
              >
                <Text style={styles.badgeText}>{discountPercentage}% OFF</Text>
              </LinearGradient>
            )}
          </View>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(142, 197, 252, 0.2)']}
            style={styles.productInfo}
          >
            <Text style={styles.itemText} numberOfLines={1} ellipsizeMode="tail">
              {item.name || 'Unnamed Product'}
            </Text>
            <Text style={styles.brandText} numberOfLines={1} ellipsizeMode="tail">
              {item.brand || 'Unknown Brand'}
            </Text>
            <View style={styles.priceContainer}>
              <Text style={styles.discountedPriceText}>₹{discountedPrice || 'N/A'}</Text>
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
              <Text style={styles.ratingText}>({item.rating?.toFixed(1) || '0.0'})</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const handleHeaderIconPress = (iconName) => {
    if (iconName === 'back') {
      Trace('Navigating Back');
      navigation.goBack();
    }
  };

  const isFilterActive = selectedPrice || selectedSort || selectedRating || selectedDiscount || selectedBrand;

  return (
    <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.container}>
      <View style={styles.headerContainer}>
        <Header
          showLeftIcon={true}
          isSearch={true}
          onSearchPress={() => navigation.navigate('Search')}
          leftIcon="arrow-back"
          onLeftPress={() => handleHeaderIconPress('back')}
        />
      </View>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={onRefresh}
            colors={[PRIMARY_THEME_COLOR]}
            tintColor={PRIMARY_THEME_COLOR}
            progressViewOffset={scale(50)}
          />
        }
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>{category}</Text>
          <Text style={styles.introSubtitle}>Discover curated products for you</Text>
        </View>
        <View style={styles.filterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
          >
            <Filterbar
              title="Price"
              options={[
                { value: PRICE_RANGES.UNDER_500, label: 'Under ₹500' },
                { value: PRICE_RANGES.RANGE_500_1000, label: '₹500 - ₹1000' },
                { value: PRICE_RANGES.RANGE_1000_2000, label: '₹1000 - ₹2000' },
                { value: PRICE_RANGES.OVER_2000, label: 'Over ₹2000' },
              ]}
              selectedOption={selectedPrice}
              onOptionSelect={(value) => dispatch(setSelectedPrice(value))}
              clearOption={() => dispatch(setSelectedPrice(''))}
            />
            <Filterbar
              title="Sort"
              options={[
                { value: SORT_OPTIONS?.NEWEST, label: 'Newest' },
                { value: SORT_OPTIONS?.PRICE_LOW_HIGH, label: 'Price: Low to High' },
                { value: SORT_OPTIONS?.PRICE_HIGH_LOW, label: 'Price: High to Low' },
                { value: SORT_OPTIONS?.POPULAR, label: 'Popular' },
              ]}
              selectedOption={selectedSort}
              onOptionSelect={(value) => dispatch(setSelectedSort(value))}
              clearOption={() => dispatch(setSelectedSort(''))}
            />
            <Filterbar
              title="Rating"
              options={[
                { value: RATING_OPTIONS.FOUR_PLUS, label: '4+ Stars' },
                { value: RATING_OPTIONS.THREE_PLUS, label: '3+ Stars' },
                { value: RATING_OPTIONS.TWO_PLUS, label: '2+ Stars' },
              ]}
              selectedOption={selectedRating}
              onOptionSelect={(value) => dispatch(setSelectedRating(value))}
              clearOption={() => dispatch(setSelectedRating(''))}
            />
            <Filterbar
              title="Discount"
              options={[
                { value: DISCOUNT_OPTIONS.TEN_PLUS, label: '10%+ Off' },
                { value: DISCOUNT_OPTIONS.TWENTY_PLUS, label: '20%+ Off' },
                { value: DISCOUNT_OPTIONS.THIRTY_PLUS, label: '30%+ Off' },
              ]}
              selectedOption={selectedDiscount}
              onOptionSelect={(value) => dispatch(setSelectedDiscount(value))}
              clearOption={() => dispatch(setSelectedDiscount(''))}
            />
            <Filterbar
              title="Brand"
              options={
                brands?.length > 0
                  ? brands.map((brand) => ({ value: brand, label: brand }))
                  : BRAND_OPTIONS.map((brand) => ({ value: brand, label: brand }))
              }
              selectedOption={selectedBrand}
              onOptionSelect={(value) => dispatch(setSelectedBrand(value))}
              clearOption={() => dispatch(setSelectedBrand(''))}
            />
          </ScrollView>
          {isFilterActive && (
            <TouchableOpacity style={styles.clearFilterButton} onPress={handleClearFilters}>
              <Icon name="filter-alt-off" size={scale(20)} color={SECONDARY_THEME_COLOR} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.productsGrid}>
          {filteredProducts?.length === 0 ? (
            <View style={styles.noProductsContainer}>
              <Icon name="error-outline" size={scale(50)} color={SUBTEXT_THEME_COLOR} />
              <Text style={styles.noProductsText}>No Products Found</Text>
            </View>
          ) : (
            filteredProducts?.map((item, index) => (
              <RenderProductList key={item.id} item={item} index={index} />
            ))
          )}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: PRODUCT_BG_COLOR,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scrollContainer: {
    paddingTop: scale(50),
    paddingBottom: scale(16), // Reduced for compactness
  },
  introContainer: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(12),
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: BORDER_THEME_COLOR,
    marginBottom: scale(12),
  },
  introTitle: {
    fontSize: scaleFont(22),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
    marginBottom: scale(4),
  },
  introSubtitle: {
    fontSize: scaleFont(13),
    fontWeight: '400',
    color: SUBTEXT_THEME_COLOR,
  },
  filterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: scale(8),
    marginBottom: scale(12),
    borderRadius: scale(12),
  },
  filterContainer: {
    flexGrow: 1,
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: scale(8),
  },
  clearFilterButton: {
    padding: scale(6),
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginLeft: scale(8),
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: scale(8),
  },
  itemBox: {
    width: itemSize,
    marginBottom: scale(12),
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(10),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  product_Img: {
    width: '100%',
    height: scale(120), // Reduced for compactness
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: scale(10),
    borderTopRightRadius: scale(10),
  },
  discountBadge: {
    position: 'absolute',
    top: scale(8),
    right: scale(8),
    paddingHorizontal: scale(6),
    paddingVertical: scale(3),
    borderRadius: scale(10),
  },
  badgeText: {
    color: '#fff',
    fontSize: scaleFont(9),
    fontWeight: '600',
  },
  productInfo: {
    padding: scale(10),
    paddingVertical:20,
  },
  itemText: {
    fontSize: scaleFont(13),
    color: TEXT_THEME_COLOR,
    fontWeight: '600',
    marginBottom: scale(2),
  },
  brandText: {
    fontSize: scaleFont(11),
    color: SUBTEXT_THEME_COLOR,
    fontWeight: '400',
    marginBottom: scale(4),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  discountedPriceText: {
    fontSize: scaleFont(13),
    fontWeight: '700',
    color: PRIMARY_THEME_COLOR,
    marginRight: scale(6),
  },
  originalPriceText: {
    fontSize: scaleFont(11),
    color: SUBTEXT_THEME_COLOR,
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: scaleFont(11),
    color: SUBTEXT_THEME_COLOR,
    marginLeft: scale(4),
  },
  noProductsContainer: {
    alignItems: 'center',
    paddingVertical: scale(40),
    width: '100%',
  },
  noProductsText: {
    fontSize: scaleFont(15),
    color: SUBTEXT_THEME_COLOR,
    marginTop: scale(8),
    fontWeight: '500',
  },
  bottomSpacer: {
    height: scale(20),
  },
});

export default CategoryProducts;