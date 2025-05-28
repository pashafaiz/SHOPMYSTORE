import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardSummary, fetchSalesAnalytics } from '../redux/slices/sellerSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart } from 'react-native-chart-kit';
import LinearGradient from 'react-native-linear-gradient';
import moment from 'moment';
import Header from '../Components/Header';
import { COLORS, SIZES, FONTS, scale, scaleFont, commonStyles } from '../utils/theme';

const SellerDashboard = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { dashboardSummary, salesAnalytics, loading, error } = useSelector(
    state => state.seller,
  );
  const [refreshing, setRefreshing] = useState(false);
  const tabBarHeight = route.params?.tabBarHeight || 60;

  useEffect(() => {
    if (!dashboardSummary) {
      dispatch(fetchDashboardSummary());
    }
    if (!salesAnalytics) {
      dispatch(fetchSalesAnalytics({ period: 'monthly', limit: 6 }));
    }
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchSalesAnalytics({ period: 'monthly', limit: 6 })).unwrap(),
        dispatch(fetchDashboardSummary()).unwrap(),
      ]);
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const SafeChart = ({ children, data }) => {
    if (!data?.labels?.length || !data?.datasets?.[0]?.data?.length || data.labels[0] === 'No Data') {
      return (
        <View style={styles.chartError}>
          <Text style={styles.errorText}>No data available for the chart</Text>
        </View>
      );
    }
    return children;
  };

  const formatChartData = () => {
    try {
      if (Array.isArray(salesAnalytics) && salesAnalytics.length > 0) {
        const labels = salesAnalytics.map(item => {
          const date = moment(item.date);
          return date.isValid() ? date.format('MM/YYYY') : 'Invalid Date';
        });

        const data = salesAnalytics.map(item => {
          const revenue = parseFloat(item.totalRevenue);
          return isNaN(revenue) ? 0 : revenue;
        });

        return {
          labels,
          datasets: [
            {
              data,
              color: (opacity = 1) => `rgba(91, 156, 255, ${opacity})`,
              strokeWidth: 2,
            },
          ],
        };
      }

      if (dashboardSummary) {
        const periods = ['today', 'week', 'month', 'allTime'];
        const labels = periods.map(p => p.charAt(0).toUpperCase() + p.slice(1));
        const data = periods.map(p => {
          const revenue = parseFloat(dashboardSummary[p]?.revenue || 0);
          return isNaN(revenue) ? 0 : revenue;
        });

        return {
          labels,
          datasets: [
            {
              data,
              color: (opacity = 1) => `rgba(91, 156, 255, ${opacity})`,
              strokeWidth: 2,
            },
          ],
        };
      }

      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    } catch (error) {
      console.error('Error formatting chart data:', error);
      return {
        labels: ['Error'],
        datasets: [{ data: [0] }],
      };
    }
  };

  const chartData = formatChartData();

  const chartConfig = {
    backgroundColor: COLORS.CARD_BACKGROUND,
    backgroundGradientFrom: COLORS.CARD_BACKGROUND,
    backgroundGradientTo: COLORS.CARD_BACKGROUND,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(27, 38, 74, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(27, 38, 74, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: COLORS.PRIMARY,
    },
  };

  if (loading && !dashboardSummary && !refreshing) {
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
          onPress={() => {
            dispatch(fetchDashboardSummary());
            dispatch(fetchSalesAnalytics({ period: 'monthly', limit: 6 }));
          }}
          style={commonStyles.retryButton}
        >
          <Text style={commonStyles.retryText}>Retry</Text>
          <Icon name="refresh" size={18} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient colors={COLORS.GRADIENT} style={commonStyles.container}>
      <Header 
        title="Dashboard" 
        showLeftIcon={true} 
        onLeftPress={() => navigation.openDrawer()}
        showRightIcon1={true}
      />
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[COLORS.PRIMARY]} 
          />
        }
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
      >
        {/* Summary Cards */}
        <View style={styles.cardContainer}>
          <View style={[commonStyles.card, styles.card]}>
            <View style={styles.cardIconContainer}>
              <Icon name="shopping-cart" size={24} color={COLORS.SUCCESS} />
            </View>
            <Text style={styles.cardTitle}>Today's Orders</Text>
            <Text style={styles.cardValue}>{dashboardSummary?.today?.orders || 0}</Text>
            <Text style={styles.cardSubtitle}>
              ₹{dashboardSummary?.today?.revenue?.toFixed(2) || '0.00'}
            </Text>
          </View>

          <View style={[commonStyles.card, styles.card]}>
            <View style={styles.cardIconContainer}>
              <Icon name="date-range" size={24} color={COLORS.INFO} />
            </View>
            <Text style={styles.cardTitle}>This Month</Text>
            <Text style={styles.cardValue}>{dashboardSummary?.month?.orders || 0}</Text>
            <Text style={styles.cardSubtitle}>
              ₹{dashboardSummary?.month?.revenue?.toFixed(2) || '0.00'}
            </Text>
          </View>
        </View>

        <View style={styles.cardContainer}>
          <View style={[commonStyles.card, styles.card]}>
            <View style={styles.cardIconContainer}>
              <Icon name="assessment" size={24} color={COLORS.WARNING} />
            </View>
            <Text style={styles.cardTitle}>Total Orders</Text>
            <Text style={styles.cardValue}>{dashboardSummary?.allTime?.orders || 0}</Text>
            <Text style={styles.cardSubtitle}>
              ₹{dashboardSummary?.allTime?.revenue?.toFixed(2) || '0.00'}
            </Text>
          </View>

          <View style={[commonStyles.card, styles.card]}>
            <View style={styles.cardIconContainer}>
              <Icon name="star" size={24} color={COLORS.SECONDARY} />
            </View>
            <Text style={styles.cardTitle}>Rating</Text>
            <Text style={styles.cardValue}>4.8</Text>
            <Text style={styles.cardSubtitle}>Based on 120 reviews</Text>
          </View>
        </View>

        {/* Sales Chart */}
        <View style={[commonStyles.card, styles.chartContainer]}>
          <Text style={styles.sectionTitle}>Monthly Sales</Text>
          <SafeChart data={chartData}>
            <LineChart
              data={chartData}
              width={SIZES.width - 40}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              fromZero
            />
          </SafeChart>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('SellerProducts')}
          >
            <Icon name="inventory" size={24} color="#fff" />
            <Text style={styles.actionText}>Products</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('SellerOrders')}
          >
            <Icon name="list-alt" size={24} color="#fff" />
            <Text style={styles.actionText}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('SellerAnalytics')}
          >
            <Icon name="analytics" size={24} color="#fff" />
            <Text style={styles.actionText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    padding: scale(15),
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(15),
  },
  card: {
    width: '48%',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: COLORS.LIGHT_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(10),
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  cardTitle: {
    ...FONTS.h4,
    color: COLORS.SUBTEXT,
    marginTop: scale(5),
    fontWeight: '600',
  },
  cardValue: {
    ...FONTS.h2,
    fontWeight: 'bold',
    marginVertical: scale(5),
    color: COLORS.TEXT,
  },
  cardSubtitle: {
    ...FONTS.h4,
    color: COLORS.SUCCESS,
    fontWeight: '600',
  },
  chartContainer: {
    marginBottom: scale(20),
  },
  sectionTitle: {
    ...FONTS.h3,
    fontWeight: '600',
    marginBottom: scale(15),
    color: COLORS.TEXT,
  },
  chart: {
    borderRadius: scale(10),
  },
  chartError: {
    height: scale(220),
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(20),
  },
  actionButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: scale(12),
    padding: scale(15),
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.TEXT,
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 3,
  },
  actionText: {
    color: '#fff',
    ...FONTS.h4,
    marginTop: scale(5),
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default SellerDashboard;