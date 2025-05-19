import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  Easing,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../Components/Header';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchNotifications,
  markNotificationAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../redux/slices/notificationsSlice';
import Toast from 'react-native-toast-message';
import {
  TOAST_POSITION,
  TOAST_TOP_OFFSET,
  TOAST_VISIBILITY_TIME,
  FETCH_NOTIFICATIONS_ERROR,
  MARK_NOTIFICATION_READ_ERROR,
  DELETE_NOTIFICATION_ERROR,
  CLEAR_NOTIFICATIONS_ERROR,
} from '../constants/GlobalConstants';

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375));

// Theme constants
const PRODUCT_BG_COLOR = '#f5f9ff';
const CATEGORY_BG_COLOR = 'rgba(91, 156, 255, 0.2)';
const SELECTED_CATEGORY_BG_COLOR = '#5b9cff';
const PRIMARY_THEME_COLOR = '#5b9cff';
const SECONDARY_THEME_COLOR = '#ff6b8a';
const TEXT_THEME_COLOR = '#1a2b4a';
const SUBTEXT_THEME_COLOR = '#5a6b8a';
const BORDER_THEME_COLOR = 'rgba(91, 156, 255, 0.3)';
const BACKGROUND_GRADIENT = ['#8ec5fc', '#fff'];

const AnimatedNotificationCard = ({
  item,
  index,
  onPress,
  onDelete,
  isSelectMode,
  isSelected,
  toggleSelect,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        delay: index * 100,
        useNativeDriver: false,
      }),
    ]).start();
  }, [fadeAnim, translateYAnim, index]);

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: isSelected ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isSelected]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', PRIMARY_THEME_COLOR],
  });

  const borderWidth = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, scale(2)],
  });

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  const date = new Date(item.timestamp);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = date.toLocaleDateString();

  return (
    <Pressable
      onPress={() => (isSelectMode ? toggleSelect(item.id) : onPress(item))}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.notificationCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
            borderLeftWidth: item.read ? 0 : scale(4),
            borderLeftColor: item.read ? 'transparent' : PRIMARY_THEME_COLOR,
            borderWidth,
            borderColor,
          },
        ]}
      >
        <LinearGradient
          colors={[PRODUCT_BG_COLOR, PRODUCT_BG_COLOR]}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {isSelectMode ? (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => toggleSelect(item.id)}
            >
              <Icon
                name={isSelected ? 'check-circle' : 'radio-button-unchecked'}
                size={scale(24)}
                color={isSelected ? PRIMARY_THEME_COLOR : SUBTEXT_THEME_COLOR}
              />
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: item.read ? CATEGORY_BG_COLOR : SELECTED_CATEGORY_BG_COLOR },
              ]}
            >
              <Icon
                name={item.read ? 'notifications' : 'notifications-active'}
                size={scale(24)}
                color={item.read ? SUBTEXT_THEME_COLOR : TEXT_THEME_COLOR}
              />
            </View>
          )}

          <View style={styles.contentContainer}>
            <Text
              style={[
                styles.notificationTitle,
                {
                  color: item.read ? SUBTEXT_THEME_COLOR : TEXT_THEME_COLOR,
                  fontWeight: isSelected ? 'bold' : item.read ? 'normal' : '600',
                },
              ]}
            >
              {item.title}
            </Text>
            <Text
              style={[
                styles.notificationBody,
                { color: item.read ? SUBTEXT_THEME_COLOR : TEXT_THEME_COLOR },
              ]}
              numberOfLines={2}
            >
              {item.body}
            </Text>
            <View style={styles.footer}>
              <Text style={styles.timestamp}>
                {dateString} at {timeString}
              </Text>
            </View>
          </View>

          {!isSelectMode && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDelete(item)}
            >
              <Icon name="delete-outline" size={scale(20)} color={SECONDARY_THEME_COLOR} />
            </TouchableOpacity>
          )}
        </LinearGradient>
        {!item.read && !isSelectMode && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>New</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};

const EmptyState = () => {
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [bounceAnim]);

  return (
    <View style={styles.emptyContainer}>
      <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
        <Icon name="notifications-none" size={scale(64)} color={PRIMARY_THEME_COLOR} />
      </Animated.View>
      <Text style={styles.emptyText}>No Notifications Yet</Text>
      <Text style={styles.emptySubText}>We'll let you know when there's something new!</Text>
    </View>
  );
};

