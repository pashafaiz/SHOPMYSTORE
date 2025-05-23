//GlobalConstants
export const BASE_URL = 'https://shopmystore-backend-1.onrender.com';

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
export const REVIEWS_ENDPOINT = '/api/products/reviews';
export const ORDER_ENDPOINT = '/api/orders';
export const CHECKOUT_ENDPOINT = '/api/checkout';
export const SEARCH_ENDPOINT = '/api/products/search';
export const SUPPORT_SUBMIT_TICKET_ENDPOINT = '/api/support/submit-ticket';
export const SUPPORT_FAQS_ENDPOINT = '/api/support/faqs';
export const SUPPORT_CHAT_MESSAGES_ENDPOINT = '/api/support/chat/messages';
export const NOTIFICATIONS_ENDPOINT = '/api/notifications';
export const NOTIFICATION_READ_ENDPOINT = '/api/notifications/:notificationId/read';
export const NOTIFICATION_DELETE_ENDPOINT = '/api/notifications/:notificationId';
export const CHAT_SEND_MESSAGE_ENDPOINT = '/api/chat/send';
export const CHAT_MESSAGES_ENDPOINT = '/api/chat/messages';
export const CHAT_UPDATE_MESSAGE_ENDPOINT = '/api/chat/message/:messageId';
export const CHAT_DELETE_MESSAGE_ENDPOINT = '/api/chat/message/:messageId';
export const CHAT_LIST_ENDPOINT = '/api/chat/list';
export const SAVE_FCM_TOKEN_ENDPOINT = '/api/notifications/save-fcm-token';
export const AUTH_FORGOT_PASSWORD_ENDPOINT = '/api/auth/forgot-password';
export const AUTH_VERIFY_PASSWORD_RESET_OTP_ENDPOINT = '/api/auth/verify-password-reset-otp';
export const AUTH_RESET_PASSWORD_ENDPOINT = '/api/auth/reset-password';

export const RAZORPAY_KEY_ID = 'rzp_test_9r6fi8ChH5mImP'; // Add your Razorpay key here

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
};

// Default Values
export const DEFAULT_IMAGE_URL = 'https://picsum.photos/200/300';
export const FALLBACK_IMAGE_URL = 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=Image+Unavailable';
export const DEFAULT_CATEGORY = 'all';
export const DEFAULT_PRICE = 0;
export const ALLOWED_ASPECT_RATIOS = [16 / 9, 9 / 16, 4 / 3];
export const USER_TOKEN_KEY = 'userToken';
export const FILTER_LIMIT = 10;
export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 20;
export const DEFAULT_QUANTITY = 1;
export const MAX_MEDIA_FILES = 10; // Maximum media files

// Price Ranges
export const PRICE_RANGES = {
  UNDER_500: 'under_500',
  RANGE_500_1000: '500_1000',
  RANGE_1000_2000: '1000_2000',
  OVER_2000: 'over_2000',
};

// Sort Options
export const SORT_OPTIONS = {
  NEWEST: 'newest',
  PRICE_LOW_HIGH: 'price_low_high',
  PRICE_HIGH_LOW: 'price_high_low',
  POPULAR: 'popular',
};

// Rating Options
export const RATING_OPTIONS = {
  FOUR_PLUS: '4',
  THREE_PLUS: '3',
  TWO_PLUS: '2',
};

