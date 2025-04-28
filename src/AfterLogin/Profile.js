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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375));
const isTablet = width >= 768;
const numColumns = 3;
const itemSpacing = scale(10);
const itemWidth = (width - (itemSpacing * (numColumns + 1))) / numColumns;

// Skeleton Loader Component for Products
const SkeletonProductItem = () => {
  return (
    <LinearGradient
      colors={['#2A2A4A', '#1E1E3F']}
      style={styles.productItem}
    >
      <View style={[styles.productImage, styles.skeletonImage]} />
      <View style={styles.productInfo}>
        <View style={[styles.skeletonText, { width: '80%', height: scale(16), marginBottom: scale(4) }]} />
        <View style={[styles.skeletonText, { width: '40%', height: scale(14) }]} />
      </View>
    </LinearGradient>
  );
};

// Reusable Animated Item Component
const AnimatedItem = ({ children, onPress, onPressIn, onPressOut, index, onLongPress }) => {
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
      entering={FadeIn.delay(index * 50)}
      style={animatedStyle}
    >
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

const Profile = ({ onScroll }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {
    user,
    userId,
    products,
    reels,
    cart,
    wishlist,
    loadingProducts,
    successMessage,
    errorMessage,
    refreshing,
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

  // Handle Redux success and error messages with Toast
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

  // Define tabs based on user type
  const getTabs = () => {
    const tabs = [
      { id: 'reels', icon: 'play-box', label: 'Reels' },
      { id: 'cart', icon: 'cart', label: 'Cart' },
      { id: 'wishlist', icon: 'heart', label: 'Wishlist' },
    ];
    if (user?.userType === 'seller') {
      tabs.unshift({ id: 'products', icon: 'shopping', label: 'Products' });
    }
    if (!tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
    return tabs;
  };

  const tabs = getTabs();

  // Sync local inputs with Redux state
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setUserName(user.userName || '');
      setProfileImage(user.profileImage || null);
    }
  }, [user]);

  // Fetch data on focus
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

  // Fetch data when userId changes
  useEffect(() => {
    if (userId) {
      dispatch(fetchUserReels(userId));
      dispatch(fetchCart());
      dispatch(fetchWishlist());
      if (user?.userType === 'seller') {
        dispatch(fetchUserProducts(userId));
      }
    }
  }, [dispatch, userId, user?.userType]);

  // Handle pull-to-refresh
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

  // Handle logout
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
      onPress: handleLogout,
      position: 'top',
      topOffset: scale(20),
      visibilityTime: 5000,
    });
  };

  // Handle profile update
  const handleUpdateProfile = () => {
    dispatch(updateProfile({ fullName, userName }));
    setEditModalVisible(false);
    setSidebarVisible(false);
  };

  // Handle image selection
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

  // Handle product submission
  const handleSubmitProduct = (productData) => {
    dispatch(submitProduct({ productData, currentProduct })).then(() => {
      if (user?.userType === 'seller') {
        dispatch(fetchUserProducts(userId));
      }
    });
    setProductModalVisible(false);
  };

  // Handle product edit
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

  // Handle product deletion
  const handleDeleteProduct = (productId) => {
    dispatch(deleteProduct(productId));
    setProductOptionsModalVisible(false);
  };

  // Show product options
  const showProductOptions = (product) => {
    setSelectedProduct(product);
    Trace('Product Options Modal Shown', { productId: product?.id });
    setProductOptionsModalVisible(true);
  };

  // Handle remove from cart
  const handleRemoveFromCart = (productId) => {
    dispatch(removeFromCart(productId));
  };

  // Handle remove from wishlist
  const handleRemoveFromWishlist = (productId) => {
    dispatch(removeFromWishlist(productId));
  };

  // Render product item
  const renderProductItem = ({ item, index }) => {
    return (
      <AnimatedItem
        index={index}
        onPress={() =>
          navigation.navigate('ProductDetail', { productId: item.id })
        }
        onLongPress={() => {
          Trace('Product Long Press', { productId: item.id });
          showProductOptions(item);
        }}
      >
        <LinearGradient
          colors={['#2A2A4A', '#1E1E3F']}
          style={styles.productItem}
        >
          <Image
            source={{
              uri: item.media[0]?.url || 'https://via.placeholder.com/120',
            }}
            style={styles.productImage}
            resizeMode="contain"
            onError={(error) =>
              Trace('Product Image Error', { error: error.nativeEvent })
            }
          />
          <View style={styles.productInfo}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.productPrice}>₹{item.price}</Text>
          </View>
        </LinearGradient>
      </AnimatedItem>
    );
  };

  // Render skeleton loader
  const renderSkeletonLoader = () => {
    const skeletonItems = Array(6).fill({});
    return (
      <FlatList
        key="skeleton-list"
        data={skeletonItems}
        renderItem={() => <SkeletonProductItem />}
        keyExtractor={(item, index) => `skeleton-${index}`}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.collectionsList}
      />
    );
  };

  // Render reel item
  const renderReelItem = ({ item, index }) => {
    return (
      <AnimatedItem
        index={index}
        onPress={() => {
          Trace('Reel Clicked', { reelId: item._id });
          navigation.navigate('ReelView', { reel: item });
        }}
      >
        <LinearGradient
          colors={['#2A2A4A', '#1E1E3F']}
          style={[styles.productItem, styles.reelItem]}
        >
          <Image
            source={{ uri: item.thumbnail || 'https://via.placeholder.com/120' }}
            style={styles.productImage}
            resizeMode="cover"
            onError={(error) =>
              Trace('Reel Thumbnail Error', { error: error.nativeEvent })
            }
          />
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.5)']}
            style={styles.imageOverlay}
          />
          <View style={styles.playIcon}>
            <MaterialCommunityIcons name="play" size={scale(24)} color="#FFFFFF" />
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {item.caption || 'No caption'}
            </Text>
          </View>
        </LinearGradient>
      </AnimatedItem>
    );
  };

  // Render cart item
  const renderCartItem = ({ item, index }) => {
    return (
      <AnimatedItem
        index={index}
        onPress={() =>
          navigation.navigate('ProductDetail', { productId: item._id })
        }
      >
        <LinearGradient
          colors={['#2A2A4A', '#1E1E3F']}
          style={styles.productItem}
        >
          <Image
            source={{ uri: item.media[0]?.url || 'https://via.placeholder.com/120' }}
            style={styles.productImage}
            resizeMode="contain"
          />
          <View style={styles.productInfo}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.productPrice}>₹{item.price}</Text>
          </View>
          <TouchableOpacity
            style={styles.closeIconContainer}
            onPress={() => handleRemoveFromCart(item._id)}
          >
            <AntDesign name="close" size={scale(16)} color="#EF4444" />
          </TouchableOpacity>
        </LinearGradient>
      </AnimatedItem>
    );
  };

  // Render wishlist item
  const renderWishlistItem = ({ item, index }) => {
    return (
      <AnimatedItem
        index={index}
        onPress={() =>
          navigation.navigate('ProductDetail', { productId: item._id })
        }
      >
        <LinearGradient
          colors={['#2A2A4A', '#1E1E3F']}
          style={styles.productItem}
        >
          <Image
            source={{ uri: item.media[0]?.url || 'https://via.placeholder.com/120' }}
            style={styles.productImage}
            resizeMode="contain"
          />
          <View style={styles.productInfo}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.productPrice}>₹{item.price}</Text>
          </View>
          <TouchableOpacity
            style={styles.closeIconContainer}
            onPress={() => handleRemoveFromWishlist(item._id)}
          >
            <AntDesign name="close" size={scale(16)} color="#EF4444" />
          </TouchableOpacity>
        </LinearGradient>
      </AnimatedItem>
    );
  };

  return (
    <LinearGradient
      colors={['#0A0A1E', '#1E1E3F']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView
        onScroll={onScroll}
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
        <LinearGradient
          colors={['#1A1A3A', '#2A2A5A']}
          style={styles.profileCard}
        >
          <TouchableOpacity
            style={{ alignSelf: 'flex-end', paddingHorizontal: scale(20) }}
            onPress={() => setSidebarVisible(true)}
          >
            <Icon name="settings" size={scale(24)} color="#FFFFFF" />
          </TouchableOpacity>
          <Pressable
            onPress={() => setImageModalVisible(true)}
            style={styles.profileImageContainer}
          >
            <Image
              source={profileImage ? { uri: profileImage } : img.user}
              style={styles.profileImage}
              resizeMode="cover"
              onError={(error) =>
                Trace('Profile Image Error', { error: error.nativeEvent })
              }
            />
            <View style={styles.editIcon}>
              <Text style={styles.editIconText}>✏️</Text>
            </View>
          </Pressable>
          <Text style={styles.name}>{user?.fullName || 'Maria May'}</Text>
          <Text style={styles.bio}>
            Username: {user?.userName || 'N/A'} {'\n'} Email:{' '}
            {user?.email || 'N/A'} {'\n'} Phone: {user?.phoneNumber || 'N/A'}
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
        </LinearGradient>

        <View style={styles.collectionsSection}>
          <LinearGradient
            colors={['#2A2A5A', '#3A3A7A']}
            style={styles.tabsContainer}
          >
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
                </TouchableOpacity>
              ))}
            </View>
          </LinearGradient>

          <Line
            style={{
              borderColor: '#B0B0D0',
              marginBottom: scale(10),
              width: '90%',
              alignSelf: 'center',
            }}
          />

          {activeTab === 'products' && user?.userType === 'seller' ? (
            loadingProducts ? (
              renderSkeletonLoader()
            ) : products.length > 0 ? (
              <>
                <TouchableOpacity
                  onPress={() => {
                    Trace('Add Product Clicked');
                    setCurrentProduct(null);
                    setProductModalVisible(true);
                  }}
                  style={{
                    paddingHorizontal: scale(20),
                    marginBottom: scale(10),
                  }}
                >
                  <AntDesign name="plussquare" size={scale(20)} color="#A855F7" />
                </TouchableOpacity>
                <FlatList
                  key="products-list"
                  data={products}
                  renderItem={renderProductItem}
                  keyExtractor={(item) =>
                    item.id?.toString() || Math.random().toString()
                  }
                  numColumns={numColumns}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.collectionsList}
                />
              </>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Image source={img.post} style={styles.emptyStateIcon} />
                <Text style={styles.emptyStateTitle}>
                  Create your first product
                </Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => {
                    Trace('Add Product Clicked');
                    setCurrentProduct(null);
                    setProductModalVisible(true);
                  }}
                >
                  <LinearGradient
                    colors={['#A855F7', '#7B61FF']}
                    style={styles.uploadButtonGradient}
                  >
                    <Text style={styles.uploadButtonText}>Add Product</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )
          ) : activeTab === 'reels' ? (
            reels.length > 0 ? (
              <>
                <TouchableOpacity
                  onPress={() => navigation.navigate('UploadReel')}
                  style={{
                    paddingHorizontal: scale(20),
                    marginBottom: scale(10),
                  }}
                >
                  <AntDesign name="plussquare" size={scale(20)} color="#A855F7" />
                </TouchableOpacity>
                <FlatList
                  key="reels-list"
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
                <Text style={styles.emptyStateTitle}>
                  Capture the moment with a friend
                </Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => {
                    Trace('Upload Reel Clicked');
                    navigation.navigate('UploadReel');
                  }}
                >
                  <LinearGradient
                    colors={['#A855F7', '#7B61FF']}
                    style={styles.uploadButtonGradient}
                  >
                    <Text style={styles.uploadButtonText}>Upload Reel</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )
          ) : activeTab === 'cart' ? (
            cart.length > 0 ? (
              <FlatList
                key="cart-list"
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
                key="wishlist-list"
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
            {
              text: 'Cancel',
              onPress: () => setEditModalVisible(false),
              style: styles.modalButtonCancel,
            },
            {
              text: 'Save',
              onPress: handleUpdateProfile,
              style: styles.modalButtonSave,
              textStyle: styles.modalButtonText,
            },
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
            {
              text: 'Choose from Gallery',
              onPress: openGallery,
              style: styles.modalButton,
            },
            {
              text: 'Open Camera',
              onPress: openCamera,
              style: styles.modalButton,
            },
            {
              text: 'Cancel',
              onPress: () => setImageModalVisible(false),
              style: styles.modalButtonCancel,
            },
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
                {
                  text: 'Edit',
                  onPress: () => handleEditProduct(selectedProduct),
                  style: styles.modalButton,
                  textStyle: { fontSize: 13 },
                },
                {
                  text: 'Delete',
                  onPress: () => handleDeleteProduct(selectedProduct?.id),
                  style: styles.modalButtonDelete,
                  textStyle: { fontSize: 13 },
                },
                {
                  text: 'Cancel',
                  onPress: () => setProductOptionsModalVisible(false),
                  style: styles.modalButtonCancel,
                  textStyle: { fontSize: 12 },
                },
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
            <Pressable
              style={styles.sidebarOverlay}
              onPress={() => setSidebarVisible(false)}
            >
              <LinearGradient
                colors={['#2A2A4A', '#1E1E3F']}
                style={styles.sidebar}
              >
                <TouchableOpacity
                  style={styles.sidebarItem}
                  onPress={() => {
                    Trace('Edit Profile Clicked');
                    setEditModalVisible(true);
                    setSidebarVisible(false);
                  }}
                >
                  <Text style={styles.sidebarText}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sidebarItem}
                  onPress={confirmLogout}
                >
                  <Text style={styles.sidebarText}>Logout</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sidebarItem}
                  onPress={() => {
                    Trace('Settings Clicked');
                    Toast.show({
                      type: 'info',
                      text1: 'Info',
                      text2: 'Settings coming soon',
                      position: 'top',
                      topOffset: scale(20),
                    });
                    setSidebarVisible(false);
                  }}
                >
                  <Text style={styles.sidebarText}>Settings</Text>
                </TouchableOpacity>
              </LinearGradient>
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
    paddingBottom: scale(20),
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: scale(20),
    borderRadius: scale(15),
    marginHorizontal: scale(10),
    marginTop: scale(10),
    elevation: 5,
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
    marginTop: scale(5),
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
  },
  tabsContainer: {
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    elevation: 3,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: scale(25),
    padding: scale(5),
    marginHorizontal: scale(10),
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
  productItem: {
    width: itemWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: scale(10),
    marginHorizontal: itemSpacing / 5,
    marginVertical: scale(2),
    padding: scale(10),
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  reelItem: {
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  productImage: {
    width: '100%',
    height: itemWidth * 1.2,
    borderRadius: scale(8),
  },
  skeletonImage: {
    backgroundColor: '#3A3A5A',
    opacity: 0.5,
  },
  skeletonText: {
    backgroundColor: '#3A3A5A',
    borderRadius: scale(4),
    opacity: 0.5,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: scale(8),
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
  productInfo: {
    width: '100%',
    alignItems: 'center',
    marginTop: scale(5),
  },
  productTitle: {
    fontSize: scaleFont(12),
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: scale(4),
    height: scale(32),
  },
  productPrice: {
    fontSize: scaleFont(14),
    fontWeight: '700',
    color: '#A855F7',
  },
  collectionsList: {
    paddingHorizontal: itemSpacing * 1.5,
    paddingBottom: scale(20),
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
});

export default Profile;