import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Colors from '../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Trace from '../utils/Trace';

const { width, height } = Dimensions.get('window');
const scaleSize = (size) => Math?.round(size * (width / 375));
const scaleFont = (size) => Math?.round(size * (Math.min(width, height) / 375));

const ProductModal = ({ visible, onClose, onSubmit, product }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [category, setCategory] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const scaleValue = useSharedValue(0.95);
  const opacityValue = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scaleValue.value) }],
    opacity: opacityValue.value,
  }));

  useEffect(() => {
    if (visible) {
      scaleValue.value = 1;
      opacityValue.value = 1;
    }
  }, [visible, scaleValue, opacityValue]);

  const categories = [
    'Assessories',
    'Grocery',
    'Toys',
    'Clothes',
    'Shoes',
    'Trending',
  ];

  useEffect(() => {
    const getUserId = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserId(parsedUser.id);
      }
    };
    getUserId();

    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setPrice(product.price?.toString() || '');
      setMedia(
        product.media?.map((item) => ({
          uri: item.url,
          mediaType: item.mediaType || 'image',
          type: item.type || 'image/jpeg',
          fileName: item.fileName || `media_${Date.now()}.jpg`,
        })) || [],
      );
      setCategory(
        product.category
          ? product.category.charAt(0).toUpperCase() + product.category.slice(1).toLowerCase()
          : '',
      );
    } else {
      resetForm();
    }
  }, [product, visible]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setMedia([]);
    setCategory('');
  };

  const pickMedia = () => {
    const options = {
      mediaType: 'mixed',
      quality: 0.8,
      selectionLimit: 5,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        Trace('User cancelled media picker');
      } else if (response.errorCode) {
        Trace('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to pick media');
      } else if (response.assets && response.assets.length > 0) {
        const selectedMedia = response.assets.map((asset) => ({
          uri: asset.uri,
          mediaType: asset.type.startsWith('video') ? 'video' : 'image',
          type: asset.type,
          fileName: asset.fileName || `media_${Date.now()}.${asset.type.startsWith('video') ? 'mp4' : 'jpg'}`,
          data: asset.base64 || null,
        }));
        setMedia([...media, ...selectedMedia].slice(0, 5));
      }
    });
  };

  const removeMedia = (index) => {
    setMedia(media.filter((_, i) => i !== index));
  };

  const renderMediaItem = ({ item, index }) => (
    <View style={styles.mediaItem}>
      {item.mediaType === 'video' ? (
        <Text style={styles.videoPlaceholder}>Video: {item.fileName || item.uri.split('/').pop()}</Text>
      ) : (
        <Image source={{ uri: item.uri }} style={styles.mediaPreview} />
      )}
      <TouchableOpacity style={styles.removeButton} onPress={() => removeMedia(index)}>
        <Text style={styles.removeButtonText}>X</Text>
      </TouchableOpacity>
    </View>
  );

  const handleSubmit = () => {
    if (!name || !description || !price || !category || media.length === 0) {
      Alert.alert('Error', 'Please fill all fields, select a category, and add at least one media file');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Error', 'Price must be a positive number');
      return;
    }

    const productData = {
      name,
      description,
      price: priceNum,
      category,
      media,
      createdBy: userId,
    };

    setIsLoading(true);
    onSubmit(productData)?.then(() => {
      setIsLoading(false);
      resetForm();
      onClose();
    }).catch((err) => {
      Trace('Submit Error', { error: err.message });
      setIsLoading(false);
      Alert.alert('Error', 'Failed to submit product');
    });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.centeredView} onPress={onClose} activeOpacity={1}>
        <Animated.View style={[animatedStyle, { width: '100%', alignItems: 'center' }]}>
          <LinearGradient
            colors={['#2A2A5A', '#3A3A7A']}
            style={styles.modalView}
          >
            <Text style={styles.modalTitle}>
              {product ? 'Edit Product' : 'Add New Product'}
            </Text>

            <TouchableOpacity onPress={pickMedia} style={styles.mediaPicker}>
              <Text style={styles.mediaPlaceholder}>
                Tap to select images or videos (up to 5)
              </Text>
            </TouchableOpacity>

            {media.length > 0 && (
              <FlatList
                data={media}
                renderItem={renderMediaItem}
                keyExtractor={(item, index) => index.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.mediaList}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Product Name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#B0B0D0"
            />

            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              placeholderTextColor="#B0B0D0"
            />

            <TextInput
              style={styles.input}
              placeholder="Price"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholderTextColor="#B0B0D0"
            />

            <TouchableOpacity
              style={[styles.input, styles.categoryInput]}
              onPress={() => setDropdownVisible(true)}
            >
              <Text style={styles.categoryText}>{category || 'Select Category'}</Text>
            </TouchableOpacity>

            <Modal
              animationType="fade"
              transparent={true}
              visible={dropdownVisible}
              onRequestClose={() => setDropdownVisible(false)}
            >
              <TouchableOpacity
                style={styles.dropdownOverlay}
                onPress={() => setDropdownVisible(false)}
                activeOpacity={1}
              >
                <LinearGradient
                  colors={['#2A2A5A', '#3A3A7A']}
                  style={styles.dropdownContainer}
                >
                  <FlatList
                    data={categories}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => {
                          setCategory(item);
                          setDropdownVisible(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </Modal>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Processing...' : product ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '90%',
    borderRadius: scaleSize(15),
    padding: scaleSize(20),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: scaleFont(20),
    fontWeight: 'bold',
    marginBottom: scaleSize(20),
    color: '#FFFFFF',
  },
  input: {
    width: '100%',
    height: scaleSize(50),
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderRadius: scaleSize(10),
    paddingHorizontal: scaleSize(15),
    marginBottom: scaleSize(15),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#FFFFFF',
    fontSize: scaleFont(16),
  },
  multilineInput: {
    height: scaleSize(100),
    textAlignVertical: 'top',
    paddingVertical: scaleSize(10),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: scaleSize(10),
  },
  button: {
    borderRadius: scaleSize(10),
    paddingVertical: scaleSize(12),
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#7B61FF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: scaleFont(16),
  },
  mediaPicker: {
    width: '100%',
    height: scaleSize(50),
    backgroundColor: 'rgba(123, 97, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSize(15),
    borderRadius: scaleSize(10),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mediaPlaceholder: {
    color: '#B0B0D0',
    fontSize: scaleFont(14),
  },
  mediaList: {
    width: '100%',
    maxHeight: scaleSize(100),
    marginBottom: scaleSize(15),
  },
  mediaItem: {
    marginRight: scaleSize(10),
    position: 'relative',
  },
  mediaPreview: {
    width: scaleSize(80),
    height: scaleSize(80),
    borderRadius: scaleSize(5),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  videoPlaceholder: {
    width: scaleSize(80),
    height: scaleSize(80),
    backgroundColor: 'rgba(123, 97, 255, 0.1)',
    textAlign: 'center',
    lineHeight: scaleSize(80),
    color: '#B0B0D0',
    borderRadius: scaleSize(5),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    fontSize: scaleFont(12),
    paddingHorizontal: scaleSize(5),
  },
  removeButton: {
    position: 'absolute',
    top: -scaleSize(5),
    right: -scaleSize(5),
    backgroundColor: '#EF4444',
    borderRadius: scaleSize(10),
    width: scaleSize(20),
    height: scaleSize(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: scaleFont(12),
  },
  categoryInput: {
    justifyContent: 'center',
    height: scaleSize(50),
  },
  categoryText: {
    color: '#B0B0D0',
    fontSize: scaleFont(16),
  },
  dropdownOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dropdownContainer: {
    width: '80%',
    borderRadius: scaleSize(10),
    maxHeight: scaleSize(200),
    paddingVertical: scaleSize(5),
  },
  dropdownItem: {
    paddingVertical: scaleSize(12),
    paddingHorizontal: scaleSize(15),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownItemText: {
    fontSize: scaleFont(16),
    color: '#FFFFFF',
  },
});

export default ProductModal;