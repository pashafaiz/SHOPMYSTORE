import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchSellerNotifications} from '../redux/slices/sellerSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../Components/Header';
import moment from 'moment';
import {
  COLORS,
  SIZES,
  FONTS,
  scale,
  scaleFont,
  commonStyles,
} from '../utils/theme';

const SellerNotifications = ({navigation}) => {
  const dispatch = useDispatch();
  const {notifications, loading, error} = useSelector(state => state.seller);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchSellerNotifications());
  }, [dispatch]);

  const handleRefresh = () => {
    setRefreshing(true);
    dispatch(fetchSellerNotifications());
    setRefreshing(false);
  };

  const renderNotificationItem = ({item}) => (
    <TouchableOpacity
      style={[
        commonStyles.card,
        styles.notificationItem,
        !item.read && styles.unreadNotification,
      ]}>
      <View style={styles.notificationIcon}>
        <Icon name="notifications" size={24} color={COLORS.PRIMARY} />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.body}</Text>
        <Text style={styles.notificationTime}>
          {moment(item.timestamp).fromNow()}
        </Text>
      </View>
      {!item.read && <View style={styles.unreadBadge} />}
    </TouchableOpacity>
  );

  if (loading && !notifications.length && !refreshing) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={commonStyles.errorContainer}>
        <Text style={commonStyles.errorText}>{error}</Text>
        <TouchableOpacity
          onPress={handleRefresh}
          style={commonStyles.retryButton}>
          <Text style={commonStyles.retryText}>Retry</Text>
          <Icon name="refresh" size={18} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient colors={COLORS.GRADIENT} style={commonStyles.container}>
      <Header
        showLeftIcon={true}
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        isSearch={false}
        title={'Notifications'}
      />
      <View style={styles.contentContainer}>
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.PRIMARY]}
            />
          }
          ListEmptyComponent={
            <View style={commonStyles.emptyContainer}>
              <Icon name="notifications-off" size={50} color={COLORS.SUBTEXT} />
              <Text style={commonStyles.emptyText}>No notifications yet</Text>
            </View>
          }
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: scale(15),
  },
  listContainer: {
    paddingBottom: scale(20),
  },
  notificationItem: {
    flexDirection: 'row',
    padding: scale(15),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    marginBottom: scale(10),
  },
  unreadNotification: {
    backgroundColor: COLORS.LIGHT_PRIMARY,
  },
  notificationIcon: {
    marginRight: scale(15),
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    ...FONTS.h3,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: scale(5),
  },
  notificationMessage: {
    ...FONTS.body3,
    color: COLORS.SUBTEXT,
    marginBottom: scale(5),
  },
  notificationTime: {
    ...FONTS.body4,
    color: COLORS.SUBTEXT,
  },
  unreadBadge: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: COLORS.PRIMARY,
    alignSelf: 'center',
  },
});

export default SellerNotifications;
