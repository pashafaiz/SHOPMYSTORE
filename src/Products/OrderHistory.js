import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Image,
  Platform,
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

// Theme constants
const PRODUCT_BG_COLOR = '#f5f9ff';
const CATEGORY_BG_COLOR = 'rgba(91, 156, 255, 0.2)';
const SELECTED_CATEGORY_BG_COLOR = '#5b9cff';
const PRIMARY_THEME_COLOR = '#5b9cff';
const SECONDARY_THEME_COLOR = '#ff6b8a';
const TEXT_THEME_COLOR = '#1a2b4a';
const SUBTEXT_THEME_COLOR = '#5a6b8a';
const BORDER_THEME_COLOR = 'rgba(91, 156, 255, 0.3)';
const BACKGROUND_GRADIENT = ['#8ec5fc', '#fff'];

const OrderHistory = ({ navigation }) => {
  const dispatch = useDispatch();
  const ordersState = useSelector((state) => state.orders) || { orders: [], loading: false, error: null };
  const { orders, loading, error } = ordersState;

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

    if (error) {
      Toast.show({
        type: 'error',
        text1: error === 'Authentication token is missing' ? 'Please login again' : 'Failed to load orders',
        position: TOAST_POSITION,
        topOffset: TOAST_TOP_OFFSET,
      });
    }
  }, [error, dispatch, navigation]);

  const handleRetry = () => {
    dispatch(fetchOrders());
  };

  const renderSkeletonLoader = () => {
    return (
      <View>
        {[...Array(3)].map((_, index) => (
          <View style={styles.orderCard} key={`skeleton-${index}`}>
            <View style={[styles.orderImageContainer, styles.skeletonBox]} />
            <View style={styles.orderDetails}>
              <View style={[styles.skeletonText, { width: '80%', marginBottom: scale(12) }]} />
              <View style={[styles.skeletonText, { width: '60%', marginBottom: scale(12) }]} />
              <View style={[styles.skeletonText, { width: '40%', marginBottom: scale(12) }]} />
              <View style={[styles.skeletonText, { width: '70%' }]} />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderOrderItem = ({ item }) => {
    const imageUrl = item.product?.media?.[0]?.url || DEFAULT_IMAGE_URL;

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
        <View style={styles.orderContent}>
          <View style={styles.orderImageContainer}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.orderImage}
              resizeMode="cover"
            />
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {status}
              </Text>
            </View>
          </View>
          <View style={styles.orderDetails}>
            <Text style={styles.orderTitle} numberOfLines={2}>
              {item.product?.name || 'Unknown Product'}
            </Text>
            <Text style={styles.orderPrice}>₹{(item.total || 0).toFixed(2)}</Text>
            <View style={styles.orderInfoRow}>
              <Text style={styles.orderDetail}>Qty: {item.quantity || 'N/A'}</Text>
              {item.size && <Text style={styles.orderDetail}>Size: {item.size}</Text>}
              {item.color && <Text style={styles.orderDetail}>Color: {item.color}</Text>}
            </View>
            <Text style={styles.orderDetail}>Payment: {paymentMethod}</Text>
            <Text style={styles.orderDetail} numberOfLines={2}>
              Address: {addressText}
            </Text>
            <Text style={styles.orderDate}>Ordered: {orderDate}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
        <Header
          showLeftIcon={true}
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
          title="Order History"
          textStyle={styles.headerText}
          containerStyle={styles.headerContainer}
        />
        {renderSkeletonLoader()}
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
      <Header
        showLeftIcon={true}
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        title="Order History"
        textStyle={styles.headerText}
        containerStyle={styles.headerContainer}
      />
      <View style={styles.content}>
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={scale(80)} color={SECONDARY_THEME_COLOR} style={styles.errorIcon} />
            <Text style={styles.errorText}>Failed to load orders</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
            >
              <LinearGradient
                colors={['#5b9cff', '#8ec5fc']}
                style={styles.buttonGradientInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonText}>Retry</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={scale(100)} color={SUBTEXT_THEME_COLOR} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>Your order history is empty</Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => navigation.navigate('HomeScreen')}
            >
              <LinearGradient
                colors={['#5b9cff', '#8ec5fc']}
                style={styles.buttonGradientInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonText}>Start Shopping</Text>
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
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRODUCT_BG_COLOR,
  },
  headerContainer: {
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(20),
    padding: scale(15),
    margin: scale(20),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
  },
  headerText: {
    fontSize: scaleFont(24),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: scale(12),
  },
  listContainer: {
    paddingBottom: scale(40),
  },
  orderCard: {
    borderRadius: scale(28),
    marginBottom: scale(20),
    overflow: 'hidden',
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    backgroundColor: PRODUCT_BG_COLOR,
  },
  orderContent: {
    flexDirection: 'row',
    padding: scale(20),
  },
  orderImageContainer: {
    width: scale(140),
    height: scale(140),
    borderRadius: scale(20),
    overflow: 'hidden',
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    position: 'relative',
    marginRight: scale(20),
  },
  orderImage: {
    width: scale(140),
    height: scale(140),
    borderRadius: scale(20),
  },
  statusBadge: {
    position: 'absolute',
    top: scale(8),
    right: scale(8),
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(12),
    paddingVertical: scale(4),
    paddingHorizontal: scale(12),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  statusText: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    color: TEXT_THEME_COLOR,
  },
  orderDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  orderTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
    marginBottom: scale(8),
    letterSpacing: 0.5,
  },
  orderPrice: {
    fontSize: scaleFont(20),
    fontWeight: '800',
    color: TEXT_THEME_COLOR,
    marginBottom: scale(8),
  },
  orderInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: scale(8),
  },
  orderDetail: {
    fontSize: scaleFont(14),
    color: SUBTEXT_THEME_COLOR,
    marginRight: scale(12),
    marginBottom: scale(4),
    fontWeight: '500',
  },
  orderDate: {
    fontSize: scaleFont(12),
    color: SUBTEXT_THEME_COLOR,
    fontWeight: '600',
    marginTop: scale(4),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  errorIcon: {
    marginBottom: scale(20),
    opacity: 0.8,
  },
  errorText: {
    fontSize: scaleFont(20),
    color: SECONDARY_THEME_COLOR,
    marginBottom: scale(24),
    textAlign: 'center',
    fontWeight: '600',
  },
  retryButton: {
    borderRadius: scale(20),
    overflow: 'hidden',
    shadowColor: PRIMARY_THEME_COLOR,
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
    elevation: 5,
  },
  buttonGradientInner: {
    paddingVertical: scale(16),
    paddingHorizontal: scale(40),
    alignItems: 'center',
    borderRadius: scale(20),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  buttonText: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
    letterSpacing: 0.8,
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
    color: TEXT_THEME_COLOR,
    marginBottom: scale(24),
    textAlign: 'center',
    fontWeight: '600',
  },
  shopButton: {
    borderRadius: scale(20),
    overflow: 'hidden',
    shadowColor: PRIMARY_THEME_COLOR,
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
    elevation: 5,
  },
  skeletonBox: {
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(20),
  },
  skeletonText: {
    backgroundColor: CATEGORY_BG_COLOR,
    height: scale(16),
    borderRadius: scale(8),
  },
});

export default OrderHistory;