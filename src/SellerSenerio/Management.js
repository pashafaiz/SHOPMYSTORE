// Management.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../Components/Header';

// Theme constants
const PRODUCT_BG_COLOR = '#f5f9ff';
const CATEGORY_BG_COLOR = 'rgba(91, 156, 255, 0.2)';
const PRIMARY_THEME_COLOR = '#5b9cff';
const SECONDARY_THEME_COLOR = '#ff6b8a';
const TEXT_THEME_COLOR = '#1a2b4a';
const SUBTEXT_THEME_COLOR = '#5a6b8a';
const BORDER_THEME_COLOR = 'rgba(91, 156, 255, 0.3)';
const BACKGROUND_GRADIENT = ['#8ec5fc', '#fff'];

const { width,height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375));

const Management = () => {
  const navigation = useNavigation();

  const managementOptions = [
    {
      title: 'Products',
      icon: 'inventory',
      screen: 'SellerProducts',
      description: 'Manage your product listings',
    },
    {
      title: 'Orders',
      icon: 'list-alt',
      screen: 'SellerOrders',
      description: 'View and process customer orders',
    },
    {
      title: 'Analytics',
      icon: 'analytics',
      screen: 'SellerAnalytics',
      description: 'View sales and performance data',
    },
    {
      title: 'Profile',
      icon: 'store',
      screen: 'SellerProfile',
      description: 'Update your seller profile',
    },
    {
      title: 'Chats',
      icon: 'chat',
      screen: 'SellerChats',
      description: 'Communicate with customers',
    },
    {
      title: 'Notifications',
      icon: 'notifications',
      screen: 'SellerNotifications',
      description: 'View your notifications',
    },
  ];

  return (
    <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.container}>
      <Header 
        title="Management"
      />
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.subtitle}>Manage your store activities</Text>
        
        <View style={styles.grid}>
          {managementOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => navigation.navigate(option.screen)}
            >
              <View style={styles.iconContainer}>
                <Icon name={option.icon} size={30} color={PRIMARY_THEME_COLOR} />
              </View>
              <Text style={styles.cardTitle}>{option.title}</Text>
              <Text style={styles.cardDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: scale(15),
  },
  subtitle: {
    fontSize: scaleFont(14),
    color: SUBTEXT_THEME_COLOR,
    marginBottom: scale(20),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: scale(12),
    padding: scale(15),
    marginBottom: scale(15),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 3,
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
  },
  iconContainer: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: CATEGORY_BG_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(10),
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
  },
  cardTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: TEXT_THEME_COLOR,
    marginBottom: scale(5),
  },
  cardDescription: {
    fontSize: scaleFont(12),
    color: SUBTEXT_THEME_COLOR,
  },
});

export default Management;