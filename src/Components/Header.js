import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');
const scaleFactor = Math.min(width, 375) / 375;
const scale = (size) => Math.round(size * scaleFactor);
const scaleFont = (size) => {
  const fontScale = Math.min(width, 375) / 375;
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

const Header = ({
  isSearch = false,
  searchValue = '',
  onSearchChange = () => {},
  onSearchPress = () => {}, // New prop for search bar click
  showLeftIcon = false,
  leftIcon = 'menu',
  onLeftPress = () => {},
  showRightIcon1 = false,
  rightIcon1 = 'notifications-outline',
  onRightPress1 = () => {},
  showRightIcon2 = false,
  rightIcon2 = 'add',
  onRightIcon2Press = () => {},
  title = '',
  isAbsolute = false,
  onBackPress = () => {},
}) => {
  return (
    <View style={[styles.container, isAbsolute && styles.absoluteContainer]}>
      {showLeftIcon || title ? (
        <View style={styles.headerRow}>
          {showLeftIcon ? (
            <TouchableOpacity onPress={onLeftPress} style={styles.iconButton}>
              <Ionicons name={leftIcon} size={scale(24)} color={SUBTEXT_THEME_COLOR} />
            </TouchableOpacity>
          ) : title ? (
            <TouchableOpacity onPress={onBackPress} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={scale(24)} color={SUBTEXT_THEME_COLOR} />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
          {title ? (
            <Text style={styles.title}>{title}</Text>
          ) : (
            <TouchableOpacity
              style={styles.searchContainer}
              onPress={onSearchPress} // Navigate to Search screen
              activeOpacity={0.7}
            >
              {isSearch && (
                <>
                  <Ionicons
                    name="search"
                    size={scale(20)}
                    color={SUBTEXT_THEME_COLOR}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search products"
                    placeholderTextColor={SUBTEXT_THEME_COLOR}
                    value={searchValue}
                    onChangeText={onSearchChange}
                    editable={false} 
                  />
                </>
              )}
            </TouchableOpacity>
          )}
          {showRightIcon1 || showRightIcon2 ? (
            <View style={styles.rightIcons}>
              {showRightIcon1 && (
                <TouchableOpacity onPress={onRightPress1} style={styles.iconButton}>
                  <Ionicons name={rightIcon1} size={scale(24)} color={SUBTEXT_THEME_COLOR} />
                </TouchableOpacity>
              )}
              {showRightIcon2 && (
                <TouchableOpacity onPress={onRightIcon2Press} style={styles.iconButton}>
                  <Ionicons name={rightIcon2} size={scale(24)} color={SUBTEXT_THEME_COLOR} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#8ec5fc",
    paddingHorizontal: scale(15),
    paddingVertical: scale(10),
    borderBottomWidth: scale(1),
    borderBottomColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 2,
  },
  absoluteContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    padding: scale(8),
    borderRadius: scale(20),
    backgroundColor: CATEGORY_BG_COLOR,
    borderWidth: scale(1),
    borderColor: BORDER_THEME_COLOR,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    marginHorizontal: scale(10),
    borderWidth: scale(1),
    borderColor: BORDER_THEME_COLOR,
  },
  searchIcon: {
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(16),
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap:10
  },
  title: {
    flex: 1,
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
    textAlign: 'center',
  },
  placeholder: {
    width: scale(40),
  },
});

export default Header;