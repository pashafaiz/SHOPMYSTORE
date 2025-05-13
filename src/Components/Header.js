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
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, 375) / 375));

const Header = ({
  isSearch = false,
  searchValue = '',
  onSearchChange = () => {},
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
              <Ionicons name={leftIcon} size={scale(20)} color={Colors.lightPurple} />
            </TouchableOpacity>
          ) : title ? (
            <TouchableOpacity onPress={onBackPress} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={scale(28)} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
          {title ? (
            <Text style={styles.title}>{title}</Text>
          ) : (
            <View style={styles.searchContainer}>
              {isSearch && (
                <>
                  <Ionicons
                    name="search"
                    size={scale(20)}
                    color={Colors.White}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search"
                    placeholderTextColor="#A0A0A0"
                    value={searchValue}
                    onChangeText={onSearchChange}
                  />
                </>
              )}
            </View>
          )}
          {showRightIcon1 || showRightIcon2 ? (
            <View style={styles.rightIcons}>
              {showRightIcon1 && (
                <TouchableOpacity onPress={onRightPress1} style={styles.iconButton}>
                  <Ionicons name={rightIcon1} size={scale(20)} color={Colors.lightPurple} />
                </TouchableOpacity>
              )}
              {showRightIcon2 && (
                <TouchableOpacity
                  onPress={onRightIcon2Press}
                  style={styles.iconButton}
                >
                  <Ionicons name={rightIcon2} size={scale(20)} color={Colors.lightPurple} />
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
    backgroundColor:'#1A0B3B',
    paddingHorizontal: scale(15),
    paddingVertical: scale(7),
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
    padding: scale(5),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal:2
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(10),
    paddingHorizontal: scale(10),
    marginHorizontal: scale(10),
  },
  searchIcon: {
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    color: Colors.White,
    fontSize: scaleFont(16),
    paddingVertical: scale(8),
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: scaleFont(15),
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  placeholder: {
    width: scale(44), // Matches iconButton size
  },
});

export default Header;