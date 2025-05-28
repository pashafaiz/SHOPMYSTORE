import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, DIMENSIONS } from '../constants/GlobalConstants';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SellerPromos = () => {
  const [activeTab, setActiveTab] = useState('active');

  const activePromos = [
    {
      id: '1',
      code: 'SUMMER20',
      discount: '20%',
      validUntil: '2023-08-31',
      minOrder: '₹500',
      uses: '45',
    },
    {
      id: '2',
      code: 'FREESHIP',
      discount: 'Free Shipping',
      validUntil: '2023-07-31',
      minOrder: '₹1000',
      uses: '32',
    },
  ];

  const expiredPromos = [
    {
      id: '3',
      code: 'WELCOME10',
      discount: '10%',
      validUntil: '2023-05-31',
      minOrder: '₹200',
      uses: '78',
    },
  ];

  const renderPromoItem = ({ item }) => (
    <View style={styles.promoCard}>
      <View style={styles.promoHeader}>
        <Text style={styles.promoCode}>{item.code}</Text>
        <Text style={styles.promoDiscount}>{item.discount}</Text>
      </View>
      <View style={styles.promoDetails}>
        <View style={styles.promoDetail}>
          <Icon name="calendar" size={16} color={COLORS.textSecondary} />
          <Text style={styles.promoDetailText}>Valid until {item.validUntil}</Text>
        </View>
        <View style={styles.promoDetail}>
          <Icon name="currency-inr" size={16} color={COLORS.textSecondary} />
          <Text style={styles.promoDetailText}>Min. order {item.minOrder}</Text>
        </View>
        <View style={styles.promoDetail}>
          <Icon name="tag" size={16} color={COLORS.textSecondary} />
          <Text style={styles.promoDetailText}>Used {item.uses} times</Text>
        </View>
      </View>
      <View style={styles.promoActions}>
        <TouchableOpacity style={styles.promoActionButton}>
          <Text style={styles.promoActionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.promoActionButton}>
          <Text style={styles.promoActionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Promotions</Text>
        <TouchableOpacity style={styles.addButton}>
          <Icon name="plus" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'expired' && styles.activeTab]}
          onPress={() => setActiveTab('expired')}
        >
          <Text style={[styles.tabText, activeTab === 'expired' && styles.activeTabText]}>Expired</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'active' ? activePromos : expiredPromos}
        renderItem={renderPromoItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="tag-off" size={48} color={COLORS.gray} />
            <Text style={styles.emptyText}>
              {activeTab === 'active' 
                ? 'No active promotions' 
                : 'No expired promotions'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DIMENSIONS.padding,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.borderRadius,
    padding: 4,
    margin: DIMENSIONS.margin,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: DIMENSIONS.borderRadius - 4,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.white,
  },
  listContainer: {
    padding: DIMENSIONS.padding,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DIMENSIONS.padding * 2,
  },
  emptyText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: DIMENSIONS.margin,
  },
  promoCard: {
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
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DIMENSIONS.margin,
  },
  promoCode: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.primary,
  },
  promoDiscount: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  promoDetails: {
    marginBottom: DIMENSIONS.margin,
  },
  promoDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  promoDetailText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  promoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: DIMENSIONS.padding,
  },
  promoActionButton: {
    flex: 1,
    alignItems: 'center',
  },
  promoActionText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.primary,
  },
});

export default SellerPromos;