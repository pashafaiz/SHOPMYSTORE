import React, { useEffect, useRef, useState } from 'react';
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
import Header from '../Components/Header';

const { width, height } = Dimensions.get('window');
const scaleFactor = Math.min(width, 375) / 375;
const scale = (size) => Math.round(size * scaleFactor);
const scaleFont = (size) => {
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

const ChangeLanguage = () => {
  const navigation = useNavigation();
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
  }, [fadeAnim, slideUpAnim]);

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
      <Animated.View style={[styles.languageItem, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          style={styles.languageItemContent}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => handleLanguageSelect(language.code, language.name)}
        >
          <LinearGradient
            colors={
              isSelected
                ? ['#5b9cff', '#8ec5fc']
                : [CATEGORY_BG_COLOR, CATEGORY_BG_COLOR]
            }
            style={styles.languageItemGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.languageItemLeft}>
              <Icon
                name="language"
                size={scale(20)}
                color={isSelected ? TEXT_THEME_COLOR : SUBTEXT_THEME_COLOR}
                style={styles.languageIcon}
              />
              <Text
                style={[
                  styles.languageText,
                  { color: isSelected ? TEXT_THEME_COLOR : TEXT_THEME_COLOR },
                ]}
              >
                {language.name}
              </Text>
            </View>
            {isSelected && (
              <Icon name="check" size={scale(20)} color={TEXT_THEME_COLOR} />
            )}
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
          title="Change Language"
          textStyle={styles.headerText}
          containerStyle={styles.headerContainer}
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
              <Icon name="language" size={scale(36)} color={TEXT_THEME_COLOR} />
            </LinearGradient>
            <Text style={styles.headerTitle}>
              Change Language
            </Text>
            <Text style={styles.headerSubtitle}>
              Select Your Language
            </Text>
          </View>

          <View style={styles.languageSection}>
            <Text style={styles.sectionTitle}>Languages</Text>
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
    paddingHorizontal: scale(20),
    paddingBottom: scale(40),
    flexGrow: 1,
    marginTop: scale(20),
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: scale(30),
    padding: scale(20),
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(20),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
  },
  headerIconContainer: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(16),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  headerTitle: {
    fontSize: scaleFont(22),
    fontWeight: '800',
    color: TEXT_THEME_COLOR,
    marginBottom: scale(8),
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    fontSize: scaleFont(14),
    color: SUBTEXT_THEME_COLOR,
    textAlign: 'center',
    paddingHorizontal: scale(20),
    lineHeight: scale(20),
    fontWeight: '500',
  },
  languageSection: {
    marginBottom: scale(30),
    padding: scale(20),
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(20),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
    marginBottom: scale(16),
    letterSpacing: 0.5,
  },
  languageItem: {
    marginBottom: scale(12),
    borderRadius: scale(16),
    overflow: 'hidden',
    backgroundColor: PRODUCT_BG_COLOR,
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(6),
  },
  languageItemContent: {
    borderRadius: scale(16),
    minHeight: scale(56),
  },
  languageItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(14),
    justifyContent: 'space-between',
    minHeight: scale(56),
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
    fontSize: scaleFont(16),
    fontWeight: '600',
    flex: 1,
    lineHeight: scale(22),
    color: TEXT_THEME_COLOR,
  },
});

export default ChangeLanguage;