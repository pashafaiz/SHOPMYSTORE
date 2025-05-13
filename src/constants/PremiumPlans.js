import React, { useEffect, useRef, useContext } from 'react';
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
import { ThemeContext } from '../constants/ThemeContext';
import Header from '../Components/Header';

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = size => size * scaleFactor;
const scaleFont = size => Math.round(size * (Math.min(width, height) / 375));

const PremiumPlans = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
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
        style={[styles.planItem(theme), { transform: [{ scale: pressAnim }] }]}
      >
        <TouchableOpacity
          style={styles.planItemContent}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => handleSubscribe(item.name)}
        >
          <LinearGradient
            colors={['rgba(123, 97, 255, 0.2)', 'rgba(173, 77, 255, 0.2)']}
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
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.eliteBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.badgeText}>Elite</Text>
              </LinearGradient>
            )}
            <Text style={[styles.planTagline, { color: theme.textSecondary }]}>
              {item.tagline}
            </Text>
            <View style={styles.planItemLeft}>
              <Icon name="diamond" size={scale(20)} color="#FFD700" style={styles.planIcon} />
              <View style={styles.planTextContainer}>
                <Text style={[styles.planName, { color: theme.textPrimary }]}>
                  {item.name} Plan - {item.price}/{item.duration}
                </Text>
                {item.features.map((feature, featureIndex) => (
                  <View key={featureIndex} style={styles.featureRow}>
                    <Icon name="diamond" size={scale(12)} color="#FFD700" style={styles.featureIcon} />
                    <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.subscribeButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.subscribeButtonText}>Subscribe</Text>
            </LinearGradient>
          </LinearGradient>
        </TouchableOpacity>
        <View style={styles.divider(theme)} />
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.containerBg }]}>
      <LinearGradient
        colors={theme.background}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Animated.View
        style={[styles.mainContainer, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}
      >
        <Header
          showLeftIcon={true}
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
          title="Premium Plans"
          textStyle={{ color: theme.textPrimary }}
        />
        <View style={styles.headerSection(theme)}>
          <LinearGradient
            colors={['#7B61FF', '#AD4DFF']}
            style={styles.headerIconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="star" size={scale(36)} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Upgrade to Premium
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
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
  headerSection: theme => ({
    alignItems: 'center',
    marginTop: scale(30),
    marginBottom: scale(30),
    padding: scale(16),
    backgroundColor: theme.glassBg,
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: theme.glassBorder,
    marginHorizontal: scale(20),
  }),
  headerIconContainer: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(16),
  },
  headerTitle: {
    fontSize: scaleFont(24),
    fontWeight: '800',
    marginBottom: scale(8),
    textAlign: 'center',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(123, 97, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: scale(5),
  },
  headerSubtitle: {
    fontSize: scaleFont(14),
    textAlign: 'center',
    paddingHorizontal: scale(20),
    lineHeight: scale(20),
    opacity: 0.9,
  },
  listContainer: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(30),
  },
  planItem: theme => ({
    marginBottom: scale(8),
    borderRadius: scale(12),
    overflow: 'hidden',
    backgroundColor: theme.glassBg,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)', // Gold gradient border effect
  }),
  planItemContent: {
    borderRadius: scale(12),
    minHeight: scale(48),
  },
  planItemGradient: {
    padding: scale(12),
    justifyContent: 'space-between',
    minHeight: scale(48),
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: scale(50),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    opacity: 0.5,
  },
  eliteBadge: {
    position: 'absolute',
    top: scale(8),
    right: scale(8),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    fontSize: scaleFont(10),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  planTagline: {
    fontSize: scaleFont(12),
    fontWeight: '600',
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
    fontSize: scaleFont(16),
    fontWeight: '700',
    marginBottom: scale(8),
    lineHeight: scale(20),
    letterSpacing: 1,
    textShadowColor: 'rgba(123, 97, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: scale(3),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  featureIcon: {
    marginRight: scale(6),
  },
  featureText: {
    fontSize: scaleFont(12),
    fontWeight: '500',
    lineHeight: scale(16),
    opacity: 0.9,
  },
  subscribeButton: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: scale(5),
  },
  subscribeButtonText: {
    fontSize: scaleFont(14),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: scale(3),
  },
  divider: theme => ({
    height: scale(1),
    backgroundColor: theme.glassBorder,
    marginTop: scale(8),
    opacity: 0.5,
  }),
});

export default PremiumPlans;