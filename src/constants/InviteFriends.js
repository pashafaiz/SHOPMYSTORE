import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
  Share,
  ToastAndroid,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import Header from '../Components/Header';

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

const InviteFriends = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;

  const inviteMethods = [
    { name: 'WhatsApp', icon: 'chat', action: 'whatsapp://send?text=' },
    { name: 'SMS', icon: 'sms', action: 'sms:?body=' },
    { name: 'Email', icon: 'email', action: 'mailto:?subject=Join ShopMyStore&body=' },
    { name: 'Copy Link', icon: 'content-copy', action: 'copy' },
  ];

  const appInviteLink = 'https://shopmystore.app/invite?ref=user123';
  const inviteMessage = 'Hey! Join me on ShopMyStore to explore awesome products! 🚀 Use my invite link: ' + appInviteLink;

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
    ]).start();
  }, []);

  const handleInvite = async (method) => {
    try {
      if (method.action === 'copy') {
        await Share.share({
          message: appInviteLink,
        });
        ToastAndroid.show('Link copied to clipboard!', ToastAndroid.SHORT);
      } else {
        const shareOptions = {
          message: inviteMessage,
          url: appInviteLink,
        };
        await Share.share(shareOptions);
        ToastAndroid.show('Invite shared successfully!', ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error('Error sharing invite:', error);
      ToastAndroid.show('Failed to share invite.', ToastAndroid.SHORT);
    }
  };

  const renderInviteItem = (method) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View style={[styles.inviteItem, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          style={styles.inviteItemContent}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => handleInvite(method)}
        >
          <LinearGradient
            colors={['rgba(91, 156, 255, 0.2)', 'rgba(142, 197, 252, 0.2)']}
            style={styles.inviteItemGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.inviteItemLeft}>
              <Icon name={method.icon} size={scale(24)} color={PRIMARY_THEME_COLOR} style={styles.inviteIcon} />
              <Text style={[styles.inviteText, { color: TEXT_THEME_COLOR }]}>{method.name}</Text>
            </View>
            <Icon name="share" size={scale(24)} color={PRIMARY_THEME_COLOR} />
          </LinearGradient>
        </TouchableOpacity>
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
          title="Invite Friends"
          textStyle={styles.headerTitle}
          style={styles.header}
          iconColor={PRIMARY_THEME_COLOR}
        />
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerSection}>
            <LinearGradient
              colors={['#5b9cff', '#8ec5fc']}
              style={styles.headerIconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon name="person-add" size={scale(36)} color={TEXT_THEME_COLOR} />
            </LinearGradient>
            <Text style={styles.headerTitle}>Invite Friends</Text>
            <Text style={styles.headerSubtitle}>
              Share the love! Invite your friends to ShopMyStore.
            </Text>
          </View>

          <View style={styles.inviteSection}>
            <Text style={styles.sectionTitle}>Invite Via</Text>
            {inviteMethods.map((method) => (
              <React.Fragment key={method.name}>
                {renderInviteItem(method)}
              </React.Fragment>
            ))}
          </View>
        </ScrollView>
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
  header: {
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(20),
    margin: scale(16),
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
  },
  scrollContainer: {
    paddingHorizontal: scale(24),
    paddingBottom: scale(40),
    flexGrow: 1,
    marginTop: scale(24),
  },
  headerSection: {
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
  },
  headerIconContainer: {
    width: scale(84),
    height: scale(84),
    borderRadius: scale(42),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(16),
    shadowColor: PRIMARY_THEME_COLOR,
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.2,
    shadowRadius: scale(4),
  },
  headerTitle: {
    fontSize: scaleFont(26),
    fontWeight: '800',
    marginBottom: scale(8),
    textAlign: 'center',
    letterSpacing: 1,
    color: TEXT_THEME_COLOR,
  },
  headerSubtitle: {
    fontSize: scaleFont(15),
    textAlign: 'center',
    paddingHorizontal: scale(24),
    lineHeight: scale(22),
    color: SUBTEXT_THEME_COLOR,
    fontWeight: '500',
  },
  inviteSection: {
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
  },
  sectionTitle: {
    fontSize: scaleFont(22),
    fontWeight: '700',
    marginBottom: scale(20),
    letterSpacing: 0.5,
    color: TEXT_THEME_COLOR,
  },
  inviteItem: {
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
  inviteItemContent: {
    borderRadius: scale(16),
    minHeight: scale(56),
  },
  inviteItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
    justifyContent: 'space-between',
    minHeight: scale(56),
  },
  inviteItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inviteIcon: {
    marginRight: scale(12),
  },
  inviteText: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    flex: 1,
    lineHeight: scale(24),
    color: TEXT_THEME_COLOR,
  },
});

export default InviteFriends;