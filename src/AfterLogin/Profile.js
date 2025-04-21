import React, {useCallback, useEffect, useState} from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign'
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {useNavigation} from '@react-navigation/native';
import Colors from '../constants/Colors';
import img from '../assets/Images/img';
import Header from '../Components/Header';
import CustomModal from '../Components/CustomModal';
import Button from '../Components/Button';
import Loader from '../Components/Loader';
import ProductModal from '../Products/ProductModal';
import {
  editProfileApi,
  createProductApi,
  getAllProductsApi,
  updateProductApi,
  deleteProductApi,
  getReelsApi,
} from '../../apiClient';
import Line from '../Components/Line';
import Toast from 'react-native-toast-message';

const {width, height} = Dimensions.get('window');
const isTablet = width >= 768;
const scaleFactor = width / 375;

const log = (message, data = {}) => {
  console.log(
    JSON.stringify(
      {timestamp: new Date().toISOString(), message, ...data},
      null,
      2,
    ),
  );
};

const Profile = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [products, setProducts] = useState([]);
  const [reels, setReels] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [fullName, setFullName] = useState('');
  const [userName, setUserName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [productOptionsVisible, setProductOptionsVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('products');

  const getUser = async () => {
    try {
      log('Fetching User Data');
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        log('User Data Fetched', {user: parsedUser});
        setUser(parsedUser);
        setUserId(parsedUser.id || '');
        setFullName(parsedUser.fullName || '');
        setUserName(parsedUser.userName || '');
        setProfileImage(parsedUser.profileImage || null);
      } else {
        log('No User Data Found');
        setErrorMessage('No user data found');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (err) {
      log('Get User Error', {error: err.message});
      setErrorMessage('Failed to load user data');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const fetchUserProducts = async () => {
    try {
      log('Fetching User Products', {userId});
      setLoading(true);
      const {ok, data} = await getAllProductsApi();
      log('Products Response', {ok, data});
      if (ok && data.products) {
        const userProducts = data.products.filter(
          product => product.createdBy === userId,
        );
        log('Filtered User Products', {count: userProducts.length});
        setProducts(userProducts);
      } else {
        setErrorMessage(data.msg || 'Failed to fetch products');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (err) {
      log('Fetch Products Error', {error: err.message});
      setErrorMessage('Something went wrong');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReels = async () => {
    try {
      log('Fetching User Reels', {userId});
      setLoading(true);
      const {ok, data} = await getReelsApi();
      log('Reels Response', {ok, data});
      if (ok && Array.isArray(data.reels)) {
        const userReels = data.reels.filter(reel => reel.user?._id === userId);
        log('Filtered User Reels', {count: userReels.length});
        setReels(userReels);
      } else {
        setErrorMessage(data.msg || 'Failed to fetch reels');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (err) {
      log('Fetch Reels Error', {error: err.message});
      setErrorMessage('Something went wrong');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    log('Refreshing Data');
    await Promise.all([fetchUserProducts(), fetchUserReels()]);
  };

  useFocusEffect(
    useCallback(() => {
      getUser();
    }, []),
  );

  useEffect(() => {
    if (userId) {
      fetchUserProducts();
      fetchUserReels();
    }
  }, [userId]);

  const handleLogout = async () => {
    try {
      log('Logging Out');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userToken');
      setModalVisible(false);
      setSidebarVisible(false);
      navigation.reset({index: 0, routes: [{name: 'Login'}]});
    } catch (err) {
      log('Logout Error', {error: err.message});
      Toast.show({type: 'error', text1: 'Failed to logout'});
    }
  };

  const handleUpdateProfile = async () => {
    try {
      log('Updating Profile', {fullName, userName});
      setLoading(true);
      setEditModalVisible(false);
      setSidebarVisible(false);
      setErrorMessage('');
      setSuccessMessage('');

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        log('No Token Found');
        setLoading(false);
        setErrorMessage('No token found');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      const {ok, data} = await editProfileApi(token, fullName, userName);
      log('Edit Profile Response', {ok, data});
      setLoading(false);

      if (ok) {
        const updatedUser = {...user, fullName, userName};
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSuccessMessage(data?.msg || 'Profile updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data?.msg || data?.errors?.userName || 'Update failed');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (err) {
      log('Update Profile Error', {error: err.message});
      setLoading(false);
      setErrorMessage('Something went wrong');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const openCamera = () => {
    launchCamera({mediaType: 'photo'}, async response => {
      try {
        log('Camera Response', {response});
        if (!response.didCancel && response.assets?.length) {
          const uri = response.assets[0].uri;
          log('Profile Image Selected', {uri});
          setProfileImage(uri);
          setImageModalVisible(false);
        }
      } catch (err) {
        log('Camera Error', {error: err.message});
        Toast.show({type: 'error', text1: 'Failed to capture image'});
      }
    });
  };

  const openGallery = () => {
    launchImageLibrary({mediaType: 'photo'}, async response => {
      try {
        log('Gallery Response', {response});
        if (!response.didCancel && response.assets?.length) {
          const uri = response.assets[0].uri;
          log('Profile Image Selected', {uri});
          setProfileImage(uri);
          setImageModalVisible(false);
        }
      } catch (err) {
        log('Gallery Error', {error: err.message});
        Toast.show({type: 'error', text1: 'Failed to select image'});
      }
    });
  };

  const handleSubmitProduct = async productData => {
    try {
      log('Submitting Product', {productData, currentProduct});
      setLoading(true);
      setProductModalVisible(false);
      setErrorMessage('');
      setSuccessMessage('');

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        log('No Token Found');
        setLoading(false);
        setErrorMessage('No token found');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      const productPayload = {...productData, createdBy: userId};
      const {ok, data} = currentProduct
        ? await updateProductApi(token, currentProduct.id, productPayload)
        : await createProductApi(token, productPayload);
      log('Product Submit Response', {ok, data});
      setLoading(false);

      if (ok) {
        setSuccessMessage(
          data?.msg ||
            (currentProduct
              ? 'Product updated successfully'
              : 'Product added successfully'),
        );
        setTimeout(() => setSuccessMessage(''), 3000);
        await fetchUserProducts();
      } else {
        setErrorMessage(data?.msg || 'Failed to manage product');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (err) {
      log('Submit Product Error', {error: err.message});
      setLoading(false);
      setErrorMessage('Something went wrong');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleEditProduct = product => {
    try {
      log('Editing Product', {product});
      setCurrentProduct(product);
      setProductModalVisible(true);
    } catch (err) {
      log('Edit Product Error', {error: err.message});
      Toast.show({type: 'error', text1: 'Failed to open edit modal'});
    }
  };

  const handleDeleteProduct = async productId => {
    try {
      log('Deleting Product', {productId});
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        log('No Token Found');
        setLoading(false);
        setErrorMessage('No token found');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      const {ok, data} = await deleteProductApi(token, productId);
      log('Delete Product Response', {ok, data});
      setLoading(false);

      if (ok) {
        setSuccessMessage(data?.msg || 'Product deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        await fetchUserProducts();
        setProductOptionsVisible(false);
      } else {
        setErrorMessage(data?.msg || 'Failed to delete product');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (err) {
      log('Delete Product Error', {error: err.message});
      setLoading(false);
      setErrorMessage('Something went wrong');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const renderProductItem = ({item}) => {
    const updatedAt = item.updatedAt
      ? new Date(item.updatedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'No date available';

    return (
      <TouchableOpacity
        style={styles.productItem}
        onPress={() =>
          navigation.navigate('ProductDetail', {productId: item.id})
        }
        onLongPress={() => {
          log('Product Long Press', {productId: item.id});
          setSelectedProduct(item);
          setProductOptionsVisible(true);
        }}>
        <Image
          source={{
            uri: item.media[0]?.url || 'https://via.placeholder.com/120',
          }}
          style={styles.productImage}
          resizeMode="contain"
          onError={error =>
            log('Product Image Error', {error: error.nativeEvent})
          }
        />
        <View style={styles.productOverlay}>
          <Text
            style={styles.productTitle}
            numberOfLines={2}
            ellipsizeMode="tail">
            {item.name}
          </Text>
          <Line />
          <Text
            style={styles.productTitle}
            numberOfLines={1}
            ellipsizeMode="tail">
            ₹{item.price}
          </Text>
          <Line />
          <Text
            style={styles.productDate}
            numberOfLines={1}
            ellipsizeMode="tail">
            {updatedAt}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderReelItem = ({item}) => {
    const updatedAt = item.updatedAt
      ? new Date(item.updatedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'No date available';

    return (
      <TouchableOpacity
        style={styles.productItem}
        onPress={() => {
          log('Reel Clicked', {reelId: item._id});
          navigation.navigate('ReelView', {reel: item});
        }}>
        <Image
          source={{uri: item.thumbnail || 'https://via.placeholder.com/120'}}
          style={styles.productImage}
          resizeMode="contain"
          onError={error =>
            log('Reel Thumbnail Error', {error: error.nativeEvent})
          }
        />
        <View style={styles.productOverlay}>
          <Text
            style={styles.productTitle}
            numberOfLines={2}
            ellipsizeMode="tail">
            {item.caption || 'No caption'}
          </Text>
          <Line />
          <Text
            style={styles.productDate}
            numberOfLines={1}
            ellipsizeMode="tail">
            {updatedAt}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* <Header
        title=""
        onLeftPress={() => navigation.goBack()}
        rightIcon1={img.App}
        onRightPress1={() => navigation.navigate('Message')}
        showRightIcon1
        rightIcon2={img.drawer}
        onRightPress2={() => setSidebarVisible(true)}
        showRightIcon2
      /> */}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} />
        }>
        <View style={styles.profileCard}>
          <TouchableOpacity style={{alignSelf:"flex-end",paddingHorizontal:20}} onPress={()=>setSidebarVisible(true)}>
            <Icon
              name="settings"
              size={24}
              // color={selectedCategory === item.id ? '#10B981' : '#6B7280'}
            />
          </TouchableOpacity>
          <Pressable
            onPress={() => setImageModalVisible(true)}
            style={styles.profileImageContainer}>
            <Image
              source={profileImage ? {uri: profileImage} : img.user}
              style={styles.profileImage}
              resizeMode="cover"
              onError={error =>
                log('Profile Image Error', {error: error.nativeEvent})
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
        </View>

        <View style={styles.collectionsSection}>
          <View style={styles.tabsContainer}>
            <Button
             icon={
              <AntDesign
                name="appstore1"
                size={20}
                color={activeTab === 'products' ? Colors.pink : '#6B7280'}
              />
            }
              
              onPress={() => {
                setActiveTab('products');
              }}
              style={[
                styles.tabButton,
                activeTab === 'products' && styles.activeTabButton,
              ]}
              textStyle={[
                styles.tabButtonText,
                activeTab === 'products' && styles.activeTabButtonText,
              ]}
            />
            <Button
              title=""
              icon={
                <AntDesign
                  name="playcircleo"
                  size={20}
                  color={activeTab === 'reels' ? Colors.pink : '#6B7280'}
                />
              }
              onPress={() => {
                log('Reels Button Clicked');
                setActiveTab('reels');
              }}
              style={[
                styles.tabButton,
                activeTab === 'reels' && styles.activeTabButton,
              ]}
              textStyle={[
                styles.tabButtonText,
                activeTab === 'reels' && styles.activeTabButtonText,
              ]}
            />
            <Button
               icon={
                <AntDesign
                  name="shoppingcart"
                  size={20}
                  color={activeTab === 'cart' ? Colors.pink : '#6B7280'}
                />
              }
              onPress={() => {
                log('Cart Button Clicked');
                setActiveTab('cart');
              }}
              style={[
                styles.tabButton,
                activeTab === 'cart' && styles.activeTabButton,
              ]}
              textStyle={[
                styles.tabButtonText,
                activeTab === 'cart' && styles.activeTabButtonText,
              ]}
            />
            <Button
               icon={
                <AntDesign
                  name="hearto"
                  size={20}
                  color={activeTab === 'wishlist' ? Colors.pink : '#6B7280'}
                />
              }
              onPress={() => {
                log('Wishlist Button Clicked');
                setActiveTab('wishlist');
              }}
              style={[
                styles.tabButton,
                activeTab === 'wishlist' && styles.activeTabButton,
              ]}
              textStyle={[
                styles.tabButtonText,
                activeTab === 'wishlist' && styles.activeTabButtonText,
              ]}
            />
          </View>

          {activeTab === 'reels' ? (
            reels.length > 0 ? (
              <FlatList
                data={reels}
                renderItem={renderReelItem}
                keyExtractor={item => item._id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.collectionsListVertical}
              />
            ) : (
              <View style={styles.emptyStateContainer}>
                <Image source={img.camera} style={styles.emptyStateIcon} />
                <Text style={styles.emptyStateTitle}>
                  Capture the moment with a friend
                </Text>
                <Button
                  title="Upload Reel"
                  onPress={() => {
                    log('Upload Reel Clicked');
                    navigation.navigate('UploadReel');
                  }}
                  style={styles.uploadButton}
                  textStyle={styles.uploadButtonText}
                />
              </View>
            )
          ) : activeTab === 'products' ? (
            products.length > 0 ? (
              <FlatList
                data={products}
                renderItem={renderProductItem}
                keyExtractor={item =>
                  item.id?.toString() || Math.random().toString()
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.collectionsListVertical}
              />
            ) : (
              <View style={styles.emptyStateContainer}>
                <Image source={img.post} style={styles.emptyStateIcon} />
                <Text style={styles.emptyStateTitle}>
                  Create your first post
                </Text>
                <Button
                  title="Add Product"
                  onPress={() => {
                    log('Add Product Clicked');
                    setCurrentProduct(null);
                    setProductModalVisible(true);
                  }}
                  style={styles.uploadButton}
                  textStyle={styles.uploadButtonText}
                />
              </View>
            )
          ) : activeTab === 'cart' ? (
            <View style={styles.emptyStateContainer}>
              <Image source={img.post} style={styles.emptyStateIcon} />
              <Text style={styles.emptyStateTitle}>Your cart is empty</Text>
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Image source={img.post} style={styles.emptyStateIcon} />
              <Text style={styles.emptyStateTitle}>Your wishlist is empty</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <CustomModal
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        title="Are you sure you want to logout?"
        buttons={[
          {
            text: 'Cancel',
            onPress: () => setModalVisible(false),
            style: styles.modalButtonCancel,
          },
          {
            text: 'Logout',
            onPress: handleLogout,
            style: styles.modalButtonLogout,
            textStyle: styles.modalButtonText,
          },
        ]}
      />

      <CustomModal
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
        title="Edit Profile"
        overlayStyle={styles.modalOverlay}
        containerStyle={styles.editModalContainer}
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
        ]}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#6B7280"
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={[styles.input, {marginTop: 15 * scaleFactor}]}
          placeholder="Username"
          placeholderTextColor="#6B7280"
          autoCapitalize="none"
          value={userName}
          onChangeText={setUserName}
        />
      </CustomModal>

      <CustomModal
        visible={imageModalVisible}
        onRequestClose={() => setImageModalVisible(false)}
        title="Update Profile Picture"
        overlayStyle={styles.modalOverlay}
        containerStyle={styles.editModalContainer}
        buttons={[
          {
            text: 'Choose from Gallery',
            onPress: openGallery,
            style: styles.modalButton,
          },
          {text: 'Open Camera', onPress: openCamera, style: styles.modalButton},
          {
            text: 'Cancel',
            onPress: () => setImageModalVisible(false),
            style: styles.modalButtonCancel,
          },
        ]}
      />

      <ProductModal
        visible={productModalVisible}
        onClose={() => setProductModalVisible(false)}
        onSubmit={handleSubmitProduct}
        product={currentProduct}
      />

      {sidebarVisible && (
        <Pressable
          style={styles.sidebarOverlay}
          onPress={() => setSidebarVisible(false)}>
          <View style={styles.sidebar}>
            <TouchableOpacity
              style={styles.sidebarItem}
              onPress={() => {
                log('Edit Profile Clicked');
                setEditModalVisible(true);
                setSidebarVisible(false);
              }}>
              <Text style={styles.sidebarText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sidebarItem}
              onPress={() => {
                log('Logout Clicked');
                setModalVisible(true);
                setSidebarVisible(false);
              }}>
              <Text style={styles.sidebarText}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sidebarItem}
              onPress={() => {
                log('Settings Clicked');
                Toast.show({type: 'info', text1: 'Settings coming soon'});
                setSidebarVisible(false);
              }}>
              <Text style={styles.sidebarText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      )}

      <CustomModal
        visible={productOptionsVisible}
        onRequestClose={() => setProductOptionsVisible(false)}
        title="Product Options"
        overlayStyle={styles.modalOverlay}
        containerStyle={styles.editModalContainer}
        buttons={[
          {
            text: 'Edit',
            onPress: () => {
              log('Edit Product Option Clicked', {
                productId: selectedProduct?.id,
              });
              handleEditProduct(selectedProduct);
              setProductOptionsVisible(false);
            },
            style: styles.modalButton,
          },
          {
            text: 'Delete',
            onPress: () => {
              log('Delete Product Option Clicked', {
                productId: selectedProduct?.id,
              });
              handleDeleteProduct(selectedProduct?.id);
            },
            style: styles.modalButtonLogout,
          },
          {
            text: 'Cancel',
            onPress: () => setProductOptionsVisible(false),
            style: styles.modalButtonCancel,
          },
        ]}
      />

      {successMessage && (
        <View style={styles.toastContainerSuccess}>
          <Text style={styles.toastTextSuccess}>{successMessage}</Text>
        </View>
      )}
      {errorMessage && (
        <View style={styles.toastContainerError}>
          <Text style={styles.toastTextError}>{errorMessage}</Text>
        </View>
      )}

      <Loader visible={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  scrollContent: {
    paddingBottom: 20 * scaleFactor,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 20 * scaleFactor,
    backgroundColor: '#FFFFFF',
    borderRadius: 10 * scaleFactor,
    marginHorizontal: 30 * scaleFactor,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 10 * scaleFactor,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 10 * scaleFactor,
  },
  profileImage: {
    width: 80 * scaleFactor,
    height: 80 * scaleFactor,
    borderRadius: 40 * scaleFactor,
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  editIcon: {
    position: 'absolute',
    bottom: -5 * scaleFactor,
    right: -5 * scaleFactor,
    backgroundColor: '#3B82F6',
    borderRadius: 10 * scaleFactor,
    width: 20 * scaleFactor,
    height: 20 * scaleFactor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconText: {
    fontSize: 12 * scaleFactor,
    color: '#FFFFFF',
  },
  name: {
    fontSize: 20 * scaleFactor,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 5 * scaleFactor,
  },
  bio: {
    fontSize: 14 * scaleFactor,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20 * scaleFactor,
    marginBottom: 10 * scaleFactor,
  },
  collectionsSection: {
    marginHorizontal: 8 * scaleFactor,
    marginTop: 20 * scaleFactor,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20 * scaleFactor,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    paddingVertical: 12 * scaleFactor,
    paddingHorizontal: 25 * scaleFactor,
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: Colors.pink,
  },
  tabButtonText: {
    fontSize: 14 * scaleFactor,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: Colors.pink,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40 * scaleFactor,
    paddingHorizontal: 20 * scaleFactor,
  },
  emptyStateIcon: {
    width: 80 * scaleFactor,
    height: 80 * scaleFactor,
    marginBottom: 20 * scaleFactor,
    tintColor: '#9CA3AF',
  },
  emptyStateTitle: {
    fontSize: 16 * scaleFactor,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20 * scaleFactor,
  },
  uploadButton: {
    backgroundColor: Colors.pink,
    paddingVertical: 12 * scaleFactor,
    paddingHorizontal: 30 * scaleFactor,
    borderRadius: 8 * scaleFactor,
  },
  uploadButtonText: {
    fontSize: 14 * scaleFactor,
    fontWeight: '600',
    color: Colors.White,
  },
  productItem: {
    alignSelf: 'center',
    width: '90%',
    minHeight: 100 * scaleFactor,
    marginBottom: 10 * scaleFactor,
    borderRadius: 10 * scaleFactor,
    overflow: 'hidden',
    elevation: 3,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 120 * scaleFactor,
    height: '90%',
    borderTopLeftRadius: 10 * scaleFactor,
    borderBottomLeftRadius: 10 * scaleFactor,
    marginLeft: 10,
  },
  productOverlay: {
    padding: 5 * scaleFactor,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    paddingLeft: 20 * scaleFactor,
    borderRadius: 10 * scaleFactor,
    marginLeft: 10 * scaleFactor,
    width: '54%',
  },
  productTitle: {
    fontSize: 14 * scaleFactor,
    color: '#1F2937',
    fontWeight: '500',
  },
  productDate: {
    fontSize: 12 * scaleFactor,
    color: '#6B7280',
  },
  collectionsListVertical: {
    paddingBottom: 10 * scaleFactor,
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  sidebar: {
    width: width * 0.3,
    backgroundColor: Colors.lightPurple,
    padding: 10 * scaleFactor,
    borderBottomLeftRadius: 20 * scaleFactor,
    alignSelf: 'flex-end',
  },
  sidebarItem: {
    paddingVertical: 12 * scaleFactor,
    paddingHorizontal: 10 * scaleFactor,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sidebarText: {
    fontSize: 12 * scaleFactor,
    color: '#1F2937',
    fontWeight: '500',
  },
  modalOverlay: {
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  editModalContainer: {
    width,
    padding: 20 * scaleFactor,
    borderTopLeftRadius: 20 * scaleFactor,
    borderTopRightRadius: 20 * scaleFactor,
    backgroundColor: '#FFFFFF',
  },
  modalButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10 * scaleFactor,
    paddingHorizontal: 20 * scaleFactor,
    borderRadius: 8 * scaleFactor,
    marginVertical: 5 * scaleFactor,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#6B7280',
    paddingVertical: 10 * scaleFactor,
    paddingHorizontal: 20 * scaleFactor,
    borderRadius: 8 * scaleFactor,
    marginVertical: 5 * scaleFactor,
    alignItems: 'center',
  },
  modalButtonSave: {
    backgroundColor: '#10B981',
    paddingVertical: 10 * scaleFactor,
    paddingHorizontal: 20 * scaleFactor,
    borderRadius: 8 * scaleFactor,
    marginVertical: 5 * scaleFactor,
    alignItems: 'center',
  },
  modalButtonLogout: {
    backgroundColor: '#EF4444',
    paddingVertical: 10 * scaleFactor,
    paddingHorizontal: 20 * scaleFactor,
    borderRadius: 8 * scaleFactor,
    marginVertical: 5 * scaleFactor,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16 * scaleFactor,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8 * scaleFactor,
    padding: 10 * scaleFactor,
    fontSize: 16 * scaleFactor,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  toastContainerSuccess: {
    position: 'absolute',
    bottom: 20 * scaleFactor,
    alignSelf: 'center',
    backgroundColor: '#10B981',
    padding: 10 * scaleFactor,
    borderRadius: 8 * scaleFactor,
    elevation: 5,
  },
  toastTextSuccess: {
    color: '#FFFFFF',
    fontSize: 14 * scaleFactor,
  },
  toastContainerError: {
    position: 'absolute',
    bottom: 20 * scaleFactor,
    alignSelf: 'center',
    backgroundColor: '#EF4444',
    padding: 10 * scaleFactor,
    borderRadius: 8 * scaleFactor,
    elevation: 5,
  },
  toastTextError: {
    color: '#FFFFFF',
    fontSize: 14 * scaleFactor,
  },
});

export default Profile;
