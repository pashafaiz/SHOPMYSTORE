export const BASE_URL = 'https://shopmystore-backend-1.onrender.com';

// API Endpoints
export const PRODUCTS_ENDPOINT = '/api/products';
export const PRODUCTS_BY_CATEGORY_ENDPOINT = '/api/products/category';
export const REELS_ENDPOINT = '/api/reels/reels';
export const COMMENTS_ENDPOINT = '/api/comments';
export const UPLOAD_REEL_ENDPOINT = '/api/reels/upload-reel';
export const AUTH_LOGIN_ENDPOINT = '/api/auth/login';
export const AUTH_SIGNUP_ENDPOINT = '/api/auth/signup';
export const AUTH_VERIFY_OTP_ENDPOINT = '/api/auth/verify-otp';
export const AUTH_RESEND_OTP_ENDPOINT = '/api/auth/resend-otp';
export const AUTH_EDIT_PROFILE_ENDPOINT = '/api/auth/edit-profile';
export const USER_PROFILE_ENDPOINT = '/api/auth/user';
export const CART_ENDPOINT = '/api/products/cart';
export const WISHLIST_ENDPOINT = '/api/products/wishlist';

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
};

// Default Values
export const DEFAULT_IMAGE_URL = 'https://via.placeholder.com/150';
export const FALLBACK_IMAGE_URL = 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=Image+Unavailable';
export const DEFAULT_CATEGORY = 'all';
export const DEFAULT_PRICE = 0;
export const ALLOWED_ASPECT_RATIOS = [16 / 9, 9 / 16, 4 / 3];
export const USER_TOKEN_KEY = 'userToken';
export const FILTER_LIMIT = 10;

// Price Ranges
export const PRICE_RANGES = {
  UNDER_500: 'Under ₹500',
  RANGE_500_1000: '₹500 - ₹1000',
  RANGE_1000_2000: '₹1000 - ₹2000',
  OVER_2000: 'Over ₹2000',
};

// Sort Options
export const SORT_OPTIONS = {
  NEWEST: 'Newest',
  PRICE_LOW_HIGH: 'Price: Low to High',
  PRICE_HIGH_LOW: 'Price: High to Low',
  POPULAR: 'Most Popular',
};

// Error Messages
export const FETCH_PRODUCTS_ERROR = 'Failed to fetch products';
export const FETCH_REELS_ERROR = 'Failed to fetch reels';
export const FETCH_COMMENTS_ERROR = 'Failed to fetch comments';
export const POST_COMMENT_ERROR = 'Failed to post comment';
export const UPLOAD_REEL_ERROR = 'Failed to upload reel';
export const NETWORK_ERROR = 'Network error. Please try again.';
export const GENERIC_ERROR = 'Something went wrong';
export const MISSING_PRODUCT_ID_ERROR = 'Missing product ID';
export const MISSING_REQUIRED_FIELDS_ERROR = 'Missing required fields';
export const MISSING_REEL_ID_ERROR = 'Missing reel ID';
export const MISSING_EMAIL_PASSWORD_ERROR = 'Missing email or password';
export const MISSING_OTP_EMAIL_ERROR = 'Missing OTP or email';
export const MISSING_EMAIL_ERROR = 'Missing email';
export const MISSING_PROFILE_DATA_ERROR = 'Missing fullName or userName';
export const MISSING_FORM_DATA_ERROR = 'No form data provided';
export const MISSING_TOKEN_ERROR = 'Authentication token is missing';
export const ADD_TO_CART_ERROR = 'Failed to add to cart';
export const REMOVE_FROM_CART_ERROR = 'Failed to remove from cart';
export const NO_TOKEN_ERROR = 'Authentication token is required';
export const SUBMIT_PRODUCT_ERROR = 'Failed to submit product';
export const DELETE_PRODUCT_ERROR = 'Failed to delete product';
export const FETCH_USER_PROFILE_ERROR = 'Failed to load user data';
export const USER_NOT_FOUND_ERROR = 'User not found';

// Categories
export const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'apps' },
  { id: 'Assessories', name: 'Accessories', icon: 'devices' },
  { id: 'Grocery', name: 'Grocery', icon: 'shopping-basket' },
  { id: 'Toys', name: 'Toys', icon: 'medical-services' },
  { id: 'Clothes', name: 'Clothes', icon: 'checkroom' },
  { id: 'Shoes', name: 'Shoes', icon1: 'shoe-sneaker' },
  { id: 'Trending', name: 'Trending', icon: 'trending-up' },
];

// Layout Constants
export const NUM_COLUMNS = 3;
export const ITEM_SPACING = 8;
export const HEADER_TITLE = 'Shop by Category';
export const EMPTY_TEXT = 'No products found';
export const EMPTY_REELS_TEXT = 'No reels available';

// Colors
export const PRIMARY_COLOR = '#7B61FF';
export const TEXT_COLOR = '#FFFFFF';
export const SECONDARY_TEXT_COLOR = '#E5E7EB';
export const BACKGROUND_COLORS = ['#0A0A1E', '#1E1E3F'];
export const CATEGORY_BG_COLOR = 'rgba(123, 97, 255, 0.1)';
export const SELECTED_CATEGORY_BG_COLOR = '#7B61FF';
export const PRODUCT_BG_COLOR = 'rgba(255, 255, 255, 0.05)';
export const BORDER_COLOR = 'rgba(255, 255, 255, 0.1)';
export const IMAGE_BG_COLOR = 'rgba(255, 255, 255, 0.05)';
export const REELS_LOADER_COLOR = 'white';
export const REELS_REFRESH_TINT_COLOR = 'white';
export const REELS_MODAL_BG_COLOR = 'rgba(0,0,0,0.6)';
export const REELS_MODAL_TEXT_COLOR = 'white';
export const REELS_BUTTON_COLOR = 'blue';

// Toast Configuration
export const TOAST_POSITION = 'top';
export const TOAST_TOP_OFFSET = 20;

// Animation Delays
export const ANIMATION_DELAY = 50;

// Responsive Scaling
export const BASE_WIDTH = 375;
export const BASE_HEIGHT = 375;

// Upload Reel Constants
export const MAX_VIDEO_DURATION = 60; // seconds
export const MAX_VIDEO_SIZE_MB = 60; // MB

// API Timeouts
export const API_TIMEOUT_SHORT = 15000; // 15 seconds for most GET/POST requests
export const API_TIMEOUT_LONG = 60000; // 60 seconds for file uploads
export const API_TIMEOUT_PROFILE = 30000; // 30 seconds for profile updates
export const API_TIMEOUT_PRODUCTS = 15150; // Slightly longer for product lists