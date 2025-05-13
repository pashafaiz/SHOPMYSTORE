import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Image,
  Animated,
  Platform,
  Easing,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { fetchOrders } from '../redux/slices/ordersSlice';
import Header from '../Components/Header';
import {
  TOAST_POSITION,
  TOAST_TOP_OFFSET,
  DEFAULT_IMAGE_URL,
} from '../constants/GlobalConstants';

// Responsive scaling
const { width, height } = Dimensions.get('window');
const scaleFactor = Math.min(width, 375) / 375;
const scale = (size) => Math.round(size * scaleFactor);
const scaleFont = (size) => {
  const fontScale = Math.min(width, height) / 375;
  const scaledSize = size * fontScale * (Platform.OS === 'ios' ? 0.9 : 0.85);
  return Math.round(scaledSize);
};

const OrderHistory = ({ navigation }) => {
  const dispatch = useDispatch();
  const ordersState = useSelector((state) => state.orders) || { orders: [], loading: false, error: null };
  const { orders, loading, error } = ordersState;

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const skeletonPulse = useRef(new Animated.Value(0.4)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // State for dimensions
  const [dimensions, setDimensions] = useState({ width, height });

  useEffect(() => {
    const updateDimensions = () => {
      const { width: newWidth, height: newHeight } = Dimensions.get('window');
      setDimensions({ width: newWidth, height: newHeight });
    };
    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    const checkTokenAndFetch = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          dispatch(fetchOrders());
        } else {
          Toast.show({
            type: 'error',
            text1: 'Please login to view order history',
            position: TOAST_POSITION,
            topOffset: TOAST_TOP_OFFSET,
          });
          navigation.navigate('Login');
        }
      } catch (err) {
        console.error('OrderHistory: Error checking token:', err);
      }
    };

    checkTokenAndFetch();

    // Fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();

    // Button pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Skeleton pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonPulse, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(skeletonPulse, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Shimmer animation
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();

    if (error) {
      Toast.show({
        type: 'error',
        text1: error === 'Authentication token is missing' ? 'Please login again' : 'Failed to load orders',
        position: TOAST_POSITION,
        topOffset: TOAST_TOP_OFFSET,
      });
    }
  }, [error, dispatch, navigation, fadeAnim, buttonScale, skeletonPulse, shimmerAnim]);

  const handleRetry = () => {
    dispatch(fetchOrders());
  };

  const handleButtonPressIn = (anim) => {
    Animated.spring(anim, {
      toValue: 0.9,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = (anim) => {
    Animated.spring(anim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const renderSkeletonLoader = () => {
    const shimmerTranslate = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-dimensions.width, dimensions.width],
    });

    return (
      <View>
        {[...Array(3)].map((_, index) => (
          <Animated.View
            style={[styles.orderCard, { opacity: skeletonPulse }]}
            key={`skeleton-${index}`}
          >
            <LinearGradient
              colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']}
              style={[styles.orderImage, styles.skeletonBox]}
            />
            <View style={styles.orderDetails}>
              <View style={[styles.skeletonText, { width: '80%', marginBottom: scale(8) }]} />
              <View style={[styles.skeletonText, { width: '60%', marginBottom: scale(8) }]} />
              <View style={[styles.skeletonText, { width: '40%', marginBottom: scale(8) }]} />
              <View style={[styles.skeletonText, { width: '70%' }]} />
              <Animated.View
                style={[
                  styles.shimmerOverlay,
                  { transform: [{ translateX: shimmerTranslate }] },
                ]}
              />
            </View>
          </Animated.View>
        ))}
      </View>
    );
  };

  const renderOrderItem = ({ item, index }) => {
    const cardFadeAnim = new Animated.Value(0);
    const cardTranslateY = new Animated.Value(20);

    Animated.parallel([
      Animated.timing(cardFadeAnim, {
        toValue: 1,
        duration: 600 + index * 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 600 + index * 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const orderDate = new Date(item.createdAt).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const addressText = item.address
      ? `${item.address.address}, ${item.address.city}, ${item.address.state} - ${item.address.zipCode}`
      : 'Address not provided';

    const paymentMethod = item.paymentMethod
      ? item.paymentMethod.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Not Specified';

    const status = item.status
      ? item.status.charAt(0).toUpperCase() + item.status.slice(1)
      : 'Unknown';

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderConfirmation', { orderId: item._id, order: item })}
        activeOpacity={0.8}
      >
          <LinearGradient
            colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']}
            style={styles.orderGradient}
          >
            <Image
              source={{ uri: item.product?.media?.[0]?.url || DEFAULT_IMAGE_URL }}
              style={styles.orderImage}
              resizeMode="cover"
            />
            <View style={styles.orderDetails}>
              <Text style={styles.orderTitle} numberOfLines={2}>
                {item.product?.name || 'Unknown Product'}
              </Text>
              <Text style={styles.orderPrice}>₹{(item.total || 0).toFixed(2)}</Text>
              <Text style={styles.orderDetail}>Qty: {item.quantity || 'N/A'}</Text>
              {item.size && <Text style={styles.orderDetail}>Size: {item.size}</Text>}
              {item.color && <Text style={styles.orderDetail}>Color: {item.color}</Text>}
              <Text style={styles.orderDetail}>Payment: {paymentMethod}</Text>
              <Text style={[styles.orderDetail, { color: status === 'Delivered' ? '#00C4B4' : '#FF6B6B' }]}>
                Status: {status}
              </Text>
              <Text style={styles.orderDetail} numberOfLines={2}>
                Address: {addressText}
              </Text>
              <Text style={styles.orderDate}>Ordered: {orderDate}</Text>
            </View>
          </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.container}>
        <Header
          showLeftIcon={true}
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
          title="Order History"
          textStyle={styles.headerText}
        />
        {renderSkeletonLoader()}
      </LinearGradient>
    );
  }

  const retryButtonScale = new Animated.Value(1);
  const shopButtonScale = new Animated.Value(1);

  return (
    <LinearGradient colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']} style={styles.container}>
      <Header
        showLeftIcon={true}
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        title="Order History"
        textStyle={styles.headerText}
      />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load orders</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              onPressIn={() => handleButtonPressIn(retryButtonScale)}
              onPressOut={() => handleButtonPressOut(retryButtonScale)}
            >
              <LinearGradient
                colors={['#7B61FF', '#4A2A8D']}
                style={[styles.buttonGradient, { transform: [{ scale: retryButtonScale }, { scale: buttonScale }] }]}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={scale(80)} color="#B0B0D0" style={styles.emptyIcon} />
            <Text style={styles.emptyText}>Your order history is empty</Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => navigation.navigate('HomeScreen')}
              onPressIn={() => handleButtonPressIn(shopButtonScale)}
              onPressOut={() => handleButtonPressOut(shopButtonScale)}
            >
              <LinearGradient
                colors={['#7B61FF', '#4A2A8D']}
                style={[styles.buttonGradient, { transform: [{ scale: shopButtonScale }, { scale: buttonScale }] }]}
              >
                <Text style={styles.shopButtonText}>Start Shopping</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerText: {
    fontSize: scaleFont(26),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(123, 97, 255, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(16),
    paddingTop: scale(12),
  },
  listContainer: {
    paddingBottom: scale(30),
  },
  orderCard: {
    borderRadius: scale(20),
    marginBottom: scale(16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.4)',
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: scale(6) },
    shadowOpacity: 0.6,
    shadowRadius: scale(10),
    // elevation: 10,
  },
  orderGradient: {
    flexDirection: 'row',
    padding: scale(14),
    borderRadius: scale(20),
  },
  orderImage: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(14),
    marginRight: scale(14),
    backgroundColor: '#2E1A5C',
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.5)',
  },
  orderDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  orderTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: scale(6),
    letterSpacing: 0.5,
  },
  orderPrice: {
    fontSize: scaleFont(20),
    fontWeight: '800',
    color: '#7B61FF',
    marginBottom: scale(6),
  },
  orderDetail: {
    fontSize: scaleFont(14),
    color: '#B0B0D0',
    marginBottom: scale(4),
    fontWeight: '500',
  },
  orderDate: {
    fontSize: scaleFont(14),
    color: '#00C4B4',
    fontWeight: '600',
    marginTop: scale(4),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  errorText: {
    fontSize: scaleFont(20),
    color: '#FFFFFF',
    marginBottom: scale(20),
    textAlign: 'center',
    fontWeight: '600',
  },
  retryButton: {
    borderRadius: scale(14),
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(36),
    alignItems: 'center',
    borderRadius: scale(14),
  },
  retryButtonText: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  emptyIcon: {
    marginBottom: scale(24),
    opacity: 0.7,
  },
  emptyText: {
    fontSize: scaleFont(20),
    color: '#B0B0D0',
    marginBottom: scale(20),
    textAlign: 'center',
    fontWeight: '600',
  },
  shopButton: {
    borderRadius: scale(14),
    overflow: 'hidden',
  },
  shopButtonText: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  skeletonBox: {
    backgroundColor: 'rgba(123, 97, 255, 0.2)',
    borderRadius: scale(14),
  },
  skeletonText: {
    backgroundColor: 'rgba(123, 97, 255, 0.2)',
    height: scale(12),
    borderRadius: scale(4),
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: scale(120),
  },
});

export default OrderHistory;