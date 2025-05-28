// SellerSupport.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Dimensions,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
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

const SellerSupport = ({ navigation }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    Alert.alert('Success', 'Your support request has been submitted');
    setSubject('');
    setMessage('');
  };

  const faqs = [
    {
      question: 'How do I add a new product?',
      answer: 'Go to the Products tab and click the "+" button to add a new product listing.',
    },
    {
      question: 'How are payments processed?',
      answer: 'Payments are processed through our secure payment gateway. You\'ll receive payments in your bank account within 3-5 business days.',
    },
    {
      question: 'How can I track my orders?',
      answer: 'All your orders can be viewed in the Orders tab where you can see their current status.',
    },
    {
      question: 'What are the seller fees?',
      answer: 'We charge a 10% commission on each sale. There are no listing fees or monthly charges.',
    },
  ];

  return (
    <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.container}>
       <Header
              showLeftIcon={true}
              leftIcon="arrow-back"
              onLeftPress={() => navigation.goBack()}
              isSearch={false}
              title={'Support'}
            />
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <Text style={styles.sectionDescription}>
            Have a question or issue? Send us a message and our support team will get back to you within 24 hours.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter subject"
              placeholderTextColor={SUBTEXT_THEME_COLOR}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your issue or question"
              placeholderTextColor={SUBTEXT_THEME_COLOR}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Request</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FAQs</Text>
          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqItem}>
              <Text style={styles.faqQuestion}>
                <Text style={styles.faqIcon}>Q: </Text>
                {faq.question}
              </Text>
              <Text style={styles.faqAnswer}>
                <Text style={styles.faqIcon}>A: </Text>
                {faq.answer}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>Need immediate assistance?</Text>
          <View style={styles.contactMethod}>
            <Icon name="email" size={20} color={PRIMARY_THEME_COLOR} />
            <Text style={styles.contactText}>support@sellerapp.com</Text>
          </View>
          <View style={styles.contactMethod}>
            <Icon name="phone" size={20} color={PRIMARY_THEME_COLOR} />
            <Text style={styles.contactText}>+1 (800) 123-4567</Text>
          </View>
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
  section: {
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
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
    marginBottom: scale(10),
  },
  sectionDescription: {
    fontSize: scaleFont(14),
    color: SUBTEXT_THEME_COLOR,
    marginBottom: scale(15),
  },
  formGroup: {
    marginBottom: scale(15),
  },
  label: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: TEXT_THEME_COLOR,
    marginBottom: scale(5),
  },
  input: {
    fontSize: scaleFont(16),
    color: TEXT_THEME_COLOR,
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(12),
    padding: scale(12),
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
  },
  textArea: {
    minHeight: scale(100),
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: PRIMARY_THEME_COLOR,
    borderRadius: scale(12),
    padding: scale(14),
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#fff',
  },
  faqItem: {
    marginBottom: scale(15),
  },
  faqQuestion: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: TEXT_THEME_COLOR,
    marginBottom: scale(5),
  },
  faqAnswer: {
    fontSize: scaleFont(14),
    color: SUBTEXT_THEME_COLOR,
  },
  faqIcon: {
    color: PRIMARY_THEME_COLOR,
    fontWeight: 'bold',
  },
  contactInfo: {
    backgroundColor: '#fff',
    borderRadius: scale(12),
    padding: scale(15),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 3,
    borderWidth: 1,
    borderColor: BORDER_THEME_COLOR,
  },
  contactTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: TEXT_THEME_COLOR,
    marginBottom: scale(15),
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(10),
  },
  contactText: {
    fontSize: scaleFont(14),
    color: TEXT_THEME_COLOR,
    marginLeft: scale(8),
  },
});

export default SellerSupport;