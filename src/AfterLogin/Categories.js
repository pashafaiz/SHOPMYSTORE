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

// Import constants from GlobalConstants.js
import {
  CATEGORIES,
  NUM_COLUMNS,
  ITEM_SPACING,
  HEADER_TITLE,
  EMPTY_TEXT,
  DEFAULT_IMAGE_URL,
  FONT_SIZE_SMALL,
  FONT_SIZE_MEDIUM,
  FONT_SIZE_LARGE,
  FONT_SIZE_XLARGE,
  SCREEN_PADDING,
  CARD_BORDER_RADIUS,
  ICON_SIZE,
  ANIMATION_DURATION,
  ANIMATION_SCALE,
  ANIMATION_OPACITY,
  // Add these to GlobalConstants.js for consistency
  // PRODUCT_BG_COLOR,
  // CATEGORY_BG_COLOR,
  // SELECTED_CATEGORY_BG_COLOR,
  // PREMIUM_BADGE_COLOR,
  // PREMIUM_TEXT_COLOR,
  // PRIMARY_THEME_COLOR,
  // SECONDARY_THEME_COLOR,
  // TEXT_THEME_COLOR,
  // SUBTEXT_THEME_COLOR,
  // BORDER_THEME_COLOR,
  // BACKGROUND_GRADIENT,
} from '../constants/GlobalConstants';

// Define theme colors (move to GlobalConstants.js if possible)
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

const scaleSize = (size) => Math.round(size * (width / 375));
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 667) * 0.85);

const itemWidth = (width - (ITEM_SPACING * (NUM_COLUMNS + 1))) / NUM_COLUMNS;

const AnimatedItem = ({ children, onPress, onPressIn, onPressOut, index, isCategory = false }) => {
  const scaleValue = useSharedValue(ANIMATION_SCALE);
  const opacityValue = useSharedValue(ANIMATION_OPACITY);

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
      // entering={FadeIn.delay(index * ANIMATION_DURATION)}
      style={animatedStyle}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={() => {
          scaleValue.value = isCategory ? 1.1 : ANIMATION_SCALE;
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
            <Icon name="play-circle-filled" size={scaleSize(ICON_SIZE)} color={PRIMARY_THEME_COLOR} />
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
              size={scaleSize(ICON_SIZE)}
              color={isSelected ? TEXT_THEME_COLOR : PRIMARY_THEME_COLOR}
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
      colors={BACKGROUND_GRADIENT}
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
            colors={[PRIMARY_THEME_COLOR]}
            tintColor={PRIMARY_THEME_COLOR}
            progressBackgroundColor={PRODUCT_BG_COLOR}
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
    paddingTop: scaleSize(SCREEN_PADDING),
  },
  header: {
    paddingHorizontal: scaleSize(SCREEN_PADDING),
    marginBottom: scaleSize(10),
  },
  headerTitle: {
    fontSize: scaleFont(FONT_SIZE_XLARGE + 4),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
    letterSpacing: 0.5,
  },
  categoriesContainer: {
    height: scaleSize(80),
    marginBottom: scaleSize(15),
  },
  categoriesList: {
    paddingHorizontal: scaleSize(SCREEN_PADDING),
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: scaleSize(15),
    paddingVertical: scaleSize(5),
  },
  selectedCategoryItem: {
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY_THEME_COLOR,
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
    fontSize: scaleFont(FONT_SIZE_MEDIUM + 2),
    color: SUBTEXT_THEME_COLOR,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedCategoryName: {
    color: PRIMARY_THEME_COLOR,
    fontWeight: '600',
  },
  productList: {
    paddingHorizontal: ITEM_SPACING,
    paddingBottom: scaleSize(70),
  },
  productItem: {
    width: itemWidth * 0.98,
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scaleSize(CARD_BORDER_RADIUS),
    margin: ITEM_SPACING / 2,
    padding: scaleSize(10),
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
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
    backgroundColor: SUBTEXT_THEME_COLOR,
    borderRadius: scaleSize(CARD_BORDER_RADIUS),
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: scaleSize(CARD_BORDER_RADIUS),
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
    fontSize: scaleFont(FONT_SIZE_LARGE + 2),
    color: TEXT_THEME_COLOR,
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
    fontSize: scaleFont(FONT_SIZE_MEDIUM + 2),
    fontWeight: '700',
    color: PRIMARY_THEME_COLOR,
  },
  discountedPrice: {
    fontSize: scaleFont(FONT_SIZE_MEDIUM + 2),
    fontWeight: '700',
    color: PRIMARY_THEME_COLOR,
    marginRight: scaleSize(4),
  },
  originalPrice: {
    fontSize: scaleFont(FONT_SIZE_SMALL + 2),
    fontWeight: '500',
    color: SUBTEXT_THEME_COLOR,
    textDecorationLine: 'line-through',
    marginRight: scaleSize(4),
  },
  discountBadge: {
    position: 'absolute',
    top: scaleSize(8),
    right: scaleSize(8),
    backgroundColor: SECONDARY_THEME_COLOR,
    borderRadius: scaleSize(4),
    paddingHorizontal: scaleSize(6),
    paddingVertical: scaleSize(2),
    zIndex: 1,
  },
  discountText: {
    fontSize: scaleFont(FONT_SIZE_SMALL),
    color: TEXT_THEME_COLOR,
    fontWeight: 'bold',
  },
  premiumBadge: {
    position: 'absolute',
    top: scaleSize(8),
    left: scaleSize(8),
    backgroundColor: PREMIUM_BADGE_COLOR,
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleSize(3),
    borderRadius: scaleSize(12),
    zIndex: 1,
  },
  premiumBadgeText: {
    fontSize: scaleFont(FONT_SIZE_SMALL),
    color: PREMIUM_TEXT_COLOR,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: height * 0.4,
    paddingHorizontal: scaleSize(SCREEN_PADDING),
  },
  emptyText: {
    fontSize: scaleFont(FONT_SIZE_XLARGE + 2),
    color: SUBTEXT_THEME_COLOR,
    textAlign: 'center',
  },
});

export default Categories;