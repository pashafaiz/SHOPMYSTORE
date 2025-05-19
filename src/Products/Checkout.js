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
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Toast from 'react-native-toast-message';
import { useSelector, useDispatch } from 'react-redux';
import RazorpayCheckout from 'react-native-razorpay';
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
  createRazorpayOrder,
} from '../redux/slices/checkoutSlice';
import Header from '../Components/Header';

const { width, height } = Dimensions.get('window');
const scaleFactor = Math.min(width, 375) / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375) * 0.85); // Increased multiplier from 0.75 to 0.85

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
  const userEmail = useSelector((state) => state.auth?.user?.email) || 'customer@example.com';

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
  const [isPaymentLoading, setPaymentLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('delivery');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (productId && (!product || product._id !== productId)) {
      dispatch(fetchCheckoutProductDetails({ productId }));
    }
    dispatch(fetchAddresses());
  }, [productId, product, dispatch]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    if (error) {
      Toast.show({
        type: 'error',
        text1: error,
        position: 'top',
        topOffset: Platform.OS === 'ios' ? 50 : 30,
      });
    }
  }, [fadeAnim, slideUpAnim, error]);

  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
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
        text1: 'Please enter a promo code',
        position: 'top',
        topOffset: Platform.OS === 'ios' ? 50 : 30,
      });
      return;
    }
    dispatch(validatePromoCode({ code: promoCode }));
  };

  const handleAddAddress = () => {
    if (!newAddress.address || !newAddress.city || !newAddress.state || !newAddress.zipCode) {
      Toast.show({
        type: 'error',
        text1: 'Please fill all required fields',
        position: 'top',
        topOffset: Platform.OS === 'ios' ? 50 : 30,
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
        text1: 'You must have at least one address',
        position: 'top',
        topOffset: Platform.OS === 'ios' ? 50 : 30,
      });
      return;
    }
    dispatch(deleteAddress({ addressId: id }));
  };

  const calculateTotal = () => {
    if (!product?.price) return 0;
    const subtotal = product.price * quantity;
    const shipping = 50; // Match backend shipping value
    const tax = subtotal * 0.05;
    const discountAmount = subtotal * (discount / 100);
    return (subtotal + shipping + tax - discountAmount).toFixed(2);
  };

  const getEstimatedDelivery = () => {
    const today = new Date();
    today.setDate(today.getDate() + 3);
    return today.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const handleConfirmOrder = async () => {
    if (!userId || !token) {
      Toast.show({
        type: 'error',
        text1: 'Please login to continue',
        position: 'top',
        topOffset: Platform.OS === 'ios' ? 50 : 30,
      });
      return;
    }

    if (!selectedAddressId) {
      Toast.show({
        type: 'error',
        text1: 'Please select a delivery address',
        position: 'top',
        topOffset: Platform.OS === 'ios' ? 50 : 30,
      });
      return;
    }

    const selectedAddress = addresses.find((addr) => addr._id === selectedAddressId);
    if (!selectedAddress) {
      Toast.show({
        type: 'error',
        text1: 'Invalid address selected',
        position: 'top',
        topOffset: Platform.OS === 'ios' ? 50 : 30,
      });
      return;
    }

    if (!paymentMethod) {
      Toast.show({
        type: 'error',
        text1: 'Please select a payment method',
        position: 'top',
        topOffset: Platform.OS === 'ios' ? 50 : 30,
      });
      return;
    }

    const total = calculateTotal();
    let orderData = {
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
      total,
    };

    try {
      setPaymentLoading(true);

      if (paymentMethod !== 'cod') {
        // Send amount in rupees (backend will convert to paise)
        const razorpayOrderResponse = await dispatch(
          createRazorpayOrder({ amount: parseFloat(total) })
        ).unwrap();
        const { id: razorpayOrderId, amount: razorpayAmount, currency } = razorpayOrderResponse;

        const options = {
          key: process.env.RAZORPAY_KEY_ID || 'rzp_test_9r6fi8ChH5mImP', // Use env variable or fallback
          amount: razorpayAmount.toString(), // Amount in paise from backend
          currency,
          order_id: razorpayOrderId,
          name: 'Premium Store',
          description: `Order for ${product?.name || 'Product'}`,
          prefill: {
            email: userEmail,
            contact: selectedAddress.alternatePhone || '9999999999',
          },
          theme: { color: '#5b9cff' },
        };

        console.log('Razorpay options:', options);

        RazorpayCheckout.open(options)
          .then(async (response) => {
            console.log('Razorpay payment response:', response);
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;

            orderData = {
              ...orderData,
              razorpayOrderId: razorpay_order_id,
              razorpayPaymentId: razorpay_payment_id,
              razorpaySignature: razorpay_signature,
            };

            const placeOrderAction = await dispatch(placeOrder(orderData)).unwrap();
            navigation.navigate('OrderConfirmation', {
              orderId: placeOrderAction._id,
              order: placeOrderAction,
              product,
              address: orderData.address,
              paymentMethod: orderData.paymentMethod,
            });

            Toast.show({
              type: 'success',
              text1: 'Order placed successfully',
              position: 'top',
              topOffset: Platform.OS === 'ios' ? 50 : 30,
            });
          })
          .catch((error) => {
            console.error('Razorpay payment error:', error);
            Toast.show({
              type: 'error',
              text1: error.description || 'Payment failed. Please try again.',
              position: 'top',
              topOffset: Platform.OS === 'ios' ? 50 : 30,
            });
            setPaymentLoading(false);
          });
      } else {
        const placeOrderAction = await dispatch(placeOrder(orderData)).unwrap();
        navigation.navigate('OrderConfirmation', {
          orderId: placeOrderAction._id,
          order: placeOrderAction,
          product,
          address: orderData.address,
          paymentMethod: orderData.paymentMethod,
        });

        Toast.show({
          type: 'success',
          text1: 'Order placed successfully',
          position: 'top',
          topOffset: Platform.OS === 'ios' ? 50 : 30,
        });
      }
    } catch (error) {
      console.error('Confirm order error:', error);
      Toast.show({
        type: 'error',
        text1: error.message || 'Failed to process payment. Please try again.',
        position: 'top',
        topOffset: Platform.OS === 'ios' ? 50 : 30,
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const renderAddressItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.addressCard,
        selectedAddressId === item._id && styles.addressCardSelected,
      ]}
      onPress={() => dispatch(setSelectedAddressId(item._id))}
    >
      <View style={styles.addressHeader}>
        <Text style={styles.addressType}>
          {item.isDefault ? 'DEFAULT' : 'OTHER'}
        </Text>
        <TouchableOpacity
          style={styles.deleteAddressButton}
          onPress={() => handleDeleteAddress(item._id)}
        >
          <Ionicons name="trash-outline" size={scale(18)} color="#ff6b8a" />
        </TouchableOpacity>
      </View>
      <Text style={styles.addressText}>
        {item.address}, {item.city}, {item.state} - {item.zipCode}
      </Text>
      {item.alternatePhone && (
        <Text style={styles.alternatePhone}>Alternate Phone: {item.alternatePhone}</Text>
      )}
      <View style={styles.addressFooter}>
        <Ionicons name="location-outline" size={scale(16)} color="#5b9cff" />
        <Text style={styles.deliveryText}>Delivery by {getEstimatedDelivery()}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderPaymentMethod = (method) => {
    let icon, color;
    switch (method.id) {
      case 'credit_card':
        icon = 'credit-card';
        color = '#5b9cff';
        break;
      case 'upi':
        icon = 'mobile';
        color = '#6b7280';
        break;
      case 'net_banking':
        icon = 'bank';
        color = '#3b82f6';
        break;
      case 'wallet':
        icon = 'wallet';
        color = '#1d4ed8';
        break;
      case 'cod':
        icon = 'money';
        color = '#2563eb';
        break;
      default:
        icon = 'credit-card';
        color = '#5b9cff';
    }

    return (
      <TouchableOpacity
        key={method.id}
        style={[
          styles.paymentOption,
          paymentMethod === method.id && styles.paymentOptionSelected,
        ]}
        onPress={() => dispatch(setPaymentMethod(method.id))}
      >
        <View style={[styles.paymentIconContainer, { backgroundColor: `${color}20` }]}>
          <FontAwesome name={icon} size={scale(18)} color={color} />
        </View>
        <Text style={styles.paymentOptionText}>{method.label}</Text>
        {paymentMethod === method.id && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark" size={scale(16)} color="#5b9cff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSkeletonLoader = () => (
    <LinearGradient colors={['#8ec5fc', '#fff']} style={styles.skeletonContainer}>
      <View style={styles.skeletonHeader} />
      <View style={styles.skeletonItem} />
      <View style={styles.skeletonItem} />
      <View style={styles.skeletonItem} />
    </LinearGradient>
  );

  if (loading && !product && !addresses.length) {
    return (
      <LinearGradient colors={['#8ec5fc', '#fff']} style={styles.container}>
        <Header
          showLeftIcon={true}
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
          title="Checkout"
          textStyle={{ color: '#1a2b4a' }}
        />
        {renderSkeletonLoader()}
      </LinearGradient>
    );
  }

  if (!product && !loading) {
    return (
      <LinearGradient colors={['#8ec5fc', '#fff']} style={styles.container}>
        <Header
          showLeftIcon={true}
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
          title="Checkout"
          textStyle={{ color: '#1a2b4a' }}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={scale(40)} color="#ff6b8a" />
          <Text style={styles.errorText}>Failed to load checkout details</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => dispatch(fetchCheckoutProductDetails({ productId }))}
          >
            <LinearGradient colors={['#5b9cff', '#3b82f6']} style={styles.retryButtonGradient}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#8ec5fc', '#fff']} style={styles.container}>
      <Header
        showLeftIcon={true}
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        title="Checkout"
        textStyle={{ color: '#1a2b4a' }}
      />

      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}
      >
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeSection === 'delivery' && styles.activeTabButton,
            ]}
            onPress={() => setActiveSection('delivery')}
          >
            <Text
              style={[
                styles.tabText,
                activeSection === 'delivery' && styles.activeTabText,
              ]}
            >
              Delivery
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeSection === 'payment' && styles.activeTabButton,
            ]}
            onPress={() => setActiveSection('payment')}
          >
            <Text
              style={[
                styles.tabText,
                activeSection === 'payment' && styles.activeTabText,
              ]}
            >
              Payment
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#5b9cff"
              colors={['#5b9cff']}
            />
          }
        >
          {activeSection === 'delivery' ? (
            <>
              <LinearGradient colors={['#d9e8ff', '#f5f9ff']} style={styles.section}>
                <Text style={styles.sectionTitle}>Delivery Address</Text>
                <FlatList
                  data={addresses}
                  renderItem={renderAddressItem}
                  keyExtractor={(item) => item._id}
                  ListEmptyComponent={
                    <Text style={styles.noAddressText}>No addresses saved</Text>
                  }
                  scrollEnabled={false}
                />
                <TouchableOpacity
                  style={styles.addAddressButton}
                  onPress={() => setAddressModalVisible(true)}
                >
                  <LinearGradient colors={['#5b9cff', '#3b82f6']} style={styles.addAddressButtonGradient}>
                    <Text style={styles.addAddressButtonText}>+ Add New Address</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>

              <LinearGradient colors={['#d9e8ff', '#f5f9ff']} style={styles.section}>
                <Text style={styles.sectionTitle}>Order Summary</Text>
                <View style={styles.productCard}>
                  <Image
                    source={{ uri: product?.media?.[0]?.url }}
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                  <View style={styles.productDetails}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {product?.name || 'Product'}
                    </Text>
                    <Text style={styles.productPrice}>
                      ₹{(product?.price * quantity || 0).toFixed(2)}
                    </Text>
                    <View style={styles.productMeta}>
                      <Text style={styles.productMetaText}>Qty: {quantity}</Text>
                      {size && (
                        <Text style={styles.productMetaText}>Size: {size}</Text>
                      )}
                      {color && (
                        <Text style={styles.productMetaText}>Color: {color}</Text>
                      )}
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </>
          ) : (
            <>
              <LinearGradient colors={['#d9e8ff', '#f5f9ff']} style={styles.section}>
                <Text style={styles.sectionTitle}>Select Payment Method</Text>
                {[
                  { id: 'credit_card', label: 'Credit/Debit Card' },
                  { id: 'upi', label: 'UPI' },
                  { id: 'net_banking', label: 'Net Banking' },
                  { id: 'wallet', label: 'Wallet' },
                  { id: 'cod', label: 'Cash on Delivery' },
                ].map((method) => renderPaymentMethod(method))}
              </LinearGradient>

              <LinearGradient colors={['#d9e8ff', '#f5f9ff']} style={styles.section}>
                <Text style={styles.sectionTitle}>Apply Promo Code</Text>
                <View style={styles.promoContainer}>
                  <TextInput
                    style={styles.promoInput}
                    placeholder="Enter promo code"
                    placeholderTextColor="#5a6b8a"
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
                      <LinearGradient  colors={['#5b9cff', '#5b9cff']}style={styles.applyButtonGradient}>
                        <Text style={styles.applyButtonText}>APPLY</Text>
                      </LinearGradient>
                    </Animated.View>
                  </TouchableOpacity>
                </View>
                {discount > 0 && (
                  <View style={styles.discountApplied}>
                    <Ionicons name="checkmark-circle" size={scale(18)} color="#ff6b8a" />
                    <Text style={styles.discountText}>
                      {discount}% discount applied
                    </Text>
                  </View>
                )}
              </LinearGradient>

              <LinearGradient colors={['#d9e8ff', '#f5f9ff']} style={styles.section}>
                <Text style={styles.sectionTitle}>Price Details</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Subtotal</Text>
                  <Text style={styles.priceValue}>
                    ₹{(product?.price * quantity || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Delivery</Text>
                  <Text style={styles.priceValue}>₹50.00</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Tax (5%)</Text>
                  <Text style={styles.priceValue}>
                    ₹{(product?.price * quantity * 0.05 || 0).toFixed(2)}
                  </Text>
                </View>
                {discount > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Discount</Text>
                    <Text style={[styles.priceValue, styles.discountValue]}>
                      -₹{(product?.price * quantity * (discount / 100) || 0).toFixed(2)}
                    </Text>
                  </View>
                )}
                <View style={[styles.priceRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>₹{calculateTotal()}</Text>
                </View>
              </LinearGradient>
            </>
          )}
        </ScrollView>

        <LinearGradient colors={['#d9e8ff', '#f5f9ff']} style={styles.footer}>
          <View style={styles.priceSummary}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>₹{calculateTotal()}</Text>
          </View>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmOrder}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
            disabled={isActionLoading || isPaymentLoading || !selectedAddressId}
          >
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <LinearGradient  colors={['#5b9cff', '#5b9cff']} style={styles.confirmButtonGradient}>
                <Text style={styles.confirmButtonText}>
                  {isPaymentLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    'PLACE ORDER'
                  )}
                </Text>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      <Modal
        visible={isAddressModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <LinearGradient colors={['#8ec5fc', '#fff']} style={styles.modalContainer}>
          <Header
            showLeftIcon={true}
            leftIcon="close"
            onLeftPress={() => setAddressModalVisible(false)}
            title="Add New Address"
            textStyle={{ color: '#1a2b4a' }}
          />
          <ScrollView contentContainerStyle={styles.modalScrollContainer}>
            <TextInput
              style={styles.modalInput}
              placeholder="Street Address"
              placeholderTextColor="#5a6b8a"
              value={newAddress.address}
              onChangeText={(text) => setNewAddress({ ...newAddress, address: text })}
            />
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.modalInput, styles.halfInput]}
                placeholder="City"
                placeholderTextColor="#5a6b8a"
                value={newAddress.city}
                onChangeText={(text) => setNewAddress({ ...newAddress, city: text })}
              />
              <TextInput
                style={[styles.modalInput, styles.halfInput]}
                placeholder="State"
                placeholderTextColor="#5a6b8a"
                value={newAddress.state}
                onChangeText={(text) => setNewAddress({ ...newAddress, state: text })}
              />
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.modalInput, styles.halfInput]}
                placeholder="Zip Code"
                placeholderTextColor="#5a6b8a"
                value={newAddress.zipCode}
                onChangeText={(text) => setNewAddress({ ...newAddress, zipCode: text })}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.modalInput, styles.halfInput]}
                placeholder="Alternate Phone (Optional)"
                placeholderTextColor="#5a6b8a"
                value={newAddress.alternatePhone}
                onChangeText={(text) => setNewAddress({ ...newAddress, alternatePhone: text })}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
            <View style={styles.defaultAddressContainer}>
              <Text style={styles.defaultAddressText}>Set as default address</Text>
              <TouchableOpacity
                onPress={() =>
                  setNewAddress({ ...newAddress, isDefault: !newAddress.isDefault })
                }
              >
                <Ionicons
                  name={newAddress.isDefault ? 'checkbox' : 'square-outline'}
                  size={scale(26)}
                  color={newAddress.isDefault ? '#5b9cff' : '#5a6b8a'}
                />
              </TouchableOpacity>
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddAddress}
              disabled={isActionLoading}
            >
              <LinearGradient colors={['#5b9cff', '#3b82f6']} style={styles.saveButtonGradient}>
                <Text style={styles.saveButtonText}>
                  {isActionLoading ? 'Saving...' : 'SAVE ADDRESS'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(91, 156, 255, 0.3)',
    marginHorizontal: scale(16),
  },
  tabButton: {
    flex: 1,
    paddingVertical: scale(15),
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#5b9cff',
  },
  tabText: {
    fontSize: scaleFont(16), // Increased from 14
    fontWeight: '600',
    color: '#5a6b8a',
  },
  activeTabText: {
    color: '#5b9cff',
  },
  scrollContainer: {
    padding: scale(16),
    paddingBottom: scale(100),
  },
  section: {
    backgroundColor: '#d9e8ff',
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.3)',
  },
  sectionTitle: {
    fontSize: scaleFont(20), // Increased from 16
    fontWeight: '700',
    color: '#1a2b4a',
    marginBottom: scale(16),
  },
  addressCard: {
    backgroundColor: '#f5f9ff',
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.3)',
  },
  addressCardSelected: {
    borderColor: '#5b9cff',
    backgroundColor: 'rgba(91, 156, 255, 0.2)',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(8),
  },
  addressType: {
    fontSize: scaleFont(12), // Increased from 10
    fontWeight: '700',
    color: '#5b9cff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addressText: {
    fontSize: scaleFont(15), // Increased from 13
    color: '#1a2b4a',
    marginBottom: scale(4),
    lineHeight: scale(20),
  },
  alternatePhone: {
    fontSize: scaleFont(14), // Increased from 12
    color: '#5a6b8a',
    marginBottom: scale(12),
  },
  addressFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(8),
  },
  deliveryText: {
    fontSize: scaleFont(14), // Increased from 12
    color: '#5a6b8a',
    marginLeft: scale(6),
  },
  deleteAddressButton: {
    padding: scale(4),
  },
  noAddressText: {
    fontSize: scaleFont(15), // Increased from 13
    color: '#5a6b8a',
    textAlign: 'center',
    marginVertical: scale(16),
  },
  addAddressButton: {
    borderRadius: scale(8),
    overflow: 'hidden',
    marginTop: scale(8),
  },
  addAddressButtonGradient: {
    padding: scale(14),
    alignItems: 'center',
  },
  addAddressButtonText: {
    fontSize: scaleFont(16), // Increased from 14
    fontWeight: '600',
    color: '#ffffff',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#f5f9ff',
    borderRadius: scale(12),
    padding: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.3)',
  },
  productImage: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(8),
    marginRight: scale(16),
    backgroundColor: 'rgba(91, 156, 255, 0.2)',
  },
  productDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: scaleFont(16), // Increased from 14
    fontWeight: '600',
    color: '#1a2b4a',
    marginBottom: scale(6),
  },
  productPrice: {
    fontSize: scaleFont(18), // Increased from 15
    fontWeight: '700',
    color: '#5b9cff',
    marginBottom: scale(8),
  },
  productMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  productMetaText: {
    fontSize: scaleFont(14), // Increased from 12
    color: '#5a6b8a',
    marginRight: scale(12),
    marginBottom: scale(4),
  },
  promoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  promoInput: {
    flex: 1,
    backgroundColor: '#f5f9ff',
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.3)',
    borderRadius: scale(8),
    padding: scale(14),
    fontSize: scaleFont(15), // Increased from 13
    color: '#1a2b4a',
    marginRight: scale(12),
  },
  applyButton: {
    borderRadius: scale(8),
    overflow: 'hidden',
  },
  applyButtonGradient: {
    paddingVertical: scale(14),
    paddingHorizontal: scale(20),
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: scaleFont(15), // Increased from 13
    fontWeight: '700',
    color: '#ffffff',
  },
  discountApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(8),
  },
  discountText: {
    fontSize: scaleFont(15), // Increased from 13
    color: '#ff6b8a',
    marginLeft: scale(6),
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(14),
    borderRadius: scale(8),
    backgroundColor: '#f5f9ff',
    marginBottom: scale(10),
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.3)',
  },
  paymentOptionSelected: {
    borderColor: '#5b9cff',
    backgroundColor: 'rgba(91, 156, 255, 0.2)',
  },
  paymentIconContainer: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  paymentOptionText: {
    fontSize: scaleFont(16), // Increased from 14
    color: '#1a2b4a',
    flex: 1,
  },
  selectedIndicator: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: '#f5f9ff',
    borderWidth: 1,
    borderColor: '#5b9cff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(12),
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(91, 156, 255, 0.3)',
    paddingTop: scale(12),
    marginTop: scale(4),
  },
  priceLabel: {
    fontSize: scaleFont(15), // Increased from 13
    color: '#5a6b8a',
  },
  priceValue: {
    fontSize: scaleFont(15), // Increased from 13
    color: '#1a2b4a',
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: scaleFont(16), // Increased from 14
    color: '#1a2b4a',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: scaleFont(16), // Increased from 14
    color: '#5b9cff',
    fontWeight: '700',
  },
  discountValue: {
    color: '#ff6b8a',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(91, 156, 255, 0.3)',
  },
  priceSummary: {
    flex: 1,
  },
  totalPrice: {
    fontSize: scaleFont(20), // Increased from 18
    fontWeight: '700',
    color: '#5b9cff',
    marginTop: scale(4),
  },
  confirmButton: {
    borderRadius: scale(8),
    overflow: 'hidden',
    flex: 1,
    marginLeft: scale(16),
  },
  confirmButtonGradient: {
    paddingVertical: scale(16),
    paddingHorizontal: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: scaleFont(16), // Increased from 14
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(16),
  },
  errorText: {
    fontSize: scaleFont(18), // Increased from 16
    color: '#1a2b4a',
    marginBottom: scale(20),
    marginTop: scale(16),
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: scale(8),
    overflow: 'hidden',
  },
  retryButtonGradient: {
    paddingVertical: scale(14),
    paddingHorizontal: scale(40),
  },
  retryButtonText: {
    fontSize: scaleFont(16), // Increased from 14
    fontWeight: '600',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
  },
  modalScrollContainer: {
    padding: scale(16),
  },
  modalInput: {
    backgroundColor: '#f5f9ff',
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.3)',
    borderRadius: scale(8),
    padding: scale(14),
    fontSize: scaleFont(15), // Increased from 13
    color: '#1a2b4a',
    marginBottom: scale(16),
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  defaultAddressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(16),
  },
  defaultAddressText: {
    fontSize: scaleFont(16), // Increased from 14
    color: '#1a2b4a',
  },
  modalFooter: {
    padding: scale(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(91, 156, 255, 0.3)',
  },
  saveButton: {
    borderRadius: scale(8),
    overflow: 'hidden',
  },
  saveButtonGradient: {
    padding: scale(16),
  },
  saveButtonText: {
    fontSize: scaleFont(16), // Increased from 14
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  skeletonContainer: {
    flex: 1,
    padding: scale(16),
  },
  skeletonHeader: {
    height: scale(40),
    backgroundColor: 'rgba(91, 156, 255, 0.2)',
    borderRadius: scale(8),
    marginBottom: scale(16),
  },
  skeletonItem: {
    height: scale(100),
    backgroundColor: 'rgba(91, 156, 255, 0.2)',
    borderRadius: scale(8),
    marginBottom: scale(16),
  },
});

export default Checkout;