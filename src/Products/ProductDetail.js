
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Video from 'react-native-video';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../constants/Colors';
import { deleteProductApi, getProductApi, getRelatedProductsApi } from '../../apiClient';

const ProductDetail = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState("");
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [userId, setUserId] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetchData = async () => {
    try {
      setLoading(true);

      const storedUser = await AsyncStorage.getItem('user');
      const userToken = await AsyncStorage.getItem('userToken');
      if (storedUser && userToken) {
        const parsedUser = JSON.parse(storedUser);
        setUserId(parsedUser.id);
        setToken(userToken);
      }

      const productResponse = await getProductApi(productId);
      
      if (productResponse) {
        setProduct(productResponse.data.product);
      } else {
        Alert.alert('Error', productResponse.data.msg || 'Failed to fetch product details');
        navigation.goBack();
      }

      const relatedResponse = await getRelatedProductsApi(productId);
      if (relatedResponse.ok) {
        setRelatedProducts(relatedResponse.data.products || []);
      } else {
        console.warn('No related products found');
        setRelatedProducts([]);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [productId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { ok, data } = await deleteProductApi(token, productId);
            if (ok) {
              Alert.alert('Success', 'Product deleted successfully');
              navigation.goBack();
            } else {
              Alert.alert('Error', data.msg || 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('EditProduct', { product });
  };

  const renderMediaItem = ({ item }) => (
    <View style={styles.mediaItem}>
      {item.mediaType === 'video' ? (
        <Video
          source={{ uri: item.url }}
          style={styles.media}
          resizeMode="contain"
          muted
          repeat
        />
      ) : (
        <Image source={{ uri: item.url }} style={styles.media} resizeMode="contain" />
      )}
    </View>
  );

  const renderRelatedProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.relatedProductCard}
      onPress={() => navigation.push('ProductDetail', { productId: item.id })}
    >
      <Image
        source={{ uri: item.media[0]?.url || 'https://via.placeholder.com/100' }}
        style={styles.relatedProductImage}
      />
      <Text style={styles.relatedProductName}>{item.name}</Text>
      <Text style={styles.relatedProductPrice}>₹{item.price}</Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.blue} />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <FlatList
        data={product.media}
        renderItem={renderMediaItem}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.mediaList}
      />

      <View style={styles.detailsContainer}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>₹{product.price}</Text>
        <Text style={styles.description}>{product.description}</Text>
      </View>

      {userId === product.createdBy && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Text style={styles.buttonText}>Edit Product</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.buttonText}>Delete Product</Text>
          </TouchableOpacity>
        </View>
      )}

      {relatedProducts.length > 0 && (
        <View style={styles.relatedProductsContainer}>
          <Text style={styles.relatedProductsTitle}>Related Products</Text>
          <FlatList
            data={relatedProducts}
            renderItem={renderRelatedProduct}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.relatedProductsList}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaList: {
    height: 300,
  },
  mediaItem: {
    width: Dimensions.get('window').width,
    height: 300,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  price: {
    fontSize: 20,
    color: Colors.pink,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  editButton: {
    backgroundColor: Colors.blue,
    padding: 15,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: Colors.pink,
    padding: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  relatedProductsContainer: {
    padding: 20,
  },
  relatedProductsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  relatedProductsList: {
    paddingVertical: 10,
  },
  relatedProductCard: {
    width: 150,
    marginRight: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  relatedProductImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  relatedProductName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  relatedProductPrice: {
    fontSize: 14,
    color: Colors.pink,
    marginTop: 5,
  },
});

export default ProductDetail;