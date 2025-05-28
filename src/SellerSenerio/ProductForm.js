import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addProduct, updateProduct } from '../redux/slices/sellerSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { globalStyles, colors } from '../constants/GlobalConstants';
import ImagePicker from 'react-native-image-crop-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import RNPickerSelect from 'react-native-picker-select';
import { showMessage } from 'react-native-flash-message';

const ProductForm = ({ route, navigation }) => {
  const { product } = route.params || {};
  const isEdit = !!product;
  
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.seller);
  
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    originalPrice: product?.originalPrice?.toString() || '',
    discount: product?.discount?.toString() || '0',
    category: product?.category || 'electronics',
    stock: product?.stock?.toString() || '0',
    brand: product?.brand || '',
    offer: product?.offer || '',
    highlights: product?.highlights?.join('\n') || '',
    specifications: product?.specifications?.map(s => `${s.name}:${s.value}`).join('\n') || '',
    tags: product?.tags?.join(',') || '',
    colors: product?.colors?.join(',') || '',
    sizes: product?.sizes?.join(',') || '',
  });
  
  const [media, setMedia] = useState(product?.media || []);
  const [errors, setErrors] = useState({});

  const categories = [
    { label: 'Electronics', value: 'electronics' },
    { label: 'Clothing', value: 'clothing' },
    { label: 'Home & Kitchen', value: 'home' },
    { label: 'Beauty', value: 'beauty' },
    { label: 'Sports', value: 'sports' },
    { label: 'Books', value: 'books' },
    { label: 'Toys', value: 'toys' },
  ];

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price) newErrors.price = 'Price is required';
    if (isNaN(formData.price)) newErrors.price = 'Price must be a number';
    if (!formData.category) newErrors.category = 'Category is required';
    if (media.length === 0) newErrors.media = 'At least one image is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddMedia = () => {
    Alert.alert(
      'Add Media',
      'Choose media type',
      [
        {
          text: 'Take Photo',
          onPress: () => takePhoto(),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => pickImage(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const takePhoto = () => {
    ImagePicker.openCamera({
      width: 800,
      height: 800,
      cropping: true,
      mediaType: 'photo',
    }).then(image => {
      setMedia([...media, { uri: image.path, type: 'image' }]);
    }).catch(error => {
      console.log('Camera Error:', error);
    });
  };

  const pickImage = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8, selectionLimit: 10 },
      response => {
        if (!response.didCancel && !response.error) {
          const newMedia = response.assets.map(asset => ({
            uri: asset.uri,
            type: 'image',
          }));
          setMedia([...media, ...newMedia]);
        }
      }
    );
  };

  const removeMedia = (index) => {
    const newMedia = [...media];
    newMedia.splice(index, 1);
    setMedia(newMedia);
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      originalPrice: parseFloat(formData.originalPrice || formData.price),
      discount: parseFloat(formData.discount),
      stock: parseInt(formData.stock),
      highlights: formData.highlights.split('\n').filter(h => h.trim()),
      specifications: formData.specifications.split('\n')
        .filter(s => s.trim())
        .map(s => {
          const [name, ...valueParts] = s.split(':');
          return {
            name: name.trim(),
            value: valueParts.join(':').trim(),
          };
        }),
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      colors: formData.colors.split(',').map(c => c.trim()).filter(c => c),
      sizes: formData.sizes.split(',').map(s => s.trim()).filter(s => s),
      media,
    };

    if (isEdit) {
      dispatch(updateProduct({ id: product._id, productData }))
        .unwrap()
        .then(() => {
          showMessage({
            message: "Product updated successfully",
            type: "success",
          });
          navigation.goBack();
        })
        .catch(error => {
          showMessage({
            message: error || "Failed to update product",
            type: "danger",
          });
        });
    } else {
      dispatch(addProduct(productData))
        .unwrap()
        .then(() => {
          showMessage({
            message: "Product added successfully",
            type: "success",
          });
          navigation.goBack();
        })
        .catch(error => {
          showMessage({
            message: error || "Failed to add product",
            type: "danger",
          });
        });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={globalStyles.header}>
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </Text>

        {/* Media Upload */}
        <Text style={styles.sectionTitle}>Product Images</Text>
        {errors.media && <Text style={styles.errorText}>{errors.media}</Text>}
        <View style={styles.mediaContainer}>
          {media.map((item, index) => (
            <View key={index} style={styles.mediaItem}>
              <Image source={{ uri: item.uri }} style={styles.mediaImage} />
              <TouchableOpacity 
                style={styles.removeMediaButton}
                onPress={() => removeMedia(index)}
              >
                <Icon name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          {media.length < 10 && (
            <TouchableOpacity 
              style={styles.addMediaButton}
              onPress={handleAddMedia}
            >
              <Icon name="plus" size={30} color={colors.primary} />
              <Text style={styles.addMediaText}>Add Image</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Basic Information */}
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={text => setFormData({ ...formData, name: text })}
            placeholder="Enter product name"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea, errors.description && styles.inputError]}
            value={formData.description}
            onChangeText={text => setFormData({ ...formData, description: text })}
            placeholder="Enter product description"
            multiline
            numberOfLines={4}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Category *</Text>
          <View style={[styles.pickerContainer, errors.category && styles.inputError]}>
            <RNPickerSelect
              onValueChange={value => setFormData({ ...formData, category: value })}
              items={categories}
              value={formData.category}
              style={pickerSelectStyles}
              placeholder={{}}
            />
          </View>
          {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Brand</Text>
          <TextInput
            style={styles.input}
            value={formData.brand}
            onChangeText={text => setFormData({ ...formData, brand: text })}
            placeholder="Enter brand name"
          />
        </View>

        {/* Pricing */}
        <Text style={styles.sectionTitle}>Pricing</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Price (₹) *</Text>
          <TextInput
            style={[styles.input, errors.price && styles.inputError]}
            value={formData.price}
            onChangeText={text => setFormData({ ...formData, price: text })}
            placeholder="Enter price"
            keyboardType="numeric"
          />
          {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Original Price (₹)</Text>
          <TextInput
            style={styles.input}
            value={formData.originalPrice}
            onChangeText={text => setFormData({ ...formData, originalPrice: text })}
            placeholder="Enter original price"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Discount (%)</Text>
          <TextInput
            style={styles.input}
            value={formData.discount}
            onChangeText={text => setFormData({ ...formData, discount: text })}
            placeholder="Enter discount percentage"
            keyboardType="numeric"
          />
        </View>

        {/* Inventory */}
        <Text style={styles.sectionTitle}>Inventory</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Stock Quantity</Text>
          <TextInput
            style={styles.input}
            value={formData.stock}
            onChangeText={text => setFormData({ ...formData, stock: text })}
            placeholder="Enter stock quantity"
            keyboardType="numeric"
          />
        </View>

        {/* Attributes */}
        <Text style={styles.sectionTitle}>Attributes</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Sizes (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={formData.sizes}
            onChangeText={text => setFormData({ ...formData, sizes: text })}
            placeholder="S, M, L, XL"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Colors (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={formData.colors}
            onChangeText={text => setFormData({ ...formData, colors: text })}
            placeholder="Red, Blue, Green"
          />
        </View>

        {/* Highlights & Specifications */}
        <Text style={styles.sectionTitle}>Highlights</Text>
        <View style={styles.formGroup}>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.highlights}
            onChangeText={text => setFormData({ ...formData, highlights: text })}
            placeholder="Enter product highlights (one per line)"
            multiline
            numberOfLines={4}
          />
        </View>

        <Text style={styles.sectionTitle}>Specifications</Text>
        <View style={styles.formGroup}>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.specifications}
            onChangeText={text => setFormData({ ...formData, specifications: text })}
            placeholder="Enter specifications (format: name:value)"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Tags */}
        <Text style={styles.sectionTitle}>Tags</Text>
        <View style={styles.formGroup}>
          <TextInput
            style={styles.input}
            value={formData.tags}
            onChangeText={text => setFormData({ ...formData, tags: text })}
            placeholder="Enter tags (comma separated)"
          />
        </View>

        {/* Offer */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Special Offer</Text>
          <TextInput
            style={styles.input}
            value={formData.offer}
            onChangeText={text => setFormData({ ...formData, offer: text })}
            placeholder="Enter special offer text"
          />
        </View>

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEdit ? 'Update Product' : 'Add Product'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: '#ccc',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightBackground,
  },
  scrollContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: colors.textPrimary,
  },
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  mediaItem: {
    width: 80,
    height: 80,
    marginRight: 10,
    marginBottom: 10,
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeMediaButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.danger,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMediaButton: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMediaText: {
    marginTop: 5,
    fontSize: 12,
    color: colors.primary,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    fontSize: 14,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  inputError: {
    borderColor: colors.danger,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductForm;