import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FastImage from 'react-native-fast-image';
import Toast from 'react-native-toast-message';
import Trace from '../utils/Trace';
import {
  fetchUser,
  fetchUserProducts,
  fetchUserReels,
  submitProduct,
  clearMessages,
} from '../redux/slices/profileSlice';
import ProductModal from '../Products/ProductModal';
import img from '../assets/Images/img';

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375));
const numColumns = 3;
const itemSpacing = scale(10);
const itemSize = (width - (itemSpacing * (numColumns + 1))) / numColumns;

// Skeleton Loader Component
const SkeletonProductItem = () => {
  return (
    <View style={styles.skeletonItem}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonInfo}>
        <View style={styles.skeletonText} />
        <View style={[styles.skeletonText, { width: '60%' }]} />
      </View>
    </View>
  );
};

// Reusable Animated Item Component
const AnimatedItem = ({ children, onPress, index, onLongPress }) => {
  const scaleValue = useSharedValue(1);
  const opacityValue = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scaleValue.value, { damping: 10 }) }],
    opacity: opacityValue.value,
  }));

  useEffect(() => {
    opacityValue.value = withSpring(1, { delay: index * 100, easing: Easing.out(Easing.quad) });
  }, [opacityValue, index]);

  return (
    <Animated.View entering={FadeIn.delay(index * 50)} style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={() => {
          scaleValue.value = 0.95;
        }}
        onPressOut={() => {
          scaleValue.value = 1;
        }}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Render Media (Image or Video)
const renderMedia = (item) => {
  const mediaUrl = item?.media?.[0]?.url || 'https://via.placeholder.com/120';
  const isVideo = mediaUrl?.toLowerCase().endsWith('.mp4') || mediaUrl?.toLowerCase().endsWith('.mov');

  return (
    <View style={styles.mediaContainer}>
      <FastImage
        source={{ uri: mediaUrl }}
        style={styles.mediaImage}
        resizeMode="cover"
        defaultSource={{ uri: 'https://via.placeholder.com/120' }}
      />
      {isVideo && (
        <View style={styles.playIcon}>
          <MaterialCommunityIcons name="play" size={scale(24)} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
};

const SellerDashboard = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {
    user,
    userId,
    products = [],
    reels = [],
    loadingProducts,
    successMessage,
    errorMessage,
    refreshing,
  } = useSelector((state) => state.profile);

  const [activeTab, setActiveTab] = useState('products');
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  const headerOpacity = useSharedValue(0);
  const headerStyle = useAnimatedStyle(() => ({
    opacity: withSpring(headerOpacity.value, { damping: 15 }),
  }));

  useEffect(() => {
    headerOpacity.value = 1;
  }, [headerOpacity]);

  useEffect(() => {
    if (successMessage) {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: successMessage,
        position: 'top',
        topOffset: scale(20),
        visibilityTime: 3000,
        onHide: () => dispatch(clearMessages()),
      });
    }
    if (errorMessage) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
        position: 'top',
        topOffset: scale(20),
        visibilityTime: 3000,
        onHide: () => dispatch(clearMessages()),
      });
    }
  }, [successMessage, errorMessage, dispatch]);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchUser()).then((result) => {
        if (result.meta.requestStatus === 'fulfilled' && userId) {
          dispatch(fetchUserProducts(userId));
          dispatch(fetchUserReels(userId));
        }
      });
    }, [dispatch, userId])
  );

  const onRefresh = useCallback(() => {
    dispatch({ type: 'profile/setRefreshing', payload: true });
    Trace('Refreshing Seller Dashboard');
    Promise.all([
      dispatch(fetchUserProducts(userId)),
      dispatch(fetchUserReels(userId)),
    ]).finally(() => {
      dispatch({ type: 'profile/setRefreshing', payload: false });
    });
  }, [dispatch, userId]);

  const handleSubmitProduct = (productData) => {
    dispatch(submitProduct({ productData, currentProduct })).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        dispatch(fetchUserProducts(userId));
      }
    });
    setProductModalVisible(false);
  };

  const renderProductItem = ({ item, index }) => {
    const originalPrice = parseFloat(item?.originalPrice || item?.price || 0).toFixed(2);
    const discount = parseFloat(item?.discount || 0);
    const discountedPrice = (originalPrice - (originalPrice * discount) / 100).toFixed(2);

    return (
      <AnimatedItem
        index={index}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        onLongPress={() => {
          setCurrentProduct(item);
          setProductModalVisible(true);
        }}
      >
        <View style={styles.itemContainer}>
          {renderMedia(item)}
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.badgeText}>{discount}% OFF</Text>
            </View>
          )}
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.name || 'Unnamed Product'}
            </Text>
            {discount > 0 ? (
              <View style={styles.priceContainer}>
                <Text style={styles.discountedPrice}>₹{discountedPrice}</Text>
                <Text style={styles.originalPrice}>₹{originalPrice}</Text>
              </View>
            ) : (
              <Text style={styles.itemPrice}>₹{originalPrice}</Text>
            )}
          </View>
        </View>
      </AnimatedItem>
    );
  };

  const renderReelItem = ({ item, index }) => {
    return (
      <AnimatedItem
        index={index}
        onPress={() => {
          Trace('Reel Clicked', { reelId: item._id });
          navigation.navigate('ReelView', { reel: item });
        }}
      >
        <View style={styles.itemContainer}>
          {renderMedia(item)}
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.caption || 'No caption'}
            </Text>
          </View>
        </View>
      </AnimatedItem>
    );
  };

  const renderSkeletonLoader = () => {
    const skeletonItems = Array(6).fill({});
    return (
      <FlatList
        data={skeletonItems}
        renderItem={() => <SkeletonProductItem />}
        keyExtractor={(item, index) => `skeleton-${index}`}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.collectionsList}
      />
    );
  };

  const tabs = [
    { id: 'products', icon: 'shopping', label: 'Products' },
    { id: 'reels', icon: 'play-box', label: 'Reels' },
  ];

  return (
    <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.container}>
      <Animated.View style={[styles.header, headerStyle]}>
        <Text style={styles.headerTitle}>Your Seller Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <FastImage
            source={user?.profileImage ? { uri: user.profileImage } : img.user}
            style={styles.profileImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#A855F7']}
            tintColor="#A855F7"
          />
        }
      >
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="shopping" size={scale(24)} color="#A855F7" />
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="play-box" size={scale(24)} color="#A855F7" />
            <Text style={styles.statValue}>{reels.length}</Text>
            <Text style={styles.statLabel}>Reels</Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <View style={styles.tabBar}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                onPress={() => {
                  Trace(`${tab.label} Tab Clicked`);
                  setActiveTab(tab.id);
                }}
              >
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={scale(20)}
                  color={activeTab === tab.id ? '#A855F7' : '#B0B0D0'}
                />
                <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.contentSection}>
          {activeTab === 'products' ? (
            loadingProducts ? (
              renderSkeletonLoader()
            ) : products.length > 0 ? (
              <>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => {
                    Trace('Add Product Clicked');
                    setCurrentProduct(null);
                    setProductModalVisible(true);
                  }}
                >
                  <LinearGradient colors={['#A855F7', '#7B61FF']} style={styles.addButtonGradient}>
                    <MaterialCommunityIcons name="plus" size={scale(20)} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>Add Product</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <FlatList
                  data={products}
                  renderItem={renderProductItem}
                  keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                  numColumns={numColumns}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.collectionsList}
                />
              </>
            ) : (
              <View style={styles.emptyStateContainer}>
                <FastImage source={img.post} style={styles.emptyStateIcon} />
                <Text style={styles.emptyStateTitle}>Create your first product</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => {
                    Trace('Add Product Clicked');
                    setCurrentProduct(null);
                    setProductModalVisible(true);
                  }}
                >
                  <LinearGradient colors={['#A855F7', '#7B61FF']} style={styles.uploadButtonGradient}>
                    <Text style={styles.uploadButtonText}>Add Product</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )
          ) : (
            reels.length > 0 ? (
              <>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => navigation.navigate('UploadReel')}
                >
                  <LinearGradient colors={['#A855F7', '#7B61FF']} style={styles.addButtonGradient}>
                    <MaterialCommunityIcons name="plus" size={scale(20)} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>Add Reel</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <FlatList
                  data={reels}
                  renderItem={renderReelItem}
                  keyExtractor={(item) => item._id}
                  numColumns={numColumns}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.collectionsList}
                />
              </>
            ) : (
              <View style={styles.emptyStateContainer}>
                <FastImage source={img.camera} style={styles.emptyStateIcon} />
                <Text style={styles.emptyStateTitle}>Share your first reel</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => navigation.navigate('UploadReel')}
                >
                  <LinearGradient colors={['#A855F7', '#7B61FF']} style={styles.uploadButtonGradient}>
                    <Text style={styles.uploadButtonText}>Upload Reel</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )
          )}
        </View>
      </ScrollView>

      {productModalVisible && (
        <ProductModal
          visible={productModalVisible}
          onClose={() => setProductModalVisible(false)}
          onSubmit={handleSubmitProduct}
          product={currentProduct}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: scale(15),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileImage: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    borderWidth: 2,
    borderColor: '#A855F7',
  },
  scrollContent: {
    paddingBottom: scale(30),
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: scale(20),
  },
  statCard: {
    backgroundColor: 'rgba(42, 42, 90, 0.9)',
    padding: scale(15),
    borderRadius: scale(12),
    alignItems: 'center',
    width: scale(150),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(5) },
    shadowOpacity: 0.2,
    shadowRadius: scale(10),
  },
  statValue: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: '#A855F7',
    marginVertical: scale(5),
  },
  statLabel: {
    fontSize: scaleFont(14),
    color: '#B0B0D0',
  },
  tabsContainer: {
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
    backgroundColor: 'rgba(42, 42, 90, 0.9)',
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    elevation: 3,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: scale(25),
    padding: scale(5),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(10),
    borderRadius: scale(20),
  },
  activeTab: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  tabText: {
    fontSize: scaleFont(14),
    color: '#B0B0D0',
    marginLeft: scale(5),
    fontWeight: '500',
  },
  activeTabText: {
    color: '#A855F7',
    fontWeight: '600',
  },
  contentSection: {
    paddingBottom: scale(20),
  },
  addButton: {
    marginHorizontal: scale(20),
    marginVertical: scale(10),
    borderRadius: scale(8),
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFont(14),
    fontWeight: '600',
    marginLeft: scale(5),
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(40),
    paddingHorizontal: scale(20),
  },
  emptyStateIcon: {
    width: scale(80),
    height: scale(80),
    marginBottom: scale(20),
    tintColor: '#B0B0D0',
  },
  emptyStateTitle: {
    fontSize: scaleFont(16),
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: scale(20),
  },
  uploadButton: {
    borderRadius: scale(8),
    overflow: 'hidden',
  },
  uploadButtonGradient: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(30),
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  itemContainer: {
    width: itemSize,
    margin: scale(5),
    backgroundColor: 'rgba(42, 42, 74, 0.9)',
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
  mediaContainer: {
    width: '100%',
    height: itemSize * 1.2,
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: scale(12),
    borderTopRightRadius: scale(12),
  },
  playIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -scale(12) }, { translateY: -scale(12) }],
    backgroundColor: 'rgba(168, 85, 247, 0.8)',
    borderRadius: scale(20),
    padding: scale(8),
  },
  itemInfo: {
    padding: scale(10),
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: scaleFont(12),
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: scale(5),
    height: scale(20),
  },
  itemPrice: {
    fontSize: scaleFont(10),
    fontWeight: '700',
    color: '#A855F7',
  },
  discountedPrice: {
    fontSize: scaleFont(10),
    fontWeight: '700',
    color: '#A855F7',
    marginRight: scale(4),
  },
  originalPrice: {
    fontSize: scaleFont(8),
    fontWeight: '500',
    color: '#B0B0D0',
    textDecorationLine: 'line-through',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: scale(8),
    right: scale(8),
    backgroundColor: '#FF3E6D',
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  badgeText: {
    fontSize: scaleFont(10),
    color: '#000000',
    fontWeight: 'bold',
  },
  collectionsList: {
    paddingHorizontal: itemSpacing,
    paddingBottom: scale(10),
    alignItems: 'center',
  },
  skeletonItem: {
    width: itemSize,
    margin: scale(5),
    backgroundColor: 'rgba(42, 42, 74, 0.9)',
    borderRadius: scale(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 3,
  },
  skeletonImage: {
    width: '100%',
    height: itemSize * 1.2,
    backgroundColor: 'rgba(58, 58, 90, 0.5)',
    borderTopLeftRadius: scale(12),
    borderTopRightRadius: scale(12),
  },
  skeletonInfo: {
    padding: scale(10),
    alignItems: 'center',
  },
  skeletonText: {
    width: '80%',
    height: scale(14),
    backgroundColor: 'rgba(58, 58, 90, 0.5)',
    borderRadius: scale(4),
    marginVertical: scale(4),
  },
});

export default SellerDashboard;