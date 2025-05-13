import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  StyleSheet,
  Dimensions,
  Pressable,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Video from 'react-native-video';
import {
  fetchUser,
  fetchUserProducts,
  fetchUserReels,
  fetchCart,
  fetchWishlist,
  updateProfile,
  submitProduct,
  deleteProduct,
  removeFromCart,
  removeFromWishlist,
  logout,
  setRefreshing,
  clearMessages,
} from '../redux/slices/profileSlice';
import Colors from '../constants/Colors';
import img from '../assets/Images/img';
import Header from '../Components/Header';
import CustomModal from '../Components/CustomModal';
import Button from '../Components/Button';
import ProductModal from '../Products/ProductModal';
import Line from '../Components/Line';
import Toast from 'react-native-toast-message';
import Trace from '../utils/Trace';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375));
const numColumns = 3;
const itemSpacing = scale(10);
const itemSize = (width - (itemSpacing * (numColumns + 1))) / numColumns;

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

const AnimatedItem = ({ children, onPress, onPressIn, onPressOut, index, onLongPress }) => {
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

const renderMedia = (item) => {
  const mediaUrl = item?.media?.[0]?.url || 'https://via.placeholder.com/120';
  const isVideo = mediaUrl?.toLowerCase().endsWith('.mp4') || mediaUrl?.toLowerCase().endsWith('.mov');

  return (
    <View style={styles.mediaContainer}>
      {isVideo ? (
        <Video
          source={{ uri: mediaUrl }}
          style={styles.mediaImage}
          resizeMode="cover"
          paused={true}
          poster={item?.thumbnail || 'https://via.placeholder.com/120'}
          posterResizeMode="cover"
          repeat={false}
        />
      ) : (
        <FastImage
          source={{ uri: mediaUrl }}
          style={styles.mediaImage}
          resizeMode="cover"
          defaultSource={{ uri: 'https://via.placeholder.com/120' }}
        />
      )}
      {isVideo && (
        <View style={styles.playIcon}>
          <MaterialCommunityIcons name="play" size={scale(24)} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
};

// Profile Component
const Profile = ({ onScroll, route }) => {

  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {
    user,
    userId,
    products = [],
    reels = [],
    cart = [],
    wishlist = [],
    loadingProducts,
    successMessage,
    errorMessage,
    refreshing,
    removingFromCart, // Added for cart removal loader
    removingFromWishlist, // Added for wishlist removal loader
  } = useSelector((state) => state.profile);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [productOptionsModalVisible, setProductOptionsModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [fullName, setFullName] = useState('');
  const [userName, setUserName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('products');

  useEffect(() => {
    const fromDrawer = route.params?.fromDrawer || false;
    console.log('Profile screen - fromDrawer:', fromDrawer);
  }, [route.params]);

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

  useEffect(() => {
    if (route?.params?.cart === true) {
      setActiveTab('cart');
    } else {
      const tabs = getTabs();
      setActiveTab(tabs[0].id);
    }
  }, [route?.params?.cart]);

  const getTabs = () => {
    const tabs = [
      { id: 'reels', icon: 'play-box' },
      { id: 'cart', icon: 'cart' },
      { id: 'wishlist', icon: 'heart' },
    ];
    if (user?.userType === 'seller') {
      tabs.unshift({ id: 'products', icon: 'shopping' });
    }
    if (!tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
    return tabs;
  };

  const tabs = getTabs();

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setUserName(user.userName || '');
      setProfileImage(user.profileImage || null);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchUser()).then((result) => {
        if (result.meta.requestStatus === 'fulfilled' && userId) {
          dispatch(fetchUserReels(userId));
          dispatch(fetchCart());
          dispatch(fetchWishlist());
          if (user?.userType === 'seller') {
            dispatch(fetchUserProducts(userId));
          }
        }
      });
    }, [dispatch, userId, user?.userType])
  );

  const onRefresh = useCallback(() => {
    dispatch(setRefreshing(true));
    Trace('Refreshing Data');
    const fetchPromises = [
      dispatch(fetchUserReels(userId)),
      dispatch(fetchCart()),
      dispatch(fetchWishlist()),
    ];
    if (user?.userType === 'seller') {
      fetchPromises.push(dispatch(fetchUserProducts(userId)));
    }
    Promise.all(fetchPromises).finally(() => {
      dispatch(setRefreshing(false));
    });
  }, [dispatch, userId, user?.userType]);

  const handleLogout = () => {
    dispatch(logout()).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        setSidebarVisible(false);
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    });
  };

const confirmLogout = () => {
  setSidebarVisible(false);
  Trace('Logout Confirmation Toast Shown');
  Toast.show({
    type: 'info',
    text1: 'Are you sure?',
    text2: 'Tap to confirm logout',
    position: 'top',
    topOffset: scale(20),
    visibilityTime: 5000,
    onPress: () => {
      handleLogout();
      Toast.hide();
    }
  });
};

  const handleUpdateProfile = () => {
    dispatch(updateProfile({ fullName, userName }));
    setEditModalVisible(false);
    setSidebarVisible(false);
  };

  const openCamera = () => {
    launchCamera({ mediaType: 'photo' }, async (response) => {
      try {
        Trace('Camera Response', { response });
        if (!response.didCancel && response.assets?.length) {
          const uri = response.assets[0].uri;
          Trace('Profile Image Selected', { uri });
          setProfileImage(uri);
          setImageModalVisible(false);
        }
      } catch (err) {
        Trace('Camera Error', { error: err.message });
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to capture image',
          position: 'top',
          topOffset: scale(20),
        });
      }
    });
  };

  const openGallery = () => {
    launchImageLibrary({ mediaType: 'photo' }, async (response) => {
      try {
        Trace('Gallery Response', { response });
        if (!response.didCancel && response.assets?.length) {
          const uri = response.assets[0].uri;
          Trace('Profile Image Selected', { uri });
          setProfileImage(uri);
          setImageModalVisible(false);
        }
      } catch (err) {
        Trace('Gallery Error', { error: err.message });
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to select image',
          position: 'top',
          topOffset: scale(20),
        });
      }
    });
  };

  const handleSubmitProduct = (productData) => {
    dispatch(submitProduct({ productData, currentProduct })).then(() => {
      if (user?.userType === 'seller') {
        dispatch(fetchUserProducts(userId));
      }
    });
    setProductModalVisible(false);
  };

  const handleEditProduct = (product) => {
    try {
      Trace('Editing Product', { product });
      setCurrentProduct(product);
      setProductModalVisible(true);
      setProductOptionsModalVisible(false);
    } catch (err) {
      Trace('Edit Product Error', { error: err.message });
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to open edit modal',
        position: 'top',
        topOffset: scale(20),
      });
    }
  };

  const handleDeleteProduct = (productId) => {
    dispatch(deleteProduct(productId));
    setProductOptionsModalVisible(false);
  };

  const showProductOptions = (product) => {
    setSelectedProduct(product);
    Trace('Product Options Modal Shown', { productId: product?.id });
    setProductOptionsModalVisible(true);
  };

  const handleRemoveFromCart = (productId, product) => {
    if (productId) {
      setSelectedProduct(product); // Set the product being removed
      dispatch(removeFromCart(productId));
    }
  };

  const handleRemoveFromWishlist = (productId, product) => {
    if (productId) {
      setSelectedProduct(product); 
      dispatch(removeFromWishlist(productId));
    }
  };

