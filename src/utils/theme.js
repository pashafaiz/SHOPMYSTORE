// styles/theme.js
import { Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

// Theme constants
export const COLORS = {
  PRIMARY: '#5b9cff',
  SECONDARY: '#ff6b8a',
  BACKGROUND: '#f8fafc',
  CARD_BACKGROUND: '#ffffff',
  TEXT: '#1a2b4a',
  SUBTEXT: '#64748b',
  BORDER: '#e2e8f0',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  INFO: '#3b82f6',
  ERROR: '#ef4444',
  LIGHT_PRIMARY: 'rgba(91, 156, 255, 0.2)',
  GRADIENT: ['#8ec5fc', '#fff'],
};

export const SIZES = {
  // Global sizes
  base: 8,
  font: 14,
  radius: 12,
  padding: 24,

  // Font sizes
  h1: 30,
  h2: 22,
  h3: 16,
  h4: 14,
  body1: 30,
  body2: 22,
  body3: 16,
  body4: 14,

  // App dimensions
  width,
  height,
};

export const FONTS = {
  h1: { fontSize: SIZES.h1, fontWeight: 'bold' },
  h2: { fontSize: SIZES.h2, fontWeight: 'bold' },
  h3: { fontSize: SIZES.h3, fontWeight: 'bold' },
  h4: { fontSize: SIZES.h4, fontWeight: 'bold' },
  body1: { fontSize: SIZES.body1 },
  body2: { fontSize: SIZES.body2 },
  body3: { fontSize: SIZES.body3 },
  body4: { fontSize: SIZES.body4 },
};

// Responsive scaling
export const scale = (size) => (width / 375) * size;
export const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 375));

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.BACKGROUND,
  },
  errorText: {
    ...FONTS.body3,
    color: COLORS.ERROR,
    marginBottom: SIZES.base,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.base,
  },
  retryText: {
    ...FONTS.body4,
    color: COLORS.PRIMARY,
    marginRight: SIZES.base,
  },
  card: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.base,
    shadowColor: COLORS.TEXT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  emptyText: {
    ...FONTS.body3,
    color: COLORS.SUBTEXT,
    marginTop: SIZES.base,
  },
});