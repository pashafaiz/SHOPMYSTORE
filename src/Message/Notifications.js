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

const AnimatedNotificationCard = ({ 
  item, 
  index, 
  onPress, 
  onDelete,
  isSelectMode,
  isSelected,
  toggleSelect
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
    outputRange: ['transparent', '#7B61FF'],
  });

  const borderWidth = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2],
  });

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: false, // Changed to false to avoid conflicts with other animations
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: false, // Changed to false to avoid conflicts with other animations
    }).start();
  };

  const date = new Date(item.timestamp);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = date.toLocaleDateString();

  const gradientColors = item.read
    ? ['#2E1A5C', '#3A226E']
    : ['#3A226E', '#4A2A8D'];

  return (
    <Pressable
      onPress={() => isSelectMode ? toggleSelect(item.id) : onPress(item)}
    //   onLongPress={() => onLongPress(item.id)}
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
            borderLeftColor: item.read ? 'transparent' : '#7B61FF',
            borderWidth,
            borderColor,
          },
        ]}
      >
        <LinearGradient
          colors={gradientColors}
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
                color={isSelected ? '#7B61FF' : '#A0A0A0'}
              />
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: item.read ? 'rgba(123, 97, 255, 0.1)' : 'rgba(123, 97, 255, 0.2)' },
              ]}
            >
              <Icon
                name={item.read ? 'notifications' : 'notifications-active'}
                size={scale(24)}
                color={item.read ? '#A0A0A0' : '#7B61FF'}
              />
            </View>
          )}
           
          
          <View style={styles.contentContainer}>
            <Text
              style={[
                styles.notificationTitle,
                { 
                  color: item.read ? '#C0C0C0' : '#FFFFFF',
                  fontWeight: isSelected ? 'bold' : item.read ? 'normal' : '600'
                },
              ]}
            >
              {item.title}
            </Text>
            <Text
              style={[
                styles.notificationBody,
                { color: item.read ? '#A0A0A0' : '#E5E7EB' },
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
              <Icon name="delete-outline" size={scale(20)} color="#FF3E6D" />
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
      ])
    ).start();
  }, [bounceAnim]);

  return (
    <View style={styles.emptyContainer}>
      <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
        <Icon name="notifications-none" size={scale(60)} color="#7B61FF" />
      </Animated.View>
      <Text style={styles.emptyText}>No Notifications Yet</Text>
      <Text style={styles.emptySubText}>We'll let you know when there's something new!</Text>
    </View>
  );
};

