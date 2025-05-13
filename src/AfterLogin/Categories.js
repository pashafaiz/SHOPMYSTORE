import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Video from 'react-native-video';
import {
  fetchAllProducts,
  fetchProductsByCategory,
  setSelectedCategory,
  setRefreshing,
} from '../redux/slices/categoriesSlice';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';

// Default constants
const DEFAULT_CONSTANTS = {
  CATEGORIES: [],
  NUM_COLUMNS: 2,
  ITEM_SPACING: 10,
  HEADER_TITLE: 'Categories',
  EMPTY_TEXT: 'No products found',
  PRIMARY_COLOR: '#7B61FF',
  TEXT_COLOR: '#FFFFFF',
  SECONDARY_TEXT_COLOR: '#A0A0A0',
  BACKGROUND_COLORS: ['#0A0A1E', '#1E1E3F'],
  CATEGORY_BG_COLOR: 'rgba(123, 97, 255, 0.1)',
  SELECTED_CATEGORY_BG_COLOR: '#7B61FF',
  PRODUCT_BG_COLOR: 'rgba(255, 255, 255, 0.05)',
  BORDER_COLOR: 'rgba(255, 255, 255, 0.1)',
  IMAGE_BG_COLOR: 'rgba(255, 255, 255, 0.1)',
  ANIMATION_DELAY: 100,
  BASE_WIDTH: 375,
  BASE_HEIGHT: 667,
  DEFAULT_IMAGE_URL: 'https://via.placeholder.com/150',
  DISCOUNT_COLOR: '#FF3E6D',
  PREMIUM_COLOR: '#FFD700',
};

// Safely get constants
const {
  CATEGORIES = DEFAULT_CONSTANTS.CATEGORIES,
  NUM_COLUMNS = DEFAULT_CONSTANTS.NUM_COLUMNS,
  ITEM_SPACING = DEFAULT_CONSTANTS.ITEM_SPACING,
  HEADER_TITLE = DEFAULT_CONSTANTS.HEADER_TITLE,
  EMPTY_TEXT = DEFAULT_CONSTANTS.EMPTY_TEXT,
  PRIMARY_COLOR = DEFAULT_CONSTANTS.PRIMARY_COLOR,
  TEXT_COLOR = DEFAULT_CONSTANTS.TEXT_COLOR,
  SECONDARY_TEXT_COLOR = DEFAULT_CONSTANTS.SECONDARY_TEXT_COLOR,
  BACKGROUND_COLORS = DEFAULT_CONSTANTS.BACKGROUND_COLORS,
  CATEGORY_BG_COLOR = DEFAULT_CONSTANTS.CATEGORY_BG_COLOR,
  SELECTED_CATEGORY_BG_COLOR = DEFAULT_CONSTANTS.SELECTED_CATEGORY_BG_COLOR,
  PRODUCT_BG_COLOR = DEFAULT_CONSTANTS.PRODUCT_BG_COLOR,
  BORDER_COLOR = DEFAULT_CONSTANTS.BORDER_COLOR,
  IMAGE_BG_COLOR = DEFAULT_CONSTANTS.IMAGE_BG_COLOR,
  ANIMATION_DELAY = DEFAULT_CONSTANTS.ANIMATION_DELAY,
  BASE_WIDTH = DEFAULT_CONSTANTS.BASE_WIDTH,
  BASE_HEIGHT = DEFAULT_CONSTANTS.BASE_HEIGHT,
  DEFAULT_IMAGE_URL = DEFAULT_CONSTANTS.DEFAULT_IMAGE_URL,
  DISCOUNT_COLOR = DEFAULT_CONSTANTS.DISCOUNT_COLOR,
  PREMIUM_COLOR = DEFAULT_CONSTANTS.PREMIUM_COLOR,
} = require('../constants/GlobalConstants') || DEFAULT_CONSTANTS;

const { width, height } = Dimensions.get('window');

// Enhanced scaling functions
const scaleSize = (size) => Math.round(size * (width / BASE_WIDTH));
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / BASE_HEIGHT));

const itemWidth = (width - (ITEM_SPACING * (NUM_COLUMNS + 1))) / NUM_COLUMNS;

