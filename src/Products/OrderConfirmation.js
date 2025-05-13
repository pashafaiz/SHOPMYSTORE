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

const { width, height } = Dimensions.get('window');
const scaleFactor = Math.min(width, 375) / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375) * 0.75);

const OrderConfirmation = ({ route, navigation }) => {
  const { orderId, order: passedOrder, product: passedProduct } = route.params || {};

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
    console.log('OrderConfirmation: selected order=', JSON.stringify(order, null, 2));
    console.log('OrderConfirmation: selected product=', JSON.stringify(product, null, 2));

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
      <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.container}>
        <Header
          showLeftIcon={true}
          leftIcon="arrow-back"
          onLeftPress={() => {
            console.log('OrderConfirmation: Navigating back');
            navigation.goBack();
          }}
          title="Order Confirmation"
          textStyle={{ color: '#FFFFFF' }}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order details not found</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={['#7B61FF', '#AD4DFF']}
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

  // Safely handle address
  const addressText = order.address
    ? typeof order.address === 'string'
      ? order.address
      : typeof order.address === 'object'
      ? [
          order.address.address || '',
          order.address.city || '',
          order.address.state || '',
          order.address.zipCode || ''
        ].filter(Boolean).join(', ') || 'Address not provided'
      : 'Address not provided'
    : 'Address not provided';

  // Safely handle payment method
  const formattedPaymentMethod = order.paymentMethod && typeof order.paymentMethod === 'string'
    ? order.paymentMethod.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Not Specified';

  const discount = order.promoCode && typeof order.promoCode === 'string' ? 10 : 0;
  const quantity = typeof order.quantity === 'number' ? order.quantity : parseInt(order.quantity) || 1;
  const total = typeof order.total === 'number' ? order.total : parseFloat(order.total) || 0;

  return (
    <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.container}>
      <Header
        showLeftIcon={true}
        leftIcon="arrow-back"
        onLeftPress={() => {
          console.log('OrderConfirmation: Navigating back');
          navigation.goBack();
        }}
        title="Order Confirmation"
        textStyle={{ color: '#FFFFFF' }}
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
          <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.section}>
            <Ionicons name="checkmark-circle" size={scale(60)} color="#00C4B4" style={styles.successIcon} />
            <Text style={styles.successTitle}>Order Confirmed!</Text>
            <Text style={styles.orderId}>Order ID: {order._id}</Text>
            <Text style={styles.successMessage}>
              Thank you for your purchase. You'll receive your order by {estimatedDelivery}.
            </Text>
          </LinearGradient>

          {/* Order Summary */}
          <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.section}>
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
          <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <Text style={styles.addressText}>
              {addressText}
            </Text>
            {order.address && typeof order.address === 'object' && order.address.alternatePhone && (
              <Text style={styles.alternatePhone}>Alt: {order.address.alternatePhone}</Text>
            )}
          </LinearGradient>

          {/* Payment Details */}
          <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.section}>
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
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <LinearGradient
              colors={['#7B61FF', '#AD4DFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.continueButtonText}>Continue Shopping</Text>
            </LinearGradient>
          </Animated.View>
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
    borderColor: 'rgba(123, 97, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.4,
    shadowRadius: scale(6),
    elevation: 6,
  },
  successIcon: {
    alignSelf: 'center',
    marginBottom: scale(12),
  },
  successTitle: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: scale(8),
  },
  orderId: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    color: '#B0B0D0',
    textAlign: 'center',
    marginBottom: scale(12),
  },
  successMessage: {
    fontSize: scaleFont(12),
    fontWeight: '400',
    color: '#E5E7EB',
    textAlign: 'center',
    lineHeight: scale(18),
  },
  sectionTitle: {
    fontSize: scaleFont(17),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: scale(12),
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
    fontSize: scaleFont(15),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: scale(5),
  },
  productPrice: {
    fontSize: scaleFont(15),
    fontWeight: '700',
    color: '#7B61FF',
    marginBottom: scale(5),
  },
  productDetail: {
    fontSize: scaleFont(13),
    color: '#B0B0D0',
    marginBottom: scale(3),
  },
  addressText: {
    fontSize: scaleFont(13),
    color: '#FFFFFF',
    marginBottom: scale(3),
  },
  alternatePhone: {
    fontSize: scaleFont(13),
    color: '#B0B0D0',
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
    borderTopColor: 'rgba(123, 97, 255, 0.2)',
    paddingTop: scale(10),
  },
  totalLabel: {
    fontSize: scaleFont(13),
    color: '#B0B0D0',
  },
  totalLabelFinal: {
    fontSize: scaleFont(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: scaleFont(12),
    color: '#FFFFFF',
  },
  totalValueFinal: {
    fontSize: scaleFont(15),
    fontWeight: '700',
    color: '#7B61FF',
  },
  discountValue: {
    color: '#00C4B4',
  },
  continueButton: {
    position: 'absolute',
    bottom: scale(16),
    left: scale(35),
    right: scale(35),
    borderRadius: scale(10),
    overflow: 'hidden',
    shadowColor: '#7B61FF',
    shadowRadius: scale(6),
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: scale(14),
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: scaleFont(15),
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
    marginBottom: scale(10),
  },
  retryButtonText: {
    fontSize: scaleFont(13),
    fontWeight: '700',
    color: '#FFFFFF',
    paddingVertical: scale(14),
    textAlign: 'center',
  },
});

export default OrderConfirmation;