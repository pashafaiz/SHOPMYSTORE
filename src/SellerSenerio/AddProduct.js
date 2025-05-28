import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addSellerProduct } from '../redux/slices/sellerSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import  ImagePicker from 'react-native-image-picker';
import { Picker } from '@react-native-picker/picker';
import { useForm, Controller } from 'react-hook-form';

const AddProduct = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.seller);
  const [images, setImages] = useState([]);
  const { control, handleSubmit, formState: { errors } } = useForm();

  const pickImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      setImages([...images, ...result.selected]);
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const onSubmit = async (data) => {
    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one image');
      return;
    }

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('price', data.price);
    formData.append('category', data.category);
    formData.append('stock', data.stock);
    formData.append('brand', data.brand);

    images.forEach((image, index) => {
      formData.append('media', {
        uri: image.uri,
        type: 'image/jpeg',
        name: `product-image-${index}.jpg`,
      });
    });

    try {
      await dispatch(addSellerProduct(formData)).unwrap();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add product');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Product</Text>

      {/* Product Images */}
      <View style={styles.imageSection}>
        <Text style={styles.sectionTitle}>Product Images</Text>
        <View style={styles.imageContainer}>
          {images.map((image, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri: image.uri }} style={styles.image} />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <Icon name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 5 && (
            <TouchableOpacity 
              style={styles.addImageButton}
              onPress={pickImages}
            >
              <Icon name="add" size={30} color="#6c5ce7" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Product Details Form */}
      <View style={styles.formSection}>
        <Controller
          control={control}
          rules={{ required: 'Product name is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              placeholder="Product Name"
              style={styles.input}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
          name="name"
        />
        {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

        <Controller
          control={control}
          rules={{ required: 'Description is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              placeholder="Description"
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
          name="description"
        />
        {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}

        <View style={styles.rowInputs}>
          <View style={styles.inputWrapper}>
            <Controller
              control={control}
              rules={{ 
                required: 'Price is required',
                pattern: {
                  value: /^\d+(\.\d{1,2})?$/,
                  message: 'Enter a valid price'
                }
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Price"
                  style={styles.input}
                  keyboardType="decimal-pad"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
              name="price"
            />
            {errors.price && <Text style={styles.errorText}>{errors.price.message}</Text>}
          </View>

          <View style={styles.inputWrapper}>
            <Controller
              control={control}
              rules={{ 
                required: 'Stock is required',
                pattern: {
                  value: /^\d+$/,
                  message: 'Enter a valid number'
                }
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Stock"
                  style={styles.input}
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
              name="stock"
            />
            {errors.stock && <Text style={styles.errorText}>{errors.stock.message}</Text>}
          </View>
        </View>

        <Controller
          control={control}
          rules={{ required: 'Category is required' }}
          render={({ field: { onChange, value } }) => (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={value}
                onValueChange={onChange}
                style={styles.picker}
              >
                <Picker.Item label="Select Category" value="" />
                <Picker.Item label="Electronics" value="Electronics" />
                <Picker.Item label="Clothing" value="Clothing" />
                <Picker.Item label="Home & Kitchen" value="Home & Kitchen" />
                <Picker.Item label="Beauty" value="Beauty" />
                <Picker.Item label="Sports" value="Sports" />
              </Picker>
            </View>
          )}
          name="category"
        />
        {errors.category && <Text style={styles.errorText}>{errors.category.message}</Text>}

        <Controller
          control={control}
          rules={{ required: 'Brand is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              placeholder="Brand"
              style={styles.input}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
          name="brand"
        />
        {errors.brand && <Text style={styles.errorText}>{errors.brand.message}</Text>}
      </View>

      {/* Submit Button */}
      <TouchableOpacity 
        style={styles.submitButton}
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Add Product</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  imageSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imageWrapper: {
    width: 80,
    height: 80,
    marginRight: 10,
    marginBottom: 10,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#F44336',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: '#6c5ce7',
    borderRadius: 8,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formSection: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputWrapper: {
    width: '48%',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#6c5ce7',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddProduct;