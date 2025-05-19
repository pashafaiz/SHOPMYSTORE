import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  Platform,
  ScrollView,
  Linking,
  TextInput,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import Trace from '../utils/Trace';
import Header from '../Components/Header';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFAQs, submitTicket, clearError } from '../redux/slices/supportSlice';
import {
  MAX_TICKET_SUBJECT_LENGTH,
  MAX_TICKET_DESCRIPTION_LENGTH,
  TOAST_POSITION,
  TOAST_TOP_OFFSET,
  TOAST_VISIBILITY_TIME,
} from '../constants/GlobalConstants';

const { width, height } = Dimensions.get('window');
const scaleFactor = Math.min(width, 375) / 375;
const scale = size => Math.round(size * scaleFactor);
const scaleFont = size => {
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

// Custom toast configuration
const toastConfig = {
  success: ({ text1, text2 }) => (
    <LinearGradient
      colors={['#5b9cff', '#8ec5fc']}
      style={styles.customToast}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.toastText1}>{text1}</Text>
      {text2 && <Text style={styles.toastText2}>{text2}</Text>}
    </LinearGradient>
  ),
  error: ({ text1, text2 }) => (
    <LinearGradient
      colors={['#ff6b8a', '#ff8f9f']}
      style={styles.customToast}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.toastText1}>{text1}</Text>
      {text2 && <Text style={styles.toastText2}>{text2}</Text>}
    </LinearGradient>
  ),
};

