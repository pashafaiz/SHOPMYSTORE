import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {
  fetchSalesAnalytics,
  fetchDashboardSummary,
} from '../redux/slices/sellerSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {LineChart, BarChart, PieChart} from 'react-native-chart-kit';
import moment from 'moment';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../Components/Header';
import {
  COLORS,
  SIZES,
  FONTS,
  scale,
  scaleFont,
  commonStyles,
} from '../utils/theme';

const SellerAnalytics = ({navigation}) => {
  const dispatch = useDispatch();
  const {salesAnalytics, dashboardSummary, loading, error} = useSelector(
    state => state.seller,
  );
  const [period, setPeriod] = useState('monthly');
  const [chartType, setChartType] = useState('line');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchSalesAnalytics({period, limit: 6}));
    dispatch(fetchDashboardSummary());
  }, [dispatch, period]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchSalesAnalytics({period, limit: 6})).unwrap(),
        dispatch(fetchDashboardSummary()).unwrap(),
      ]);
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const formatChartData = () => {
    try {
      if (Array.isArray(salesAnalytics) && salesAnalytics.length > 0) {
        const labels = salesAnalytics.map(item => {
          const date = moment(item.date);
          if (!date.isValid()) return 'Invalid Date';

          switch (period) {
            case 'daily':
              return date.format('DD/MM');
            case 'weekly':
              return `Week ${date.isoWeek()}`;
            case 'monthly':
              return date.format('MMM');
            case 'yearly':
              return date.format('YYYY');
            default:
              return date.format('MMM');
          }
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
        const periods = ['today', 'week', 'month', 'year'];
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
        datasets: [{data: [0]}],
      };
    } catch (error) {
      console.error('Error formatting chart data:', error);
      return {
        labels: ['Error'],
        datasets: [{data: [0]}],
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

  const pieData = [
    {
      name: 'Today',
      value: Math.max(dashboardSummary?.today?.orders || 0, 0),
      color: COLORS.WARNING,
      legendFontColor: COLORS.SUBTEXT,
      legendFontSize: scaleFont(12),
    },
    {
      name: 'Week',
      value: Math.max(dashboardSummary?.week?.orders || 0, 0),
      color: COLORS.INFO,
      legendFontColor: COLORS.SUBTEXT,
      legendFontSize: scaleFont(12),
    },
    {
      name: 'Month',
      value: Math.max(dashboardSummary?.month?.orders || 0, 0),
      color: COLORS.SECONDARY,
      legendFontColor: COLORS.SUBTEXT,
      legendFontSize: scaleFont(12),
    },
    {
      name: 'Year',
      value: Math.max(dashboardSummary?.year?.orders || 0, 0),
      color: COLORS.SUCCESS,
      legendFontColor: COLORS.SUBTEXT,
      legendFontSize: scaleFont(12),
    },
  ].filter(item => item.value > 0);

  const renderChart = () => {
    if (
      !chartData.labels.length ||
      !chartData.datasets[0].data.length ||
      chartData.labels[0] === 'No Data'
    ) {
      return (
        <View style={styles.chartError}>
          <Text style={commonStyles.errorText}>
            No data available for the selected period
          </Text>
        </View>
      );
    }

    switch (chartType) {
      case 'line':
        return (
          <LineChart
            data={chartData}
            width={SIZES.width - scale(40)}
            height={scale(220)}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            fromZero
          />
        );
      case 'bar':
        return (
          <BarChart
            data={chartData}
            width={SIZES.width - scale(40)}
            height={scale(220)}
            chartConfig={chartConfig}
            style={styles.chart}
            fromZero
          />
        );
      case 'pie':
        return pieData.length > 0 ? (
          <PieChart
            data={pieData}
            width={SIZES.width - scale(40)}
            height={scale(220)}
            chartConfig={chartConfig}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            style={styles.chart}
          />
        ) : (
          <View style={styles.chartError}>
            <Text style={commonStyles.errorText}>
              No valid data for pie chart
            </Text>
          </View>
        );
      default:
        return (
          <LineChart
            data={chartData}
            width={SIZES.width - scale(40)}
            height={scale(220)}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            fromZero
          />
        );
    }
  };

  if (loading && !salesAnalytics?.length && !refreshing) {
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
            dispatch(fetchSalesAnalytics({period, limit: 6}));
            dispatch(fetchDashboardSummary());
          }}
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
        title={'Analytics'}
      />
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.PRIMARY]}
          />
        }>
        {/* Period Selector */}
        <View style={styles.periodContainer}>
          {['daily', 'weekly', 'monthly', 'yearly'].map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodButton, period === p && styles.activePeriod]}
              onPress={() => setPeriod(p)}>
              <Text
                style={[
                  styles.periodText,
                  period === p && styles.activePeriodText,
                ]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart Type Selector */}
        <View style={styles.chartTypeContainer}>
          {[
            {type: 'line', icon: 'show-chart'},
            {type: 'bar', icon: 'bar-chart'},
            {type: 'pie', icon: 'pie-chart'},
          ].map(({type, icon}) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.chartTypeButton,
                chartType === type && styles.activeChartType,
              ]}
              onPress={() => setChartType(type)}>
              <Icon
                name={icon}
                size={20}
                color={chartType === type ? '#fff' : COLORS.PRIMARY}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        <View style={[commonStyles.card, styles.chartContainer]}>
          {renderChart()}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[commonStyles.card, styles.summaryCard]}>
            <Text style={styles.summaryTitle}>Today</Text>
            <Text style={styles.summaryValue}>
              {dashboardSummary?.today?.orders || 0}
            </Text>
            <Text style={styles.summarySubtitle}>Orders</Text>
            <Text style={styles.summaryRevenue}>
              ₹{dashboardSummary?.today?.revenue?.toFixed(2) || '0.00'}
            </Text>
          </View>
          <View style={[commonStyles.card, styles.summaryCard]}>
            <Text style={styles.summaryTitle}>This Week</Text>
            <Text style={styles.summaryValue}>
              {dashboardSummary?.week?.orders || 0}
            </Text>
            <Text style={styles.summarySubtitle}>Orders</Text>
            <Text style={styles.summaryRevenue}>
              ₹{dashboardSummary?.week?.revenue?.toFixed(2) || '0.00'}
            </Text>
          </View>
        </View>
        <View style={styles.summaryContainer}>
          <View style={[commonStyles.card, styles.summaryCard]}>
            <Text style={styles.summaryTitle}>This Month</Text>
            <Text style={styles.summaryValue}>
              {dashboardSummary?.month?.orders || 0}
            </Text>
            <Text style={styles.summarySubtitle}>Orders</Text>
            <Text style={styles.summaryRevenue}>
              ₹{dashboardSummary?.month?.revenue?.toFixed(2) || '0.00'}
            </Text>
          </View>
          <View style={[commonStyles.card, styles.summaryCard]}>
            <Text style={styles.summaryTitle}>All Time</Text>
            <Text style={styles.summaryValue}>
              {dashboardSummary?.allTime?.orders || 0}
            </Text>
            <Text style={styles.summarySubtitle}>Orders</Text>
            <Text style={styles.summaryRevenue}>
              ₹{dashboardSummary?.allTime?.revenue?.toFixed(2) || '0.00'}
            </Text>
          </View>
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
  periodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(15),
  },
  periodButton: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: scale(20),
    paddingVertical: scale(8),
    paddingHorizontal: scale(15),
    shadowColor: COLORS.TEXT,
    shadowOffset: {width: 0, height: scale(2)},
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  activePeriod: {
    backgroundColor: COLORS.PRIMARY,
  },
  periodText: {
    ...FONTS.body4,
    color: COLORS.SUBTEXT,
  },
  activePeriodText: {
    color: '#fff',
  },
  chartTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: scale(15),
  },
  chartTypeButton: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: scale(5),
    shadowColor: COLORS.TEXT,
    shadowOffset: {width: 0, height: scale(2)},
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  activeChartType: {
    backgroundColor: COLORS.PRIMARY,
  },
  chartContainer: {
    marginBottom: scale(20),
    minHeight: scale(250),
    justifyContent: 'center',
    alignItems: 'center',
  },
  chart: {
    borderRadius: scale(10),
  },
  chartError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: scale(220),
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(15),
  },
  summaryCard: {
    width: '48%',
  },
  summaryTitle: {
    ...FONTS.body4,
    color: COLORS.SUBTEXT,
    marginBottom: scale(5),
  },
  summaryValue: {
    ...FONTS.h2,
    fontWeight: 'bold',
    color: COLORS.TEXT,
  },
  summarySubtitle: {
    ...FONTS.body4,
    color: COLORS.SUBTEXT,
    marginTop: scale(5),
  },
  summaryRevenue: {
    ...FONTS.h3,
    fontWeight: '600',
    color: COLORS.SUCCESS,
    marginTop: scale(5),
  },
});

export default SellerAnalytics;
