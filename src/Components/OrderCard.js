import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS, FONTS, DIMENSIONS } from '../constants/GlobalConstants';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const OrderCard = ({ order, onPress, onStatusChange }) => {
  const [showActions, setShowActions] = useState(false);
  const productImage = order.product.media.length > 0 ? order.product.media[0].url : null;

  const getStatusColor = () => {
    switch (order.status) {
      case 'pending':
        return COLORS.warning;
      case 'processing':
        return COLORS.info;
      case 'shipped':
        return COLORS.primary;
      case 'delivered':
        return COLORS.success;
      case 'cancelled':
        return COLORS.danger;
      default:
        return COLORS.gray;
    }
  };

  const handleStatusAction = (newStatus) => {
    onStatusChange(order._id, newStatus);
    setShowActions(false);
  };

  const renderStatusActions = () => {
    if (!showActions) return null;

    const actions = [];
    switch (order.status) {
      case 'pending':
        actions.push(
          { label: 'Process', status: 'processing' },
          { label: 'Cancel', status: 'cancelled' }
        );
        break;
      case 'processing':
        actions.push(
          { label: 'Ship', status: 'shipped' },
          { label: 'Cancel', status: 'cancelled' }
        );
        break;
      case 'shipped':
        actions.push(
          { label: 'Mark as Delivered', status: 'delivered' }
        );
        break;
      default:
        return null;
    }

    return (
      <View style={styles.actionsContainer}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionButton}
            onPress={() => handleStatusAction(action.status)}
          >
            <Text style={styles.actionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        {productImage ? (
          <Image source={{ uri: productImage }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Icon name="image-off" size={24} color={COLORS.gray} />
          </View>
        )}
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.productName} numberOfLines={1}>{order.product.name}</Text>
        <Text style={styles.orderId}>Order #{order._id.slice(-6).toUpperCase()}</Text>
        <View style={styles.row}>
          <Text style={styles.price}>₹{order.total.toLocaleString()}</Text>
          <Text style={styles.quantity}>Qty: {order.quantity}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
          </View>
          <Text style={styles.date}>
            {new Date(order.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.menuButton}
        onPress={() => setShowActions(!showActions)}
      >
        <Icon name="dots-vertical" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
      {renderStatusActions()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
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
    width: 60,
    height: 60,
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
  },
  productName: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  orderId: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  price: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.primary,
  },
  quantity: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: COLORS.white,
  },
  date: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  menuButton: {
    position: 'absolute',
    top: DIMENSIONS.padding,
    right: DIMENSIONS.padding,
    padding: 4,
  },
  actionsContainer: {
    marginTop: DIMENSIONS.margin,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: DIMENSIONS.padding,
  },
  actionButton: {
    paddingVertical: 8,
    marginBottom: 4,
  },
  actionText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.primary,
  },
});

export default OrderCard;