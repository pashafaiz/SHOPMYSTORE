import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  Easing,
  ActivityIndicator,
  Image,
  FlatList,
  Modal,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchCheckoutProductDetails,
  fetchAddresses,
  addAddress,
  deleteAddress,
  validatePromoCode,
  placeOrder,
  setSelectedAddressId,
  setPromoCode,
  setPaymentMethod,
  clearDiscount,
} from '../redux/slices/checkoutSlice';
import Header from '../Components/Header';
import {
  TOAST_POSITION,
  TOAST_TOP_OFFSET,
  DEFAULT_IMAGE_URL,
} from '../constants/GlobalConstants';

const { width, height } = Dimensions.get('window');
const scaleFactor = Math.min(width, 375) / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375) * 0.75);

const Checkout = ({ route, navigation }) => {
  const { productId, quantity, size, color } = route.params || {};
  const dispatch = useDispatch();
  const {
    product,
    addresses,
    selectedAddressId,
    discount,
    promoCode,
    paymentMethod,
    loading,
    isActionLoading,
    error,
  } = useSelector((state) => state.checkout);
  const { userId, token } = useSelector((state) => state.productDetail);

  const [newAddress, setNewAddress] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    alternatePhone: '',
    isDefault: false,
  });
  const [isAddressModalVisible, setAddressModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const skeletonPulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    console.log('Checkout: productId=', productId);
    console.log('Checkout: initial state=', { product, addresses, error });
    if (productId && (!product || product._id !== productId)) {
      dispatch(fetchCheckoutProductDetails({ productId }));
    }
    dispatch(fetchAddresses());
  }, [productId, product, dispatch]);

  useEffect(() => {
    // Content animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // Skeleton loader pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonPulse, {
          toValue: 0.8,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(skeletonPulse, {
          toValue: 0.4,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    if (error) {
      Toast.show({
        type: 'error',
        text1: error,
        position: TOAST_POSITION,
        topOffset: TOAST_TOP_OFFSET,
      });
    }
  }, [fadeAnim, slideUpAnim, scaleAnim, skeletonPulse, error]);

  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    console.log('Checkout: Refreshing data');
    await Promise.all([
      dispatch(fetchCheckoutProductDetails({ productId })),
      dispatch(fetchAddresses()),
    ]);
    setRefreshing(false);
  };

  const applyPromoCode = () => {
    if (!promoCode.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Enter a promo code',
        position: TOAST_POSITION,
        topOffset: TOAST_TOP_OFFSET,
      });
      return;
    }
    dispatch(validatePromoCode({ code: promoCode }));
  };

  const handleAddAddress = () => {
    if (!newAddress.address || !newAddress.city || !newAddress.state || !newAddress.zipCode) {
      Toast.show({
        type: 'error',
        text1: 'Fill all required address fields',
        position: TOAST_POSITION,
        topOffset: TOAST_TOP_OFFSET,
      });
      return;
    }
    if (newAddress.alternatePhone && !/^[6-9]\d{9}$/.test(newAddress.alternatePhone)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid alternate phone number',
        position: TOAST_POSITION,
        topOffset: TOAST_TOP_OFFSET,
      });
      return;
    }
    dispatch(addAddress({ ...newAddress, isDefault: addresses.length === 0 }));
    setAddressModalVisible(false);
    setNewAddress({
      address: '',
      city: '',
      state: '',
      zipCode: '',
      alternatePhone: '',
      isDefault: false,
    });
  };

  const handleDeleteAddress = (id) => {
    if (addresses.length === 1) {
      Toast.show({
        type: 'error',
        text1: 'Cannot delete default address',
        position: TOAST_POSITION,
        topOffset: TOAST_TOP_OFFSET,
      });
      return;
    }
    dispatch(deleteAddress({ addressId: id }));
  };

  const calculateTotal = () => {
    if (!product?.price) return 0;
    const subtotal = product.price * quantity;
    const shipping = 50;
    const tax = subtotal * 0.05;
    const discountAmount = subtotal * (discount / 100);
    return (subtotal + shipping + tax - discountAmount).toFixed(2);
  };

  const getEstimatedDelivery = () => {
    const today = new Date();
    today.setDate(today.getDate() + 5);
    return today.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const handleConfirmOrder = async () => {
    if (!userId || !token) {
      Toast.show({
        type: 'error',
        text1: 'Please login',
        position: TOAST_POSITION,
        topOffset: TOAST_TOP_OFFSET,
      });
      return;
    }

    if (!selectedAddressId) {
      Toast.show({
        type: 'error',
        text1: 'Select a delivery address',
        position: TOAST_POSITION,
        topOffset: TOAST_TOP_OFFSET,
      });
      return;
    }

    const selectedAddress = addresses.find((addr) => addr._id === selectedAddressId);
    const orderData = {
      productId,
      quantity,
      size,
      color,
      address: {
        address: selectedAddress.address,
        city: selectedAddress.city,
        state: selectedAddress.state,
        zipCode: selectedAddress.zipCode,
        alternatePhone: selectedAddress.alternatePhone || '',
      },
      paymentMethod,
      promoCode: discount > 0 ? promoCode : null,
      total: calculateTotal(),
    };

    console.log('Checkout: Placing order with data=', orderData);
    dispatch(placeOrder(orderData)).then((action) => {
      console.log('Checkout: placeOrder action=', action);
      if (action.meta.requestStatus === 'fulfilled') {
        console.log('Checkout: Navigating to OrderConfirmation with order=', action.payload, 'and product=', product);
        navigation.navigate('OrderConfirmation', {
          orderId: action.payload._id,
          order: action.payload,
          product: product, // Pass the product details directly
        });
      } else {
        Toast.show({
          type: 'error',
          text1: action.payload || 'Failed to place order',
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
        });
      }
    });
  };

  const renderAddressItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.addressCard,
        selectedAddressId === item._id && styles.addressCardSelected,
      ]}
      onPress={() => dispatch(setSelectedAddressId(item._id))}
    >
      <LinearGradient
        colors={selectedAddressId === item._id ? ['#7B61FF', '#AD4DFF'] : ['#1A0B3B', '#2E1A5C']}
        style={styles.addressGradient}
      >
        <View style={styles.addressContent}>
          <Text style={styles.addressText}>
            {item.address}, {item.city}, {item.state} - {item.zipCode}
          </Text>
          {item.alternatePhone && <Text style={styles.alternatePhone}>Alt: {item.alternatePhone}</Text>}
          {item.isDefault && <Text style={styles.defaultBadge}>Default</Text>}
        </View>
        <TouchableOpacity
          style={styles.deleteAddressButton}
          onPress={() => handleDeleteAddress(item._id)}
        >
          <Ionicons name="trash-outline" size={scale(16)} color="#FF3E6D" />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderSkeletonLoader = () => (
    <Animated.View style={{ opacity: skeletonPulse }}>
      <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.productCard}>
          <View style={[styles.productImage, styles.skeletonBox]} />
          <View style={styles.productDetails}>
            <View style={[styles.skeletonText, { width: '80%', marginBottom: scale(5) }]} />
            <View style={[styles.skeletonText, { width: '60%', marginBottom: scale(5) }]} />
            <View style={[styles.skeletonText, { width: '40%' }]} />
          </View>
        </View>
      </LinearGradient>

      <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <View style={[styles.skeletonBox, { height: scale(60), marginBottom: scale(12) }]} />
      </LinearGradient>

      <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.section}>
        <Text style={styles.sectionTitle}>Price Details</Text>
        <View style={[styles.skeletonText, { width: '100%', marginBottom: scale(10) }]} />
        <View style={[styles.skeletonText, { width: '100%', marginBottom: scale(10) }]} />
        <View style={[styles.skeletonText, { width: '100%' }]} />
      </LinearGradient>
    </Animated.View>
  );

  if (loading && !product && !addresses.length) {
    return (
      <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.container}>
        <Header
          showLeftIcon={true}
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
          title="Checkout"
          textStyle={{ color: '#FFFFFF' }}
        />
        {renderSkeletonLoader()}
      </LinearGradient>
    );
  }

  if (!product && !loading) {
    return (
      <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.container}>
        <Header
          showLeftIcon={true}
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
          title="Checkout"
          textStyle={{ color: '#FFFFFF' }}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load checkout details</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => dispatch(fetchCheckoutProductDetails({ productId }))}
          >
            <LinearGradient
              colors={['#7B61FF', '#AD4DFF']}
              style={styles.retryButtonGradient}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.container}>
      <Header
        showLeftIcon={true}
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        title="Checkout"
        textStyle={{ color: '#FFFFFF' }}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }, { scale: scaleAnim }] }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#7B61FF"
              colors={['#7B61FF', '#AD4DFF']}
            />
          }
        >
          <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.productCard}>
              <Image
                source={{ uri: product?.media?.[0]?.url || DEFAULT_IMAGE_URL }}
                style={styles.productImage}
                resizeMode="contain"
              />
              <View style={styles.productDetails}>
                <Text style={styles.productName} numberOfLines={2}>{product.name || 'Product'}</Text>
                <Text style={styles.productPrice}>₹{(product.price * quantity).toFixed(2)}</Text>
                <Text style={styles.productDetail}>Qty: {quantity}</Text>
                {size && <Text style={styles.productDetail}>Size: {size}</Text>}
                {color && <Text style={styles.productDetail}>Color: {color}</Text>}
              </View>
            </View>
            <Text style={styles.deliveryInfo}>Delivery: {getEstimatedDelivery()}</Text>
          </LinearGradient>

          <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              <TouchableOpacity onPress={() => setAddressModalVisible(true)}>
                <Text style={styles.addAddressText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={addresses}
              renderItem={renderAddressItem}
              keyExtractor={(item) => item._id}
              ListEmptyComponent={<Text style={styles.noAddressText}>Add an address</Text>}
              scrollEnabled={false}
            />
          </LinearGradient>

          <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.section}>
            <Text style={styles.sectionTitle}>Promo Code</Text>
            <View style={styles.promoContainer}>
              <TextInput
                style={styles.promoInput}
                placeholder="Enter code (e.g., SAVE10)"
                placeholderTextColor="#B0B0D0"
                value={promoCode}
                onChangeText={(text) => dispatch(setPromoCode(text))}
              />
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyPromoCode}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                disabled={isActionLoading}
              >
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <LinearGradient
                    colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']}
                    style={styles.applyButtonGradient}
                  >
                    <Text style={styles.applyButtonText}>Apply</Text>
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>
            </View>
            {discount > 0 && (
              <Text style={styles.discountText}>{discount}% off applied</Text>
            )}
          </LinearGradient>

          <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            {[
              { id: 'credit_card', label: 'Card', icon: 'card-outline' },
              { id: 'upi', label: 'UPI', icon: 'phone-portrait-outline' },
              { id: 'net_banking', label: 'Net Banking', icon: 'business-outline' },
              { id: 'wallet', label: 'Wallet', icon: 'wallet-outline' },
              { id: 'cod', label: 'COD', icon: 'cash-outline' },
            ].map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentOption,
                  paymentMethod === method.id && styles.paymentOptionSelected,
                ]}
                onPress={() => dispatch(setPaymentMethod(method.id))}
              >
                <Ionicons
                  name={method.icon}
                  size={scale(20)}
                  color={paymentMethod === method.id ? '#7B61FF' : '#FFFFFF'}
                />
                <Text
                  style={[
                    styles.paymentOptionText,
                    paymentMethod === method.id && styles.paymentOptionTextSelected,
                  ]}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </LinearGradient>

          <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.section}>
            <Text style={styles.sectionTitle}>Price Details</Text>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>₹{(product.price * quantity).toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Shipping</Text>
              <Text style={styles.totalValue}>₹50.00</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>₹{(product.price * quantity * 0.05).toFixed(2)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={[styles.totalValue, styles.discountValue]}>-₹{(product.price * quantity * (discount / 100)).toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.totalRow, styles.totalRowFinal]}>
              <Text style={[styles.totalLabel, styles.totalLabelFinal]}>Total</Text>
              <Text style={[styles.totalValue, styles.totalValueFinal]}>₹{calculateTotal()}</Text>
            </View>
          </LinearGradient>
        </ScrollView>


 <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmOrder}
          onPressIn={handleButtonPressIn}
          onPressOut={handleButtonPressOut}
          disabled={isActionLoading}
        >
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <LinearGradient
              colors={['#7B61FF', '#AD4DFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.continueButtonText}>Place Order</Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>


      </Animated.View>

      <Modal
        visible={isAddressModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Street Address"
              placeholderTextColor="#B0B0D0"
              value={newAddress.address}
              onChangeText={(text) => setNewAddress({ ...newAddress, address: text })}
            />
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputHalf]}
                placeholder="City"
                placeholderTextColor="#B0B0D0"
                value={newAddress.city}
                onChangeText={(text) => setNewAddress({ ...newAddress, city: text })}
              />
              <TextInput
                style={[styles.input, styles.inputHalf]}
                placeholder="State"
                placeholderTextColor="#B0B0D0"
                value={newAddress.state}
                onChangeText={(text) => setNewAddress({ ...newAddress, state: text })}
              />
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputHalf]}
                placeholder="Zip Code"
                placeholderTextColor="#B0B0D0"
                value={newAddress.zipCode}
                onChangeText={(text) => setNewAddress({ ...newAddress, zipCode: text })}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.inputHalf]}
                placeholder="Alt. Phone (Optional)"
                placeholderTextColor="#B0B0D0"
                value={newAddress.alternatePhone}
                onChangeText={(text) => setNewAddress({ ...newAddress, alternatePhone: text })}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setAddressModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddAddress}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                disabled={isActionLoading}
              >
                <LinearGradient
                  colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>Add</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    padding: scale(16),
    paddingBottom: scale(100),
  },
  section: {
    borderRadius: scale(10),
    padding: scale(16),
    marginBottom: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.4,
    shadowRadius: scale(6),
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  sectionTitle: {
    fontSize: scaleFont(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addAddressText: {
    fontSize: scaleFont(11),
    fontWeight: '600',
    color: '#7B61FF',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: scale(8),
    padding: scale(14),
    marginBottom: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.1)',
  },
  productImage: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(6),
    marginRight: scale(14),
    backgroundColor: '#F0F0F0',
  },
  productDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: scaleFont(13),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: scale(5),
  },
  productPrice: {
    fontSize: scaleFont(13),
    fontWeight: '700',
    color: '#7B61FF',
    marginBottom: scale(5),
  },
  productDetail: {
    fontSize: scaleFont(11),
    color: '#B0B0D0',
    marginBottom: scale(3),
  },
  deliveryInfo: {
    fontSize: scaleFont(11),
    color: '#00C4B4',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: scale(10),
  },
  addressCard: {
    borderRadius: scale(8),
    marginBottom: scale(12),
    overflow: 'hidden',
  },
  addressGradient: {
    padding: scale(14),
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressCardSelected: {
    borderWidth: 1,
    borderColor: '#7B61FF',
  },
  addressContent: {
    flex: 1,
    marginRight: scale(12),
  },
  addressText: {
    fontSize: scaleFont(11),
    color: '#FFFFFF',
    marginBottom: scale(3),
  },
  alternatePhone: {
    fontSize: scaleFont(11),
    color: '#B0B0D0',
    marginBottom: scale(3),
  },
  defaultBadge: {
    fontSize: scaleFont(10),
    color: '#00C4B4',
    fontWeight: '600',
  },
  deleteAddressButton: {
    padding: scale(10),
  },
  noAddressText: {
    fontSize: scaleFont(11),
    color: '#B0B0D0',
    textAlign: 'center',
    marginVertical: scale(12),
  },
  promoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  promoInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.1)',
    borderRadius: scale(6),
    padding: scale(12),
    fontSize: scaleFont(11),
    color: '#FFFFFF',
    marginRight: scale(12),
  },
  applyButton: {
    borderRadius: scale(6),
    overflow: 'hidden',
  },
  applyButtonGradient: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: scaleFont(11),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  discountText: {
    fontSize: scaleFont(11),
    color: '#00C4B4',
    fontWeight: '600',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(14),
    borderRadius: scale(6),
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: scale(10),
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.1)',
  },
  paymentOptionSelected: {
    borderColor: '#7B61FF',
    backgroundColor: 'rgba(123, 97, 255, 0.1)',
  },
  paymentOptionText: {
    fontSize: scaleFont(11),
    color: '#FFFFFF',
    marginLeft: scale(16),
  },
  paymentOptionTextSelected: {
    color: '#7B61FF',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(10),
  },
  totalRowFinal: {
    marginTop: scale(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(123, 97, 255, 0.2)',
    paddingTop: scale(10),
  },
  totalLabel: {
    fontSize: scaleFont(11),
    color: '#B0B0D0',
  },
  totalLabelFinal: {
    fontSize: scaleFont(13),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: scaleFont(11),
    color: '#FFFFFF',
  },
  totalValueFinal: {
    fontSize: scaleFont(13),
    fontWeight: '700',
    color: '#7B61FF',
  },
  discountValue: {
    color: '#00C4B4',
  },
  confirmButton: {
    position: 'absolute',
    bottom: scale(16),
    left: scale(35),
    right: scale(35),
    borderRadius: scale(10),
    overflow: 'hidden',
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.4,
    shadowRadius: scale(6),
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: scale(14),
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: scaleFont(13),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(16),
  },
  errorText: {
    fontSize: scaleFont(13),
    color: '#FFFFFF',
    marginBottom: scale(20),
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: scale(10),
    overflow: 'hidden',
  },
  retryButtonGradient: {
    paddingVertical: scale(14),
    paddingHorizontal: scale(40),
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: scaleFont(13),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: scale(20),
  },
  modalContent: {
    borderRadius: scale(10),
    padding: scale(20),
    backgroundColor: '#1A0B3B',
  },
  modalTitle: {
    fontSize: scaleFont(15),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: scale(16),
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.1)',
    borderRadius: scale(6),
    padding: scale(12),
    fontSize: scaleFont(11),
    color: '#FFFFFF',
    marginBottom: scale(12),
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputHalf: {
    width: '48%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scale(16),
  },
  cancelButton: {
    flex: 1,
    borderRadius: scale(6),
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.1)',
    paddingVertical: scale(12),
    alignItems: 'center',
    marginRight: scale(10),
  },
  cancelButtonText: {
    fontSize: scaleFont(11),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    borderRadius: scale(6),
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: scale(12),
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: scaleFont(11),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  skeletonBox: {
    backgroundColor: 'rgba(123, 97, 255, 0.1)',
    borderRadius: scale(8),
  },
  skeletonText: {
    backgroundColor: 'rgba(123, 97, 255, 0.1)',
    height: scale(12),
    borderRadius: scale(4),
  },
});

export default Checkout;