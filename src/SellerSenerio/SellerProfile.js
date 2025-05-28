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
      Alert.alert('Error', error.message || 'Failed to update profile');
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
    return (
      <View style={commonStyles.errorContainer}>
        <Text style={commonStyles.errorText}>{error}</Text>
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
      />
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          {!editMode ? (
            <TouchableOpacity onPress={() => setEditMode(true)}>
              <Icon name="edit" size={24} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setEditMode(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Business Logo */}
        <View style={styles.imageContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon name="store" size={50} color={COLORS.SUBTEXT} />
            </View>
          )}
          {editMode && (
            <TouchableOpacity style={styles.imageEditButton} onPress={pickImage}>
              <Icon name="camera-alt" size={20} color="#fff" />
            </TouchableOpacity>
          )}
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
                  error={errors.businessName}
                  style={styles.input}
                  theme={{
                    colors: {
                      primary: COLORS.PRIMARY,
                      placeholder: COLORS.SUBTEXT,
                      text: COLORS.TEXT,
                    }
                  }}
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
                  error={errors.businessType}
                  style={styles.input}
                  theme={{
                    colors: {
                      primary: COLORS.PRIMARY,
                      placeholder: COLORS.SUBTEXT,
                      text: COLORS.TEXT,
                    }
                  }}
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
                  theme={{
                    colors: {
                      primary: COLORS.PRIMARY,
                      placeholder: COLORS.SUBTEXT,
                      text: COLORS.TEXT,
                    }
                  }}
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
                  error={errors.panNumber}
                  style={styles.input}
                  theme={{
                    colors: {
                      primary: COLORS.PRIMARY,
                      placeholder: COLORS.SUBTEXT,
                      text: COLORS.TEXT,
                    }
                  }}
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
                  style={styles.input}
                  theme={{
                    colors: {
                      primary: COLORS.PRIMARY,
                      placeholder: COLORS.SUBTEXT,
                      text: COLORS.TEXT,
                    }
                  }}
                />
              )}
              name="businessDescription"
            />

            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSubmit(onSubmit)}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.profileInfo}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Business Name</Text>
              <Text style={styles.infoValue}>{profile?.businessName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Business Type</Text>
              <Text style={styles.infoValue}>{profile?.businessType}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>GST Number</Text>
              <Text style={styles.infoValue}>{profile?.gstNumber || 'Not provided'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>PAN Number</Text>
              <Text style={styles.infoValue}>{profile?.panNumber}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Business Description</Text>
              <Text style={styles.infoValue}>{profile?.businessDescription || 'Not provided'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Verification Status</Text>
              <View style={[
                styles.verificationBadge,
                { backgroundColor: profile?.isVerified ? COLORS.SUCCESS : COLORS.WARNING }
              ]}>
                <Text style={styles.verificationText}>
                  {profile?.isVerified ? 'Verified' : 'Pending Verification'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Business Address */}
        <Text style={styles.sectionTitle}>Business Address</Text>
        <View style={[commonStyles.card, styles.addressCard]}>
          <Text style={styles.addressText}>
            {profile?.businessAddress.street}
          </Text>
          <Text style={styles.addressText}>
            {profile?.businessAddress.city}, {profile?.businessAddress.state}
          </Text>
          <Text style={styles.addressText}>
            {profile?.businessAddress.pincode}
          </Text>
          <Text style={styles.addressText}>
            {profile?.businessAddress.country}
          </Text>
        </View>

        {/* Bank Details */}
        <Text style={styles.sectionTitle}>Bank Details</Text>
        <View style={[commonStyles.card, styles.bankCard]}>
          <View style={styles.bankItem}>
            <Text style={styles.bankLabel}>Account Holder</Text>
            <Text style={styles.bankValue}>{profile?.bankDetails.accountHolderName}</Text>
          </View>
          <View style={styles.bankItem}>
            <Text style={styles.bankLabel}>Account Number</Text>
            <Text style={styles.bankValue}>{profile?.bankDetails.accountNumber}</Text>
          </View>
          <View style={styles.bankItem}>
            <Text style={styles.bankLabel}>Bank Name</Text>
            <Text style={styles.bankValue}>{profile?.bankDetails.bankName}</Text>
          </View>
          <View style={styles.bankItem}>
            <Text style={styles.bankLabel}>IFSC Code</Text>
            <Text style={styles.bankValue}>{profile?.bankDetails.ifscCode}</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    padding: scale(25),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: scale(20),
  },
  cancelText: {
    color: COLORS.SECONDARY,
    ...FONTS.body3,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: scale(20),
  },
  image: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    borderWidth: 2,
    borderColor: COLORS.BORDER,
  },
  imagePlaceholder: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    backgroundColor: COLORS.LIGHT_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.BORDER,
  },
  imageEditButton: {
    position: 'absolute',
    bottom: 0,
    right: SIZES.width / 2 - scale(70),
    backgroundColor: COLORS.PRIMARY,
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.TEXT,
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.3,
    shadowRadius: scale(4),
    elevation: 5,
  },
  formContainer: {
    marginBottom: scale(20),
  },
  input: {
    marginBottom: scale(10),
    backgroundColor: COLORS.CARD_BACKGROUND,
  },
  errorMessage: {
    color: COLORS.SECONDARY,
    ...FONTS.body4,
    marginBottom: scale(10),
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: scale(15),
    borderRadius: scale(8),
    alignItems: 'center',
    marginTop: scale(10),
  },
  saveButtonText: {
    color: '#fff',
    ...FONTS.body3,
    fontWeight: '600',
  },
  profileInfo: {
    marginBottom: scale(20),
  },
  infoItem: {
    marginBottom: scale(15),
  },
  infoLabel: {
    ...FONTS.body3,
    color: COLORS.SUBTEXT,
    marginBottom: scale(5),
  },
  infoValue: {
    ...FONTS.body3,
    color: COLORS.TEXT,
  },
  verificationBadge: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: scale(4),
    alignSelf: 'flex-start',
  },
  verificationText: {
    color: '#fff',
    ...FONTS.body4,
    fontWeight: '600',
  },
  sectionTitle: {
    ...FONTS.h3,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: scale(10),
  },
  addressCard: {
    marginBottom: scale(20),
  },
  addressText: {
    ...FONTS.body3,
    color: COLORS.TEXT,
    marginBottom: scale(5),
  },
  bankCard: {
    marginBottom: scale(90),
  },
  bankItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(10),
  },
  bankLabel: {
    ...FONTS.body3,
    color: COLORS.SUBTEXT,
  },
  bankValue: {
    ...FONTS.body3,
    color: COLORS.TEXT,
    fontWeight: '500',
  },
});

export default SellerProfile;