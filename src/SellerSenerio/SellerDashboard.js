import React, { useState, useEffect, useCallback } from 'react';
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
  deleteProduct,
  clearMessages,
} from '../redux/slices/profileSlice';
import CustomModal from '../Components/CustomModal';
import img from '../assets/Images/img';
import {
  PRODUCT_BG_COLOR,
  CATEGORY_BG_COLOR,
  SELECTED_CATEGORY_BG_COLOR,
  PRIMARY_COLOR,
  SECONDARY_COLOR,
  TEXT_COLOR,
  SUBTEXT_COLOR,
  BORDER_COLOR,
  BACKGROUND_GRADIENT,
  DEFAULT_IMAGE_URL,
} from '../constants/GlobalConstants';

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375));
const numColumns = 3;
const itemSpacing = scale(8);
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
    transform: [{ scale: withSpring(scaleValue.value, { damping: 12 }) }],
    opacity: opacityValue.value,
  }));

  useEffect(() => {
    opacityValue.value = withSpring(1, { delay: index * 80, easing: Easing.out(Easing.quad) });
  }, [opacityValue, index]);

  return (
    <Animated.View entering={FadeIn.delay(index * 40)} style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={() => {
          scaleValue.value = 0.97;
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
  const mediaUrl = item?.media?.[0] || DEFAULT_IMAGE_URL;
  const isVideo = mediaUrl?.toLowerCase().endsWith('.mp4') || mediaUrl?.toLowerCase().endsWith('.mov');

  return (
    <View style={styles.mediaContainer}>
      <FastImage
        source={{ uri: mediaUrl }}
        style={styles.mediaImage}
        resizeMode="cover"
        defaultSource={{ uri: DEFAULT_IMAGE_URL }}
      />
      {isVideo && (
        <View style={styles.playIcon}>
          <MaterialCommunityIcons name="play" size={scale(18)} color={TEXT_COLOR} />
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
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

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

  const handleEditProduct = (product) => {
    Trace('Navigating to ProductScreen for Edit', { productId: product.id });
    navigation.navigate('ProductScreen', { product, screenType: 'edit' });
    setCustomModalVisible(false);
  };

  const handleAddProduct = () => {
    Trace('Navigating to ProductScreen for Add');
    navigation.navigate('ProductScreen', { product: null, screenType: 'add' });
  };

  const handleDeleteProduct = (productId) => {
    Trace('Deleting Product', { productId });
    dispatch(deleteProduct(productId)).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        dispatch(fetchUserProducts(userId));
      }
    });
    setCustomModalVisible(false);
  };

  const showProductOptions = (product) => {
    setSelectedProduct(product);
    Trace('Product Options Modal Shown', { productId: product?.id });
    setCustomModalVisible(true);
  };

  const totalStock = products.reduce((sum, product) => sum + (product.stock || 0), 0);

  const renderProductItem = ({ item, index }) => {
    const originalPrice = parseFloat(item?.originalPrice || item?.price || 0).toFixed(2);
    const discount = parseFloat(item?.discount || 0);
    const discountedPrice = (originalPrice - (originalPrice * discount) / 100).toFixed(2);

    return (
      <AnimatedItem
        index={index}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        onLongPress={() => showProductOptions(item)}
      >
        <View style={styles.itemContainer}>
          {renderMedia(item)}
          {discount > 0 && !item.offer && (
            <View style={styles.discountBadge}>
              <Text style={styles.badgeText}>{discount}% OFF</Text>
            </View>
          )}
          {item.offer && (
            <View style={styles.offerBadge}>
              <Text style={styles.badgeText}>{item.offer}</Text>
            </View>
          )}
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.name || 'Unnamed Product'}
            </Text>
            <Text style={styles.itemBrand} numberOfLines={1}>
              {item.brand || 'Unknown Brand'}
            </Text>
            {discount > 0 ? (
              <View style={styles.priceContainer}>
                <Text style={styles.discountedPrice}>₹{discountedPrice}</Text>
                <Text style={styles.originalPrice}>₹{originalPrice}</Text>
              </View>
            ) : (
              <Text style={styles.itemPrice}>₹{originalPrice}</Text>
            )}
            <Text style={styles.itemStock}>
              Stock: {item.stock || 0}
            </Text>
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
    <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.container}>
      <Animated.View style={[styles.header, headerStyle]}>
        <Text style={styles.headerTitle}>Seller Dashboard</Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY_COLOR]}
            tintColor={PRIMARY_COLOR}
            progressBackgroundColor={PRODUCT_BG_COLOR}
          />
        }
      >
        <View style={styles.profileSection}>
          <FastImage
            source={user?.profileImage ? { uri: user.profileImage } : img.user}
            style={styles.profileImage}
            resizeMode="cover"
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.fullName || 'User Name'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <LinearGradient
              colors={[CATEGORY_BG_COLOR, PRIMARY_COLOR]}
              style={styles.editProfileButtonGradient}
            >
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="shopping" size={scale(24)} color={PRIMARY_COLOR} />
            <Text style={styles.statValue}>{products.length}</Text>
            {/* <Text style={styles.statLabel}>Products</Text> */}
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="play-box" size={scale(24)} color={PRIMARY_COLOR} />
            <Text style={styles.statValue}>{reels.length}</Text>
            {/* <Text style={styles.statLabel}>Reels</Text> */}
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="package-variant" size={scale(24)} color={PRIMARY_COLOR} />
            <Text style={styles.statValue}>{totalStock}</Text>
            {/* <Text style={styles.statLabel}>Stock</Text> */}
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
                  size={scale(24)}
                  color={activeTab === tab.id ? TEXT_COLOR : SUBTEXT_COLOR}
                />
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
                  onPress={handleAddProduct}
                >
                  <LinearGradient
                    colors={[CATEGORY_BG_COLOR, PRIMARY_COLOR]}
                    style={styles.addButtonGradient}
                  >
                    <MaterialCommunityIcons name="plus-circle" size={scale(24)} color={TEXT_COLOR} />
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
                <FastImage
                  source={img.post}
                  style={styles.emptyStateIcon}
                  tintColor={SUBTEXT_COLOR}
                />
                <Text style={styles.emptyStateTitle}>Create your first product</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleAddProduct}
                >
                  <LinearGradient
                    colors={[CATEGORY_BG_COLOR, PRIMARY_COLOR]}
                    style={styles.uploadButtonGradient}
                  >
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
                  <LinearGradient
                    colors={[CATEGORY_BG_COLOR, PRIMARY_COLOR]}
                    style={styles.addButtonGradient}
                  >
                    <MaterialCommunityIcons name="plus-circle" size={scale(24)} color={TEXT_COLOR} />
                  </LinearGradient>
                </TouchableOpacity>
                <FlatList
                  data={reels}
                  renderItem={renderReelItem}
                  keyExtractor={(item) => item._id}
                  numColumns={numColumns}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.collectionsList}
                />
              </>
            ) : (
              <View style={styles.emptyStateContainer}>
                <FastImage
                  source={img.camera}
                  style={styles.emptyStateIcon}
                  tintColor={SUBTEXT_COLOR}
                />
                <Text style={styles.emptyStateTitle}>Share your first reel</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => navigation.navigate('UploadReel')}
                >
                  <LinearGradient
                    colors={[CATEGORY_BG_COLOR, PRIMARY_COLOR]}
                    style={styles.uploadButtonGradient}
                  >
                    <Text style={styles.uploadButtonText}>Upload Reel</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )
          )}
        </View>
      </ScrollView>

      <CustomModal
        visible={customModalVisible}
        containerStyle={{ alignSelf: 'center' }}
        onRequestClose={() => setCustomModalVisible(false)}
        title="Product Options"
        buttons={[
          {
            text: 'Edit',
            onPress: () => handleEditProduct(selectedProduct),
            style: styles.modalButton,
            textStyle: { fontSize: scaleFont(13) },
          },
          {
            text: 'Delete',
            onPress: () => handleDeleteProduct(selectedProduct?.id),
            style: styles.modalButtonDelete,
            textStyle: { fontSize: scaleFont(13) },
          },
          {
            text: 'Cancel',
            onPress: () => setCustomModalVisible(false),
            style: styles.modalButtonCancel,
            textStyle: { fontSize: scaleFont(12) },
          },
        ]}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRODUCT_BG_COLOR,
  },
  header: {
    alignItems: 'center',
    paddingVertical: scale(14),
    backgroundColor: '#8ec5fc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(5),
    elevation: 3,
  },
  headerTitle: {
    fontSize: scaleFont(22),
    fontWeight: '700',
    color: TEXT_COLOR,
  },
  scrollContent: {
    paddingBottom: scale(30),
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: scale(15),
    padding: scale(15),
    borderRadius: scale(15),
    backgroundColor: PRODUCT_BG_COLOR,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(6),
    elevation: 4,
  },
  profileImage: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    borderWidth: scale(3),
    borderColor: PRIMARY_COLOR,
  },
  profileInfo: {
    flex: 1,
    marginHorizontal: scale(12),
  },
  profileName: {
    fontSize: scaleFont(15),
    fontWeight: '700',
    color: TEXT_COLOR,
  },
  profileEmail: {
    fontSize: scaleFont(12),
    color: SUBTEXT_COLOR,
    marginTop: scale(5),
  },
  editProfileButton: {
    borderRadius: scale(10),
    overflow: 'hidden',
  },
  editProfileButtonGradient: {
    paddingVertical: scale(6),
    paddingHorizontal: scale(14),
    alignItems: 'center',
  },
  editProfileButtonText: {
    fontSize: scaleFont(11),
    fontWeight: '600',
    color: TEXT_COLOR,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: scale(15),
    paddingVertical: scale(12),
  },
  statCard: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(20),
    backgroundColor: CATEGORY_BG_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(6),
  },
  statValue: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: PRIMARY_COLOR,
    marginVertical: scale(5),
  },
  statLabel: {
    fontSize: scaleFont(13),
    color: SUBTEXT_COLOR,
    fontWeight: '500',
  },
  tabsContainer: {
    paddingVertical: scale(5),
    paddingHorizontal: scale(15),
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(20),
    padding: scale(6),
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(5),
    elevation: 3,
  },
  tab: {
    width: scale(158),
    height: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(14),
    marginHorizontal: scale(8),
  },
  activeTab: {
    backgroundColor: SELECTED_CATEGORY_BG_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.2,
    shadowRadius: scale(4),
    elevation: 4,
  },
  contentSection: {
    paddingHorizontal: scale(10),
    paddingBottom: scale(15),
  },
  addButton: {
    alignSelf: 'flex-start',
    marginHorizontal: scale(15),
    marginVertical: scale(8),
    borderRadius: scale(20),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(6),
    elevation: 4,
  },
  addButtonGradient: {
    padding: scale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(35),
    margin: scale(15),
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(15),
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(6),
  },
  emptyStateIcon: {
    width: scale(64),
    height: scale(64),
    marginBottom: scale(20),
  },
  emptyStateTitle: {
    fontSize: scaleFont(15),
    fontWeight: '600',
    color: TEXT_COLOR,
    textAlign: 'center',
    marginBottom: scale(20),
  },
  uploadButton: {
    borderRadius: scale(12),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(6),
  },
  uploadButtonGradient: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(30),
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: TEXT_COLOR,
  },
  itemContainer: {
    width: itemSize,
    margin: itemSpacing / 4,
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(6),
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
    borderWidth: scale(2),
    borderColor: BORDER_COLOR,
  },
  playIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -scale(9) }, { translateY: -scale(9) }],
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(14),
    padding: scale(5),
  },
  itemInfo: {
    padding: scale(10),
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: scaleFont(12),
    color: TEXT_COLOR,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: scale(5),
    height: scale(20),
  },
  itemBrand: {
    fontSize: scaleFont(10),
    color: SUBTEXT_COLOR,
    textAlign: 'center',
    marginBottom: scale(5),
  },
  itemPrice: {
    fontSize: scaleFont(11),
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },
  discountedPrice: {
    fontSize: scaleFont(11),
    fontWeight: '700',
    color: PRIMARY_COLOR,
    marginRight: scale(5),
  },
  originalPrice: {
    fontSize: scaleFont(9),
    fontWeight: '500',
    color: SUBTEXT_COLOR,
    textDecorationLine: 'line-through',
  },
  itemStock: {
    fontSize: scaleFont(10),
    color: SUBTEXT_COLOR,
    marginTop: scale(5),
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
    backgroundColor: SECONDARY_COLOR,
    paddingHorizontal: scale(4),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  offerBadge: {
    position: 'absolute',
    top: scale(8),
    left: scale(8),
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: scale(4),
    paddingVertical: scale(2),
    borderRadius: scale(4),
  },
  badgeText: {
    fontSize: scaleFont(8),
    color: TEXT_COLOR,
    fontWeight: '700',
  },
  collectionsList: {
    paddingHorizontal: itemSpacing,
    paddingBottom: scale(12),
    alignItems: 'center',
  },
  skeletonItem: {
    width: itemSize,
    margin: itemSpacing / 2,
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(6),
    elevation: 4,
  },
  skeletonImage: {
    width: '100%',
    height: itemSize * 1.2,
    backgroundColor: CATEGORY_BG_COLOR,
    borderTopLeftRadius: scale(12),
    borderTopRightRadius: scale(12),
    opacity: 0.7,
  },
  skeletonInfo: {
    padding: scale(10),
    alignItems: 'center',
  },
  skeletonText: {
    width: '80%',
    height: scale(14),
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(4),
    marginVertical: scale(4),
    opacity: 0.7,
  },
  modalButton: {
    backgroundColor: 'transparent',
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
    borderRadius: scale(8),
    marginVertical: scale(5),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
  },
  modalButtonDelete: {
    backgroundColor: 'transparent',
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
    borderRadius: scale(8),
    marginVertical: scale(5),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SECONDARY_COLOR,
  },
  modalButtonCancel: {
    backgroundColor: 'transparent',
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
    borderRadius: scale(8),
    marginVertical: scale(5),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SUBTEXT_COLOR,
  },
});

export default SellerDashboard;
