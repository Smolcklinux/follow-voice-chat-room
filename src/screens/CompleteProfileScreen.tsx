import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../services/firebase';
import { completeUserProfile, getUserProfile } from '../services/firestore/index';
import { uploadToCloudinary } from '../services/cloudinary';
import { requestGalleryPermission } from '../services/permissions';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors } from '../utils/colors';

export default function CompleteProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [nick, setNick] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');
  const [age, setAge] = useState('');
  const [language, setLanguage] = useState('Português');

  const countries = ['Brasil', 'Portugal', 'Angola', 'Moçambique', 'Outro'];
  const languages = ['Português', 'Inglês', 'Espanhol', 'Francês'];

  const handleUploadAvatar = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;
    
    setUploading(true);
    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, async (response) => {
      if (!response.didCancel && !response.errorCode && response.assets?.[0]) {
        const result = await uploadToCloudinary(response.assets[0].uri);
        if (result.success) setAvatarUrl(result.url);
      }
      setUploading(false);
    });
  };

  const handleCompleteProfile = async () => {
    if (!nick.trim() || !gender || !country || !age) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      Alert.alert('Erro', 'Idade inválida');
      return;
    }

    setLoading(true);
    const result = await completeUserProfile(auth.currentUser?.uid || '', {
      nick, avatarUrl, gender, country, age: ageNum, language, profileCompleted: true
    });
    
    if (result.success) {
      navigation.replace('Main');
    } else {
      Alert.alert('Erro', result.error);
    }
    setLoading(false);
  };

  return (
    <LinearGradient colors={[colors.background, colors.card]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Icon name="account-edit" size={50} color={colors.primary} />
          <Text style={styles.title}>Complete seu perfil</Text>
        </View>

        <TouchableOpacity style={styles.avatarContainer} onPress={handleUploadAvatar} disabled={uploading}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="camera-plus" size={36} color={colors.textSecondary} />
              <Text style={styles.avatarText}>Adicionar foto</Text>
            </View>
          )}
          <View style={styles.avatarBadge}>
            <Icon name="camera" size={16} color="#fff" />
          </View>
          {uploading && <ActivityIndicator size="large" color={colors.primary} style={styles.uploadingOverlay} />}
        </TouchableOpacity>

        <View style={styles.inputCard}>
          <TextInput style={styles.input} placeholder="Seu nome" placeholderTextColor={colors.textSecondary} value={nick} onChangeText={setNick} maxLength={30} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gênero</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity style={[styles.genderButton, gender === 'Masculino' && styles.genderActive]} onPress={() => setGender('Masculino')}>
              <Icon name="gender-male" size={28} color={gender === 'Masculino' ? '#fff' : colors.primary} />
              <Text style={[styles.genderText, gender === 'Masculino' && styles.genderTextActive]}>Homem</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.genderButton, gender === 'Feminino' && styles.genderActive]} onPress={() => setGender('Feminino')}>
              <Icon name="gender-female" size={28} color={gender === 'Feminino' ? '#fff' : colors.primary} />
              <Text style={[styles.genderText, gender === 'Feminino' && styles.genderTextActive]}>Mulher</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>País</Text>
          <View style={styles.chipsContainer}>
            {countries.map(c => (
              <TouchableOpacity key={c} style={[styles.chip, country === c && styles.chipActive]} onPress={() => setCountry(c)}>
                <Text style={[styles.chipText, country === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputCard}>
          <TextInput style={styles.input} placeholder="Idade" placeholderTextColor={colors.textSecondary} value={age} onChangeText={setAge} keyboardType="numeric" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Idioma</Text>
          <View style={styles.chipsContainer}>
            {languages.map(l => (
              <TouchableOpacity key={l} style={[styles.chip, language === l && styles.chipActive]} onPress={() => setLanguage(l)}>
                <Text style={[styles.chipText, language === l && styles.chipTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={[styles.button, (loading || uploading) && styles.buttonDisabled]} onPress={handleCompleteProfile} disabled={loading || uploading}>
          <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.buttonGradient}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Começar</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 24, paddingVertical: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { color: colors.text, fontSize: 24, fontWeight: 'bold', marginTop: 16 },
  avatarContainer: { alignItems: 'center', marginBottom: 32, position: 'relative' },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed' },
  avatarText: { color: colors.textSecondary, fontSize: 11, marginTop: 8 },
  avatarBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: colors.primary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.background },
  uploadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 55, justifyContent: 'center', alignItems: 'center' },
  inputCard: { backgroundColor: colors.card, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  input: { padding: 16, color: colors.text, fontSize: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 12 },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderButton: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border },
  genderActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  genderText: { color: colors.textSecondary, fontSize: 14 },
  genderTextActive: { color: '#fff' },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { backgroundColor: colors.card, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 30, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: 14 },
  chipTextActive: { color: '#fff' },
  button: { borderRadius: 30, overflow: 'hidden', marginTop: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonGradient: { paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
