import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import Header from '../Components/Header';
import {
  TOAST_POSITION,
  TOAST_TOP_OFFSET,
  DEFAULT_IMAGE_URL,
} from '../constants/GlobalConstants';
import Trace from '../utils/Trace';

const { width, height } = Dimensions.get('window');
const scaleFactor = Math.min(width, 375) / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375) * 0.85); 

const OrderConfirmation = ({ route, navigation }) => {
  const { orderId, order: passedOrder, product: passedProduct, address, paymentMethod } = route.params || {};
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Use the passed order and product
  const order = passedOrder;
  const product = passedProduct || order?.product;

  useEffect(() => {
    console.log('OrderConfirmation: orderId=', orderId);
    console.log('OrderConfirmation: passedOrder=', JSON.stringify(passedOrder, null, 2));
    console.log('OrderConfirmation: passedProduct=', JSON.stringify(passedProduct, null, 2));
    console.log('OrderConfirmation: address=', JSON.stringify(address, null, 2));
    console.log('OrderConfirmation: paymentMethod=', paymentMethod);
    console.log('OrderConfirmation: selected order=', JSON.stringify(order, null, 2));
    console.log('OrderConfirmation: selected product=', JSON.stringify(product, null, 2));
    Trace("---adreesss---->", route?.params);

    // Content animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // Button pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    if (!order) {
      Toast.show({
        type: 'error',
        text1: 'Order data is missing',
        position: TOAST_POSITION,
        topOffset: TOAST_TOP_OFFSET,
      });
    }
  }, [orderId, passedOrder, passedProduct, order, fadeAnim, scaleAnim, buttonScale]);

  const handleContinueShopping = () => {
    console.log('OrderConfirmation: Navigating to HomeScreen');
    navigation.navigate('BottomTabs');
  };

  // Check if order or orderId is missing
  if (!order || !orderId) {
    return (
      <LinearGradient colors={['#8ec5fc', '#fff']} style={styles.container}>
        <Header
          showLeftIcon={true}
          leftIcon="arrow-back"
          onLeftPress={() => {
            console.log('OrderConfirmation: Navigating back');
            navigation.goBack();
          }}
          title="Order Confirmation"
          textStyle={{ color: '#1a2b4a' }}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order details not found</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={['#5b9cff', '#3b82f6']}
              style={styles.buttonGradient}
            >
              <Text style={styles.retryButtonText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const estimatedDelivery = order.createdAt
    ? new Date(new Date(order.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      })
    : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });

  // Safely handle product details
  const productName = product && typeof product === 'object' && product.name
    ? product.name
    : order.product && typeof order.product === 'object' && order.product.name
    ? order.product.name
    : 'Unknown Product';
  const productImage = product && typeof product === 'object' && product.media && Array.isArray(product.media) && product.media[0]?.url
    ? product.media[0].url
    : order.product && typeof order.product === 'object' && order.product.media && Array.isArray(order.product.media) && order.product.media[0]?.url
    ? order.product.media[0].url
    : DEFAULT_IMAGE_URL;
  const productPrice = product && typeof product === 'object' && product.price
    ? product.price
    : order.product && typeof order.product === 'object' && order.product.price
    ? order.product.price
    : (order.total - 50 - (order.total - 50) * 0.05) / (order.quantity || 1);

  // Safely handle address from route.params
  const addressText = address && typeof address === 'object'
    ? [
        address.address || '',
        address.city || '',
        address.state || '',
        address.zipCode || '',
      ].filter(Boolean).join(', ')
    : 'Address not provided';

  // Safely handle payment method from route.params
  const paymentMethodDisplay = {
    credit_card: 'Credit/Debit Card',
    upi: 'UPI',
    net_banking: 'Net Banking',
    wallet: 'Wallet',
    cod: 'Cash on Delivery',
  };
  const formattedPaymentMethod = paymentMethod && typeof paymentMethod === 'string'
    ? paymentMethodDisplay[paymentMethod] || paymentMethod.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Not Specified';

  const discount = order.promoCode && typeof order.promoCode === 'string' ? 10 : 0;
  const quantity = typeof order.quantity === 'number' ? order.quantity : parseInt(order.quantity) || 1;
  const total = typeof order.total === 'number' ? order.total : parseFloat(order.total) || 0;

  return (
    <LinearGradient colors={['#8ec5fc', '#fff']} style={styles.container}>
      <Header
        showLeftIcon={true}
        leftIcon="arrow-back"
        onLeftPress={() => {
          console.log('OrderConfirmation: Navigating back');
          navigation.goBack();
        }}
        title="Order Confirmation"
        textStyle={{ color: '#1a2b4a' }}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Success Message */}
          <LinearGradient colors={['#d9e8ff', '#f5f9ff']} style={styles.section}>
            <Ionicons name="checkmark-circle" size={scale(60)} color="#ff6b8a" style={styles.successIcon} />
            <Text style={styles.successTitle}>Order Confirmed!</Text>
            <Text style={styles.orderId}>Order ID: {order._id}</Text>
            <Text style={styles.successMessage}>
              Thank you for your purchase. You'll receive your order by {estimatedDelivery}.
            </Text>
          </LinearGradient>

          {/* Order Summary */}
          <LinearGradient colors={['#d9e8ff', '#f5f9ff']} style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.productCard}>
              <Image
                source={{ uri: productImage }}
                style={styles.productImage}
                resizeMode="contain"
              />
              <View style={styles.productDetails}>
                <Text style={styles.productName} numberOfLines={2}>
                  {productName}
                </Text>
                <Text style={styles.productPrice}>
                  ₹{(productPrice * quantity).toFixed(2)}
                </Text>
                <Text style={styles.productDetail}>Quantity: {quantity}</Text>
                {order.size && typeof order.size === 'string' && <Text style={styles.productDetail}>Size: {order.size}</Text>}
                {order.color && typeof order.color === 'string' && <Text style={styles.productDetail}>Color: {order.color}</Text>}
              </View>
            </View>
          </LinearGradient>

          {/* Delivery Address */}
          <LinearGradient colors={['#d9e8ff', '#f5f9ff']} style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <Text style={styles.addressText}>
              {addressText}
            </Text>
            {address && typeof address === 'object' && address.alternatePhone && (
              <Text style={styles.alternatePhone}>Alt: {address.alternatePhone}</Text>
            )}
          </LinearGradient>

          {/* Payment Details */}
          <LinearGradient colors={['#d9e8ff', '#f5f9ff']} style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Payment Method</Text>
              <Text style={styles.totalValue}>
                {formattedPaymentMethod}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                ₹{(productPrice * quantity).toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Shipping</Text>
              <Text style={styles.totalValue}>₹50.00</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>
                ₹{(productPrice * quantity * 0.05).toFixed(2)}
              </Text>
            </View>
            {discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={[styles.totalValue, styles.discountValue]}>
                  -₹{(productPrice * quantity * (discount / 100)).toFixed(2)}
                </Text>
              </View>
            )}
            <View style={[styles.totalRow, styles.totalRowFinal]}>
              <Text style={[styles.totalLabel, styles.totalLabelFinal]}>Total</Text>
              <Text style={[styles.totalValue, styles.totalValueFinal]}>
                ₹{total.toFixed(2)}
              </Text>
            </View>
          </LinearGradient>
        </ScrollView>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinueShopping}
        >
            <LinearGradient
               colors={['#5b9cff', '#5b9cff']}
              style={styles.buttonGradient}
            >
              <Text style={styles.continueButtonText}>Continue Shopping</Text>
            </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
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
    borderColor: 'rgba(91, 156, 255, 0.3)',
    backgroundColor: '#f5f9ff',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.2,
    shadowRadius: scale(6),
    elevation: 4,
  },
  successIcon: {
    alignSelf: 'center',
    marginBottom: scale(12),
  },
  successTitle: {
    fontSize: scaleFont(24), 
    fontWeight: '700',
    color: '#1a2b4a',
    textAlign: 'center',
    marginBottom: scale(8),
  },
  orderId: {
    fontSize: scaleFont(14), 
    fontWeight: '600',
    color: '#5a6b8a',
    textAlign: 'center',
    marginBottom: scale(12),
  },
  successMessage: {
    fontSize: scaleFont(14), 
    fontWeight: '400',
    color: '#5a6b8a',
    textAlign: 'center',
    lineHeight: scale(20),
  },
  sectionTitle: {
    fontSize: scaleFont(20), 
    fontWeight: '700',
    color: '#1a2b4a',
    marginBottom: scale(12),
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#f5f9ff',
    borderRadius: scale(8),
    padding: scale(14),
    marginBottom: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(91, 156, 255, 0.3)',
  },
  productImage: {
    width: scale(70), // Slightly increased
    height: scale(70),
    borderRadius: scale(6),
    marginRight: scale(14),
    backgroundColor: '#e5e7eb',
  },
  productDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: scaleFont(18), 
    fontWeight: '600',
    color: '#1a2b4a',
    marginBottom: scale(5),
  },
  productPrice: {
    fontSize: scaleFont(18), 
    fontWeight: '700',
    color: '#5b9cff',
    marginBottom: scale(5),
  },
  productDetail: {
    fontSize: scaleFont(15), 
    color: '#5a6b8a',
    marginBottom: scale(3),
  },
  addressText: {
    fontSize: scaleFont(15), 
    color: '#1a2b4a',
    marginBottom: scale(3),
  },
  alternatePhone: {
    fontSize: scaleFont(15), 
    color: '#5a6b8a',
    marginBottom: scale(3),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(10),
  },
  totalRowFinal: {
    marginTop: scale(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(91, 156, 255, 0.3)',
    paddingTop: scale(10),
  },
  totalLabel: {
    fontSize: scaleFont(15), 
    color: '#5a6b8a',
  },
  totalLabelFinal: {
    fontSize: scaleFont(18), 
    fontWeight: '700',
    color: '#1a2b4a',
  },
  totalValue: {
    fontSize: scaleFont(15), 
    color: '#1a2b4a',
  },
  totalValueFinal: {
    fontSize: scaleFont(18), 
    fontWeight: '700',
    color: '#5b9cff',
  },
  discountValue: {
    color: '#ff6b8a',
  },
  continueButton: {
    position: 'absolute',
    bottom: scale(16),
    left: scale(35),
    right: scale(35),
    borderRadius: scale(10),
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowRadius: scale(6),
    elevation: 4,
  },
  buttonGradient: {
    paddingVertical: scale(14),
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: scaleFont(18), 
    fontWeight: '700',
    color: '#ffffff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(16),
  },
  errorText: {
    fontSize: scaleFont(16), 
    color: '#1a2b4a',
    marginBottom: scale(20),
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: scale(10),
    overflow: 'hidden',
    marginBottom: scale(10),
  },
  retryButtonText: {
    fontSize: scaleFont(16), 
    fontWeight: '700',
    color: '#ffffff',
    paddingVertical: scale(14),
    textAlign: 'center',
  },
});

export default OrderConfirmation;