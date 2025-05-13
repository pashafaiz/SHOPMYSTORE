import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Rating = ({ rating, size = 16, showText = false }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View style={styles.container}>
      {[...Array(fullStars)].map((_, i) => (
        <Icon key={`full-${i}`} name="star" size={size} color="#FFD700" />
      ))}
      {hasHalfStar && (
        <Icon key="half" name="star-half" size={size} color="#FFD700" />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Icon key={`empty-${i}`} name="star-border" size={size} color="#FFD700" />
      ))}
      {showText && (
        <Text style={[styles.ratingText, { fontSize: size * 0.8 }]}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    color: '#A78BFA',
    fontWeight: 'bold',
  },
});

export default Rating;