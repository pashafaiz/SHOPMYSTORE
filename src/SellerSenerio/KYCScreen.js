import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Platform } from 'react-native';
import { COLORS, FONTS, DIMENSIONS } from '../constants/GlobalConstants';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ImagePicker from 'react-native-image-picker';
import FilePickerManager from 'react-native-file-picker';

const KYCScreen = ({ navigation }) => {
  const [documents, setDocuments] = useState({
    idProof: null,
    addressProof: null,
    businessProof: null,
    bankProof: null,
  });

  const pickDocument = async (type) => {
    try {
      FilePickerManager.showFilePicker(null, (response) => {
        if (response.didCancel) {
          console.log('User cancelled file picker');
        } else if (response.error) {
          Alert.alert('Error', 'Failed to pick document');
        } else {
          setDocuments(prev => ({
            ...prev,
            [type]: {
              name: response.fileName,
              uri: Platform.OS === 'android' ? response.uri : response.uri.replace('file://', ''),
              type: response.type,
            },
          }));
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const takePhoto = async (type) => {
    const options = {
      title: 'Select Image',
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
      quality: 0.5,
    };

    ImagePicker.launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        Alert.alert('Error', 'Failed to take photo');
      } else {
        setDocuments(prev => ({
          ...prev,
          [type]: {
            name: 'photo.jpg',
            uri: response.uri,
          },
        }));
      }
    });
  };

  const handleSubmit = () => {
    if (!documents.idProof || !documents.addressProof || !documents.businessProof || !documents.bankProof) {
      Alert.alert('Error', 'Please upload all required documents');
      return;
    }

    // Here you would typically submit the documents to your backend
    Alert.alert('Success', 'Your KYC documents have been submitted for verification');
    navigation.goBack();
  };

  const renderDocumentUpload = (type, label, description) => {
    const document = documents[type];

    return (
      <View style={styles.documentContainer}>
        <Text style={styles.documentLabel}>{label}</Text>
        <Text style={styles.documentDescription}>{description}</Text>
        
        {document ? (
          <View style={styles.documentPreview}>
            <Icon name="file-document" size={24} color={COLORS.primary} />
            <Text style={styles.documentName} numberOfLines={1}>{document.name}</Text>
            <TouchableOpacity onPress={() => pickDocument(type)}>
              <Text style={styles.documentAction}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.documentActions}>
            <TouchableOpacity 
              style={styles.documentButton}
              onPress={() => pickDocument(type)}
            >
              <Icon name="upload" size={20} color={COLORS.primary} />
              <Text style={styles.documentButtonText}>Upload File</Text>
            </TouchableOpacity>
            <Text style={styles.documentOr}>OR</Text>
            <TouchableOpacity 
              style={styles.documentButton}
              onPress={() => takePhoto(type)}
            >
              <Icon name="camera" size={20} color={COLORS.primary} />
              <Text style={styles.documentButtonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>KYC Verification</Text>
      <Text style={styles.subtitle}>
        Complete your KYC to start selling on our platform. This information is required for payment processing.
      </Text>

      {renderDocumentUpload(
        'idProof',
        'Identity Proof',
        'Upload any government issued ID (Aadhaar, PAN, Passport, Driving License)'
      )}

      {renderDocumentUpload(
        'addressProof',
        'Address Proof',
        'Upload any document with your address (Aadhaar, Utility Bill, Bank Statement)'
      )}

      {renderDocumentUpload(
        'businessProof',
        'Business Proof',
        'Upload business registration or GST certificate (if applicable)'
      )}

      {renderDocumentUpload(
        'bankProof',
        'Bank Proof',
        'Upload cancelled cheque or bank statement with account details'
      )}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit for Verification</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Note: Your documents will be verified within 2-3 business days. You'll receive a notification once verified.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: DIMENSIONS.padding,
    paddingBottom: DIMENSIONS.padding * 2,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.margin,
  },
  documentContainer: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.padding,
    marginBottom: DIMENSIONS.margin,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  documentLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  documentDescription: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.margin,
  },
  documentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.padding,
  },
  documentName: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginHorizontal: DIMENSIONS.margin,
  },
  documentAction: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.primary,
  },
  documentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.padding,
    marginHorizontal: DIMENSIONS.margin / 2,
  },
  documentButtonText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  documentOr: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.padding,
    alignItems: 'center',
    marginTop: DIMENSIONS.margin,
  },
  submitButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.white,
  },
  note: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: DIMENSIONS.margin,
    textAlign: 'center',
  },
});

export default KYCScreen;