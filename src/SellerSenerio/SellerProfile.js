import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSellerProfile, updateSellerProfile } from '../redux/slices/sellerSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'react-native-image-picker';
import { TextInput } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../Components/Header';
import { COLORS, SIZES, FONTS, scale, scaleFont, commonStyles } from '../utils/theme';

const SellerProfile = ({ navigation }) => {
  const dispatch = useDispatch();
  const { profile, loading, error } = useSelector((state) => state.seller);
  const [editMode, setEditMode] = useState(false);
  const [image, setImage] = useState(null);
  const { control, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    dispatch(fetchSellerProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setValue('businessName', profile.businessName);
      setValue('businessType', profile.businessType);
      setValue('gstNumber', profile.gstNumber);
      setValue('panNumber', profile.panNumber);
      setValue('businessDescription', profile.businessDescription);
      setImage(profile.businessLogo);
    }
  }, [profile, setValue]);

  const pickImage = async () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (!response.didCancel && !response.error) {
        setImage(response.uri);
      }
    });
  };

  const onSubmit = async (data) => {
    if (!data.businessName || !data.businessType || !data.panNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('businessName', data.businessName);
    formData.append('businessType', data.businessType);
    formData.append('gstNumber', data.gstNumber || '');
    formData.append('panNumber', data.panNumber);
    formData.append('businessDescription', data.businessDescription || '');
    
    if (image && image !== profile?.businessLogo) {
      formData.append('businessLogo', {
        uri: image,
        type: 'image/jpeg',
        name: 'business-logo.jpg',
      });
    }

    try {
      await dispatch(updateSellerProfile(formData)).unwrap();
      Alert.alert('Success', 'Profile updated successfully');
      setEditMode(false);
    } catch (error) {
      // Handle error message properly (fix for object rendering error)
      const errorMsg = error?.message || error?.msg || 'Failed to update profile';
      Alert.alert('Error', typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
  };

  if (loading && !profile) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  if (error && !profile) {
    // Handle error message properly (fix for object rendering error)
    const errorMsg = error?.message || error?.msg || 'An error occurred';
    
    return (
      <View style={commonStyles.errorContainer}>
        <Text style={commonStyles.errorText}>
          {typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)}
        </Text>
        <TouchableOpacity 
          onPress={() => dispatch(fetchSellerProfile())}
          style={commonStyles.retryButton}
        >
          <Text style={commonStyles.retryText}>Retry</Text>
          <Icon name="refresh" size={18} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient colors={COLORS.GRADIENT} style={commonStyles.container}>
      <Header 
        title="Seller Profile" 
        rightIcon={editMode ? 'close' : 'edit'}
        onRightPress={() => setEditMode(!editMode)}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          {/* Profile Image Section */}
          <View style={styles.profileHeader}>
            <View style={styles.imageContainer}>
              <View style={styles.imageWrapper}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.image} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Icon name="store" size={scale(40)} color={COLORS.WHITE} />
                  </View>
                )}
              </View>
              
              {editMode && (
                <TouchableOpacity style={styles.imageEditButton} onPress={pickImage}>
                  <Icon name="camera-alt" size={scale(16)} color={COLORS.WHITE} />
                </TouchableOpacity>
              )}
              
              {!editMode && profile?.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Icon name="verified" size={scale(16)} color={COLORS.WHITE} />
                </View>
              )}
            </View>
            
            <Text style={styles.businessName}>
              {profile?.businessName}
            </Text>
            <Text style={styles.businessType}>
              {profile?.businessType}
            </Text>
          </View>

          {editMode ? (
            <View style={styles.formContainer}>
              <Controller
                control={control}
                rules={{ required: 'Business name is required' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Business Name *"
                    mode="outlined"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={!!errors.businessName}
                    style={styles.input}
                    outlineColor={COLORS.BORDER}
                    activeOutlineColor={COLORS.PRIMARY}
                    textColor={COLORS.TEXT}
                  />
                )}
                name="businessName"
              />
              {errors.businessName && (
                <Text style={styles.errorMessage}>{errors.businessName.message}</Text>
              )}

              <Controller
                control={control}
                rules={{ required: 'Business type is required' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Business Type *"
                    mode="outlined"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={!!errors.businessType}
                    style={styles.input}
                    outlineColor={COLORS.BORDER}
                    activeOutlineColor={COLORS.PRIMARY}
                    textColor={COLORS.TEXT}
                  />
                )}
                name="businessType"
              />
              {errors.businessType && (
                <Text style={styles.errorMessage}>{errors.businessType.message}</Text>
              )}

              <Controller
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="GST Number"
                    mode="outlined"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    style={styles.input}
                    outlineColor={COLORS.BORDER}
                    activeOutlineColor={COLORS.PRIMARY}
                    textColor={COLORS.TEXT}
                  />
                )}
                name="gstNumber"
              />

              <Controller
                control={control}
                rules={{ required: 'PAN Number is required' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="PAN Number *"
                    mode="outlined"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={!!errors.panNumber}
                    style={styles.input}
                    outlineColor={COLORS.BORDER}
                    activeOutlineColor={COLORS.PRIMARY}
                    textColor={COLORS.TEXT}
                  />
                )}
                name="panNumber"
              />
              {errors.panNumber && (
                <Text style={styles.errorMessage}>{errors.panNumber.message}</Text>
              )}

              <Controller
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Business Description"
                    mode="outlined"
                    multiline
                    numberOfLines={4}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    style={[styles.input, styles.textArea]}
                    outlineColor={COLORS.BORDER}
                    activeOutlineColor={COLORS.PRIMARY}
                    textColor={COLORS.TEXT}
                  />
                )}
                name="businessDescription"
              />

              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]} 
                  onPress={() => setEditMode(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.saveButton]} 
                  onPress={handleSubmit(onSubmit)}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={COLORS.WHITE} />
                  ) : (
                    <Text style={styles.buttonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.detailsContainer}>
              {/* Business Info Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name="business" size={scale(20)} color={COLORS.PRIMARY} />
                  <Text style={styles.sectionTitle}>Business Information</Text>
                </View>
                
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Icon name="badge" size={scale(16)} color={COLORS.SUBTEXT} />
                    <Text style={styles.infoLabel}>PAN Number</Text>
                    <Text style={styles.infoValue}>{profile?.panNumber}</Text>
                  </View>
                  
                  {profile?.gstNumber && (
                    <View style={styles.infoRow}>
                      <Icon name="receipt" size={scale(16)} color={COLORS.SUBTEXT} />
                      <Text style={styles.infoLabel}>GST Number</Text>
                      <Text style={styles.infoValue}>{profile.gstNumber}</Text>
                    </View>
                  )}
                  
                  <View style={styles.infoRow}>
                    <Icon name="description" size={scale(16)} color={COLORS.SUBTEXT} />
                    <Text style={styles.infoLabel}>Description</Text>
                    <Text style={styles.infoValue}>
                      {profile?.businessDescription || 'Not provided'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Business Address Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name="location-on" size={scale(20)} color={COLORS.PRIMARY} />
                  <Text style={styles.sectionTitle}>Business Address</Text>
                </View>
                
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Icon name="home" size={scale(16)} color={COLORS.SUBTEXT} />
                    <Text style={styles.infoValue}>
                      {profile?.businessAddress.street}
                    </Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Icon name="location-city" size={scale(16)} color={COLORS.SUBTEXT} />
                    <Text style={styles.infoValue}>
                      {profile?.businessAddress.city}, {profile?.businessAddress.state}
                    </Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Icon name="map" size={scale(16)} color={COLORS.SUBTEXT} />
                    <Text style={styles.infoValue}>
                      {profile?.businessAddress.pincode}, {profile?.businessAddress.country}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Bank Details Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name="account-balance" size={scale(20)} color={COLORS.PRIMARY} />
                  <Text style={styles.sectionTitle}>Bank Details</Text>
                </View>
                
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Icon name="person" size={scale(16)} color={COLORS.SUBTEXT} />
                    <Text style={styles.infoLabel}>Account Holder</Text>
                    <Text style={styles.infoValue}>{profile?.bankDetails.accountHolderName}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Icon name="credit-card" size={scale(16)} color={COLORS.SUBTEXT} />
                    <Text style={styles.infoLabel}>Account Number</Text>
                    <Text style={styles.infoValue}>{profile?.bankDetails.accountNumber}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Icon name="account-balance" size={scale(16)} color={COLORS.SUBTEXT} />
                    <Text style={styles.infoLabel}>Bank Name</Text>
                    <Text style={styles.infoValue}>{profile?.bankDetails.bankName}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Icon name="code" size={scale(16)} color={COLORS.SUBTEXT} />
                    <Text style={styles.infoLabel}>IFSC Code</Text>
                    <Text style={styles.infoValue}>{profile?.bankDetails.ifscCode}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: scale(30),
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: scale(20),
    paddingHorizontal: scale(20),
  },
  imageContainer: {
    position: 'relative',
    marginBottom: scale(10),
  },
  imageWrapper: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    backgroundColor: COLORS.LIGHT_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.PRIMARY,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.LIGHT_PRIMARY,
  },
  imageEditButton: {
    position: 'absolute',
    bottom: scale(5),
    right: scale(5),
    backgroundColor: COLORS.PRIMARY,
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  verifiedBadge: {
    position: 'absolute',
    top: scale(5),
    right: scale(5),
    backgroundColor: COLORS.SUCCESS,
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  businessName: {
    ...FONTS.h3,
    color: COLORS.TEXT,
    fontWeight: '600',
    marginTop: scale(5),
    textAlign: 'center',
  },
  businessType: {
    ...FONTS.body2,
    color: COLORS.SUBTEXT,
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: scale(20),
    marginTop: scale(10),
  },
  input: {
    marginBottom: scale(10),
    backgroundColor: COLORS.WHITE,
    borderRadius: scale(8),
  },
  textArea: {
    height: scale(100),
  },
  errorMessage: {
    ...FONTS.body4,
    color: COLORS.SECONDARY,
    marginBottom: scale(10),
    marginLeft: scale(5),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scale(20),
  },
  button: {
    flex: 1,
    paddingVertical: scale(15),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginRight: scale(10),
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  buttonText: {
    ...FONTS.body2,
    fontWeight: '600',
  },
  detailsContainer: {
    paddingHorizontal: scale(20),
  },
  section: {
    marginBottom: scale(20),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(10),
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.TEXT,
    fontWeight: '600',
    marginLeft: scale(10),
  },
  infoCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: scale(12),
    padding: scale(15),
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(8),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT_BORDER,
  },
  infoLabel: {
    ...FONTS.body3,
    color: COLORS.SUBTEXT,
    marginLeft: scale(10),
    width: scale(120),
  },
  infoValue: {
    ...FONTS.body3,
    color: COLORS.TEXT,
    flex: 1,
    marginLeft: scale(10),
  },
});

export default SellerProfile;