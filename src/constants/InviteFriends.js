import React, { useEffect, useRef, useContext } from 'react';
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
import { ThemeContext } from '../constants/ThemeContext';
import Header from '../Components/Header';

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = size => size * scaleFactor;
const scaleFont = size => Math.round(size * (Math.min(width, height) / 375));

const InviteFriends = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
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
      <Animated.View style={[styles.inviteItem(theme), { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          style={styles.inviteItemContent}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => handleInvite(method)}
        >
          <LinearGradient
            colors={['rgba(123, 97, 255, 0.2)', 'rgba(173, 77, 255, 0.2)']}
            style={styles.inviteItemGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.inviteItemLeft}>
              <Icon name={method.icon} size={scale(20)} color={theme.textTertiary} style={styles.inviteIcon} />
              <Text style={[styles.inviteText, { color: theme.textPrimary }]}>{method.name}</Text>
            </View>
            <Icon name="share" size={scale(20)} color={theme.textTertiary} />
          </LinearGradient>
        </TouchableOpacity>
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
          title="Invite Friends"
          textStyle={{ color: theme.textPrimary }}
        />
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerSection(theme)}>
            <LinearGradient
              colors={['#7B61FF', '#AD4DFF']}
              style={styles.headerIconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon name="person-add" size={scale(36)} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Invite Friends</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Share the love! Invite your friends to ShopMyStore.
            </Text>
          </View>

          <View style={styles.inviteSection(theme)}>
            <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Invite Via</Text>
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
  headerSection: theme => ({
    alignItems: 'center',
    marginBottom: scale(30),
    padding: scale(16),
    backgroundColor: theme.glassBg,
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: theme.glassBorder,
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
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: scaleFont(14),
    textAlign: 'center',
    paddingHorizontal: scale(20),
    lineHeight: scale(20),
    opacity: 0.9,
  },
  inviteSection: theme => ({
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
  inviteItem: theme => ({
    marginBottom: scale(8),
    borderRadius: scale(12),
    overflow: 'hidden',
    backgroundColor: theme.glassBg,
    borderWidth: 1,
    borderColor: theme.glassBorder,
  }),
  inviteItemContent: {
    borderRadius: scale(12),
    minHeight: scale(48),
  },
  inviteItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
    justifyContent: 'space-between',
    minHeight: scale(48),
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
    fontSize: scaleFont(14),
    fontWeight: '700',
    flex: 1,
    lineHeight: scale(20),
  },
});

export default InviteFriends;