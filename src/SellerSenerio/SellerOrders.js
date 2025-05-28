import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {
  fetchSellerOrders,
  updateOrderStatus,
  resetOrdersForTab,
} from '../redux/slices/sellerSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useFocusEffect} from '@react-navigation/native';
import moment from 'moment';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../Components/Header';

// Theme constants
const PRIMARY_COLOR = '#6366f1'; // Indigo
const SECONDARY_COLOR = '#f43f5e'; // Rose
const BACKGROUND_COLOR = '#f1f5f9'; // Slate
const CARD_BACKGROUND = '#ffffff';
const TEXT_COLOR = '#0f172a'; // Slate-900
const SUBTEXT_COLOR = '#64748b'; // Slate-500
const BORDER_COLOR = '#e2e8f0'; // Slate-200
const SUCCESS_COLOR = '#22c55e'; // Green
const WARNING_COLOR = '#f59e0b'; // Amber
const INFO_COLOR = '#3b82f6'; // Blue
const ERROR_COLOR = '#dc2626'; // Red
const GRADIENT_COLORS = ['#a5b4fc', '#e0e7ff']; // Indigo gradient

const {width} = Dimensions.get('window');
const CARD_WIDTH = width * 0.92;
const CARD_MARGIN = width * 0.04;

const SellerOrders = ({navigation}) => {
  const dispatch = useDispatch();
  const {orders, loading, error} = useSelector(state => state.seller);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [allOrdersLoaded, setAllOrdersLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current; // Start at 1 to avoid initial blur
  const scaleAnim = useRef(new Animated.Value(1)).current; // Start at 1 to avoid initial scale

  const loadOrders = async () => {
    setIsLoading(true);
    const limit = activeTab === 'all' ? 100 : 10;
    try {
      await dispatch(resetOrdersForTab(activeTab));
      const result = await dispatch(
        fetchSellerOrders({
          page,
          limit,
          status: activeTab === 'all' ? undefined : activeTab,
        }),
      ).unwrap();
      if (result.orders.length < limit) setAllOrdersLoaded(true);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setPage(1);
      setAllOrdersLoaded(false);
      loadOrders();

      // Only animate on tab change, not on navigation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300, // Reduced duration for smoother transition
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      return () => {
        // Don't reset animations on unmount to prevent blur
      };
    }, [activeTab]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setAllOrdersLoaded(false);
    await loadOrders();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loading && !allOrdersLoaded && activeTab !== 'all') {
      setPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (page > 1) {
      loadOrders();
    }
  }, [page]);

  const getStatusColor = status => {
    switch (status) {
      case 'pending':
        return WARNING_COLOR;
      case 'processing':
        return INFO_COLOR;
      case 'shipped':
        return PRIMARY_COLOR;
      case 'delivered':
        return SUCCESS_COLOR;
      case 'cancelled':
        return ERROR_COLOR;
      default:
        return SUBTEXT_COLOR;
    }
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'pending':
        return 'hourglass-empty';
      case 'processing':
        return 'autorenew';
      case 'shipped':
        return 'local-shipping';
      case 'delivered':
        return 'check-circle';
      case 'cancelled':
        return 'cancel';
      default:
        return 'info';
    }
  };

  const handleUpdateStatus = async (orderId, currentStatus) => {
    let newStatus;
    switch (currentStatus) {
      case 'pending':
        newStatus = 'processing';
        break;
      case 'processing':
        newStatus = 'shipped';
        break;
      case 'shipped':
        newStatus = 'delivered';
        break;
      default:
        return;
    }
    try {
      await dispatch(updateOrderStatus({orderId, status: newStatus})).unwrap();
      // Optionally, refresh orders after updating status
      await loadOrders();
    } catch (err) {
      console.error('Failed to update order status:', err);
      // Optionally, show an error message to the user
    }
  };

  const renderOrderItem = ({item, index}) => {
    // Add defensive checks for item structure
    if (!item || !item._id || !item.status) {
      return null; // Skip rendering if item is malformed
    }

    // Ensure items is an array and has the expected structure
    const items = Array.isArray(item.items) ? item.items : [];
    const user = item.user && typeof item.user === 'object' ? item.user : { userName: 'Unknown' };

    return (
      <Animated.View
        style={[
          styles.orderCard,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          },
        ]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('OrderDetails', {orderId: item._id})
          }>
          <LinearGradient
            colors={[CARD_BACKGROUND, `${getStatusColor(item.status)}10`]}
            style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.orderIdContainer}>
                <Icon name="receipt-long" size={20} color={PRIMARY_COLOR} />
                <Text style={styles.orderId}>
                  #{item._id.slice(-8).toUpperCase()}
                </Text>
              </View>
              <View
                style={[
                  styles.statusContainer,
                  {backgroundColor: `${getStatusColor(item.status)}20`},
                ]}>
                <Icon
                  name={getStatusIcon(item.status)}
                  size={16}
                  color={getStatusColor(item.status)}
                />
                <Text
                  style={[
                    styles.orderStatus,
                    {color: getStatusColor(item.status)},
                  ]}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
            </View>

            <Text style={styles.orderDate}>
              {moment(item.createdAt || new Date()).format('MMM DD, YYYY • hh:mm A')}
            </Text>

            <View style={styles.productsContainer}>
              {items.slice(0, 2).map((product, idx) => (
                <View key={idx} style={styles.productItem}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {product?.product?.name || 'Unknown Product'}
                  </Text>
                  <View style={styles.productMeta}>
                    <Text style={styles.productQuantity}>
                      ×{product?.quantity || 1}
                    </Text>
                    <Text style={styles.productPrice}>
                      ₹{(product?.price || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
              {items.length > 2 && (
                <Text style={styles.moreItemsText}>
                  +{(items.length - 2)} more
                </Text>
              )}
            </View>

            <View style={styles.orderFooter}>
              <View style={styles.customerInfo}>
                <Icon name="person-outline" size={18} color={SUBTEXT_COLOR} />
                <Text style={styles.customerName} numberOfLines={1}>
                  {user.userName || 'Unknown'}
                </Text>
              </View>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalAmount}>₹{(item.total || 0).toFixed(2)}</Text>
              </View>
            </View>
          </LinearGradient>

          {item.status !== 'delivered' && item.status !== 'cancelled' && (
            <TouchableOpacity
              style={[
                styles.statusButton,
                {backgroundColor: getStatusColor(item.status)},
              ]}
              onPress={() => handleUpdateStatus(item._id, item.status)}
              activeOpacity={0.7}>
              <Text style={styles.statusButtonText}>
                {item.status === 'pending'
                  ? 'Start Processing'
                  : item.status === 'processing'
                  ? 'Mark Shipped'
                  : 'Mark Delivered'}
              </Text>
              <Icon name="arrow-forward" size={18} color={CARD_BACKGROUND} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (isLoading || (loading && !orders[activeTab]?.length)) {
    return (
      <LinearGradient colors={GRADIENT_COLORS} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Fetching your orders...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error && !orders[activeTab]?.length) {
    return (
      <LinearGradient colors={GRADIENT_COLORS} style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="error" size={60} color={ERROR_COLOR} />
          <Text style={styles.errorText}>
            {error.message || 'Unable to load orders'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryText}>Retry</Text>
            <Icon name="refresh" size={20} color={CARD_BACKGROUND} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={GRADIENT_COLORS} style={styles.container}>
      <Header
        showLeftIcon={true}
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        isSearch={false}
        title={'Orders'}
      />

      <View style={styles.contentContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContainer}>
          {[
            'all',
            'pending',
            'processing',
            'shipped',
            'delivered',
            'cancelled',
          ].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          data={orders[activeTab] || []}
          renderItem={renderOrderItem}
          keyExtractor={item => item?._id || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[PRIMARY_COLOR]}
              tintColor={PRIMARY_COLOR}
            />
          }
          onEndReached={activeTab === 'all' ? null : handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <Animated.View
              style={[
                styles.emptyContainer,
                {opacity: fadeAnim, transform: [{scale: scaleAnim}]},
              ]}>
              <Icon name="inbox" size={80} color={SUBTEXT_COLOR} />
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'all'
                  ? 'No orders received.'
                  : `No ${activeTab} orders found.`}
              </Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}>
                <Text style={styles.refreshText}>Refresh</Text>
                <Icon name="refresh" size={20} color={PRIMARY_COLOR} />
              </TouchableOpacity>
            </Animated.View>
          }
          ListFooterComponent={
            loading && orders[activeTab]?.length > 0 && activeTab !== 'all' ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                <Text style={styles.footerText}>Loading more...</Text>
              </View>
            ) : null
          }
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    // flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: TEXT_COLOR,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: TEXT_COLOR,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: PRIMARY_COLOR,
  },
  retryText: {
    color: CARD_BACKGROUND,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  tabContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: CARD_BACKGROUND,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: `${PRIMARY_COLOR}20`,
  },
  tabText: {
    fontSize: 16,
    color: SUBTEXT_COLOR,
    fontWeight: '500',
  },
  activeTabText: {
    color: PRIMARY_COLOR,
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  orderCard: {
    width: CARD_WIDTH,
    alignSelf: 'center',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_COLOR,
    marginLeft: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  orderDate: {
    fontSize: 14,
    color: SUBTEXT_COLOR,
    marginBottom: 12,
  },
  productsContainer: {
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    paddingTop: 12,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 15,
    color: TEXT_COLOR,
    flex: 1,
    fontWeight: '500',
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productQuantity: {
    fontSize: 14,
    color: SUBTEXT_COLOR,
    marginRight: 12,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  moreItemsText: {
    fontSize: 13,
    color: SUBTEXT_COLOR,
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '50%',
  },
  customerName: {
    fontSize: 14,
    color: SUBTEXT_COLOR,
    marginLeft: 8,
    fontWeight: '500',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    color: SUBTEXT_COLOR,
    marginRight: 8,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_COLOR,
  },
  statusButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statusButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: CARD_BACKGROUND,
    marginRight: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_COLOR,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: SUBTEXT_COLOR,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
  },
  refreshText: {
    fontSize: 16,
    color: PRIMARY_COLOR,
    fontWeight: '600',
    marginRight: 8,
  },
  footerLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  footerText: {
    fontSize: 14,
    color: SUBTEXT_COLOR,
    marginLeft: 8,
  },
});

export default SellerOrders;