const renderProductItem = ({ item, index }) => {
  const originalPrice = parseFloat(item?.originalPrice || item?.price || 0).toFixed(2);
  const discount = parseFloat(item?.discount || 0);
  const discountedPrice = (originalPrice - (originalPrice * discount) / 100).toFixed(2);
  const isPremium = item?.premium || false;

  let specifications = [];
  try {
    specifications = item.specifications ? 
      (typeof item.specifications === 'string' ? 
        JSON.parse(item.specifications) : 
        item.specifications) : 
      [];
  } catch (err) {
    console.error('Error parsing specifications:', err);
  }

  return (
    <AnimatedItem
      index={index}
      onPress={() => navigation.navigate('ProductDetail', { 
        productId: item.id,
        product: {
          ...item,
          specifications
        }
      })}
      onLongPress={() => showProductOptions(item)}
    >
      <View style={styles.itemContainer}>
        {renderMedia(item)}
        {isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.badgeText}>PREMIUM</Text>
          </View>
        )}
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

  const renderCartItem = ({ item, index }) => {
    const price = parseFloat(item?.price || 0).toFixed(2);

    if (removingFromCart && item._id === selectedProduct?._id) {
      return <SkeletonProductItem />;
    }

    return (
      <AnimatedItem
        index={index}
        onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
      >
        <View style={styles.itemContainer}>
          {renderMedia(item)}
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.name || 'Unnamed Item'}
            </Text>
            <Text style={styles.itemPrice}>₹{price}</Text>
          </View>
          <TouchableOpacity style={styles.closeIcon} onPress={() => handleRemoveFromCart(item._id, item)}>
            <AntDesign name="close" size={scale(16)} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </AnimatedItem>
    );
  };

  const renderWishlistItem = ({ item, index }) => {
    const price = parseFloat(item?.price || 0).toFixed(2);

    if (removingFromWishlist && item._id === selectedProduct?._id) {
      return <SkeletonProductItem />;
    }

    return (
      <AnimatedItem
        index={index}
        onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
      >
        <View style={styles.itemContainer}>
          {renderMedia(item)}
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.name || 'Unnamed Item'}
            </Text>
            <Text style={styles.itemPrice}>₹{price}</Text>
          </View>
          <TouchableOpacity style={styles.closeIcon} onPress={() => handleRemoveFromWishlist(item._id, item)}>
            <AntDesign name="close" size={scale(16)} color="#EF4444" />
          </TouchableOpacity>
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

  return (
    <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.container}>
      <ScrollView
        onScroll={onScroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#A855F7']} tintColor="#A855F7" />
        }
      >
        <View style={styles.profileCard}>
          
        <View style={styles.iconContainer}>
            {route?.params?.cart === true && (
              <TouchableOpacity style={styles.backIcon} onPress={() => navigation.goBack()}>
                <Icon name="arrow-back" size={scale(24)} color="#FFFFFF" />
              </TouchableOpacity>
            ) }
            <TouchableOpacity style={[styles.settingsIcon,route?.params?.cart === true && {bottom:25}]} onPress={() => setSidebarVisible(true)}>
                <Icon name="settings" size={scale(24)} color="#FFFFFF" />
              </TouchableOpacity>
          </View>
          <Pressable onPress={() => setImageModalVisible(true)} style={styles.profileImageContainer}>
            <FastImage
              source={profileImage ? { uri: profileImage } : img.user}
              style={styles.profileImage}
              resizeMode="cover"
              onError={(error) => Trace('Profile Image Error', { error: error.nativeEvent })}
            />
            <View style={styles.editIcon}>
              <Text style={styles.editIconText}>✏️</Text>
            </View>
          </Pressable>
          <Text style={styles.name}>{user?.fullName || 'Maria May'}</Text>
          <Text style={styles.bio}>
            Username: {user?.userName || 'N/A'} {'\n'} Email: {user?.email || 'N/A'} {'\n'} Phone: {user?.phoneNumber || 'N/A'}
          </Text>
          <View style={styles.statsRow}>
            {user?.userType === 'seller' && (
              <View style={styles.stat}>
                <Text style={styles.statValue}>{products.length}</Text>
                <Text style={styles.statLabel}>Products</Text>
              </View>
            )}
            <View style={styles.stat}>
              <Text style={styles.statValue}>{reels.length}</Text>
              <Text style={styles.statLabel}>Reels</Text>
            </View>
          </View>
        </View>

        <View style={styles.collectionsSection}>
          <View style={styles.tabsContainer}>
            <View style={styles.tabBar}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                  onPress={() => {
                    Trace(`${tab.label} Button Clicked`);
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

          <Line style={styles.line} />

          {activeTab === 'products' && user?.userType === 'seller' ? (
            loadingProducts ? (
              renderSkeletonLoader()
            ) : products.length > 0 ? (
              <>
                {/* <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => {
                    Trace('Add Product Clicked');
                    setCurrentProduct(null);
                    setProductModalVisible(true);
                  }}
                >
                  <AntDesign name="plussquare" size={scale(20)} color="#A855F7" />
                </TouchableOpacity> */}
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
                <Image source={img.post} style={styles.emptyStateIcon} />
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
          ) : activeTab === 'reels' ? (
            reels.length > 0 ? (
              <>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => navigation.navigate('UploadReel')}
                >
                  <AntDesign name="plussquare" size={scale(20)} color="#A855F7" />
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
                <Image source={img.camera} style={styles.emptyStateIcon} />
                <Text style={styles.emptyStateTitle}>Capture the moment with a friend</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => {
                    Trace('Upload Reel Clicked');
                    navigation.navigate('UploadReel');
                  }}
                >
                  <LinearGradient colors={['#A855F7', '#7B61FF']} style={styles.uploadButtonGradient}>
                    <Text style={styles.uploadButtonText}>Upload Reel</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )
          ) : activeTab === 'cart' ? (
            cart.length > 0 ? (
              <FlatList
                data={cart}
                renderItem={renderCartItem}
                keyExtractor={(item) => item._id}
                numColumns={numColumns}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.collectionsList}
              />
            ) : (
              <View style={styles.emptyStateContainer}>
                <Image source={img.post} style={styles.emptyStateIcon} />
                <Text style={styles.emptyStateTitle}>Your cart is empty</Text>
              </View>
            )
          ) : (
            wishlist.length > 0 ? (
              <FlatList
                data={wishlist}
                renderItem={renderWishlistItem}
                keyExtractor={(item) => item._id}
                numColumns={numColumns}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.collectionsList}
              />
            ) : (
              <View style={styles.emptyStateContainer}>
                <Image source={img.post} style={styles.emptyStateIcon} />
                <Text style={styles.emptyStateTitle}>Your wishlist is empty</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>

      <View style={styles.modalContainer}>
        <CustomModal
          containerStyle={{ alignSelf: 'center' }}
          visible={editModalVisible}
          onRequestClose={() => setEditModalVisible(false)}
          title="Edit Profile"
          buttons={[
            { text: 'Cancel', onPress: () => setEditModalVisible(false), style: styles.modalButtonCancel },
            { text: 'Save', onPress: handleUpdateProfile, style: styles.modalButtonSave, textStyle: styles.modalButtonText },
          ]}
        >
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#B0B0D0"
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            style={[styles.input, { marginTop: scale(15) }]}
            placeholder="Username"
            placeholderTextColor="#B0B0D0"
            autoCapitalize="none"
            value={userName}
            onChangeText={setUserName}
          />
        </CustomModal>

        <CustomModal
          visible={imageModalVisible}
          containerStyle={{ alignSelf: 'center' }}
          onRequestClose={() => setImageModalVisible(false)}
          title="Update Profile Picture"
          buttons={[
            { text: 'Choose from Gallery', onPress: openGallery, style: styles.modalButton },
            { text: 'Open Camera', onPress: openCamera, style: styles.modalButton },
            { text: 'Cancel', onPress: () => setImageModalVisible(false), style: styles.modalButtonCancel },
          ]}
        />

        {user?.userType === 'seller' && (
          <>
            <ProductModal
              visible={productModalVisible}
              onClose={() => setProductModalVisible(false)}
              onSubmit={handleSubmitProduct}
              product={currentProduct}
            />
            <CustomModal
              visible={productOptionsModalVisible}
              containerStyle={{ alignSelf: 'center' }}
              onRequestClose={() => setProductOptionsModalVisible(false)}
              title="Product Options"
              buttons={[
                { text: 'Edit', onPress: () => handleEditProduct(selectedProduct), style: styles.modalButton, textStyle: { fontSize: 13 } },
                { text: 'Delete', onPress: () => handleDeleteProduct(selectedProduct?.id), style: styles.modalButtonDelete, textStyle: { fontSize: 13 } },
                { text: 'Cancel', onPress: () => setProductOptionsModalVisible(false), style: styles.modalButtonCancel, textStyle: { fontSize: 12 } },
              ]}
            />
          </>
        )}

        {sidebarVisible && (
          <Modal
            transparent={true}
            visible={sidebarVisible}
            onRequestClose={() => setSidebarVisible(false)}
            animationType="fade"
          >
            <Pressable style={styles.sidebarOverlay} onPress={() => setSidebarVisible(false)}>
              <View style={styles.sidebar}>
                <TouchableOpacity style={styles.sidebarItem} onPress={() => { Trace('Edit Profile Clicked'); setEditModalVisible(true); setSidebarVisible(false); }}>
                  <Text style={styles.sidebarText}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sidebarItem} onPress={confirmLogout}>
                  <Text style={styles.sidebarText}>Logout</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sidebarItem} onPress={() => { Trace('Settings Clicked'); Toast.show({ type: 'info', text1: 'Info', text2: 'Settings coming soon', position: 'top', topOffset: scale(20) }); setSidebarVisible(false); }}>
                  <Text style={styles.sidebarText}>Settings</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: scale(10),
    paddingBottom: scale(30),
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: scale(20),
    borderRadius: scale(15),
    marginHorizontal: scale(10),
    backgroundColor: 'rgba(26, 26, 58, 0.9)',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(5) },
    shadowOpacity: 0.2,
    shadowRadius: scale(10),
  },
  iconContainer: {
    width: '100%',
    alignItems: 'flex-end',
    paddingHorizontal: scale(20),
  },
  settingsIcon: {
    alignSelf: 'flex-end',
    paddingHorizontal: scale(0),
  },
  backIcon:{
    alignSelf: 'flex-start',
    paddingHorizontal: scale(0),
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: scale(10),
  },
  profileImage: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    borderWidth: 2,
    borderColor: '#A855F7',
  },
  editIcon: {
    position: 'absolute',
    bottom: -scale(5),
    right: -scale(5),
    backgroundColor: '#A855F7',
    borderRadius: scale(10),
    width: scale(20),
    height: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconText: {
    fontSize: scale(12),
    color: '#FFFFFF',
  },
  name: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: scale(5),
  },
  bio: {
    fontSize: scaleFont(14),
    color: '#B0B0D0',
    textAlign: 'center',
    paddingHorizontal: scale(20),
    marginBottom: scale(10),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginTop: scale(10),
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#A855F7',
  },
  statLabel: {
    fontSize: scaleFont(12),
    color: '#B0B0D0',
  },
  collectionsSection: {
    marginTop: scale(20),
    paddingBottom: scale(20),
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
  line: {
    borderColor: '#B0B0D0',
    marginBottom: scale(10),
    width: '90%',
    alignSelf: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    marginBottom: scale(10),
  },
  addButtonText: {
    color: '#A855F7',
    fontSize: scaleFont(14),
    marginLeft: scale(5),
    fontWeight: '500',
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
    height: scale(20), // Fixed height for consistency
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
  closeIcon: {
    position: 'absolute',
    top: scale(5),
    right: scale(5),
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: scale(10),
    padding: scale(4),
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
  premiumBadge: {
    position: 'absolute',
    top: scale(8),
    left: scale(8),
    backgroundColor: '#FFD700',
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(12),
  },
  badgeText: {
    fontSize: scaleFont(10),
    color: '#000000',
    fontWeight: 'bold',
  },
  collectionsList: {
    paddingHorizontal: itemSpacing,
    paddingBottom: scale(10),
    alignItems: 'center', // Center items in the grid
  },
  sidebarOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: width * 0.3,
    padding: scale(10),
    backgroundColor: '#2A2A4A',
    borderBottomLeftRadius: scale(20),
  },
  sidebarItem: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sidebarText: {
    fontSize: scaleFont(12),
    color: '#FFFFFF',
    fontWeight: '500',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButton: {
    backgroundColor: 'transparent',
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
    borderRadius: scale(8),
    marginVertical: scale(5),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A855F7',
  },
  modalButtonDelete: {
    backgroundColor: 'transparent',
    paddingVertical: scale(10),
    paddingHorizontal: scale(10),
    borderRadius: scale(8),
    marginVertical: scale(5),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  modalButtonCancel: {
    backgroundColor: 'transparent',
    paddingVertical: scale(10),
    paddingHorizontal: scale(5),
    borderRadius: scale(8),
    marginVertical: scale(5),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  modalButtonSave: {
    backgroundColor: 'transparent',
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
    borderRadius: scale(8),
    marginVertical: scale(5),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(8),
    padding: scale(10),
    fontSize: scaleFont(16),
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: '100%',
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

export default Profile;