// Discount Options
export const DISCOUNT_OPTIONS = {
  TEN_PLUS: '10',
  TWENTY_PLUS: '20',
  THIRTY_PLUS: '30',
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
export const NO_TOKEN_ERROR = 'Authentication token required';
export const SUBMIT_PRODUCT_ERROR = 'Failed to submit product';
export const DELETE_PRODUCT_ERROR = 'Failed to delete product';
export const FETCH_USER_PROFILE_ERROR = 'Failed to load user data';
export const USER_NOT_FOUND_ERROR = 'User not found';
export const INVALID_OTP_ERROR = 'Invalid OTP';
export const ORDER_CREATION_ERROR = 'Failed to create order';
export const CHECKOUT_ERROR = 'Failed to process checkout';
export const SEARCH_ERROR = 'Failed to search products';
export const FETCH_FAQS_ERROR = 'Failed to fetch FAQs';
export const SUBMIT_TICKET_ERROR = 'Failed to submit ticket';
export const FETCH_CHAT_MESSAGES_ERROR = 'Failed to fetch chat messages';
export const SEND_CHAT_MESSAGE_ERROR = 'Failed to send chat message';
export const UPDATE_CHAT_MESSAGE_ERROR = 'Failed to update chat message';
export const DELETE_CHAT_MESSAGE_ERROR = 'Failed to delete chat message';
export const FETCH_ADDRESSES_ERROR = 'Failed to fetch addresses';
export const ADD_ADDRESS_ERROR = 'Failed to add address';
export const DELETE_ADDRESS_ERROR = 'Failed to delete address';
export const INVALID_PROMO_CODE_ERROR = 'Invalid promo code';
export const PLACE_ORDER_ERROR = 'Failed to place order';
export const FETCH_NOTIFICATIONS_ERROR = 'Failed to fetch notifications';
export const CREATE_NOTIFICATION_ERROR = 'Failed to create notification';
export const MARK_NOTIFICATION_READ_ERROR = 'Failed to mark notification as read';
export const DELETE_NOTIFICATION_ERROR = 'Failed to delete notification';
export const CLEAR_NOTIFICATIONS_ERROR = 'Failed to clear notifications';
export const SAVE_FCM_TOKEN_ERROR = 'Failed to save FCM token';
export const FETCH_CHAT_LIST_ERROR = 'Failed to fetch chat list';

// Layout Constants
export const NUM_COLUMNS = 3;
export const ITEM_SPACING = 8;
export const HEADER_TITLE = 'Shop by Category';
export const EMPTY_TEXT = 'No products found';
export const SCREEN_PADDING = 15;
export const CARD_BORDER_RADIUS = 12;
export const ICON_SIZE = 24;
export const FONT_SIZE_SMALL = 12;
export const FONT_SIZE_MEDIUM = 14;
export const FONT_SIZE_LARGE = 16;
export const FONT_SIZE_XLARGE = 18;

// API Timeout Constants
export const API_TIMEOUT_SHORT = 10000;
export const API_TIMEOUT_LONG = 30000;

// Toast Notification Constants
export const TOAST_POSITION = 'top';
export const TOAST_TOP_OFFSET = 20;
export const TOAST_VISIBILITY_TIME = 3000;
export const NOTIFICATION_DEDUPE_WINDOW = 10000;

// Animation Constants
export const ANIMATION_DURATION = 300;
export const ANIMATION_SCALE = 0.95;
export const ANIMATION_OPACITY = 0;

// Storage Keys
export const RECENTLY_VIEWED_KEY = 'recentlyViewed';
export const USER_DATA_KEY = 'user';

// Colors
export const PRIMARY_THEME_COLOR = '#5b9cff'; // Primary theme color used in buttons, highlights
export const SECONDARY_THEME_COLOR = '#ff6b8a'; // Secondary theme for badges, liked icons
export const TEXT_THEME_COLOR = '#1a2b4a'; // Primary text color
export const SUBTEXT_THEME_COLOR = '#5a6b8a'; // Subtext and secondary text color
export const BORDER_THEME_COLOR = 'rgba(91, 156, 255, 0.3)'; // Border color for cards and inputs
export const PRODUCT_BG_COLOR = '#f5f9ff'; // Background for product cards and sections
export const CATEGORY_BG_COLOR = 'rgba(91, 156, 255, 0.2)'; // Background for category tags
export const BACKGROUND_GRADIENT = ['#8ec5fc', '#fff']; // Gradient for screens and action bars
export const SELECTED_CATEGORY_BG_COLOR = '#5b9cff';
export const REELS_LOADER_COLOR = '#5b9cff';
export const REELS_REFRESH_TINT_COLOR = '#5b9cff';
export const REELS_MODAL_BG_COLOR = '#f5f9ff';
export const REELS_MODAL_TEXT_COLOR = '#1a2b4a';
export const REELS_BUTTON_COLOR = '#5b9cff';

// Previously defined colors for consistency
export const PRIMARY_COLOR = '#5b9cff';
export const SECONDARY_COLOR = '#ff6b8a';
export const TEXT_COLOR = '#1a2b4a';
export const SUBTEXT_COLOR = '#5a6b8a';
export const BORDER_COLOR = 'rgba(91, 156, 255, 0.3)';

// Miscellaneous
export const MAX_QUANTITY = 10;
export const MIN_QUANTITY = 1;
export const MAX_COMMENT_LENGTH = 500;
export const MAX_REVIEW_LENGTH = 1000;
export const RECENTLY_VIEWED_LIMIT = 10;
export const RELATED_PRODUCTS_LIMIT = 10;
export const MAX_TICKET_SUBJECT_LENGTH = 100;
export const MAX_TICKET_DESCRIPTION_LENGTH = 500;
export const MAX_CHAT_MESSAGE_LENGTH = 500;
export const EMPTY_REELS_TEXT = 'No reels available';


