import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { getAllProductsApi, getProductsByCategoryApi } from '../../apiClient';
import Loader from '../Components/Loader';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const scaleFactor = width / 375;
const numColumns = 2;

const categories = [
  { id: 'all', name: 'All', icon: 'apps' },
  { id: 'Assessories', name: 'Assessories', icon: 'devices' },
  { id: 'Grocery', name: 'Grocery', icon: 'shopping-basket' },
  { id: 'Toys', name: 'Toys', icon: 'medical-services' },
  { id: 'Clothes', name: 'Clothes', icon: 'checkroom' },
  { id: 'Shoes', name: 'Shoes', icon: 'shoes' },
  { id : 'Trending', name: 'Trending', icon: 'trending'}
];

const Categories = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { ok, data } = selectedCategory === 'all'
        ? await getAllProductsApi()
        : await getProductsByCategoryApi(selectedCategory);
      
      if (ok) {
        setProducts(data.products || []);
      } else {
        Toast.show({
          type: 'error',
          text1: data?.msg || 'Failed to fetch products'
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Network error. Please try again.'
      });
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const renderProductItem = ({ item }) => {
    return(

    <TouchableOpacity
      style={styles.productItem}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <Image
        source={{ uri: item.media[0]?.url || 'https://via.placeholder.com/150' }}
        style={styles.productImage}
        resizeMode="contain"
      />
      <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.productPrice}>₹{item.price}</Text>
    </TouchableOpacity>
    )
  }

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.selectedCategoryItem
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Icon 
        name={item.icon} 
        size={24} 
        color={selectedCategory === item.id ? '#10B981' : '#6B7280'} 
        style={styles.categoryIcon}
      />
      <Text style={styles.categoryName} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Categories Horizontal Scroll */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={categories}
          renderItem={renderCategory}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Products Grid with Refresh */}
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={item => item._id}
        numColumns={numColumns}
        contentContainerStyle={styles.productList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#10B981']}
            tintColor="#10B981"
          />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {refreshing ? '' : 'No products found'}
              </Text>
            </View>
          )
        }
      />

      <Loader visible={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: 10,
  },
  categoriesContainer: {
    height: 90,
    marginBottom: 10,
  },
  categoriesList: {
    paddingHorizontal: 15,
  },
  categoryItem: {
    width: 80,
    alignItems: 'center',
    marginRight: 15,
    paddingVertical: 10,
  },
  selectedCategoryItem: {
    borderBottomWidth: 2,
    borderBottomColor: '#10B981',
  },
  categoryIcon: {
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
  },
  productList: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  productItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    margin: 5,
    padding: 10,
    alignItems: 'center',
    elevation: 2,
    maxWidth: (width - 40) / 2,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  productName: {
    fontSize: 14,
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default Categories;