const AnimatedItem = ({ children, onPress, onPressIn, onPressOut, index, isCategory = false }) => {
  const scaleValue = useSharedValue(0.95);
  const opacityValue = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scaleValue.value) }],
    opacity: opacityValue.value,
  }));

  useEffect(() => {
    scaleValue.value = 1;
    opacityValue.value = 1;
  }, [scaleValue, opacityValue]);

  return (
    <Animated.View
      entering={FadeIn.delay(index * ANIMATION_DELAY)}
      style={animatedStyle}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={() => {
          scaleValue.value = isCategory ? 1.1 : 0.95;
          if (onPressIn) onPressIn();
        }}
        onPressOut={() => {
          scaleValue.value = 1;
          if (onPressOut) onPressOut();
        }}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const Categories = ({ onScroll }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute();
  const { products = [], selectedCategory = 'all', loading = false, refreshing = false } = useSelector((state) => state.categories);

  // Log the fromDrawer prop
  useEffect(() => {
    const fromDrawer = route.params?.fromDrawer || false;
    console.log('Categories screen - fromDrawer:', fromDrawer);
  }, [route.params]);

  const safeBackgroundColors = Array.isArray(BACKGROUND_COLORS) && BACKGROUND_COLORS.length >= 2 
    ? BACKGROUND_COLORS 
    : DEFAULT_CONSTANTS.BACKGROUND_COLORS;

  const fetchProducts = () => {
    if (selectedCategory === 'all') {
      dispatch(fetchAllProducts());
    } else {
      dispatch(fetchProductsByCategory(selectedCategory));
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const onRefresh = () => {
    dispatch(setRefreshing(true));
    fetchProducts();
  };

  const renderMedia = (item) => {
    const mediaUrl = item?.media?.[0]?.url || DEFAULT_IMAGE_URL;
    const isVideo = mediaUrl?.endsWith('.mp4') || mediaUrl?.endsWith('.mov');

    if (isVideo) {
      return (
        <View style={styles.mediaContainer}>
          <Video
            source={{ uri: mediaUrl }}
            style={styles.productImage}
            resizeMode="cover"
            paused={true}
            posterResizeMode="cover"
            repeat={false}
          />
          <View style={styles.videoIcon}>
            <Icon name="play-circle-filled" size={scaleSize(24)} color="rgba(255,255,255,0.8)" />
          </View>
        </View>
      );
    }
    return (
      <Image
        source={{ uri: mediaUrl }}
        style={styles.productImage}
        resizeMode="contain"
        defaultSource={{ uri: DEFAULT_IMAGE_URL }}
      />
    );
  };

  const renderProductItem = ({ item = {}, index }) => {
    const productId = item?.id || item?._id || index.toString();
    const productName = item?.name || 'Unnamed Product';
    const originalPrice = item?.price || 0;
    const discount = item?.discount || 0;
    const discountedPrice = originalPrice - (originalPrice * discount / 100);
    const isPremium = item?.premium || false;

    return (
      <AnimatedItem
        index={index}
        onPress={() =>
          navigation.navigate('ProductDetail', {
            productId,
            product: item
          })
        }
      >
        <View style={styles.productItem}>
          <View style={styles.imageContainer}>
            {renderMedia(item)}
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </View>
            )}
            {discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discount}% OFF</Text>
              </View>
            )}
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {productName}
            </Text>
            <View style={styles.priceContainer}>
              {discount > 0 ? (
                <>
                  <Text style={styles.discountedPrice}>₹{discountedPrice.toFixed(2)}</Text>
                  <Text style={styles.originalPrice}>₹{originalPrice.toFixed(2)}</Text>
                </>
              ) : (
                <Text style={styles.productPrice}>₹{originalPrice.toFixed(2)}</Text>
              )}
            </View>
          </View>
        </View>
      </AnimatedItem>
    );
  };

  const renderCategory = ({ item = {}, index }) => {
    const categoryId = item?.id || index.toString();
    const categoryName = item?.name || 'Category';
    const iconName = item?.icon || 'category';
    const isSelected = selectedCategory === categoryId;

    return (
      <AnimatedItem
        index={index}
        isCategory={true}
        onPress={() => dispatch(setSelectedCategory(categoryId))}
      >
        <View
          style={[
            styles.categoryItem,
            isSelected && styles.selectedCategoryItem,
          ]}
        >
          <View
            style={[
              styles.categoryIconContainer,
              isSelected && styles.selectedCategoryIconContainer,
            ]}
          >
            <Icon
              name={iconName}
              size={scaleSize(20)}
              color={isSelected ? TEXT_COLOR : PRIMARY_COLOR}
            />
          </View>
          <Text
            style={[
              styles.categoryName,
              isSelected && styles.selectedCategoryName,
            ]}
            numberOfLines={1}
          >
            {categoryName}
          </Text>
        </View>
      </AnimatedItem>
    );
  };

  return (
    <LinearGradient
      colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{HEADER_TITLE}</Text>
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={CATEGORIES}
          renderItem={renderCategory}
          keyExtractor={(item, index) => item?.id || index.toString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item, index) => item?._id || index.toString()}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.productList}
        refreshControl={
          <RefreshControl
            refreshing={loading || refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY_COLOR]}
            tintColor={PRIMARY_COLOR}
            progressBackgroundColor={safeBackgroundColors[1] || PRIMARY_COLOR}
            progressViewOffset={50}
          />
        }
        ListEmptyComponent={
          !loading && !refreshing && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{EMPTY_TEXT}</Text>
            </View>
          )
        }
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: scaleSize(20),
  },
  header: {
    paddingHorizontal: scaleSize(20),
    marginBottom: scaleSize(10),
  },
  headerTitle: {
    fontSize: scaleFont(22),
    fontWeight: '700',
    color: TEXT_COLOR,
    letterSpacing: 0.5,
  },
  categoriesContainer: {
    height: scaleSize(80),
    marginBottom: scaleSize(15),
  },
  categoriesList: {
    paddingHorizontal: scaleSize(15),
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: scaleSize(15),
    paddingVertical: scaleSize(5),
  },
  selectedCategoryItem: {
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY_COLOR,
  },
  categoryIconContainer: {
    backgroundColor: CATEGORY_BG_COLOR,
    width: scaleSize(50),
    height: scaleSize(50),
    borderRadius: scaleSize(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSize(5),
  },
  selectedCategoryIconContainer: {
    backgroundColor: SELECTED_CATEGORY_BG_COLOR,
  },
  categoryName: {
    fontSize: scaleFont(14),
    color: SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedCategoryName: {
    color: PRIMARY_COLOR,
    fontWeight: '600',
  },
  productList: {
    paddingHorizontal: ITEM_SPACING,
    paddingBottom: scaleSize(70),
  },
  productItem: {
    width: itemWidth * 0.98,
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scaleSize(10),
    margin: ITEM_SPACING / 2,
    padding: scaleSize(10),
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  mediaContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  imageContainer: {
    width: '100%',
    height: scaleSize(120),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSize(4),
    backgroundColor: IMAGE_BG_COLOR,
    borderRadius: scaleSize(8),
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: scaleSize(8),
  },
  videoIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  productInfo: {
    width: '100%',
    alignItems: 'center',
    paddingTop: scaleSize(4),
  },
  productName: {
    fontSize: scaleFont(17),
    color: TEXT_COLOR,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: scaleSize(2),
    height: scaleSize(25),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleSize(2),
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  productPrice: {
    fontSize: scaleFont(14),
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },
  discountedPrice: {
    fontSize: scaleFont(14),
    fontWeight: '700',
    color: PRIMARY_COLOR,
    marginRight: scaleSize(4),
  },
  originalPrice: {
    fontSize: scaleFont(12),
    fontWeight: '500',
    color: SECONDARY_TEXT_COLOR,
    textDecorationLine: 'line-through',
    marginRight: scaleSize(4),
  },
  discountBadge: {
    position: 'absolute',
    top: scaleSize(8),
    right: scaleSize(8),
    backgroundColor: DISCOUNT_COLOR,
    borderRadius: scaleSize(4),
    paddingHorizontal: scaleSize(6),
    paddingVertical: scaleSize(2),
    zIndex: 1,
  },
  discountText: {
    fontSize: scaleFont(10),
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  premiumBadge: {
    position: 'absolute',
    top: scaleSize(8),
    left: scaleSize(8),
    backgroundColor: PREMIUM_COLOR,
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleSize(3),
    borderRadius: scaleSize(12),
    zIndex: 1,
  },
  premiumBadgeText: {
    fontSize: scaleFont(10),
    color: '#000000',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: height * 0.4,
    paddingHorizontal: scaleSize(20),
  },
  emptyText: {
    fontSize: scaleFont(18),
    color: SECONDARY_TEXT_COLOR,
    textAlign: 'center',
  },
});

export default Categories;