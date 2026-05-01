import { PermissionsAndroid, Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export const requestMicrophonePermission = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
      title: 'Permissão do Microfone',
      message: 'O app precisa acessar seu microfone para as salas de voz',
      buttonPositive: 'Permitir',
    });
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  
  const result = await request(PERMISSIONS.IOS.MICROPHONE);
  return result === RESULTS.GRANTED;
};

export const requestGalleryPermission = async () => {
  if (Platform.OS === 'android') {
    const apiLevel = Platform.Version as number;
    const permission = apiLevel >= 33 
      ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
    
    const granted = await PermissionsAndroid.request(permission, {
      title: 'Permissão da Galeria',
      message: 'O app precisa acessar suas fotos',
      buttonPositive: 'Permitir',
    });
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  
  const result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
  return result === RESULTS.GRANTED;
};
