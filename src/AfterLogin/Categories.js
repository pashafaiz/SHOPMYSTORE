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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
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
import {
  CATEGORIES,
  NUM_COLUMNS,
  ITEM_SPACING,
  HEADER_TITLE,
  EMPTY_TEXT,
  PRIMARY_COLOR,
  TEXT_COLOR,
  SECONDARY_TEXT_COLOR,
  BACKGROUND_COLORS,
  CATEGORY_BG_COLOR,
  SELECTED_CATEGORY_BG_COLOR,
  PRODUCT_BG_COLOR,
  BORDER_COLOR,
  IMAGE_BG_COLOR,
  ANIMATION_DELAY,
  BASE_WIDTH,
  BASE_HEIGHT,
  DEFAULT_IMAGE_URL,
} from '../constants/GlobalConstants';

const { width, height } = Dimensions.get('window');

// Responsive scaling functions
const scaleSize = (size) => Math.round(size * (width / BASE_WIDTH));
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / BASE_HEIGHT));

const itemWidth = (width - (ITEM_SPACING * (NUM_COLUMNS + 1))) / NUM_COLUMNS;

// Reusable Animated Item Component
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
  const { products, selectedCategory, loading, refreshing } = useSelector((state) => state.categories);

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

  const renderProductItem = ({ item, index }) => {
    return (
      <AnimatedItem
        index={index}
        onPress={() =>
          navigation.navigate('ProductDetail', {
            productId: item.id || item._id,
          })
        }
      >
        <View style={styles.productItem}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: item.media[0]?.url || DEFAULT_IMAGE_URL,
              }}
              style={styles.productImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.productPrice}>₹{item.price}</Text>
          </View>
        </View>
      </AnimatedItem>
    );
  };

  const renderCategory = ({ item, index }) => {
    return (
      <AnimatedItem
        index={index}
        isCategory={true}
        onPress={() => dispatch(setSelectedCategory(item.id))}
      >
        <View
          style={[
            styles.categoryItem,
            selectedCategory === item.id && styles.selectedCategoryItem,
          ]}
        >
          <View
            style={[
              styles.categoryIconContainer,
              selectedCategory === item.id && styles.selectedCategoryIconContainer,
            ]}
          >
            {item.icon ? (
              <Icon
                name={item.icon}
                size={scaleSize(18)}
                color={selectedCategory === item.id ? TEXT_COLOR : PRIMARY_COLOR}
              />
            ) : (
              <MaterialCommunityIcons
                name={item.icon1}
                size={scaleSize(18)}
                color={selectedCategory === item.id ? TEXT_COLOR : PRIMARY_COLOR}
              />
            )}
          </View>
          <Text
            style={[
              styles.categoryName,
              selectedCategory === item.id && styles.selectedCategoryName,
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
        </View>
      </AnimatedItem>
    );
  };

  return (
    <LinearGradient
      colors={BACKGROUND_COLORS}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{HEADER_TITLE}</Text>
      </View>

      {/* Categories Horizontal Scroll */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={CATEGORIES}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item._id}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.productList}
        refreshControl={
          <RefreshControl
            refreshing={loading || refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY_COLOR]}
            tintColor={PRIMARY_COLOR}
            progressBackgroundColor={BACKGROUND_COLORS[1]}
            progressViewOffset={50}
          >
            {loading && (
              <ActivityIndicator
                size="large"
                color={PRIMARY_COLOR}
                style={styles.loader}
              />
            )}
          </RefreshControl>
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
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: TEXT_COLOR,
    letterSpacing: 0.5,
  },
  categoriesContainer: {
    height: scaleSize(70),
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
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: scaleSize(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSize(5),
  },
  selectedCategoryIconContainer: {
    backgroundColor: SELECTED_CATEGORY_BG_COLOR,
  },
  categoryName: {
    fontSize: scaleFont(10),
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
  imageContainer: {
    width: '100%',
    height: scaleSize(90),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSize(8),
    backgroundColor: IMAGE_BG_COLOR,
    borderRadius: scaleSize(8),
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: scaleSize(8),
  },
  productInfo: {
    width: '100%',
    alignItems: 'center',
  },
  productName: {
    fontSize: scaleFont(12),
    color: TEXT_COLOR,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: scaleSize(4),
    height: scaleSize(32),
  },
  productPrice: {
    fontSize: scaleFont(14),
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: height * 0.4,
    paddingHorizontal: scaleSize(20),
  },
  emptyText: {
    fontSize: scaleFont(16),
    color: SECONDARY_TEXT_COLOR,
    textAlign: 'center',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
});

export default Categories;