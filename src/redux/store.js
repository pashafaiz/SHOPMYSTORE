import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import profileSlice from './slices/profileSlice';
import categoriesSlice from './slices/categoriesSlice';
import reelsSlice from './slices/reelsSlice';
import dashboardReducer from './slices/dashboardSlice';
import reelReducer from './slices/reelSlice';
import uploadReelSlice from './slices/uploadReelSlice';
import productDetailSlice from './slices/productDetailSlice';
import userProfileReducer from './slices/userProfileSlice';
import productModalReducer from './slices/productModalSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    profile: profileSlice,
    categories: categoriesSlice,
    reels: reelsSlice,
    dashboard: dashboardReducer,
    reel: reelReducer,
    uploadReel: uploadReelSlice,
    productDetail: productDetailSlice,
    userProfile: userProfileReducer,
    productModal: productModalReducer,
  },
});

export default store;