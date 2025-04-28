import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Pressable,
  StatusBar,
  Image,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUserProfile,
  fetchUserProducts,
  fetchUserReels,
  setActiveTab,
  clearError,
  setRefreshing,
  selectUserProfile,
} from '../redux/slices/userProfileSlice';
import img from '../assets/Images/img';
import Trace from '../utils/Trace';
import {
  FALLBACK_IMAGE_URL,
  NUM_COLUMNS,
  ITEM_SPACING,
} from '../constants/GlobalConstants';

const { width, height } = Dimensions.get('window');
const scaleFactor = width / 375;
const scale = (size) => size * scaleFactor;
const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375));
const itemWidth = (width - (ITEM_SPACING * (NUM_COLUMNS + 1))) / NUM_COLUMNS;

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

const RenderItem = ({ item, index, isProduct, navigation }) => {
  Trace('RenderItem Called', { item, isProduct, index });

  const scaleValue = useSharedValue(0.95);
  const opacityValue = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scaleValue.value) }],
    opacity: opacityValue.value,
  }));

  useEffect(() => {
    scaleValue.value = 1;
    opacityValue.value = 1;
  }, [scaleValue, opacityValue]);

  const onPressIn = () => {
    scaleValue.value = 0.95;
  };

  const onPressOut = () => {
    scaleValue.value = 1;
  };

  const imageUri = isProduct
    ? (typeof item.media === 'string' && item.media ? item.media : FALLBACK_IMAGE_URL)
    : (item.thumbnail || FALLBACK_IMAGE_URL);
  Trace('Image URI', { imageUri, itemId: item._id || item.id, isProduct });

  return (
    <Animated.View
      entering={FadeIn.delay(index * 50)}
      style={[styles.itemContainer, animatedStyle]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() =>
          isProduct
            ? navigation.navigate('ProductDetail', { productId: item.id || item._id })
            : navigation.navigate('ReelView', { reel: item })
        }
      >
        <LinearGradient
          colors={['#2A2A4A', '#1E1E3F']}
          style={[
            styles.itemCard,
            !isProduct && styles.reelCard,
          ]}
        >
          <Image
            source={{ uri: imageUri }}
            style={styles.itemImage}
            resizeMode="cover"
            onError={(e) => Trace('Image load error:', { imageUri, error: e.nativeEvent.error })}
          />
          {!isProduct && (
            <>
              <LinearGradient
                colors={['rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.5)']}
                style={styles.imageOverlay}
              />
              <View style={styles.playIcon}>
                <MaterialCommunityIcons name="play" size={scale(24)} color="#FFFFFF" />
              </View>
            </>
          )}
          {isProduct && (
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>₹{item.price || 'N/A'}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const UserProfile = ({ route }) => {
  const { userId } = route.params;
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {
    user,
    products,
    reels,
    activeTab,
    loading,
    errorMessage,
    refreshing,
  } = useSelector(selectUserProfile);

  const onRefresh = useCallback(async () => {
    Trace('Refreshing User Profile Data', { userId });
    if (!userId) {
      Trace('Missing userId for refresh');
      return;
    }
    dispatch(setRefreshing(true));
    try {
      await Promise.all([
        dispatch(fetchUserProfile({ userId })),
        dispatch(fetchUserProducts({ userId })),
        dispatch(fetchUserReels({ userId })),
      ]);
    } catch (error) {
      Trace('Refresh failed:', { error: error.message });
    } finally {
      dispatch(setRefreshing(false));
    }
  }, [dispatch, userId]);

  useEffect(() => {
    Trace('Component mounted with userId:', userId);
    if (userId) {
      onRefresh();
    } else {
      Trace('No userId provided, skipping fetch');
    }
  }, [userId, onRefresh]);

  const handleTabChange = (tab) => {
    dispatch(setActiveTab(tab));
  };

  const renderHeaderSkeleton = () => (
    <LinearGradient
      colors={['#1A1A3A', '#2A2A5A']}
      style={styles.headerContainer}
    >
      <View style={styles.profileHeader}>
        <ShimmerPlaceholder style={styles.profileImage} />
        <ShimmerPlaceholder style={[styles.skeletonText, { width: scale(120), height: scaleFont(22), marginBottom: scale(2) }]} />
        <ShimmerPlaceholder style={[styles.skeletonText, { width: scale(80), height: scaleFont(14), marginBottom: scale(10) }]} />
        <View style={styles.statsRow}>
          {[...Array(3)].map((_, index) => (
            <View key={index} style={styles.stat}>
              <ShimmerPlaceholder style={[styles.skeletonText, { width: scale(40), height: scaleFont(16) }]} />
              <ShimmerPlaceholder style={[styles.skeletonText, { width: scale(60), height: scaleFont(12), marginTop: scale(2) }]} />
            </View>
          ))}
        </View>
      </View>
    </LinearGradient>
  );

  const renderTabSkeleton = () => (
    <LinearGradient
      colors={['#2A2A5A', '#3A3A7A']}
      style={styles.tabContainer}
    >
      <View style={styles.tabBar}>
        {[...Array(2)].map((_, index) => (
          <View key={index} style={styles.tab}>
            <ShimmerPlaceholder style={{ width: scale(20), height: scale(20), borderRadius: scale(10) }} />
            <ShimmerPlaceholder style={[styles.skeletonText, { width: scale(60), height: scaleFont(14), marginLeft: scale(5) }]} />
          </View>
        ))}
      </View>
    </LinearGradient>
  );

  const renderHeader = () => (
    <View>
      {loading ? renderHeaderSkeleton() : (
        <LinearGradient
          colors={['#1A1A3A', '#2A2A5A']}
          style={styles.headerContainer}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <AntDesign name="arrowleft" size={scale(24)} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.profileHeader}>
            <Image
              source={user?.profileImage ? { uri: user.profileImage } : img.user}
              style={styles.profileImage}
              resizeMode="cover"
            />
            <Text style={styles.profileName}>{user?.fullName || 'Unknown User'}</Text>
            <Text style={styles.profileUsername}>@{user?.userName || 'unknown'}</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {activeTab === 'products' ? products.length : reels.length}
                </Text>
                <Text style={styles.statLabel}>
                  {activeTab === 'products' ? 'Products' : 'Reels'}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{user?.followers || 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{user?.following || 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      )}
      {loading ? renderTabSkeleton() : (
        <LinearGradient
          colors={['#2A2A5A', '#3A3A7A']}
          style={styles.tabContainer}
        >
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'products' && styles.activeTab]}
              onPress={() => handleTabChange('products')}
            >
              <MaterialCommunityIcons
                name="shopping"
                size={scale(20)}
                color={activeTab === 'products' ? '#A855F7' : '#B0B0D0'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'products' && styles.activeTabText,
                ]}
              >
                Products
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'reels' && styles.activeTab]}
              onPress={() => handleTabChange('reels')}
            >
              <MaterialCommunityIcons
                name="play-box"
                size={scale(20)}
                color={activeTab === 'reels' ? '#A855F7' : '#B0B0D0'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'reels' && styles.activeTabText,
                ]}
              >
                Reels
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      )}
      {errorMessage ? (
        <Pressable
          style={styles.errorMessage}
          onPress={() => dispatch(clearError())}
        >
          <Text style={styles.errorText}>{errorMessage}</Text>
          <AntDesign name="closecircleo" size={scale(16)} color="#EF4444" />
        </Pressable>
      ) : null}
    </View>
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[...Array(NUM_COLUMNS * 2)].map((_, index) => (
        <View key={index} style={styles.skeletonItem}>
          <ShimmerPlaceholder style={styles.skeletonImage} />
          {activeTab === 'products' && (
            <ShimmerPlaceholder style={styles.skeletonPriceTag} />
          )}
          {activeTab === 'reels' && (
            <ShimmerPlaceholder style={styles.skeletonPlayIcon} />
          )}
        </View>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name={activeTab === 'products' ? 'shopping-outline' : 'video-off-outline'}
        size={scale(50)}
        color="#A855F7"
      />
      <Text style={styles.emptyStateText}>
        No {activeTab === 'products' ? 'products' : 'reels'} found
      </Text>
      <Text style={styles.emptyStateSubText}>
        {activeTab === 'products'
          ? 'Add some products to showcase here!'
          : 'Share your first reel to get started!'}
      </Text>
    </View>
  );

  const data = activeTab === 'products' ? products : reels;
  Trace('FlatList Data', { activeTab, data, user, loading, refreshing });

  return (
    <LinearGradient colors={['#1A1A3A', '#2A2A5A']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A3A" />
      <FlatList
        data={data}
        renderItem={({ item, index }) => (
          <RenderItem
            item={item}
            index={index}
            isProduct={activeTab === 'products'}
            navigation={navigation}
          />
        )}
        keyExtractor={(item, index) =>
          item._id?.toString() || item.id?.toString() || `item-${index}`
        }
        numColumns={NUM_COLUMNS}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={loading || refreshing ? renderSkeleton : renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#A855F7']}
            tintColor="#A855F7"
          />
        }
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: ITEM_SPACING,
    paddingBottom: scale(20),
  },
  headerContainer: {
    paddingTop: scale(40),
    paddingBottom: scale(20),
    borderBottomLeftRadius: scale(30),
    borderBottomRightRadius: scale(30),
    elevation: 5,
  },
  backButton: {
    position: 'absolute',
    top: scale(10),
    left: scale(15),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(20),
    padding: scale(8),
    zIndex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  profileImage: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    borderWidth: 2,
    borderColor: '#A855F7',
    marginBottom: scale(10),
    backgroundColor: '#2A2A5A',
  },
  profileName: {
    fontSize: scaleFont(22),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: scale(2),
  },
  profileUsername: {
    fontSize: scaleFont(14),
    color: '#B0B0D0',
    marginBottom: scale(10),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginTop: scale(5),
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: '#A855F7',
  },
  statLabel: {
    fontSize: scaleFont(12),
    color: '#B0B0D0',
  },
  tabContainer: {
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    elevation: 3,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: scale(25),
    padding: scale(5),
    marginHorizontal: scale(10),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(10),
    borderRadius: scale(20),
  },
  activeTab: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  tabText: {
    fontSize: scaleFont(14),
    color: '#B0B0D0',
    marginLeft: scale(5),
    fontWeight: '500',
  },
  activeTabText: {
    color: '#A855F7',
    fontWeight: '600',
  },
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: scale(10),
    marginHorizontal: scale(20),
    marginVertical: scale(5),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    fontSize: scaleFont(14),
    color: '#EF4444',
    flex: 1,
  },
  skeletonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: ITEM_SPACING,
    paddingVertical: scale(10),
  },
  skeletonItem: {
    width: itemWidth,
    margin: ITEM_SPACING / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: scale(15),
    padding: scale(5),
    elevation: 2,
  },
  skeletonImage: {
    width: '100%',
    height: itemWidth * 1.2,
    borderRadius: scale(10),
  },
  skeletonPriceTag: {
    width: scale(50),
    height: scale(20),
    borderRadius: scale(5),
    position: 'absolute',
    bottom: scale(10),
    left: scale(10),
  },
  skeletonPlayIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -scale(20) }, { translateY: -scale(20) }],
  },
  skeletonText: {
    height: scale(12),
    borderRadius: scale(4),
  },
  itemContainer: {
    width: itemWidth,
    margin: ITEM_SPACING / 2,
  },
  itemCard: {
    borderRadius: scale(15),
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    elevation: 3,
  },
  reelCard: {
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    elevation: 5,
  },
  itemImage: {
    width: '100%',
    height: itemWidth * 1.2,
    borderRadius: scale(15),
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: scale(15),
  },
  playIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -scale(12) }, { translateY: -scale(12) }],
    backgroundColor: 'rgba(168, 85, 247, 0.8)',
    borderRadius: scale(20),
    padding: scale(8),
  },
  priceTag: {
    position: 'absolute',
    bottom: scale(10),
    left: scale(10),
    backgroundColor: 'rgba(168, 85, 247, 0.9)',
    borderRadius: scale(5),
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
  },
  priceText: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(50),
  },
  emptyStateText: {
    fontSize: scaleFont(16),
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: scale(10),
  },
  emptyStateSubText: {
    fontSize: scaleFont(14),
    color: '#B0B0D0',
    textAlign: 'center',
    marginTop: scale(5),
    paddingHorizontal: scale(20),
  },
});

export default UserProfile;