const ConfirmationModal = ({ 
  visible, 
  onConfirm, 
  onCancel, 
  isSingleDelete,
  count 
}) => {
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
            }
          ]}
        >
          <Icon 
            name="warning" 
            size={scale(40)} 
            color="#FFA726" 
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

  // Fetch notifications on mount
  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(fetchNotifications()).finally(() => setRefreshing(false));
  }, [dispatch]);

  // Handle notification press
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
    [dispatch, selectMode]
  );

  // Handle delete button press (single notification)
  const handleDeletePress = useCallback((notification) => {
    setDeleteConfig({
      isSingle: true,
      id: notification.id,
    });
    setShowDeleteModal(true);
  }, []);

  // Handle delete confirmation
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
      selectedNotifications.forEach(id => {
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

  // Handle clear all notifications
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
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId) 
        : [...prev, notificationId]
    );
  }, []);

  const selectAll = useCallback(() => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  }, [notifications, selectedNotifications]);

  // Exit select mode
  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedNotifications([]);
  }, []);

  // Show error toast if fetch fails
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

  // Sort notifications - unread first
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.read === b.read) return new Date(b.timestamp) - new Date(a.timestamp);
    return a.read ? 1 : -1;
  });

  // Safeguard: Ensure notifications is an array
  const notificationsData = Array.isArray(sortedNotifications) ? sortedNotifications : [];

  return (
    <LinearGradient
      colors={['#1A0B3B', '#2E1A5C', '#4A2A8D']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Header
        showLeftIcon={true}
        leftIcon={selectMode ? 'close' : 'arrow-back'}
        onLeftPress={selectMode ? exitSelectMode : () => navigation.goBack()}
        title={selectMode ? `${selectedNotifications.length} Selected` : "Notifications"}
        textStyle={{ color: '#FFFFFF' }}
      />
      
      <View style={styles.headerActions}>
        {selectMode ? (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={selectAll}
            >
              <Text style={styles.actionButtonText}>
                {selectedNotifications.length === notifications.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { 
                backgroundColor: selectedNotifications.length > 0 ? '#FF3E6D20' : '#50505020',
                borderColor: selectedNotifications.length > 0 ? 'rgba(255, 62, 109, 0.3)' : 'rgba(80, 80, 80, 0.3)',
              }]}
              onPress={() => {
                setDeleteConfig({
                  isSingle: false,
                  id: null,
                });
                setShowDeleteModal(true);
              }}
              disabled={selectedNotifications.length === 0}
            >
              <Icon 
                name="delete" 
                size={scale(20)} 
                color={selectedNotifications.length > 0 ? '#FF3E6D' : '#808080'} 
              />
              <Text style={[
                styles.actionButtonText, 
                { color: selectedNotifications.length > 0 ? '#FF3E6D' : '#808080' }
              ]}>
                Delete ({selectedNotifications.length})
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          notificationsData.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearAllPress}
            >
              <Icon name="delete-sweep" size={scale(20)} color="#FF3E6D" />
              <Text style={styles.clearText}>Clear All</Text>
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
            colors={['#7B61FF']}
            tintColor="#7B61FF"
          />
        }
        initialNumToRender={10}
      />

      <ConfirmationModal
        visible={showDeleteModal}
        onConfirm={deleteConfig.isSingle ? handleDeleteConfirmed : 
                  deleteConfig.id === null ? handleClearConfirmed : handleDeleteConfirmed}
        onCancel={() => setShowDeleteModal(false)}
        isSingleDelete={deleteConfig.isSingle}
        count={deleteConfig.isSingle ? 1 : deleteConfig.id === null ? notifications.length : selectedNotifications.length}
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
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingVertical: scale(10),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B61FF20',
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.3)',
  },
  actionButtonText: {
    color: '#7B61FF',
    fontSize: scaleFont(14),
    fontWeight: '600',
    marginLeft: scale(5),
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 62, 109, 0.1)',
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: 'rgba(255, 62, 109, 0.3)',
  },
  clearText: {
    color: '#FF3E6D',
    fontSize: scaleFont(14),
    fontWeight: '600',
    marginLeft: scale(5),
  },
  listContainer: {
    paddingHorizontal: scale(15),
    paddingBottom: scale(20),
    flexGrow: 1,
  },
  notificationCard: {
    marginVertical: scale(8),
    borderRadius: scale(15),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.3,
    shadowRadius: scale(6),
    elevation: 5,
  },
  cardGradient: {
    flexDirection: 'row',
    padding: scale(15),
    alignItems: 'center',
  },
  selectButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(10),
  },
  iconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(15),
  },
  contentContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: scaleFont(16),
    marginBottom: scale(5),
  },
  notificationBody: {
    fontSize: scaleFont(14),
    marginBottom: scale(5),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: scaleFont(12),
    color: '#A0A0A0',
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: '#7B61FF',
    // borderRadius: scale(10),
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
  },
  unreadText: {
    fontSize: scaleFont(10),
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  deleteButton: {
    // padding: scale(10),
    // justifyContent: 'center',
    // alignItems: 'center',
    bottom: scale(20)
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scale(50),
  },
  emptyText: {
    fontSize: scaleFont(18),
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: scale(20),
  },
  emptySubText: {
    fontSize: scaleFont(14),
    color: '#A0A0A0',
    marginTop: scale(10),
    textAlign: 'center',
    paddingHorizontal: scale(30),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  modalContainer: {
    backgroundColor: '#2E1A5C',
    borderRadius: scale(20),
    padding: scale(25),
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#7B61FF50',
  },
  modalIcon: {
    alignSelf: 'center',
    marginBottom: scale(15),
  },
  modalTitle: {
    fontSize: scaleFont(20),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: scale(10),
  },
  modalText: {
    fontSize: scaleFont(16),
    color: '#E5E7EB',
    textAlign: 'center',
    marginBottom: scale(20),
    lineHeight: scale(24),
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scale(10),
  },
  modalButton: {
    flex: 1,
    paddingVertical: scale(12),
    borderRadius: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: scale(5),
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#7B61FF',
  },
  confirmButton: {
    backgroundColor: '#FF3E6D',
  },
  cancelButtonText: {
    color: '#7B61FF',
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
});

export default Notifications;