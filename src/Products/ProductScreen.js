import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  Image,
  Dimensions,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { submitProduct } from '../redux/slices/profileSlice';
import {
  MAX_MEDIA_FILES,
  FONT_SIZE_XLARGE,
  FONT_SIZE_LARGE,
  FONT_SIZE_MEDIUM,
  SCREEN_PADDING,
  CARD_BORDER_RADIUS,
  ICON_SIZE,
  PRODUCT_BG_COLOR,
  CATEGORY_BG_COLOR,
  PRIMARY_THEME_COLOR,
  SECONDARY_THEME_COLOR,
  TEXT_THEME_COLOR,
  SUBTEXT_THEME_COLOR,
  BORDER_THEME_COLOR,
  BACKGROUND_GRADIENT,
} from '../constants/GlobalConstants';

const { width, height } = Dimensions.get('window');
const scaleFactor = Math.min(width, 375) / 375;
const scale = (size) => Math.round(size * scaleFactor);
const scaleFont = (size) => {
  const fontScale = Math.min(width, height) / 375;
  const scaledSize = size * fontScale * (Platform.OS === 'ios' ? 0.9 : 0.85);
  return Math.round(scaledSize);
};

const ProductScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute();
  const { product, screenType = 'add' } = route.params || {};

  const COMMON_SPECS = ['Material', 'Weight', 'Dimensions', 'Color', 'Size', 'Brand', 'Model'];
  const COMMON_COLORS = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'pink'];
  const COMMON_HIGHLIGHTS = ['Waterproof', 'Lightweight', 'Durable', 'Eco-friendly', 'Premium', 'Handmade'];
  const COMMON_TAGS = ['Fashion', 'Summer', 'Winter', 'Casual', 'Formal', 'Sports', 'Trending'];
  const COMMON_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    discount: '0',
    sizes: '',
    colors: '',
    highlights: '',
    specifications: '[]',
    tags: '',
    category: '',
    stock: '0',
    brand: '',
    offer: '',
  });
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dropdownType, setDropdownType] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, width: 0 });
  const [selectedItems, setSelectedItems] = useState([]);
  const [customInput, setCustomInput] = useState('');

  const scaleValue = useSharedValue(0.95);
  const opacityValue = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scaleValue.value) }],
    opacity: opacityValue.value,
  }));

  const inputRefs = {
    sizes: useRef(null),
    colors: useRef(null),
    highlights: useRef(null),
    specifications: useRef(null),
    tags: useRef(null),
  };

  useEffect(() => {
    scaleValue.value = 1;
    opacityValue.value = 1;
  }, [scaleValue, opacityValue]);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUserId(parsedUser.id);
          console.log('Fetched userId:', parsedUser.id);
        } else {
          console.log('No user found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error fetching userId:', error);
      }
    };
    getUserId();

    if (product && screenType === 'edit') {
      const formattedProduct = {
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        originalPrice: product.originalPrice?.toString() || '',
        discount: product.discount?.toString() || '0',
        sizes: product.sizes?.join(', ') || '',
        colors: product.colors?.join(', ') || '',
        highlights: product.highlights?.join(', ') || '',
        specifications: Array.isArray(product.specifications)
          ? JSON.stringify(product.specifications)
          : '[]',
        tags: product.tags?.join(', ') || '',
        category: product.category || '',
        stock: product.stock?.toString() || '0',
        brand: product.brand || '',
        offer: product.offer || '',
      };
      setFormData(formattedProduct);
      console.log('Loaded product for edit:', formattedProduct);

      const formattedMedia = product.media?.map((item) => ({
        uri: item.url || item,
        mediaType: item.mediaType || 'image',
        type: item.type || 'image/jpeg',
        fileName: item.fileName || `media_${Date.now()}.jpg`,
      })) || [];
      setMedia(formattedMedia);
    } else if (screenType === 'add') {
      resetForm();
    }
  }, [product, screenType]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      discount: '0',
      sizes: '',
      colors: '',
      highlights: '',
      specifications: '[]',
      tags: '',
      category: '',
      stock: '0',
      brand: '',
      offer: '',
    });
    setMedia([]);
    setUploadProgress(0);
    setIsUploading(false);
    console.log('Form reset');
  };

  const handleChange = (name, value) => {
    console.log(`Changing ${name} to: ${value}`);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if ((name === 'price' || name === 'originalPrice') && formData.originalPrice && formData.price) {
      const original = parseFloat(name === 'originalPrice' ? value : formData.originalPrice);
      const discounted = parseFloat(name === 'price' ? value : formData.price);

      if (original > 0 && discounted > 0 && original >= discounted) {
        const discountValue = Math.round(((original - discounted) / original) * 100);
        setFormData((prev) => ({
          ...prev,
          discount: discountValue.toString(),
        }));
        console.log(`Calculated discount: ${discountValue}%`);
      }
    }
  };

  const pickMedia = () => {
    const options = {
      mediaType: 'mixed',
      quality: 0.8,
      selectionLimit: MAX_MEDIA_FILES - media.length,
      maxWidth: 1000,
      maxHeight: 1000,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('Media picker cancelled');
        return;
      }
      if (response.errorCode) {
        Alert.alert('Error', 'Failed to pick media');
        console.error('Media picker error:', response.errorCode);
        return;
      }
      if (response.assets?.length > 0) {
        const selectedMedia = response.assets.map((asset) => {
          const extension = asset.type?.startsWith('video') ? 'mp4' : 'jpg';
          const fileName = asset.fileName || `media_${Date.now()}.${extension}`;
          return {
            uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
            mediaType: asset.type?.startsWith('video') ? 'video' : 'image',
            type: asset.type || (asset.type?.startsWith('video') ? 'video/mp4' : 'image/jpeg'),
            fileName,
          };
        });
        setMedia((prev) => [...prev, ...selectedMedia].slice(0, MAX_MEDIA_FILES));
        console.log('Selected media:', selectedMedia);
      }
    });
  };

  const removeMedia = (index) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
    console.log(`Removed media at index: ${index}`);
  };

  const renderMediaItem = ({ item, index }) => (
    <View style={styles.mediaItem}>
      {item.mediaType === 'video' ? (
        <View style={styles.videoContainer}>
          <Image
            source={{ uri: item.uri }}
            style={styles.videoThumbnail}
            defaultSource={{ uri: 'https://cdn-icons-png.flaticon.com/512/3172/3172555.png' }}
          />
          <Icon name="play-circle-filled" size={scale(ICON_SIZE)} color={TEXT_THEME_COLOR} style={styles.playIcon} />
        </View>
      ) : (
        <Image
          source={{ uri: item.uri }}
          style={styles.mediaPreview}
          defaultSource={{ uri: 'https://via.placeholder.com/90' }}
        />
      )}
      <TouchableOpacity style={styles.removeButton} onPress={() => removeMedia(index)}>
        <Icon name="cancel" size={scale(16)} color={TEXT_THEME_COLOR} />
      </TouchableOpacity>
    </View>
  );

  const openDropdown = (type) => {
    console.log(`Opening dropdown for: ${type}`);
    setDropdownType(type);
    setCustomInput('');

    const currentValues = formData[type]?.split(',').map((item) => item.trim()).filter((item) => item) || [];
    setSelectedItems(currentValues);
    console.log(`Current values for ${type}:`, currentValues);

    const dropdownWidth = width * 0.8;
    const dropdownHeight = 300;
    const x = (width - dropdownWidth) / 2;
    const y = (height - dropdownHeight) / 2;

    setDropdownPosition({ x, y, width: dropdownWidth });
    setDropdownVisible(true);
    console.log(`Dropdown positioned at: x=${x}, y=${y}, width=${dropdownWidth}`);
  };

  const closeDropdown = () => {
    setDropdownVisible(false);
    setDropdownType(null);
    console.log('Closed dropdown');
  };

  const handleDropdownSelect = (value) => {
    console.log(`Selecting ${value} for ${dropdownType}`);
    setSelectedItems((prev) => {
      const newItems = prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value];
      setFormData((prevForm) => ({
        ...prevForm,
        [dropdownType]: newItems.join(', '),
      }));
      console.log(`Updated selectedItems for ${dropdownType}:`, newItems);
      return newItems;
    });
  };

  const addCustomValue = () => {
    if (!customInput.trim()) return;

    setSelectedItems((prev) => {
      const newItems = [...prev, customInput.trim()];
      setFormData((prevForm) => ({
        ...prevForm,
        [dropdownType]: newItems.join(', '),
      }));
      console.log(`Added custom ${dropdownType}: ${customInput}, new items:`, newItems);
      return newItems;
    });
    setCustomInput('');
  };

  const confirmSelections = () => {
    const joinedItems = selectedItems.join(', ');
    setFormData((prev) => ({
      ...prev,
      [dropdownType]: joinedItems,
    }));
    console.log(`Confirmed selections for ${dropdownType}: ${joinedItems}`);
    closeDropdown();
  };

  const getDropdownItems = () => {
    switch (dropdownType) {
      case 'sizes':
        return COMMON_SIZES;
      case 'colors':
        return COMMON_COLORS;
      case 'highlights':
        return COMMON_HIGHLIGHTS;
      case 'specifications':
        return COMMON_SPECS;
      case 'tags':
        return COMMON_TAGS;
      default:
        return [];
    }
  };

  const handleSubmit = async () => {
    const { name, price, originalPrice, discount, category, stock, brand } = formData;

    if (!name || !price || !category || !originalPrice || !discount || !stock || !brand || media.length === 0) {
      Alert.alert('Error', 'Please fill all required fields and add at least one media file');
      console.log('Validation failed:', {
        name,
        price,
        originalPrice,
        discount,
        category,
        stock,
        brand,
        mediaLength: media.length,
      });
      return;
    }

    const priceNum = parseFloat(price);
    const originalPriceNum = parseFloat(originalPrice);
    const discountNum = parseFloat(discount);
    const stockNum = parseInt(stock);

    if (isNaN(priceNum)) {
      Alert.alert('Error', 'Price must be a valid number');
      console.log('Invalid price:', price);
      return;
    }

    if (isNaN(originalPriceNum)) {
      Alert.alert('Error', 'Original price must be a valid number');
      console.log('Invalid originalPrice:', originalPrice);
      return;
    }

    if (isNaN(discountNum) || discountNum < 0 || discountNum > 100) {
      Alert.alert('Error', 'Discount must be between 0 and 100');
      console.log('Invalid discount:', discount);
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      Alert.alert('Error', 'Stock must be a valid number');
      console.log('Invalid stock:', stock);
      return;
    }

    let specificationsArray = [];
    try {
      specificationsArray = JSON.parse(formData.specifications);
      if (!Array.isArray(specificationsArray)) {
        throw new Error('Specifications must be an array');
      }
    } catch (e) {
      try {
        const pairs = formData.specifications
          .split(',')
          .map((pair) => pair.trim())
          .filter((pair) => pair.includes(':'));

        specificationsArray = pairs.map((pair) => {
          const [name, value] = pair.split(':').map((s) => s.trim());
          return { name, value };
        });
      } catch (err) {
        Alert.alert(
          'Error',
          'Specifications must be in format: "Material: Cotton, Weight: 250gsm" or valid JSON array'
        );
        console.log('Invalid specifications:', formData.specifications);
        return;
      }
    }

    const processField = (field) =>
      field ? field.split(',').map((item) => item.trim()).filter((item) => item) : [];

    const productData = {
      ...formData,
      price: priceNum,
      originalPrice: originalPriceNum,
      discount: discountNum,
      stock: stockNum,
      sizes: processField(formData.sizes),
      colors: processField(formData.colors).map((color) => color.toLowerCase()),
      highlights: processField(formData.highlights),
      specifications: specificationsArray,
      tags: processField(formData.tags),
      media: media.map((item) => ({
        uri: Platform.OS === 'android' ? item.uri : item.uri.replace('file://', ''),
        mediaType: item.mediaType,
        type: item.type,
        fileName: item.fileName,
      })),
      createdBy: userId,
    };

    setIsLoading(true);
    setIsUploading(true);
    setUploadProgress(0);
    console.log('Submitting product:', productData);

    try {
      const result = await dispatch(submitProduct({ productData, currentProduct: product })).unwrap();
      console.log('Product submitted successfully:', result);
      setIsLoading(false);
      setIsUploading(false);
      resetForm();
      navigation.goBack();
    } catch (err) {
      setIsLoading(false);
      setIsUploading(false);
      const errorMessage = err.message || 'Failed to submit product';
      Alert.alert('Error', errorMessage);
      console.error('Submission error:', {
        message: err.message,
        response: err.response,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <LinearGradient
          colors={BACKGROUND_GRADIENT}
          style={styles.gradientContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
              <Icon name="arrow-back" size={scale(ICON_SIZE)} color={PRIMARY_THEME_COLOR} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {screenType === 'edit' ? 'Edit Product' : 'Add New Product'}
            </Text>
            <View style={styles.headerRight} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={[animatedStyle, styles.contentContainer]}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Media *</Text>
                <TouchableOpacity onPress={pickMedia} style={styles.mediaPicker}>
                  <View style={styles.mediaPickerContent}>
                    <Icon name="add-photo-alternate" size={scale(ICON_SIZE)} color={PRIMARY_THEME_COLOR} />
                    <Text style={styles.mediaPlaceholder}>
                      {media.length > 0
                        ? 'Add more media'
                        : `Tap to select images or videos (up to ${MAX_MEDIA_FILES})`}
                    </Text>
                  </View>
                </TouchableOpacity>

                {media.length > 0 && (
                  <FlatList
                    data={media}
                    renderItem={renderMediaItem}
                    keyExtractor={(item, index) => `media-${index}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.mediaList}
                    contentContainerStyle={styles.mediaListContent}
                  />
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Product Name *"
                  placeholderTextColor={SUBTEXT_THEME_COLOR}
                  value={formData.name}
                  onChangeText={(text) => handleChange('name', text)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Brand *"
                  placeholderTextColor={SUBTEXT_THEME_COLOR}
                  value={formData.brand}
                  onChangeText={(text) => handleChange('brand', text)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Stock *"
                  placeholderTextColor={SUBTEXT_THEME_COLOR}
                  value={formData.stock}
                  onChangeText={(text) => handleChange('stock', text)}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Offer (e.g., Buy 1 Get 1)"
                  placeholderTextColor={SUBTEXT_THEME_COLOR}
                  value={formData.offer}
                  onChangeText={(text) => handleChange('offer', text)}
                />
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Description"
                  placeholderTextColor={SUBTEXT_THEME_COLOR}
                  value={formData.description}
                  onChangeText={(text) => handleChange('description', text)}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pricing</Text>
                <View style={styles.row}>
                  <View style={[styles.inputContainer, { flex: 1, marginRight: scale(10) }]}>
                    <Text style={styles.inputLabel}>Original Price *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="₹0.00"
                      placeholderTextColor={SUBTEXT_THEME_COLOR}
                      value={formData.originalPrice}
                      onChangeText={(text) => handleChange('originalPrice', text)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Selling Price *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="₹0.00"
                      placeholderTextColor={SUBTEXT_THEME_COLOR}
                      value={formData.price}
                      onChangeText={(text) => handleChange('price', text)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Discount (%)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={SUBTEXT_THEME_COLOR}
                    value={formData.discount}
                    onChangeText={(text) => handleChange('discount', text)}
                    keyboardType="numeric"
                    editable={false}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Category *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Category *"
                  placeholderTextColor={SUBTEXT_THEME_COLOR}
                  value={formData.category}
                  onChangeText={(text) => handleChange('category', text)}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Details</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Sizes</Text>
                  <View style={styles.dropdownInputContainer} ref={inputRefs.sizes}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="XS, S, M, L"
                      placeholderTextColor={SUBTEXT_THEME_COLOR}
                      value={formData.sizes}
                      onChangeText={(text) => handleChange('sizes', text)}
                    />
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => openDropdown('sizes')}
                    >
                      <Icon name="arrow-drop-down" size={scale(ICON_SIZE)} color={PRIMARY_THEME_COLOR} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Colors</Text>
                  <View style={styles.dropdownInputContainer} ref={inputRefs.colors}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="red, blue, green"
                      placeholderTextColor={SUBTEXT_THEME_COLOR}
                      value={formData.colors}
                      onChangeText={(text) => handleChange('colors', text)}
                    />
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => openDropdown('colors')}
                    >
                      <Icon name="arrow-drop-down" size={scale(ICON_SIZE)} color={PRIMARY_THEME_COLOR} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Highlights</Text>
                  <View style={styles.dropdownInputContainer} ref={inputRefs.highlights}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Waterproof, Lightweight"
                      placeholderTextColor={SUBTEXT_THEME_COLOR}
                      value={formData.highlights}
                      onChangeText={(text) => handleChange('highlights', text)}
                    />
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => openDropdown('highlights')}
                    >
                      <Icon name="arrow-drop-down" size={scale(ICON_SIZE)} color={PRIMARY_THEME_COLOR} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Specifications</Text>
                  <View style={styles.dropdownInputContainer} ref={inputRefs.specifications}>
                    <TextInput
                      style={[styles.input, styles.multilineInput, { flex: 1 }]}
                      placeholder='Material: Cotton, Weight: 250gsm OR [{"name":"Material","value":"Cotton"}]'
                      placeholderTextColor={SUBTEXT_THEME_COLOR}
                      value={formData.specifications}
                      onChangeText={(text) => handleChange('specifications', text)}
                      multiline
                      numberOfLines={4}
                    />
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => openDropdown('specifications')}
                    >
                      <Icon name="arrow-drop-down" size={scale(ICON_SIZE)} color={PRIMARY_THEME_COLOR} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Tags</Text>
                  <View style={styles.dropdownInputContainer} ref={inputRefs.tags}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="fashion, summer"
                      placeholderTextColor={SUBTEXT_THEME_COLOR}
                      value={formData.tags}
                      onChangeText={(text) => handleChange('tags', text)}
                    />
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => openDropdown('tags')}
                    >
                      <Icon name="arrow-drop-down" size={scale(ICON_SIZE)} color={PRIMARY_THEME_COLOR} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Animated.View>
          </ScrollView>

          {isUploading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${uploadProgress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>Uploading: {uploadProgress}%</Text>
              <ActivityIndicator size="small" color={PRIMARY_THEME_COLOR} />
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, isUploading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading || isUploading}
          >
            <LinearGradient
              colors={[PRIMARY_THEME_COLOR, '#8ec5fc']}
              style={styles.submitButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.submitButtonText}>
                {screenType === 'edit' ? 'Update Product' : 'Add Product'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {dropdownVisible && (
            <TouchableWithoutFeedback onPress={closeDropdown}>
              <View style={styles.dropdownOverlay}>
                <View
                  style={[
                    styles.dropdownContainer,
                    {
                      position: 'absolute',
                      top: dropdownPosition.y,
                      left: dropdownPosition.x,
                      width: dropdownPosition.width,
                      maxHeight: scale(300),
                    },
                  ]}
                  onStartShouldSetResponder={() => true}
                >
                  <View style={styles.customInputContainer}>
                    <TextInput
                      style={styles.customInput}
                      placeholder={`Add new ${dropdownType}`}
                      placeholderTextColor={SUBTEXT_THEME_COLOR}
                      value={customInput}
                      onChangeText={setCustomInput}
                      onSubmitEditing={addCustomValue}
                    />
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={addCustomValue}
                      disabled={!customInput.trim()}
                    >
                      <Icon name="add" size={scale(20)} color={TEXT_THEME_COLOR} />
                    </TouchableOpacity>
                  </View>

                  <FlatList
                    data={getDropdownItems()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => handleDropdownSelect(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dropdownItemText}>{item}</Text>
                        {selectedItems.includes(item) && (
                          <Icon name="check" size={scale(20)} color={PRIMARY_THEME_COLOR} />
                        )}
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item) => `dropdown-${dropdownType}-${item}`}
                    contentContainerStyle={styles.dropdownList}
                  />

                  <TouchableOpacity
                    style={[styles.addButton, { alignSelf: 'center', marginVertical: scale(10) }]}
                    onPress={confirmSelections}
                  >
                    <Text style={styles.addButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          )}
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(SCREEN_PADDING),
    paddingTop: Platform.OS === 'ios' ? scale(20) : scale(10),
    paddingBottom: scale(15),
    backgroundColor: PRODUCT_BG_COLOR,
    borderBottomWidth: scale(2),
    borderBottomColor: BORDER_THEME_COLOR,
    borderRadius: scale(CARD_BORDER_RADIUS),
    margin: scale(SCREEN_PADDING),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    elevation: 5,
  },
  closeButton: {
    paddingTop: scale(8),
  },
  headerTitle: {
    fontSize: scaleFont(FONT_SIZE_XLARGE),
    fontWeight: '700',
    color: TEXT_THEME_COLOR,
  },
  headerRight: {
    width: scale(40),
  },
  scrollContent: {
    paddingBottom: scale(100),
  },
  contentContainer: {
    padding: scale(SCREEN_PADDING),
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(CARD_BORDER_RADIUS),
    margin: scale(SCREEN_PADDING),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    elevation: 5,
  },
  section: {
    marginBottom: scale(24),
  },
  sectionTitle: {
    fontSize: scaleFont(FONT_SIZE_LARGE),
    fontWeight: '600',
    color: TEXT_THEME_COLOR,
    marginBottom: scale(12),
  },
  mediaPicker: {
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(CARD_BORDER_RADIUS),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    padding: scale(20),
    marginBottom: scale(12),
  },
  mediaPickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaPlaceholder: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(FONT_SIZE_MEDIUM),
    marginLeft: scale(8),
  },
  mediaList: {
    marginBottom: scale(12),
  },
  mediaListContent: {
    paddingRight: scale(8),
  },
  mediaItem: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(CARD_BORDER_RADIUS),
    marginRight: scale(8),
    backgroundColor: PRODUCT_BG_COLOR,
    overflow: 'hidden',
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: CATEGORY_BG_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  playIcon: {
    position: 'absolute',
  },
  removeButton: {
    position: 'absolute',
    top: scale(4),
    right: scale(4),
    backgroundColor: SECONDARY_THEME_COLOR,
    borderRadius: scale(10),
    width: scale(20),
    height: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  inputContainer: {
    marginBottom: scale(12),
  },
  dropdownInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownButton: {
    padding: scale(10),
    marginLeft: scale(5),
  },
  inputLabel: {
    fontSize: scaleFont(FONT_SIZE_MEDIUM),
    color: SUBTEXT_THEME_COLOR,
    marginBottom: scale(6),
  },
  input: {
    backgroundColor: CATEGORY_BG_COLOR,
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    borderRadius: scale(CARD_BORDER_RADIUS),
    padding: scale(14),
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(FONT_SIZE_MEDIUM),
    marginVertical: 5,
  },
  multilineInput: {
    minHeight: scale(100),
    textAlignVertical: 'top',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  dropdownContainer: {
    backgroundColor: PRODUCT_BG_COLOR,
    borderRadius: scale(16),
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    elevation: 5,
  },
  customInputContainer: {
    flexDirection: 'row',
    padding: scale(16),
    paddingBottom: scale(8),
  },
  customInput: {
    flex: 1,
    backgroundColor: CATEGORY_BG_COLOR,
    borderWidth: scale(2),
    borderColor: BORDER_THEME_COLOR,
    borderRadius: scale(CARD_BORDER_RADIUS),
    padding: scale(12),
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(FONT_SIZE_MEDIUM),
    marginRight: scale(8),
  },
  addButton: {
    backgroundColor: PRIMARY_THEME_COLOR,
    borderRadius: scale(CARD_BORDER_RADIUS),
    width: scale(48),
    height: scale(48),
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(FONT_SIZE_MEDIUM),
    fontWeight: '600',
  },
  dropdownList: {
    paddingHorizontal: scale(16),
  },
  dropdownItem: {
    paddingVertical: scale(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: scale(1),
    borderBottomColor: BORDER_THEME_COLOR,
  },
  dropdownItemText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(FONT_SIZE_MEDIUM),
  },
  submitButton: {
    position: 'absolute',
    bottom: scale(20),
    left: scale(SCREEN_PADDING),
    right: scale(SCREEN_PADDING),
    borderRadius: scale(CARD_BORDER_RADIUS),
    overflow: 'hidden',
    shadowColor: PRIMARY_THEME_COLOR,
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonGradient: {
    paddingVertical: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(FONT_SIZE_LARGE),
    fontWeight: '700',
  },
  progressContainer: {
    paddingHorizontal: scale(SCREEN_PADDING),
    marginBottom: scale(10),
    alignItems: 'center',
  },
  progressBar: {
    height: scale(8),
    width: '100%',
    backgroundColor: CATEGORY_BG_COLOR,
    borderRadius: scale(4),
    marginBottom: scale(8),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: PRIMARY_THEME_COLOR,
    borderRadius: scale(4),
  },
  progressText: {
    color: TEXT_THEME_COLOR,
    fontSize: scaleFont(FONT_SIZE_MEDIUM),
    marginBottom: scale(8),
  },
});

export default ProductScreen;