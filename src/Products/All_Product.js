import React from 'react';
import { FlatList, StyleSheet, View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import Colors from '../constants/Colors';

const { width, height } = Dimensions.get('window');

const All_Product = ({ route, navigation }) => {
  const { products } = route.params || { products: [] };

  const RenderProductList = ({ item }) => (
    <TouchableOpacity
      style={styles.itemBox}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <View style={styles.product_Img}>
        <Image
          source={{ uri: item.media[0]?.url || 'https://via.placeholder.com/120' }}
          style={styles.productImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.itemText}>{item.name}</Text>
      <Text style={styles.priceText}>₹{item.price}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => <RenderProductList item={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContainer: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  itemBox: {
    width: width * 0.45,
    backgroundColor: Colors.lightPurple,
    borderRadius: 10,
    margin: 6,
    alignItems: 'center',
    padding: 10,
  },
  product_Img: {
    width: width * 0.4,
    height: height * 0.22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.White,
    borderRadius: 8,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  itemText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.White,
    marginTop: 5,
  },
});

export default All_Product;