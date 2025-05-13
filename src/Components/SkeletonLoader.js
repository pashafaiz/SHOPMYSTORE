import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = (size) => size * scaleFactor;

const SkeletonLoader = () => {
  const [loadingAnim] = useState(new Animated.Value(0));
  const totalElements = 15; // Total number of skeleton elements

  useEffect(() => {
    // Create a wave of animations
    const animations = [];
    
    for (let i = 0; i < totalElements; i++) {
      animations.push(
        Animated.delay(i * 100), // 100ms delay between elements
        Animated.timing(loadingAnim, {
          toValue: i + 1,
          duration: 300,
          useNativeDriver: true,
        })
      );
    }

    Animated.sequence(animations).start();
  }, []);

  // Animation for each element
  const getElementAnimation = (index) => {
    const inputRange = Array.from({length: totalElements + 1}, (_, i) => i);
    const outputRangeOpacity = inputRange.map(i => i >= index ? 1 : 0);
    const outputRangeTranslateY = inputRange.map(i => i >= index ? 0 : 10);

    return {
      opacity: loadingAnim.interpolate({
        inputRange,
        outputRange: outputRangeOpacity,
        extrapolate: 'clamp',
      }),
      transform: [
        {
          translateY: loadingAnim.interpolate({
            inputRange,
            outputRange: outputRangeTranslateY,
            extrapolate: 'clamp',
          }),
        },
      ],
    };
  };

  return (
    <LinearGradient colors={['#1A1A3A', '#2A2A5A']} style={styles.container}>
      {/* Media Placeholder (Element 1) */}
      <Animated.View 
        style={[
          styles.skeletonMediaContainer,
          getElementAnimation(1),
          { height: width * 0.9 }
        ]}
      >
        <View style={styles.skeletonMedia} />
      </Animated.View>

      {/* Product Info (Elements 2-5) */}
      <View style={styles.skeletonDetails}>
        <Animated.View style={[styles.skeletonBrandRating, getElementAnimation(2)]}>
          <View style={[styles.skeletonLine, { width: '30%', height: 16 }]} />
          <View style={[styles.skeletonLine, { width: '20%', height: 16, marginLeft: 10 }]} />
        </Animated.View>
        
        <Animated.View style={getElementAnimation(3)}>
          <View style={[styles.skeletonLine, { width: '80%', height: 24, marginVertical: 8 }]} />
        </Animated.View>
        
        <Animated.View style={[styles.skeletonPriceContainer, getElementAnimation(4)]}>
          <View style={[styles.skeletonLine, { width: '25%', height: 24 }]} />
          <View style={[styles.skeletonLine, { width: '20%', height: 18, marginLeft: 10 }]} />
        </Animated.View>
        
        <Animated.View style={getElementAnimation(5)}>
          <View style={[styles.skeletonLine, { width: '30%', height: 20, marginBottom: 15 }]} />
        </Animated.View>
      </View>

      {/* Size Selector (Elements 6-7) */}
      <Animated.View style={[styles.skeletonDivider, getElementAnimation(6)]} />
      
      <Animated.View style={[styles.skeletonSection, getElementAnimation(7)]}>
        <View style={[styles.skeletonLine, { width: '20%', height: 16, marginBottom: 10 }]} />
        <View style={styles.skeletonSizeContainer}>
          {[1, 2, 3, 4].map((_, i) => (
            <View key={i} style={styles.skeletonSize} />
          ))}
        </View>
      </Animated.View>

      {/* Color Selector (Element 8) */}
      <Animated.View style={[styles.skeletonSection, getElementAnimation(8)]}>
        <View style={[styles.skeletonLine, { width: '20%', height: 16, marginBottom: 10 }]} />
        <View style={styles.skeletonColorContainer}>
          {[1, 2, 3, 4].map((_, i) => (
            <View key={i} style={styles.skeletonColor} />
          ))}
        </View>
      </Animated.View>

      {/* Quantity Selector (Element 9) */}
      <Animated.View style={[styles.skeletonSection, getElementAnimation(9)]}>
        <View style={[styles.skeletonLine, { width: '30%', height: 16, marginBottom: 10 }]} />
        <View style={styles.skeletonQuantityContainer}>
          <View style={styles.skeletonQuantityButton} />
          <View style={[styles.skeletonLine, { width: 40, height: 30 }]} />
          <View style={styles.skeletonQuantityButton} />
        </View>
      </Animated.View>

      {/* Seller Info (Elements 10-11) */}
      <Animated.View style={[styles.skeletonDivider, getElementAnimation(10)]} />
      
      <Animated.View style={[styles.skeletonUserInfo, getElementAnimation(11)]}>
        <View style={styles.skeletonUserImage} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={[styles.skeletonLine, { width: '30%', height: 12 }]} />
          <View style={[styles.skeletonLine, { width: '50%', height: 16, marginTop: 5 }]} />
        </View>
        <View style={styles.skeletonCallButton} />
      </Animated.View>

      {/* Highlights (Elements 12-13) */}
      <Animated.View style={[styles.skeletonDivider, getElementAnimation(12)]} />
      
      <Animated.View style={[styles.skeletonSection, getElementAnimation(13)]}>
        <View style={[styles.skeletonLine, { width: '30%', height: 16, marginBottom: 10 }]} />
        {[1, 2, 3, 4].map((_, i) => (
          <View key={i} style={[styles.skeletonLine, { 
            width: i % 2 === 0 ? '90%' : '80%', 
            height: 14, 
            marginBottom: 6 
          }]} />
        ))}
      </Animated.View>

      {/* Tabs (Element 14) */}
      <Animated.View style={[styles.skeletonTabs, getElementAnimation(14)]}>
        {['Description', 'Specifications', 'Reviews'].map((tab, i) => (
          <View key={i} style={styles.skeletonTab}>
            <View style={[styles.skeletonLine, { width: '70%', height: 16 }]} />
          </View>
        ))}
      </Animated.View>

      {/* Action Bar (Element 15) */}
      <Animated.View style={[styles.skeletonActionBar, getElementAnimation(15)]}>
        <View style={styles.skeletonWishlistButton} />
        <View style={styles.skeletonCartButton} />
        <View style={styles.skeletonBuyButton} />
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skeletonMediaContainer: {
    position: 'relative',
    marginBottom: scale(15),
  },
  skeletonMedia: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  skeletonDetails: {
    padding: scale(20),
  },
  skeletonBrandRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  skeletonPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(15),
  },
  skeletonLine: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: scale(4),
    overflow: 'hidden',
  },
  skeletonDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: scale(15),
  },
  skeletonSection: {
    marginBottom: scale(15),
  },
  skeletonSizeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skeletonSize: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(4),
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: scale(10),
    marginBottom: scale(10),
  },
  skeletonColorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skeletonColor: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: scale(10),
    marginBottom: scale(10),
  },
  skeletonQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonQuantityButton: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: scale(10),
  },
  skeletonUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(10),
  },
  skeletonUserImage: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  skeletonCallButton: {
    width: scale(80),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  skeletonTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  skeletonTab: {
    flex: 1,
    paddingVertical: scale(15),
    alignItems: 'center',
  },
  skeletonActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: scale(10),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  skeletonWishlistButton: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: scale(10),
  },
  skeletonCartButton: {
    flex: 1,
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: scale(10),
  },
  skeletonBuyButton: {
    flex: 1,
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});

export default SkeletonLoader;