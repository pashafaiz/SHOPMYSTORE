import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  FlatList,
  ToastAndroid,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import Header from '../Components/Header';

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
const PRIMARY_THEME_COLOR = '#5b9cff';
const SECONDARY_THEME_COLOR = '#ff6b8a';
const TEXT_THEME_COLOR = '#1a2b4a';
const SUBTEXT_THEME_COLOR = '#5a6b8a';
const BORDER_THEME_COLOR = 'rgba(91, 156, 255, 0.3)';
const BACKGROUND_GRADIENT = ['#8ec5fc', '#fff'];

const PremiumPlans = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;

  const plans = [
    {
      id: '1',
      name: 'Basic',
      price: '$4.99',
      duration: 'month',
      tagline: 'Best for Beginners',
      features: [
        'Access to Basic Products',
        'Standard Support',
        'Limited Customization',
        '5 GB Storage',
      ],
    },
    {
      id: '2',
      name: 'Pro',
      price: '$9.99',
      duration: 'month',
      tagline: 'Ideal for Creators',
      features: [
        'Access to All Products',
        'Priority Support',
        'Advanced Customization',
        '20 GB Storage',
        'Exclusive Discounts',
      ],
    },
    {
      id: '3',
      name: 'Elite',
      price: '$19.99',
      duration: 'month',
      tagline: 'Ultimate Experience',
      features: [
        'Access to All Products',
        '24/7 Premium Support',
        'Full Customization',
        'Unlimited Storage',
        'Exclusive Discounts',
        'Early Access to Features',
      ],
    },
  ];

  // Animations
  const pressAnims = useRef(plans.map(() => new Animated.Value(1))).current;
  const shimmerAnims = useRef(plans.map(() => new Animated.Value(-1))).current;

  useEffect(() => {
    // Screen entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Shimmer animation for each card
    shimmerAnims.forEach((anim) => {
      Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    });
  }, [fadeAnim, slideUpAnim, shimmerAnims]);

  const handleSubscribe = (planName) => {
    console.log(`Subscribed to ${planName} plan`);
    ToastAndroid.show(`Subscribed to ${planName} plan!`, ToastAndroid.SHORT);
  };

  const renderPlanItem = ({ item, index }) => {
    const pressAnim = pressAnims[index];
    const shimmerAnim = shimmerAnims[index];
    const isElitePlan = item.name === 'Elite';

    const onPressIn = () => {
      Animated.spring(pressAnim, {
        toValue: 0.97,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(pressAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={[styles.planItem, { transform: [{ scale: pressAnim }] }]}
      >
        <TouchableOpacity
          style={styles.planItemContent}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => handleSubscribe(item.name)}
        >
          <LinearGradient
            colors={[CATEGORY_BG_COLOR, CATEGORY_BG_COLOR]}
            style={styles.planItemGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Animated.View
              style={[
                styles.shimmerOverlay,
                {
                  transform: [
                    {
                      translateX: shimmerAnim.interpolate({
                        inputRange: [-1, 1],
                        outputRange: [-width * 0.9, width * 0.9],
                      }),
                    },
                  ],
                },
              ]}
            />
            {isElitePlan && (
              <View style={styles.eliteBadge}>
                <Text style={styles.badgeText}>Elite</Text>
              </View>
            )}
            <Text style={styles.planTagline}>
              {item.tagline}
            </Text>
            <View style={styles.planItemLeft}>
              <Icon name="diamond" size={scale(20)} color={PRIMARY_THEME_COLOR} style={styles.planIcon} />
              <View style={styles.planTextContainer}>
                <Text style={styles.planName}>
                  {item.name} Plan - {item.price}/{item.duration}
                </Text>
                {item.features.map((feature, featureIndex) => (
                  <View key={featureIndex} style={styles.featureRow}>
                    <Icon name="diamond" size={scale(12)} color={PRIMARY_THEME_COLOR} style={styles.featureIcon} />
                    <Text style={styles.featureText}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <LinearGradient
              colors={['#5b9cff', '#8ec5fc']}
              style={styles.subscribeButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.subscribeButtonText}>Subscribe</Text>
            </LinearGradient>
          </LinearGradient>
        </TouchableOpacity>
        <View style={styles.divider} />
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={BACKGROUND_GRADIENT}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <Animated.View
        style={[styles.mainContainer, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}
      >
        <Header
          showLeftIcon={true}
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
          title="Premium Plans"
          textStyle={styles.headerText}
          containerStyle={styles.headerContainer}
        />
        <View style={styles.headerSection}>
          <LinearGradient
            colors={['#5b9cff', '#8ec5fc']}
            style={styles.headerIconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="star" size={scale(36)} color={TEXT_THEME_COLOR} />
          </LinearGradient>
          <Text style={styles.headerTitle}>
            Upgrade to Premium
          </Text>
          <Text style={styles.headerSubtitle}>
            Unlock exclusive features with our premium plans.
          </Text>
        </View>

        <FlatList
          data={plans}
          renderItem={renderPlanItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRODUCT_BG_COLOR,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  mainContainer: {
    flex: 1,
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
    elevation: 5,
  },
  headerText: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
    textAlign: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginTop: scale(20),
    marginBottom: scale(30),
    padding: scale(20),
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(20),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    marginHorizontal: scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    elevation: 5,
  },
  headerIconContainer: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(16),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  headerTitle: {
    fontSize: scaleFont(22),
    fontWeight: '800',
    color: TEXT_THEME_COLOR,
    marginBottom: scale(8),
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    fontSize: scaleFont(14),
    color: SUBTEXT_THEME_COLOR,
    textAlign: 'center',
    paddingHorizontal: scale(20),
    lineHeight: scale(20),
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(40),
  },
  planItem: {
    marginBottom: scale(12),
    borderRadius: scale(16),
    overflow: 'hidden',
    backgroundColor: PRODUCT_BG_COLOR,
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(6),
    elevation: 3,
  },
  planItemContent: {
    borderRadius: scale(16),
    minHeight: scale(56),
  },
  planItemGradient: {
    padding: scale(14),
    justifyContent: 'space-between',
    minHeight: scale(56),
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: scale(50),
    backgroundColor: CATEGORY_BG_COLOR,
    opacity: 0.3,
  },
  eliteBadge: {
    position: 'absolute',
    top: scale(10),
    right: scale(10),
    paddingHorizontal: scale(6),
    paddingVertical: scale(6),
    borderRadius: scale(10),
    backgroundColor: SECONDARY_THEME_COLOR,
    borderWidth: scale(1),
    borderColor: BORDER_THEME_COLOR,
  },
  badgeText: {
    fontSize: scaleFont(12),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
    letterSpacing: 0.8,
  },
  planTagline: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: SUBTEXT_THEME_COLOR,
    marginBottom: scale(8),
    textAlign: 'left',
    opacity: 0.9,
  },
  planItemLeft: {
    flex: 1,
    marginRight: scale(12),
  },
  planIcon: {
    marginBottom: scale(8),
  },
  planTextContainer: {
    flex: 1,
  },
  planName: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
    marginBottom: scale(8),
    lineHeight: scale(24),
    letterSpacing: 0.8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(6),
  },
  featureIcon: {
    marginRight: scale(6),
  },
  featureText: {
    fontSize: scaleFont(14),
    fontWeight: '500',
    color: SUBTEXT_THEME_COLOR,
    lineHeight: scale(18),
    opacity: 0.9,
  },
  subscribeButton: {
    paddingVertical: scale(10),
    paddingHorizontal: scale(16),
    borderRadius: scale(12),
    borderWidth: scale(1),
    borderColor: BORDER_THEME_COLOR,
    alignItems: 'center',
    shadowColor: PRIMARY_THEME_COLOR,
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.3,
    shadowRadius: scale(6),
    elevation: 3,
  },
  subscribeButtonText: {
    fontSize: scaleFont(14),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
    letterSpacing: 0.8,
  },
  divider: {
    height: scale(1),
    backgroundColor: BORDER_THEME_COLOR,
    marginTop: scale(8),
    opacity: 0.5,
  },
});

export default PremiumPlans;