const FAQItem = ({ item, index, expandedFAQ, toggleFAQ }) => {
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: expandedFAQ === index ? scale(50) : 0,
        duration: 400,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(animatedOpacity, {
        toValue: expandedFAQ === index ? 1 : 0,
        duration: 400,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [expandedFAQ, index]);

  const onPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.97,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.faqItem, { transform: [{ scale: buttonScale }] }]}>
      <TouchableOpacity
        style={styles.faqQuestionContainer}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => toggleFAQ(index)}
      >
        <View style={styles.faqQuestionGradient}>
          <Text style={styles.faqQuestion}>{item.question}</Text>
          <Icon
            name={expandedFAQ === index ? 'expand-less' : 'expand-more'}
            size={scale(24)}
            color={PRIMARY_THEME_COLOR}
          />
        </View>
      </TouchableOpacity>
      <Animated.View
        style={[styles.faqAnswerContainer, { height: animatedHeight, opacity: animatedOpacity }]}
      >
        <Text style={styles.faqAnswer}>{item.answer}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const Support = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { faqs, loading, error } = useSelector(state => state.support);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const headerScale = useRef(new Animated.Value(0.8)).current;
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const isToggling = useRef(false);
  const [modalVisible, setModalVisible] = useState(false);
  const modalFadeAnim = useRef(new Animated.Value(0)).current;
  const modalSlideAnim = useRef(new Animated.Value(scale(150))).current;
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');

  useEffect(() => {
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
      Animated.spring(headerScale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    dispatch(fetchFAQs());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error,
        position: TOAST_POSITION,
        topOffset: TOAST_TOP_OFFSET,
        visibilityTime: TOAST_VISIBILITY_TIME,
        onHide: () => dispatch(clearError()),
      });
    }
  }, [error, dispatch]);

  const toggleFAQ = (index) => {
    if (isToggling.current) return;
    isToggling.current = true;

    const isExpanding = expandedFAQ !== index;
    setExpandedFAQ(isExpanding ? index : null);

    setTimeout(() => {
      isToggling.current = false;
    }, 400);
  };

  const openModal = () => {
    setModalVisible(true);
    Animated.parallel([
      Animated.timing(modalFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(modalSlideAnim, {
        toValue: 0,
        tension: 120,
        friction: 14,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalFadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(modalSlideAnim, {
        toValue: scale(150),
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      setTicketSubject('');
      setTicketDescription('');
    });
  };

  const handleContact = (type) => {
    Trace(`Support Contact Clicked: ${type}`);
    console.log(`Initiating ${type} contact...`);

    if (type === 'Email Support') {
      const email = 'mfaizpasha104@gmail.com';
      const subject = encodeURIComponent('Support Request');
      const body = encodeURIComponent('Please describe your issue...');
      const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
      const webmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;

      Linking.openURL(mailtoUrl).catch((error) => {
        console.error('Error opening email client:', error);
        Clipboard.setString(email);
        Toast.show({
          type: 'error',
          text1: 'Email Error',
          text2: `Unable to open email client. The email address ${email} has been copied to your clipboard.`,
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
          visibilityTime: TOAST_VISIBILITY_TIME,
          onPress: () => Linking.openURL(webmailUrl),
        });
      });
    } else if (type === 'Live Chat') {
      console.log('Navigating to Chat screen...');
      navigation.navigate('Chat');
    }
  };

  const handleTicketSubmit = () => {
    if (!ticketSubject.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a subject for your ticket.',
        position: TOAST_POSITION,
        topOffset: TOAST_TOP_OFFSET,
        visibilityTime: TOAST_VISIBILITY_TIME,
      });
      return;
    }

    dispatch(submitTicket({ subject: ticketSubject, description: ticketDescription }))
      .unwrap()
      .then(() => {
        Trace('Support: Ticket Submitted');
        closeModal();
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Your ticket has been submitted! You will receive a confirmation soon.',
          position: TOAST_POSITION,
          topOffset: TOAST_TOP_OFFSET,
          visibilityTime: TOAST_VISIBILITY_TIME,
        });
      })
      .catch((err) => {
        console.error('Ticket submission failed:', err);
      });
  };

  const renderContactButton = (type, icon) => {
    const buttonScale = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
      Animated.spring(buttonScale, {
        toValue: 0.97,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View style={[styles.contactButton, { transform: [{ scale: buttonScale }] }]}>
        <TouchableOpacity
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => handleContact(type)}
        >
          <LinearGradient
            colors={['#5b9cff', '#8ec5fc']}
            style={styles.contactButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name={icon} size={scale(20)} color={TEXT_THEME_COLOR} style={styles.contactIcon} />
            <Text style={styles.contactText}>{type}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderModal = () => {
    const buttonScale = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
      Animated.spring(buttonScale, {
        toValue: 0.97,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeModal}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: modalFadeAnim }]}>
          <Animated.View
            style={[styles.modalContainer, { transform: [{ translateY: modalSlideAnim }] }]}
          >
            <LinearGradient
              colors={['#f5f9ff', '#f5f9ff']}
              style={styles.modalGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Submit a Ticket</Text>
                <TouchableOpacity onPress={closeModal}>
                  <Icon name="close" size={scale(24)} color={PRIMARY_THEME_COLOR} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.modalInput}
                placeholder="Subject"
                placeholderTextColor={SUBTEXT_THEME_COLOR}
                value={ticketSubject}
                onChangeText={setTicketSubject}
                maxLength={MAX_TICKET_SUBJECT_LENGTH}
              />
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Describe your issue..."
                placeholderTextColor={SUBTEXT_THEME_COLOR}
                value={ticketDescription}
                onChangeText={setTicketDescription}
                multiline
                numberOfLines={5}
                maxLength={MAX_TICKET_DESCRIPTION_LENGTH}
              />
              <Animated.View style={[styles.modalButton, { transform: [{ scale: buttonScale }] }]}>
                <TouchableOpacity
                  onPressIn={onPressIn}
                  onPressOut={onPressOut}
                  onPress={handleTicketSubmit}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#5b9cff', '#8ec5fc']}
                    style={styles.modalButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.modalButtonText}>
                      {loading ? 'Submitting...' : 'Submit'}
                    </Text>
                    <Icon name="send" size={scale(18)} color={TEXT_THEME_COLOR} />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </Modal>
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
          title="Support"
          textStyle={{ color: TEXT_THEME_COLOR }}
          style={styles.header}
          iconColor={PRIMARY_THEME_COLOR}
        />
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.welcomeSection}>
            <LinearGradient
              colors={['#5b9cff', '#8ec5fc']}
              style={styles.welcomeIconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon name="support-agent" size={scale(30)} color={TEXT_THEME_COLOR} />
            </LinearGradient>
            <Text style={styles.welcomeTitle}>Premium Support</Text>
            <Text style={styles.welcomeSubtitle}>
              Your gateway to exceptional assistance—explore FAQs, reach out, or submit a ticket.
            </Text>
          </View>

          <View style={styles.faqSection}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            {loading ? (
              <Text style={styles.loadingText}>Loading FAQs...</Text>
            ) : faqs.length > 0 ? (
              faqs.map((item, index) => (
                <FAQItem
                  key={item._id || index}
                  item={item}
                  index={index}
                  expandedFAQ={expandedFAQ}
                  toggleFAQ={toggleFAQ}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>No FAQs available</Text>
            )}
          </View>

          <View style={styles.contactSection}>
            <Text style={styles.sectionTitle}>Get in Touch</Text>
            <View style={styles.contactButtons}>
              {renderContactButton('Email Support', 'email')}
              {renderContactButton('Live Chat', 'chat')}
            </View>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={openModal} activeOpacity={0.9}>
            <LinearGradient
              colors={['#5b9cff', '#8ec5fc']}
              style={styles.submitButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.submitButtonText}>Submit a Ticket</Text>
              <Icon name="send" size={scale(18)} color={TEXT_THEME_COLOR} />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
        {renderModal()}
      </Animated.View>
      <Toast config={toastConfig} />
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
  scrollContainer: {
    paddingHorizontal: scale(24),
    paddingBottom: scale(40),
    flexGrow: 1,
    marginTop: scale(30),
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: scale(32),
    padding: scale(20),
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(20),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    // elevation: 6,
  },
  welcomeIconContainer: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(16),
    shadowColor: PRIMARY_THEME_COLOR,
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.2,
    shadowRadius: scale(4),
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: scaleFont(26),
    fontWeight: '800',
    marginBottom: scale(12),
    textAlign: 'center',
    letterSpacing: 1,
    color: TEXT_THEME_COLOR,
  },
  welcomeSubtitle: {
    fontSize: scaleFont(15),
    textAlign: 'center',
    paddingHorizontal: scale(20),
    lineHeight: scaleFont(22),
    color: SUBTEXT_THEME_COLOR,
    fontWeight: '500',
  },
  faqSection: {
    marginBottom: scale(32),
    padding: scale(16),
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(20),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    // elevation: 6,
  },
  contactSection: {
    marginBottom: scale(32),
    padding: scale(16),
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(20),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    // elevation: 6,
  },
  sectionTitle: {
    fontSize: scaleFont(22),
    fontWeight: '700',
    marginBottom: scale(16),
    letterSpacing: 0.5,
    color: PRIMARY_THEME_COLOR,
  },
  faqItem: {
    marginBottom: scale(12),
    borderRadius: scale(16),
    overflow: 'hidden',
    backgroundColor: CATEGORY_BG_COLOR,
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: PRIMARY_THEME_COLOR,
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
  },
  faqQuestionContainer: {
    borderRadius: scale(16),
    minHeight: scale(56),
  },
  faqQuestionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
    justifyContent: 'space-between',
    minHeight: scale(56),
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(16),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  faqQuestion: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    flex: 1,
    lineHeight: scaleFont(22),
    color: TEXT_THEME_COLOR,
  },
  faqAnswerContainer: {
    paddingHorizontal: scale(16),
    marginVertical:5,
    overflow: 'visible',
  },
  faqAnswer: {
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
    color: SUBTEXT_THEME_COLOR,
    fontWeight: '500',
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(16),
  },
  contactButton: {
    flex: 1,
    borderRadius: scale(16),
  },
  contactButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
    borderRadius: scale(10),
    shadowColor: PRIMARY_THEME_COLOR,
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.2,
    shadowRadius: scale(4),
    // elevation: 4,
  },
  contactIcon: {
    marginRight: scale(10),
  },
  contactText: {
    fontSize: scaleFont(15),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
    letterSpacing: 0.5,
  },
  submitButton: {
    borderRadius: scale(16),
    overflow: 'hidden',
    marginVertical: scale(24),
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(14),
    paddingHorizontal: scale(20),
    shadowColor: PRIMARY_THEME_COLOR,
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
    // elevation: 6,
  },
  submitButtonText: {
    fontSize: scaleFont(18),
    fontWeight: '800',
    color: TEXT_THEME_COLOR,
    marginRight: scale(10),
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    borderRadius: scale(24),
    overflow: 'hidden',
    backgroundColor: CATEGORY_BG_COLOR,
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    // elevation: 6,
  },
  modalGradient: {
    padding: scale(24),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(24),
  },
  modalTitle: {
    fontSize: scaleFont(22),
    fontWeight: '800',
    letterSpacing: 0.5,
    color: TEXT_THEME_COLOR,
  },
  modalInput: {
    backgroundColor: 'rgba(91, 156, 255, 0.1)',
    borderRadius: scale(12),
    padding: scale(14),
    marginBottom: scale(20),
    fontSize: scaleFont(14),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    color: TEXT_THEME_COLOR,
    shadowColor: PRIMARY_THEME_COLOR,
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    // elevation: 3,
  },
  modalTextArea: {
    height: scale(120),
    textAlignVertical: 'top',
  },
  modalButton: {
    borderRadius: scale(16),
    overflow: 'hidden',
  },
  modalButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(14),
    paddingHorizontal: scale(20),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: PRIMARY_THEME_COLOR,
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
    // elevation: 6,
  },
  modalButtonText: {
    fontSize: scaleFont(18),
    fontWeight: '800',
    color: TEXT_THEME_COLOR,
    marginRight: scale(10),
    letterSpacing: 0.5,
  },
  loadingText: {
    fontSize: scaleFont(15),
    textAlign: 'center',
    color: SUBTEXT_THEME_COLOR,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: scaleFont(15),
    textAlign: 'center',
    color: SUBTEXT_THEME_COLOR,
    fontWeight: '500',
  },
  customToast: {
    width: '90%',
    padding: scale(16),
    borderRadius: scale(12),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    // elevation: 3,
  },
  toastText1: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
  },
  toastText2: {
    fontSize: scaleFont(13),
    marginTop: scale(6),
    color: SUBTEXT_THEME_COLOR,
    fontWeight: '500',
  },
});

export default Support;