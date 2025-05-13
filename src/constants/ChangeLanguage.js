import React, { useEffect, useRef, useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../constants/ThemeContext';
import Header from '../Components/Header';

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = size => size * scaleFactor;
const scaleFont = size => Math.round(size * (Math.min(width, height) / 375));

const ChangeLanguage = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const languages = [
    { name: 'English', code: 'en' },
    { name: 'Hindi', code: 'hi' },
    { name: 'Spanish', code: 'es' },
    { name: 'French', code: 'fr' },
    { name: 'German', code: 'de' },
    { name: 'Chinese', code: 'zh' },
  ];

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('language');
        if (savedLanguage) {
          setSelectedLanguage(savedLanguage.toLowerCase());
        } else {
          setSelectedLanguage('en');
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };
    loadLanguage();

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

  const handleLanguageSelect = async (languageCode, languageName) => {
    setSelectedLanguage(languageCode);
    try {
      await AsyncStorage.setItem('language', languageCode);
      console.log(`Language set to: ${languageName} (${languageCode})`);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const renderLanguageItem = (language) => {
    const isSelected = selectedLanguage === language.code;
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
      <Animated.View style={[styles.languageItem(theme), { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          style={styles.languageItemContent}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => handleLanguageSelect(language.code, language.name)}
        >
          <LinearGradient
            colors={
              isSelected
                ? ['#7B61FF', '#AD4DFF']
                : ['rgba(123, 97, 255, 0.2)', 'rgba(173, 77, 255, 0.2)']
            }
            style={styles.languageItemGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.languageItemLeft}>
              <Icon name="language" size={scale(20)} color={isSelected ? '#FFFFFF' : theme.textTertiary} style={styles.languageIcon} />
              <Text
                style={[
                  styles.languageText,
                  { color: isSelected ? '#FFFFFF' : theme.textPrimary },
                ]}
              >
                {language.name}
              </Text>
            </View>
            {isSelected && (
              <Icon name="check" size={scale(20)} color="#FFFFFF" />
            )}
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
          title="Change Language"
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
              <Icon name="language" size={scale(36)} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Change Language
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Select Your Language
            </Text>
          </View>

          <View style={styles.languageSection(theme)}>
            <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Languages</Text>
            {languages.map((language) => (
              <React.Fragment key={language.code}>
                {renderLanguageItem(language)}
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
  languageSection: theme => ({
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
  languageItem: theme => ({
    marginBottom: scale(8),
    borderRadius: scale(12),
    overflow: 'hidden',
    backgroundColor: theme.glassBg,
    borderWidth: 1,
    borderColor: theme.glassBorder,
  }),
  languageItemContent: {
    borderRadius: scale(12),
    minHeight: scale(48),
  },
  languageItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
    justifyContent: 'space-between',
    minHeight: scale(48),
  },
  languageItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageIcon: {
    marginRight: scale(12),
  },
  languageText: {
    fontSize: scaleFont(14),
    fontWeight: '700',
    flex: 1,
    lineHeight: scale(20),
  },
});

export default ChangeLanguage;