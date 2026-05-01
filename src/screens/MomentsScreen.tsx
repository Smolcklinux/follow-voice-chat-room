import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, TextInput, Alert, Modal, ActivityIndicator, RefreshControl
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../services/firebase';
import { getMoments, createMoment, likeMoment, getUserProfile } from '../services/firestore/index';
import { uploadToCloudinary } from '../services/cloudinary';
import { requestGalleryPermission } from '../services/permissions';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors } from '../utils/colors';

export default function MomentsScreen({ navigation }: any) {
  const [moments, setMoments] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const profile = await getUserProfile(auth.currentUser?.uid || '');
    if (profile.success) setUserProfile(profile.data);
    
    const momentsResult = await getMoments();
    if (momentsResult.success) setMoments(momentsResult.data);
    
    setLoading(false);
  };

  const handleAddImage = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;
    
    setUploadingImage(true);
    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, async (response) => {
      if (!response.didCancel && !response.errorCode && response.assets?.[0]) {
        const uploadResult = await uploadToCloudinary(response.assets[0].uri);
        if (uploadResult.success) {
          setPostImage(uploadResult.url);
        } else {
          Alert.alert('Erro', 'Falha ao carregar imagem');
        }
      }
      setUploadingImage(false);
    });
  };

  const handleCreatePost = async () => {
    if (!postText.trim() && !postImage) {
      Alert.alert('Erro', 'Digite algo ou adicione uma imagem');
      return;
    }
    
    setSubmitting(true);
    const result = await createMoment(
      auth.currentUser?.uid || '',
      userProfile?.nick,
      postText,
      userProfile?.avatarUrl,
      postImage
    );
    
    if (result.success) {
      setPostText('');
      setPostImage(null);
      setModalVisible(false);
      await loadData();
      Alert.alert('Sucesso', 'Momento publicado!');
    } else {
      Alert.alert('Erro', result.error);
    }
    setSubmitting(false);
  };

  const handleLike = async (momentId: string, currentLikes: string[]) => {
    const hasLiked = currentLikes?.includes(auth.currentUser?.uid || '') || false;
    
    // Atualização otimista
    const updatedMoments = moments.map(moment => {
      if (moment.id === momentId) {
        const newLikes = hasLiked
          ? moment.likes.filter((id: string) => id !== auth.currentUser?.uid)
          : [...(moment.likes || []), auth.currentUser?.uid];
        return { ...moment, likes: newLikes };
      }
      return moment;
    });
    setMoments(updatedMoments);
    
    const result = await likeMoment(momentId, auth.currentUser?.uid || '', hasLiked);
    if (!result.success) {
      await loadData();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes < 60) return `${diffMinutes} min`;
    if (diffHours < 24) return `${diffHours} h`;
    if (diffDays < 7) return `${diffDays} dias`;
    return date.toLocaleDateString();
  };

  const renderMoment = ({ item }: any) => {
    const hasLiked = item.likes?.includes(auth.currentUser?.uid) || false;
    const likesCount = item.likes?.length || 0;
    
    return (
      <LinearGradient colors={[colors.card, colors.background]} style={styles.momentCard}>
        <TouchableOpacity style={styles.momentHeader} onPress={() => navigation.navigate('UserProfile', { userId: item.userId, userNick: item.userNick, userAvatar: item.userAvatar })}>
          {item.userAvatar ? (
            <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
          ) : (
            <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.avatarGradient}>
              <Icon name="account" size={24} color="#fff" />
            </LinearGradient>
          )}
          <View style={styles.momentHeaderInfo}>
            <Text style={styles.userName}>{item.userNick}</Text>
            <Text style={styles.momentTime}>{formatDate(item.createdAt)}</Text>
          </View>
        </TouchableOpacity>
        
        {item.text && <Text style={styles.momentText}>{item.text}</Text>}
        
        {item.imageUrl && (
          <TouchableOpacity style={styles.imageContainer}>
            <Image source={{ uri: item.imageUrl }} style={styles.momentImage} />
          </TouchableOpacity>
        )}
        
        <View style={styles.momentFooter}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(item.id, item.likes)}>
            <Icon name={hasLiked ? "heart" : "heart-outline"} size={22} color={hasLiked ? '#ff6b6b' : colors.textSecondary} />
            <Text style={[styles.actionText, hasLiked && styles.actionTextActive]}>{likesCount}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Comentários', 'Em breve!')}>
            <Icon name="comment-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.actionText}>0</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Compartilhar', 'Em breve!')}>
            <Icon name="share-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <LinearGradient colors={[colors.background, '#0f0f1a']} style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[colors.card, 'transparent']} style={styles.headerGradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Momentos</Text>
          <TouchableOpacity style={styles.newButton} onPress={() => setModalVisible(true)}>
            <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.newButtonGradient}>
              <Icon name="plus" size={20} color="#fff" />
              <Text style={styles.newButtonText}>Novo</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={moments}
        keyExtractor={(item) => item.id}
        renderItem={renderMoment}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="newspaper-variant" size={60} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Nenhum momento ainda</Text>
            <Text style={styles.emptyText}>Compartilhe algo com seus amigos!</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => setModalVisible(true)}>
              <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.emptyButtonGradient}>
                <Text style={styles.emptyButtonText}>Criar Momento</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal de Criação */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalContent}>
            <LinearGradient colors={[colors.card, colors.background]} style={styles.modalGradient}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Novo Momento</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Icon name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalUserInfo}>
                {userProfile?.avatarUrl ? (
                  <Image source={{ uri: userProfile.avatarUrl }} style={styles.modalAvatar} />
                ) : (
                  <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.modalAvatarGradient}>
                    <Icon name="account" size={20} color="#fff" />
                  </LinearGradient>
                )}
                <Text style={styles.modalUserName}>{userProfile?.nick}</Text>
              </View>
              
              <TextInput
                style={styles.modalInput}
                placeholder="O que você está pensando?"
                placeholderTextColor={colors.textSecondary}
                value={postText}
                onChangeText={setPostText}
                multiline
                maxLength={500}
              />
              
              {postImage && (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: postImage }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removeImage} onPress={() => setPostImage(null)}>
                    <Icon name="close-circle" size={28} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>
              )}
              
              <TouchableOpacity style={styles.imageButton} onPress={handleAddImage} disabled={uploadingImage}>
                <LinearGradient colors={['rgba(108,99,255,0.1)', 'rgba(108,99,255,0.2)']} style={styles.imageButtonGradient}>
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Icon name="image-plus" size={24} color={colors.primary} />
                      <Text style={styles.imageButtonText}>Adicionar imagem</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalSave, submitting && styles.modalSaveDisabled]} onPress={handleCreatePost} disabled={submitting}>
                  <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.modalSaveGradient}>
                    {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalSaveText}>Publicar</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  headerGradient: { paddingTop: 40, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  headerTitle: { color: colors.text, fontSize: 28, fontWeight: 'bold' },
  newButton: { borderRadius: 25, overflow: 'hidden' },
  newButtonGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  newButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  listContent: { paddingHorizontal: 16, paddingBottom: 30 },
  momentCard: { borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  momentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 45, height: 45, borderRadius: 22.5 },
  avatarGradient: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  momentHeaderInfo: { marginLeft: 12, flex: 1 },
  userName: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  momentTime: { color: colors.textSecondary, fontSize: 10, marginTop: 2 },
  momentText: { color: colors.text, fontSize: 14, lineHeight: 22, marginBottom: 12 },
  imageContainer: { marginBottom: 12 },
  momentImage: { width: '100%', height: 200, borderRadius: 16 },
  momentFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 20 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { color: colors.textSecondary, fontSize: 13 },
  actionTextActive: { color: '#ff6b6b' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  emptyText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8 },
  emptyButton: { marginTop: 20, borderRadius: 25, overflow: 'hidden' },
  emptyButtonGradient: { paddingHorizontal: 24, paddingVertical: 12 },
  emptyButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { maxHeight: '85%' },
  modalGradient: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: colors.text, fontSize: 24, fontWeight: 'bold' },
  modalUserInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  modalAvatar: { width: 40, height: 40, borderRadius: 20 },
  modalAvatarGradient: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  modalUserName: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 15, color: colors.text, fontSize: 16, minHeight: 100, textAlignVertical: 'top', marginBottom: 15 },
  imageButton: { marginBottom: 15, borderRadius: 16, overflow: 'hidden' },
  imageButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 16 },
  imageButtonText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  imagePreview: { position: 'relative', marginBottom: 15 },
  previewImage: { width: '100%', height: 150, borderRadius: 16 },
  removeImage: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, backgroundColor: 'rgba(255,107,107,0.2)', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  modalCancelText: { color: '#ff6b6b', fontSize: 16, fontWeight: 'bold' },
  modalSave: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  modalSaveDisabled: { opacity: 0.6 },
  modalSaveGradient: { paddingVertical: 14, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
