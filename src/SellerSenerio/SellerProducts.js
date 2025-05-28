import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image,
  RefreshControl
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSellerProducts, fetchProductAnalytics } from '../redux/slices/sellerSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../Components/Header';
import { COLORS, SIZES, FONTS, scale, scaleFont, commonStyles } from '../utils/theme';

const SellerProducts = ({ navigation }) => {
  const dispatch = useDispatch();
  const { products, productAnalytics, loading, error } = useSelector((state) => state.seller);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = () => {
    const limit = activeTab === 'all' ? 100 : 10;
    dispatch(fetchSellerProducts({ page, limit, status: activeTab === 'all' ? undefined : activeTab }));
    if (page === 1) {
      dispatch(fetchProductAnalytics());
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setPage(1);
      loadProducts();
    }, [activeTab])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadProducts();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (activeTab !== 'all' && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity 
      style={[commonStyles.card, styles.productCard]}
      onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
    >
      <Image 
        source={{ uri: item.media[0]?.url }} 
        style={styles.productImage} 
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productPrice}>₹{item.price}</Text>
        <View style={styles.stockContainer}>
          <Text style={[
            styles.stockText,
            { color: item.stock > 0 ? COLORS.SUCCESS : COLORS.SECONDARY }
          ]}>
            {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.editButton} 
        onPress={() => navigation.navigate('ProductScreen', { product: item, screenType: 'edit' })}
      >
        <Icon name="edit" size={20} color={COLORS.PRIMARY} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading && !products.length && !refreshing) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={commonStyles.errorContainer}>
        <Text style={commonStyles.errorText}>{error}</Text>
        <TouchableOpacity onPress={handleRefresh} style={commonStyles.retryButton}>
          <Text style={commonStyles.retryText}>Retry</Text>
          <Icon name="refresh" size={18} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient colors={COLORS.GRADIENT} style={commonStyles.container}>
      <Header 
        title="My Products" 
      />
      <View style={styles.contentContainer}>
        {/* Analytics Summary */}
        <View style={[commonStyles.card, styles.analyticsContainer]}>
          <View style={styles.analyticItem}>
            <Text style={styles.analyticValue}>{productAnalytics?.totalProducts || 0}</Text>
            <Text style={styles.analyticLabel}>Total Products</Text>
          </View>
          <View style={styles.analyticItem}>
            <Text style={[styles.analyticValue, { color: COLORS.SUCCESS }]}>
              {productAnalytics?.activeProducts || 0}
            </Text>
            <Text style={styles.analyticLabel}>Active</Text>
          </View>
          <View style={styles.analyticItem}>
            <Text style={[styles.analyticValue, { color: COLORS.SECONDARY }]}>
              {productAnalytics?.outOfStockProducts || 0}
            </Text>
            <Text style={styles.analyticLabel}>Out of Stock</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={[commonStyles.card, styles.tabContainer]}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'active' && styles.activeTab]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'out_of_stock' && styles.activeTab]}
            onPress={() => setActiveTab('out_of_stock')}
          >
            <Text style={[styles.tabText, activeTab === 'out_of_stock' && styles.activeTabText]}>Out of Stock</Text>
          </TouchableOpacity>
        </View>

        {/* Product List */}
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh} 
              colors={[COLORS.PRIMARY]} 
            />
          }
          onEndReached={activeTab === 'all' ? null : handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={commonStyles.emptyContainer}>
              <Icon name="inventory" size={50} color={COLORS.SUBTEXT} />
              <Text style={commonStyles.emptyText}>No products found</Text>
            </View>
          }
          ListFooterComponent={
            activeTab !== 'all' && loading && products.length > 0 ? (
              <ActivityIndicator size="small" color={COLORS.PRIMARY} />
            ) : null
          }
        />

        {/* Add Product Button */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('ProductScreen')}
        >
          <Icon name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: scale(15),
  },
  analyticsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(10),
  },
  analyticItem: {
    alignItems: 'center',
    width: '30%',
  },
  analyticValue: {
    ...FONTS.h2,
    fontWeight: 'bold',
    color: COLORS.TEXT,
  },
  analyticLabel: {
    ...FONTS.body4,
    color: COLORS.SUBTEXT,
    marginTop: scale(5),
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(10),
    marginBottom: scale(10),
  },
  tabButton: {
    flex: 1,
    padding: scale(15),
    borderBottomWidth: scale(2),
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  activeTab: {
    borderBottomColor: COLORS.PRIMARY,
  },
  tabText: {
    ...FONTS.body4,
    color: COLORS.SUBTEXT,
  },
  activeTabText: {
    color: COLORS.TEXT,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: scale(60),
  },
  productCard: {
    flexDirection: 'row',
    marginHorizontal: scale(10),
    marginBottom: scale(10),
    padding: scale(10),
  },
  productImage: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(8),
  },
  productInfo: {
    flex: 1,
    marginLeft: scale(10),
    justifyContent: 'center',
  },
  productName: {
    ...FONTS.h3,
    fontWeight: '600',
    color: COLORS.TEXT,
  },
  productPrice: {
    ...FONTS.h3,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginVertical: scale(5),
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    ...FONTS.body4,
    fontWeight: '500',
  },
  editButton: {
    padding: scale(5),
    alignSelf: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: scale(70),
    right: scale(20),
    backgroundColor: COLORS.PRIMARY,
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.TEXT,
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.3,
    shadowRadius: scale(4),
    elevation: 5,
  },
});

export default SellerProducts;