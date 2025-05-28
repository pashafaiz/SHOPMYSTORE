import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS, FONTS, DIMENSIONS } from '../constants/GlobalConstants';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ProductCard = ({ product, onPress }) => {
  const firstImage = product.media.length > 0 ? product.media[0].url : null;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        {firstImage ? (
          <Image source={{ uri: firstImage }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Icon name="image-off" size={24} color={COLORS.gray} />
          </View>
        )}
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.title} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.price}>₹{product.price.toLocaleString()}</Text>
        <View style={styles.stockContainer}>
          <Text style={[
            styles.stockText,
            product.stock > 0 ? styles.inStock : styles.outOfStock
          ]}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </Text>
        </View>
        <View style={styles.ratingContainer}>
          <Icon name="star" size={16} color={COLORS.warning} />
          <Text style={styles.ratingText}>{product.rating || '0.0'}</Text>
          <Text style={styles.reviewText}>({product.reviewCount || 0} reviews)</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.menuButton}>
        <Icon name="dots-vertical" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.padding,
    marginBottom: DIMENSIONS.margin,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: DIMENSIONS.margin,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  price: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 4,
  },
  stockContainer: {
    marginBottom: 4,
  },
  stockText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
  inStock: {
    color: COLORS.success,
  },
  outOfStock: {
    color: COLORS.danger,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginLeft: 4,
    marginRight: 8,
  },
  reviewText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  menuButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
});

export default ProductCard;