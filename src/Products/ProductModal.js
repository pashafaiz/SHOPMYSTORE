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
  Platform,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Colors from '../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProductModal = ({ visible, onClose, onSubmit, product }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [category, setCategory] = useState(''); // Selected category
  const [dropdownVisible, setDropdownVisible] = useState(false); // Dropdown visibility

  // Categories list
  const categories = [
    'Assessories',
    'Grocery',
    'Toys',
    'Clothes',
    'Shoes',
    'Trending'
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
      setName(product.name);
      setDescription(product.description);
      setPrice(product.price.toString());
      setMedia(product.media.map((item) => ({
        uri: item.url,
        mediaType: item.mediaType,
      })));
      setCategory(product.category || ''); // Set existing category
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
        console.log('User cancelled media picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to pick media');
      } else if (response.assets && response.assets.length > 0) {
        const selectedMedia = response.assets.map((asset) => ({
          uri: asset.uri,
          mediaType: asset.type.startsWith('video') ? 'video' : 'image',
          type: asset.type,
          fileName: asset.fileName || `media_${Date.now()}.${asset.type.startsWith('video') ? 'mp4' : 'jpg'}`,
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
        <Text style={styles.videoPlaceholder}>Video: {item.fileName || item.uri}</Text>
      ) : (
        <Image source={{ uri: item.uri }} style={styles.mediaPreview} />
      )}
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeMedia(index)}
      >
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
      category, // Use lowercase for consistency with apiClient.js
      media,
      createdBy: userId,
    };

    setIsLoading(true);
    onSubmit(productData);
    setIsLoading(false);
    resetForm();
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
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
              style={styles.mediaList}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Product Name"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <TextInput
            style={styles.input}
            placeholder="Price"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />

          {/* Custom Category Dropdown Trigger */}
          <TouchableOpacity
            style={[styles.input, styles.categoryInput, { marginBottom: 15 }]}
            onPress={() => setDropdownVisible(true)}
          >
            <Text style={styles.categoryText}>
              {category || 'Select Category'}
            </Text>
          </TouchableOpacity>

          {/* Dropdown Modal */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={dropdownVisible}
            onRequestClose={() => setDropdownVisible(false)}
          >
            <TouchableOpacity
              style={styles.dropdownOverlay}
              onPress={() => setDropdownVisible(false)}
            >
              <View style={styles.dropdownContainer}>
                <FlatList
                  data={categories}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setCategory(item.toLowerCase()); // Convert to lowercase for consistency
                        setDropdownVisible(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item}
                />
              </View>
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
        </View>
      </View>
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
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: Colors.pink,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: Colors.lightGray,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 5,
    padding: 10,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.lightGray,
  },
  submitButton: {
    backgroundColor: Colors.pink,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  mediaPicker: {
    width: '100%',
    height: 50,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderRadius: 5,
  },
  mediaPlaceholder: {
    color: Colors.darkGray,
  },
  mediaList: {
    maxHeight: 100,
    marginBottom: 15,
  },
  mediaItem: {
    marginRight: 10,
    position: 'relative',
  },
  mediaPreview: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  videoPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: Colors.lightGray,
    textAlign: 'center',
    lineHeight: 80,
    color: Colors.darkGray,
    borderRadius: 5,
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.pink,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  categoryInput: {
    justifyContent: 'center',
    height: 40,
  },
  categoryText: {
    color: Colors.darkGray,
    fontSize: 16,
  },
  dropdownOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dropdownContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 5,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  dropdownItemText: {
    fontSize: 16,
    color: Colors.darkGray,
  },
});

export default ProductModal;