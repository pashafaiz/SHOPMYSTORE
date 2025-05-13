import i18n from 'i18n-js';
import * as Localization from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Translation files
const en = {
  change_language: {
    title: "Change Language",
    select_language: "Select Your Language",
    languages: {
      English: "English",
      Hindi: "Hindi",
      Spanish: "Spanish",
      French: "French",
      German: "German",
      Chinese: "Chinese",
    },
  },
  settings: {
    title: "Settings",
    general_settings: "General Settings",
    notifications: "Notifications",
    dark_mode: "Dark Mode",
    language: "Language",
    privacy: "Privacy",
    account: "Account",
    change_password: "Change Password",
    help_support: "Help & Support",
    logout: "Logout",
    edit_profile: "Edit Profile",
  },
  drawer: {
    orders: "Orders",
    change_language: "Change Language",
    settings: "Settings",
    continue_as_seller: "Continue as Seller",
    support: "Support",
    invite_friends: "Invite Friends",
    go_premium: "Go Premium",
    logout: "Logout",
    app_version: "App Version: 1.0.0",
  },
};

const hi = {
  change_language: {
    title: "भाषा बदलें",
    select_language: "अपनी भाषा चुनें",
    languages: {
      English: "अंग्रेजी",
      Hindi: "हिंदी",
      Spanish: "स्पेनिश",
      French: "फ्रेंच",
      German: "जर्मन",
      Chinese: "चीनी",
    },
  },
  settings: {
    title: "सेटिंग्स",
    general_settings: "सामान्य सेटिंग्स",
    notifications: "सूचनाएं",
    dark_mode: "डार्क मोड",
    language: "भाषा",
    privacy: "गोपनीयता",
    account: "खाता",
    change_password: "पासवर्ड बदलें",
    help_support: "सहायता और समर्थन",
    logout: "लॉगआउट",
    edit_profile: "प्रोफाइल संपादित करें",
  },
  drawer: {
    orders: "आदेश",
    change_language: "भाषा बदलें",
    settings: "सेटिंग्स",
    continue_as_seller: "विक्रेता के रूप में जारी रखें",
    support: "सहायता",
    invite_friends: "दोस्तों को आमंत्रित करें",
    go_premium: "प्रीमियम प्राप्त करें",
    logout: "लॉगआउट",
    app_version: "ऐप संस्करण: 1.0.0",
  },
};

// Add more languages as needed (Spanish, French, etc.)
const es = {
  change_language: {
    title: "Cambiar Idioma",
    select_language: "Selecciona tu idioma",
    languages: {
      English: "Inglés",
      Hindi: "Hindi",
      Spanish: "Español",
      French: "Francés",
      German: "Alemán",
      Chinese: "Chino",
    },
  },
  settings: {
    title: "Configuraciones",
    general_settings: "Configuraciones Generales",
    notifications: "Notificaciones",
    dark_mode: "Modo Oscuro",
    language: "Idioma",
    privacy: "Privacidad",
    account: "Cuenta",
    change_password: "Cambiar Contraseña",
    help_support: "Ayuda y Soporte",
    logout: "Cerrar Sesión",
    edit_profile: "Editar Perfil",
  },
  drawer: {
    orders: "Pedidos",
    change_language: "Cambiar Idioma",
    settings: "Configuraciones",
    continue_as_seller: "Continuar como Vendedor",
    support: "Soporte",
    invite_friends: "Invitar Amigos",
    go_premium: "Obtener Premium",
    logout: "Cerrar Sesión",
    app_version: "Versión de la App: 1.0.0",
  },
};

// Add more translation files for French, German, Chinese, etc., as needed

// Set up translations
i18n.translations = { en, hi, es };
i18n.fallbacks = true;

// Initialize the language
export const initI18n = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('language');
    if (savedLanguage) {
      i18n.locale = savedLanguage.toLowerCase();
    } else {
      const locales = Localization.getLocales();
      const systemLocale = locales[0]?.languageCode || 'en';
      i18n.locale = systemLocale;
    }
  } catch (error) {
    console.error('Error initializing language:', error);
    i18n.locale = 'en'; // Fallback to English
  }
};

// Function to change the language
export const changeLanguage = async (languageCode) => {
  try {
    i18n.locale = languageCode.toLowerCase();
    await AsyncStorage.setItem('language', languageCode);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

export default i18n;