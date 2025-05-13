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
  Modal
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CATEGORIES } from '../constants/GlobalConstants';

const { width, height } = Dimensions.get('window');

const ProductModal = ({ visible, onClose, onSubmit, product, screenType = 'add' }) => {
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
    category: useRef(null),
    sizes: useRef(null),
    colors: useRef(null),
    highlights: useRef(null),
    specifications: useRef(null),
    tags: useRef(null),
  };

  useEffect(() => {
    if (visible) {
      scaleValue.value = 1;
      opacityValue.value = 1;
    }
  }, [visible, scaleValue, opacityValue]);

  const categories = CATEGORIES.filter(cat => cat.id !== 'all').map(cat => cat.name);

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
      };
      setFormData(formattedProduct);
      console.log('Loaded product for edit:', formattedProduct);
      
      const formattedMedia = product.media?.map((item) => ({
        uri: item.url,
        mediaType: item.mediaType || 'image',
        type: item.type || 'image/jpeg',
        fileName: item.fileName || `media_${Date.now()}.jpg`,
      })) || [];
      setMedia(formattedMedia);
    } else if (screenType === 'add') {
      resetForm();
    }
  }, [product, visible, screenType]);

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
    });
    setMedia([]);
    setUploadProgress(0);
    setIsUploading(false);
    console.log('Form reset');
  };

  const handleChange = (name, value) => {
    console.log(`Changing ${name} to: ${value}`);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if ((name === 'price' || name === 'originalPrice') && formData.originalPrice && formData.price) {
      const original = parseFloat(name === 'originalPrice' ? value : formData.originalPrice);
      const discounted = parseFloat(name === 'price' ? value : formData.price);
      
      if (original > 0 && discounted > 0 && original >= discounted) {
        const discountValue = Math.round(((original - discounted) / original) * 100);
        setFormData(prev => ({
          ...prev,
          discount: discountValue.toString()
        }));
        console.log(`Calculated discount: ${discountValue}%`);
      }
    }
  };

  const pickMedia = () => {
    const options = {
      mediaType: 'mixed',
      quality: 0.8,
      selectionLimit: 5 - media.length,
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
      } else if (response.assets?.length > 0) {
        const selectedMedia = response.assets.map((asset) => ({
          uri: asset.uri,
          mediaType: asset.type?.startsWith('video') ? 'video' : 'image',
          type: asset.type,
          fileName: asset.fileName || `media_${Date.now()}.${asset.type?.startsWith('video') ? 'mp4' : 'jpg'}`,
        }));
        setMedia(prev => [...prev, ...selectedMedia].slice(0, 5));
        console.log('Selected media:', selectedMedia);
      }
    });
  };

  const removeMedia = (index) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
    console.log(`Removed media at index: ${index}`);
  };

  const renderMediaItem = ({ item, index }) => (
    <View style={styles.mediaItem}>
      {item.mediaType === 'video' ? (
        <View style={styles.videoContainer}>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3172/3172555.png' }} 
            style={styles.videoThumbnail}
          />
          <Icon name="play-circle-filled" size={24} color="#FFFFFF" style={styles.playIcon} />
        </View>
      ) : (
        <Image source={{ uri: item.uri }} style={styles.mediaPreview} />
      )}
      <TouchableOpacity style={styles.removeButton} onPress={() => removeMedia(index)}>
        <Icon name="cancel" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const openDropdown = (type) => {
    console.log(`Opening dropdown for: ${type}`);
    setDropdownType(type);
    setCustomInput('');
    
    if (type === 'category') {
      setSelectedItems([]);
    } else {
      const currentValues = formData[type]?.split(',').map(item => item.trim()).filter(item => item) || [];
      setSelectedItems(currentValues);
      console.log(`Current values for ${type}:`, currentValues);
    }

    // Center the dropdown on the screen
    const dropdownWidth = width * 0.8; // 80% of screen width
    const dropdownHeight = 300; // Fixed height (maxHeight from styles)
    const x = (width - dropdownWidth) / 2; // Center horizontally
    const y = (height - dropdownHeight) / 2; // Center vertically

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
    if (dropdownType === 'category') {
      setFormData(prev => ({
        ...prev,
        category: value
      }));
      closeDropdown();
      console.log(`Set category to: ${value}`);
    } else {
      setSelectedItems(prev => {
        const newItems = prev.includes(value)
          ? prev.filter(item => item !== value)
          : [...prev, value];
        setFormData(prevForm => ({
          ...prevForm,
          [dropdownType]: newItems.join(', ')
        }));
        console.log(`Updated selectedItems for ${dropdownType}:`, newItems);
        return newItems;
      });
    }
  };

  const addCustomValue = () => {
    if (!customInput.trim()) return;
    
    if (dropdownType === 'category') {
      setFormData(prev => ({
        ...prev,
        category: customInput
      }));
      console.log(`Set custom category: ${customInput}`);
      closeDropdown();
    } else {
      setSelectedItems(prev => {
        const newItems = [...prev, customInput.trim()];
        setFormData(prevForm => ({
          ...prevForm,
          [dropdownType]: newItems.join(', ')
        }));
        console.log(`Added custom ${dropdownType}: ${customInput}, new items:`, newItems);
        return newItems;
      });
      setCustomInput('');
    }
  };

  const confirmSelections = () => {
    if (dropdownType !== 'category') {
      const joinedItems = selectedItems.join(', ');
      setFormData(prev => ({
        ...prev,
        [dropdownType]: joinedItems
      }));
      console.log(`Confirmed selections for ${dropdownType}: ${joinedItems}`);
    }
    closeDropdown();
  };

  const getDropdownItems = () => {
    switch (dropdownType) {
      case 'category':
        return categories;
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

  const handleRequestClose = () => {
    if (!isUploading) {
      onClose();
    }
    console.log('Modal close requested');
  };

  const handleSubmit = async () => {
    const { name, price, originalPrice, discount, category } = formData;
    
    if (!name || !price || !category || !originalPrice || !discount || media.length === 0) {
      Alert.alert('Error', 'Please fill all required fields and add at least one media file');
      console.log('Validation failed:', { name, price, originalPrice, discount, category, mediaLength: media.length });
      return;
    }

    const priceNum = parseFloat(price);
    const originalPriceNum = parseFloat(originalPrice);
    const discountNum = parseFloat(discount);

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

    let specificationsArray = [];
    try {
      specificationsArray = JSON.parse(formData.specifications);
      if (!Array.isArray(specificationsArray)) {
        throw new Error('Specifications must be an array');
      }
    } catch (e) {
      try {
        const pairs = formData.specifications.split(',')
          .map(pair => pair.trim())
          .filter(pair => pair.includes(':'));

        specificationsArray = pairs.map(pair => {
          const [name, value] = pair.split(':').map(s => s.trim());
          return { name, value };
        });
      } catch (err) {
        Alert.alert('Error', 'Specifications must be in format: "Material: Cotton, Weight: 250gsm" or valid JSON array');
        console.log('Invalid specifications:', formData.specifications);
        return;
      }
    }

    const processField = (field) => 
      field ? field.split(',').map(item => item.trim()).filter(item => item) : [];

    const colors = processField(formData.colors).map(color => color.toLowerCase());

    const productData = {
      ...formData,
      price: priceNum,
      originalPrice: originalPriceNum,
      discount: discountNum,
      sizes: processField(formData.sizes),
      colors: colors,
      highlights: processField(formData.highlights),
      specifications: specificationsArray,
      tags: processField(formData.tags),
      media,
      createdBy: userId
    };

    setIsLoading(true);
    setIsUploading(true);
    setUploadProgress(0);
    console.log('Submitting product:', productData);
    
    try {
      const submitResult = onSubmit({
        ...productData,
        progressCallback: (progress) => {
          setUploadProgress(Math.round(progress * 100));
          console.log(`Upload progress: ${Math.round(progress * 100)}%`);
        }
      });

      if (submitResult && typeof submitResult.then === 'function') {
        await submitResult;
        console.log('onSubmit promise resolved');
      } else {
        console.warn('onSubmit did not return a promise, proceeding without awaiting');
      }
      
      setIsLoading(false);
      setIsUploading(false);
      resetForm();
      onClose();
      console.log('Product submitted successfully');
    } catch (err) {
      setIsLoading(false);
      setIsUploading(false);
      const errorMessage = err.message || 'Failed to submit product';
      Alert.alert('Error', errorMessage);
      console.error('Submission error:', err);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={handleRequestClose}
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <LinearGradient
          colors={['#0A0A1E', '#1E1E3F']}
          style={styles.gradientContainer}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={handleRequestClose} style={styles.closeButton}>
              <Icon name="arrow-back" size={24} color="#FFFFFF" />
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
                    <Icon name="add-photo-alternate" size={24} color="#7B61FF" />
                    <Text style={styles.mediaPlaceholder}>
                      {media.length > 0 ? 'Add more media' : 'Tap to select images or videos (up to 5)'}
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
                  placeholderTextColor="#B0B0D0"
                  value={formData.name}
                  onChangeText={(text) => handleChange('name', text)}
                />
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Description"
                  placeholderTextColor="#B0B0D0"
                  value={formData.description}
                  onChangeText={(text) => handleChange('description', text)}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pricing</Text>
                <View style={styles.row}>
                  <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.inputLabel}>Original Price *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="₹0.00"
                      placeholderTextColor="#B0B0D0"
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
                      placeholderTextColor="#B0B0D0"
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
                    placeholderTextColor="#B0B0D0"
                    value={formData.discount}
                    onChangeText={(text) => handleChange('discount', text)}
                    keyboardType="numeric"
                    editable={false}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Category *</Text>
                <TouchableOpacity
                  style={styles.categoryInput}
                  onPress={() => openDropdown('category')}
                  ref={inputRefs.category}
                >
                  <Text style={[styles.categoryText, !formData.category && { color: '#B0B0D0' }]}>
                    {formData.category || 'Select Category'}
                  </Text>
                  <Icon name="keyboard-arrow-down" size={20} color="#B0B0D0" />
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Details</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Sizes</Text>
                  <View style={styles.dropdownInputContainer} ref={inputRefs.sizes}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="XS, S, M, L"
                      placeholderTextColor="#B0B0D0"
                      value={formData.sizes}
                      onChangeText={(text) => handleChange('sizes', text)}
                    />
                    <TouchableOpacity 
                      style={styles.dropdownButton}
                      onPress={() => openDropdown('sizes')}
                    >
                      <Icon name="arrow-drop-down" size={24} color="#7B61FF" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Colors</Text>
                  <View style={styles.dropdownInputContainer} ref={inputRefs.colors}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="red, blue, green"
                      placeholderTextColor="#B0B0D0"
                      value={formData.colors}
                      onChangeText={(text) => handleChange('colors', text)}
                    />
                    <TouchableOpacity 
                      style={styles.dropdownButton}
                      onPress={() => openDropdown('colors')}
                    >
                      <Icon name="arrow-drop-down" size={24} color="#7B61FF" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Highlights</Text>
                  <View style={styles.dropdownInputContainer} ref={inputRefs.highlights}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Waterproof, Lightweight"
                      placeholderTextColor="#B0B0D0"
                      value={formData.highlights}
                      onChangeText={(text) => handleChange('highlights', text)}
                    />
                    <TouchableOpacity 
                      style={styles.dropdownButton}
                      onPress={() => openDropdown('highlights')}
                    >
                      <Icon name="arrow-drop-down" size={24} color="#7B61FF" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Specifications</Text>
                  <View style={styles.dropdownInputContainer} ref={inputRefs.specifications}>
                    <TextInput
                      style={[styles.input, styles.multilineInput, { flex: 1 }]}
                      placeholder='Material: Cotton, Weight: 250gsm OR [{"name":"Material","value":"Cotton"}]'
                      placeholderTextColor="#B0B0D0"
                      value={formData.specifications}
                      onChangeText={(text) => handleChange('specifications', text)}
                      multiline
                      numberOfLines={4}
                    />
                    <TouchableOpacity 
                      style={styles.dropdownButton}
                      onPress={() => openDropdown('specifications')}
                    >
                      <Icon name="arrow-drop-down" size={24} color="#7B61FF" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Tags</Text>
                  <View style={styles.dropdownInputContainer} ref={inputRefs.tags}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="fashion, summer"
                      placeholderTextColor="#B0B0D0"
                      value={formData.tags}
                      onChangeText={(text) => handleChange('tags', text)}
                    />
                    <TouchableOpacity 
                      style={styles.dropdownButton}
                      onPress={() => openDropdown('tags')}
                    >
                      <Icon name="arrow-drop-down" size={24} color="#7B61FF" />
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
                  style={[
                    styles.progressFill,
                    { width: `${uploadProgress}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                Uploading: {uploadProgress}%
              </Text>
              <ActivityIndicator size="small" color="#7B61FF" />
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              isUploading && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isLoading || isUploading}
          >
            <LinearGradient
              colors={['#7B61FF', '#A855F7']}
              style={styles.submitButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
            </LinearGradient>
          </TouchableOpacity>

          {dropdownVisible && (
            <TouchableWithoutFeedback onPress={closeDropdown}>
              <View style={styles.dropdownOverlay}>
                <View 
                  style={[styles.dropdownContainer, {
                    position: 'absolute',
                    top: dropdownPosition.y,
                    left: dropdownPosition.x,
                    width: dropdownPosition.width,
                    maxHeight: 300,
                  }]}
                  onStartShouldSetResponder={() => true}
                >
                  <View style={styles.customInputContainer}>
                    <TextInput
                      style={styles.customInput}
                      placeholder={`Add new ${dropdownType}`}
                      placeholderTextColor="#B0B0D0"
                      value={customInput}
                      onChangeText={setCustomInput}
                      onSubmitEditing={addCustomValue}
                    />
                    <TouchableOpacity 
                      style={styles.addButton}
                      onPress={addCustomValue}
                      disabled={!customInput.trim()}
                    >
                      <Icon name="add" size={20} color="#FFFFFF" />
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
                        {(dropdownType === 'category' ? 
                          formData.category === item : 
                          selectedItems.includes(item)) && (
                          <Icon name="check" size={20} color="#7B61FF" />
                        )}
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item) => `dropdown-${dropdownType}-${item}`}
                    contentContainerStyle={styles.dropdownList}
                  />

                  {dropdownType !== 'category' && (
                    <TouchableOpacity
                      style={[styles.addButton, { alignSelf: 'center', marginVertical: 10 }]}
                      onPress={confirmSelections}
                    >
                      <Text style={styles.addButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          )}
        </LinearGradient>
      </KeyboardAvoidingView>
    </Modal>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  mediaPicker: {
    backgroundColor: 'rgba(123, 97, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.3)',
    padding: 16,
    marginBottom: 12,
  },
  mediaPickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaPlaceholder: {
    color: '#7B61FF',
    fontSize: 14,
    marginLeft: 8,
  },
  mediaList: {
    marginBottom: 12,
  },
  mediaListContent: {
    paddingRight: 8,
  },
  mediaItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
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
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  inputContainer: {
    marginBottom: 12,
  },
  dropdownInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownButton: {
    padding: 10,
    marginLeft: 5,
  },
  inputLabel: {
    fontSize: 14,
    color: '#B0B0D0',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  dropdownContainer: {
    backgroundColor: '#2A2A5A',
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  customInputContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
  },
  customInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#7B61FF',
    borderRadius: 8,
    width: 70,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  dropdownList: {
    paddingHorizontal: 16,
  },
  dropdownItem: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownItemText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  submitButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  progressBar: {
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7B61FF',
    borderRadius: 3,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 8,
  },
});

export default ProductModal;