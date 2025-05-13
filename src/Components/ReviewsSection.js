// import React from 'react';
// import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
// import Rating from './Rating';

// const ReviewsSection = ({ reviews, onWriteReview }) => {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Customer Reviews</Text>
//       {reviews.length === 0 ? (
//         <Text style={styles.noReviewsText}>No reviews yet</Text>
//       ) : (
//         <ScrollView>
//           {reviews.map((review) => (
//             <View key={review.id} style={styles.reviewCard}>
//               <View style={styles.reviewHeader}>
//                 <Text style={styles.reviewUser}>{review.user}</Text>
//                 <Rating rating={review.rating} size={14} />
//               </View>
//               <Text style={styles.reviewDate}>{review.date}</Text>
//               <Text style={styles.reviewComment}>{review.comment}</Text>
//             </View>
//           ))}
//         </ScrollView>
//       )}
//       <TouchableOpacity style={styles.writeReviewButton} onPress={onWriteReview}>
//         <Text style={styles.writeReviewButtonText}>Write a Review</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     marginVertical: 10,
//   },
//   title: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#FFFFFF',
//     marginBottom: 15,
//   },
//   noReviewsText: {
//     fontSize: 14,
//     color: '#A78BFA',
//     textAlign: 'center',
//     marginVertical: 20,
//   },
//   reviewCard: {
//     backgroundColor: '#2A2A5A',
//     borderRadius: 8,
//     padding: 15,
//     marginBottom: 15,
//   },
//   reviewHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 5,
//   },
//   reviewUser: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#FFFFFF',
//   },
//   reviewDate: {
//     fontSize: 12,
//     color: '#A78BFA',
//     marginBottom: 10,
//   },
//   reviewComment: {
//     fontSize: 14,
//     color: '#A78BFA',
//     lineHeight: 20,
//   },
//   writeReviewButton: {
//     backgroundColor: '#A78BFA',
//     padding: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginTop: 15,
//   },
//   writeReviewButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// export default ReviewsSection;