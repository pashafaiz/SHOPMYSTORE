import React, { useEffect, useRef, useState, useContext } from 'react';
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
import { ThemeContext } from '../constants/ThemeContext';

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = size => size * scaleFactor;
const scaleFont = size => Math.round(size * (Math.min(width, height) / 375));

// Custom toast configuration to match the app's theme
const toastConfig = (theme) => ({
  success: ({ text1, text2 }) => (
    <LinearGradient
      colors={['#7B61FF', '#AD4DFF']}
      style={styles.customToast}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={[styles.toastText1, { color: theme.textPrimary }]}>{text1}</Text>
      {text2 && <Text style={[styles.toastText2, { color: theme.textMuted }]}>{text2}</Text>}
    </LinearGradient>
  ),
  error: ({ text1, text2 }) => (
    <LinearGradient
      colors={['#FF6B6B', '#FFD93D']}
      style={styles.customToast}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={[styles.toastText1, { color: theme.textPrimary }]}>{text1}</Text>
      {text2 && <Text style={[styles.toastText2, { color: theme.textMuted }]}>{text2}</Text>}
    </LinearGradient>
  ),
});

const FAQItem = ({ item, index, expandedFAQ, toggleFAQ, theme }) => {
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
    <Animated.View style={[styles.faqItem(theme), { transform: [{ scale: buttonScale }] }]}>
      <TouchableOpacity
        style={styles.faqQuestionContainer}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => toggleFAQ(index)}
      >
        <LinearGradient
          colors={['rgba(123, 97, 255, 0.2)', 'rgba(173, 77, 255, 0.2)']}
          style={styles.faqQuestionGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[styles.faqQuestion, { color: theme.textPrimary }]}>{item.question}</Text>
          <Icon
            name={expandedFAQ === index ? 'expand-less' : 'expand-more'}
            size={scale(20)}
            color={theme.textTertiary}
          />
        </LinearGradient>
      </TouchableOpacity>
      <Animated.View
        style={[styles.faqAnswerContainer(theme), { height: animatedHeight, opacity: animatedOpacity }]}
      >
        <Text style={[styles.faqAnswer, { color: theme.textMuted }]}>{item.answer}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const Support = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { theme } = useContext(ThemeContext);
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

  const renderContactButton = (type, icon, colors) => {
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
            colors={colors}
            style={styles.contactButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name={icon} size={scale(18)} color="#FFFFFF" style={styles.contactIcon} />
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
        <Animated.View style={[styles.modalOverlay(theme), { opacity: modalFadeAnim }]}>
          <Animated.View
            style={[styles.modalContainer(theme), { transform: [{ translateY: modalSlideAnim }] }]}
          >
            <LinearGradient
              colors={theme.background}
              style={styles.modalGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Submit a Ticket</Text>
                <TouchableOpacity onPress={closeModal}>
                  <Icon name="close" size={scale(24)} color={theme.textTertiary} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.modalInput(theme), { color: theme.textPrimary }]}
                placeholder="Subject"
                placeholderTextColor={theme.textMuted}
                value={ticketSubject}
                onChangeText={setTicketSubject}
                maxLength={MAX_TICKET_SUBJECT_LENGTH}
              />
              <TextInput
                style={[styles.modalInput(theme), styles.modalTextArea, { color: theme.textPrimary }]}
                placeholder="Describe your issue..."
                placeholderTextColor={theme.textMuted}
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
                    colors={['#AD4DFF', '#7B61FF']}
                    style={styles.modalButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.modalButtonText}>
                      {loading ? 'Submitting...' : 'Submit'}
                    </Text>
                    <Icon name="send" size={scale(16)} color="#FFFFFF" />
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
          title="Support"
          textStyle={{ color: theme.textPrimary }}
        />
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.welcomeSection(theme)}>
            <LinearGradient
              colors={['#7B61FF', '#AD4DFF']}
              style={styles.welcomeIconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon name="support-agent" size={scale(30)} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.welcomeTitle, { color: theme.textPrimary }]}>Premium Support</Text>
            <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
              Your gateway to exceptional assistance—explore FAQs, reach out, or submit a ticket.
            </Text>
          </View>

          <View style={styles.faqSection(theme)}>
            <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Frequently Asked Questions</Text>
            {loading ? (
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading FAQs...</Text>
            ) : faqs.length > 0 ? (
              faqs.map((item, index) => (
                <FAQItem
                  key={item._id || index}
                  item={item}
                  index={index}
                  expandedFAQ={expandedFAQ}
                  toggleFAQ={toggleFAQ}
                  theme={theme}
                />
              ))
            ) : (
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No FAQs available</Text>
            )}
          </View>

          <View style={styles.contactSection(theme)}>
            <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Get in Touch</Text>
            <View style={styles.contactButtons}>
              {renderContactButton('Email Support', 'email', ['#7B61FF', '#AD4DFF'])}
              {renderContactButton('Live Chat', 'chat', ['#FF6B6B', '#FFD93D'])}
            </View>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={openModal} activeOpacity={0.9}>
            <LinearGradient
              colors={['#AD4DFF', '#7B61FF']}
              style={styles.submitButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.submitButtonText}>Submit a Ticket</Text>
              <Icon name="send" size={scale(16)} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
        {renderModal()}
      </Animated.View>
      <Toast config={toastConfig(theme)} />
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
  scrollContainer: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(30),
    flexGrow: 1,
    marginTop: scale(30),
  },
  welcomeSection: theme => ({
    alignItems: 'center',
    marginBottom: scale(30),
    padding: scale(16),
    backgroundColor: theme.glassBg,
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: theme.glassBorder,
  }),
  welcomeIconContainer: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(16),
  },
  welcomeTitle: {
    fontSize: scaleFont(24),
    fontWeight: '800',
    marginBottom: scale(10),
    textAlign: 'center',
    letterSpacing: 1,
  },
  welcomeSubtitle: {
    fontSize: scaleFont(14),
    textAlign: 'center',
    paddingHorizontal: scale(20),
    lineHeight: scale(20),
    opacity: 0.9,
  },
  faqSection: theme => ({
    marginBottom: scale(30),
    padding: scale(12),
    backgroundColor: theme.glassBg,
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: theme.glassBorder,
  }),
  contactSection: theme => ({
    marginBottom: scale(30),
    padding: scale(12),
    backgroundColor: theme.glassBg,
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: theme.glassBorder,
  }),
  sectionTitle: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    marginBottom: scale(16),
    letterSpacing: 0.5,
  },
  faqItem: theme => ({
    marginBottom: scale(8),
    borderRadius: scale(12),
    overflow: 'hidden',
    backgroundColor: theme.glassBg,
    borderWidth: 1,
    borderColor: theme.glassBorder,
  }),
  faqQuestionContainer: {
    borderRadius: scale(12),
    minHeight: scale(48),
  },
  faqQuestionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
    justifyContent: 'space-between',
    minHeight: scale(48),
  },
  faqQuestion: {
    fontSize: scaleFont(14),
    fontWeight: '700',
    flex: 1,
    lineHeight: scale(20),
  },
  faqAnswerContainer: theme => ({
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    overflow: 'visible',
    backgroundColor: theme.containerBg === '#0A0A1E' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
  }),
  faqAnswer: {
    fontSize: scaleFont(12),
    lineHeight: scale(18),
    opacity: 0.9,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(12),
  },
  contactButton: {
    flex: 1,
    borderRadius: scale(12),
  },
  contactButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(10),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  contactIcon: {
    marginRight: scale(8),
  },
  contactText: {
    fontSize: scaleFont(14),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  submitButton: {
    borderRadius: scale(12),
    overflow: 'hidden',
    marginVertical: scale(20),
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(12),
    paddingHorizontal: scale(18),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  submitButtonText: {
    fontSize: scaleFont(16),
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: scale(8),
    letterSpacing: 0.5,
  },
  modalOverlay: theme => ({
    flex: 1,
    backgroundColor: theme.containerBg === '#0A0A1E' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  }),
  modalContainer: theme => ({
    width: width * 0.85,
    borderRadius: scale(20),
    overflow: 'hidden',
    backgroundColor: theme.glassBg,
  }),
  modalGradient: {
    padding: scale(20),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(20),
  },
  modalTitle: {
    fontSize: scaleFont(20),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalInput: theme => ({
    backgroundColor: theme.containerBg === '#0A0A1E' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    borderRadius: scale(10),
    padding: scale(12),
    marginBottom: scale(16),
    fontSize: scaleFont(14),
    borderWidth: 1,
    borderColor: theme.glassBorder,
  }),
  modalTextArea: {
    height: scale(100),
    textAlignVertical: 'top',
  },
  modalButton: {
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  modalButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(12),
    paddingHorizontal: scale(18),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButtonText: {
    fontSize: scaleFont(16),
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: scale(8),
    letterSpacing: 0.5,
  },
  loadingText: {
    fontSize: scaleFont(14),
    textAlign: 'center',
    opacity: 0.8,
  },
  emptyText: {
    fontSize: scaleFont(14),
    textAlign: 'center',
    opacity: 0.8,
  },
  customToast: {
    width: '90%',
    padding: scale(14),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toastText1: {
    fontSize: scaleFont(16),
    fontWeight: '700',
  },
  toastText2: {
    fontSize: scaleFont(12),
    marginTop: scale(4),
  },
});

export default Support;