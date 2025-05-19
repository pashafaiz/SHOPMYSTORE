import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const scaleSize = (size) => Math.round(size * (width / 375));
export const scaleFont = (size) => Math.round(size * (Math.min(width, height) / 667) * 0.85);