const ConfirmationModal = ({ visible, onConfirm, onCancel, isSingleDelete, count }) => {
  const [modalAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(modalAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [visible]);

  const translateY = modalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const opacity = modalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onCancel}
    >
      <Animated.View style={[styles.modalBackdrop, { opacity }]}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY }],
              maxWidth: width * 0.85,
            },
          ]}
        >
          <Icon
            name="warning"
            size={scale(40)}
            color={SECONDARY_THEME_COLOR}
            style={styles.modalIcon}
          />
          <Text style={styles.modalTitle}>Confirm Deletion</Text>
          <Text style={styles.modalText}>
            {isSingleDelete
              ? 'Are you sure you want to delete this notification?'
              : `Are you sure you want to delete ${count} notifications?`}
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const Notifications = ({ navigation }) => {
  const dispatch = useDispatch();
  const { notifications, status, error } = useSelector((state) => state.notifications);
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState({
    isSingle: false,
    id: null,
  });

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(fetchNotifications()).finally(() => setRefreshing(false));
  }, [dispatch]);

  const handleNotificationPress = useCallback(
    (notification) => {
      if (selectMode) return;

      if (!notification.read) {
        dispatch(markNotificationAsRead(notification.id)).catch(() => {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: MARK_NOTIFICATION_READ_ERROR,
            position: TOAST_POSITION,
            visibilityTime: TOAST_VISIBILITY_TIME,
            topOffset: TOAST_TOP_OFFSET,
          });
        });
      }
    },
    [dispatch, selectMode],
  );

  const handleDeletePress = useCallback((notification) => {
    setDeleteConfig({
      isSingle: true,
      id: notification.id,
    });
    setShowDeleteModal(true);
  }, []);

  const handleDeleteConfirmed = useCallback(() => {
    setShowDeleteModal(false);

    if (deleteConfig.isSingle) {
      dispatch(deleteNotification(deleteConfig.id)).catch(() => {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: DELETE_NOTIFICATION_ERROR,
          position: TOAST_POSITION,
          visibilityTime: TOAST_VISIBILITY_TIME,
          topOffset: TOAST_TOP_OFFSET,
        });
      });
    } else {
      selectedNotifications.forEach((id) => {
        dispatch(deleteNotification(id)).catch(() => {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: DELETE_NOTIFICATION_ERROR,
            position: TOAST_POSITION,
            visibilityTime: TOAST_VISIBILITY_TIME,
            topOffset: TOAST_TOP_OFFSET,
          });
        });
      });
      setSelectMode(false);
      setSelectedNotifications([]);
    }
  }, [dispatch, deleteConfig, selectedNotifications]);

  const handleClearAllPress = useCallback(() => {
    setDeleteConfig({
      isSingle: false,
      id: null,
    });
    setShowDeleteModal(true);
  }, []);

  const handleClearConfirmed = useCallback(() => {
    setShowDeleteModal(false);
    dispatch(clearAllNotifications()).catch(() => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: CLEAR_NOTIFICATIONS_ERROR,
        position: TOAST_POSITION,
        visibilityTime: TOAST_VISIBILITY_TIME,
        topOffset: TOAST_TOP_OFFSET,
      });
    });
  }, [dispatch]);

  const toggleSelect = useCallback((notificationId) => {
    setSelectedNotifications((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId],
    );
  }, []);

  const selectAll = useCallback(() => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map((n) => n.id));
    }
  }, [notifications, selectedNotifications]);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedNotifications([]);
  }, []);

  useEffect(() => {
    if (error && status === 'failed') {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error || FETCH_NOTIFICATIONS_ERROR,
        position: TOAST_POSITION,
        visibilityTime: TOAST_VISIBILITY_TIME,
        topOffset: TOAST_TOP_OFFSET,
      });
    }
  }, [error, status]);

  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.read === b.read) return new Date(b.timestamp) - new Date(a.timestamp);
    return a.read ? 1 : -1;
  });

  const notificationsData = Array.isArray(sortedNotifications) ? sortedNotifications : [];

  return (
    <LinearGradient
      colors={BACKGROUND_GRADIENT}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <Header
        showLeftIcon={true}
        leftIcon={selectMode ? 'close' : 'arrow-back'}
        onLeftPress={selectMode ? exitSelectMode : () => navigation.goBack()}
        title={selectMode ? `${selectedNotifications.length} Selected` : 'Notifications'}
        textStyle={{ color: TEXT_THEME_COLOR }}
      />

      <View style={styles.headerActions}>
        {selectMode ? (
          <>
            <TouchableOpacity style={styles.actionButton} onPress={selectAll}>
              <LinearGradient
                colors={[CATEGORY_BG_COLOR, PRIMARY_THEME_COLOR]}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionButtonText}>
                  {selectedNotifications.length === notifications.length ? 'Deselect All' : 'Select All'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: selectedNotifications.length > 0 ? CATEGORY_BG_COLOR : PRODUCT_BG_COLOR,
                  borderColor: selectedNotifications.length > 0 ? BORDER_THEME_COLOR : BORDER_THEME_COLOR,
                },
              ]}
              onPress={() => {
                setDeleteConfig({
                  isSingle: false,
                  id: null,
                });
                setShowDeleteModal(true);
              }}
              disabled={selectedNotifications.length === 0}
            >
              <LinearGradient
                colors={[CATEGORY_BG_COLOR, selectedNotifications.length > 0 ? SECONDARY_THEME_COLOR : CATEGORY_BG_COLOR]}
                style={styles.actionButtonGradient}
              >
                <Icon
                  name="delete"
                  size={scale(20)}
                  color={selectedNotifications.length > 0 ? SECONDARY_THEME_COLOR : SUBTEXT_THEME_COLOR}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: selectedNotifications.length > 0 ? SECONDARY_THEME_COLOR : SUBTEXT_THEME_COLOR },
                  ]}
                >
                  Delete ({selectedNotifications.length})
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          notificationsData.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearAllPress}>
              <LinearGradient
                colors={[CATEGORY_BG_COLOR, SECONDARY_THEME_COLOR]}
                style={styles.actionButtonGradient}
              >
                <Icon name="delete-sweep" size={scale(20)} color={SECONDARY_THEME_COLOR} />
                <Text style={styles.clearText}>Clear All</Text>
              </LinearGradient>
            </TouchableOpacity>
          )
        )}
      </View>

      <FlatList
        data={notificationsData}
        renderItem={({ item, index }) => (
          <AnimatedNotificationCard
            item={item}
            index={index}
            onPress={handleNotificationPress}
            onDelete={handleDeletePress}
            isSelectMode={selectMode}
            isSelected={selectedNotifications.includes(item.id)}
            toggleSelect={toggleSelect}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY_THEME_COLOR]}
            tintColor={PRIMARY_THEME_COLOR}
            progressBackgroundColor={PRODUCT_BG_COLOR}
          />
        }
        initialNumToRender={10}
      />

      <ConfirmationModal
        visible={showDeleteModal}
        onConfirm={
          deleteConfig.isSingle
            ? handleDeleteConfirmed
            : deleteConfig.id === null
            ? handleClearConfirmed
            : handleDeleteConfirmed
        }
        onCancel={() => setShowDeleteModal(false)}
        isSingleDelete={deleteConfig.isSingle}
        count={
          deleteConfig.isSingle
            ? 1
            : deleteConfig.id === null
            ? notifications.length
            : selectedNotifications.length
        }
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: scale(20),
    paddingVertical: scale(12),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scale(24),
    borderWidth: scale(1),
    borderColor: BORDER_THEME_COLOR,
    marginHorizontal: scale(8),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(5),
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    paddingVertical: scale(10),
  },
  actionButtonText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(15),
    fontWeight: '600',
    marginLeft: scale(6),
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scale(24),
    borderWidth: scale(1),
    borderColor: BORDER_THEME_COLOR,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(5),
    // elevation: 3,
  },
  clearText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(15),
    fontWeight: '600',
    marginLeft: scale(6),
  },
  listContainer: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(30),
    flexGrow: 1,
  },
  notificationCard: {
    marginVertical: scale(10),
    borderRadius: scale(18),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
  },
  cardGradient: {
    flexDirection: 'row',
    padding: scale(18),
    alignItems: 'center',
  },
  selectButton: {
    width: scale(44),
    height: scale(44),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  iconContainer: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(15),
  },
  contentContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: scaleFont(17),
    marginBottom: scale(6),
  },
  notificationBody: {
    fontSize: scaleFont(15),
    marginBottom: scale(6),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: scaleFont(13),
    color: SUBTEXT_THEME_COLOR,
    fontStyle: 'italic',
  },
  unreadBadge: {
    position: 'absolute',
    top: scale(12),
    right: scale(12),
    backgroundColor: PRIMARY_THEME_COLOR,
    borderRadius: scale(10),
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
  },
  unreadText: {
    fontSize: scaleFont(11),
    color: TEXT_THEME_COLOR,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scale(60),
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(18),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    margin: scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    elevation: 4,
  },
  emptyText: {
    fontSize: scaleFont(20),
    color: TEXT_THEME_COLOR,
    fontWeight: '600',
    marginTop: scale(20),
  },
  emptySubText: {
    fontSize: scaleFont(15),
    color: SUBTEXT_THEME_COLOR,
    marginTop: scale(10),
    textAlign: 'center',
    paddingHorizontal: scale(40),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  modalContainer: {
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(24),
    padding: scale(30),
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    elevation: 5,
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  modalIcon: {
    alignSelf: 'center',
    marginBottom: scale(20),
  },
  modalTitle: {
    fontSize: scaleFont(22),
    fontWeight: 'bold',
    color: TEXT_THEME_COLOR,
    textAlign: 'center',
    marginBottom: scale(12),
  },
  modalText: {
    fontSize: scaleFont(17),
    color: SUBTEXT_THEME_COLOR,
    textAlign: 'center',
    marginBottom: scale(25),
    lineHeight: scale(24),
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scale(12),
  },
  modalButton: {
    flex: 1,
    paddingVertical: scale(14),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: scale(8),
  },
  cancelButton: {
    backgroundColor: CATEGORY_BG_COLOR,
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  confirmButton: {
    backgroundColor: SECONDARY_THEME_COLOR,
  },
  cancelButtonText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(17),
    fontWeight: '600',
  },
  confirmButtonText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(17),
    fontWeight: '600',
  },
});

export default Notifications;