import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator, Modal, TextInput
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../services/firebase';
import { getUserProfile, updateUserProfile, getFollowers, getFollowing } from '../services/firestore/index';
import { uploadToCloudinary } from '../services/cloudinary';
import { requestGalleryPermission } from '../services/permissions';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors } from '../utils/colors';

export default function ProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editNick, setEditNick] = useState('');
  const [editBio, setEditBio] = useState('');
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const result = await getUserProfile(auth.currentUser?.uid || '');
    if (result.success) {
      setProfile(result.data);
      setEditNick(result.data.nick);
      setEditBio(result.data.bio || '');
    }
    setLoading(false);
  };

  const handleUploadAvatar = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;
    
    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, async (response) => {
      if (!response.didCancel && !response.errorCode && response.assets?.[0]) {
        setUploading(true);
        const uploadResult = await uploadToCloudinary(response.assets[0].uri);
        if (uploadResult.success) {
          await updateUserProfile(auth.currentUser?.uid || '', { avatarUrl: uploadResult.url });
          await loadProfile();
          Alert.alert('Sucesso', 'Avatar atualizado!');
        }
        setUploading(false);
      }
    });
  };

  const handleUpdateProfile = async () => {
    if (!editNick.trim()) {
      Alert.alert('Erro', 'Nome não pode estar vazio');
      return;
    }
    const result = await updateUserProfile(auth.currentUser?.uid || '', { nick: editNick, bio: editBio });
    if (result.success) {
      await loadProfile();
      setEditModalVisible(false);
      Alert.alert('Sucesso', 'Perfil atualizado!');
    } else {
      Alert.alert('Erro', result.error);
    }
  };

  const loadFollowersList = async () => {
    const result = await getFollowers(auth.currentUser?.uid || '');
    if (result.success) setFollowersList(result.data);
    setShowFollowers(true);
  };

  const loadFollowingList = async () => {
    const result = await getFollowing(auth.currentUser?.uid || '');
    if (result.success) setFollowingList(result.data);
    setShowFollowing(true);
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => auth.signOut() }
    ]);
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={[colors.card, 'transparent']} style={styles.headerGradient}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Perfil</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <Icon name="cog" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Avatar e Info */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handleUploadAvatar} disabled={uploading} style={styles.avatarContainer}>
            {profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.avatarGradient}>
                <Icon name="account" size={40} color="#fff" />
              </LinearGradient>
            )}
            <View style={styles.editAvatarBadge}>
              <Icon name="camera" size={14} color="#fff" />
            </View>
            {uploading && <View style={styles.uploadingOverlay} />}
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.nick}>{profile?.nick}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(true)}>
                <Icon name="pencil" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.id}>ID: {profile?.numericId || profile?.uid?.slice(-6)}</Text>
            <View style={styles.levelRow}>
              <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.1)']} style={styles.badge}>
                <Icon name="star" size={12} color={colors.primary} />
                <Text style={styles.badgeText}>Nível {profile?.level || 1}</Text>
              </LinearGradient>
              <LinearGradient colors={['rgba(78,205,196,0.2)', 'rgba(78,205,196,0.1)']} style={styles.badge}>
                <Icon name="heart" size={12} color="#4ecdc4" />
                <Text style={styles.badgeText}>Carisma {profile?.charisma || 0}</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statBox} onPress={loadFollowersList}>
            <Text style={styles.statNumber}>{profile?.followers?.length || 0}</Text>
            <Text style={styles.statLabel}>Seguidores</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statBox} onPress={loadFollowingList}>
            <Text style={styles.statNumber}>{profile?.following?.length || 0}</Text>
            <Text style={styles.statLabel}>Seguindo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statBox} onPress={() => Alert.alert('Carisma', 'Ganhe carisma participando de salas!')}>
            <Text style={styles.statNumber}>{profile?.charisma || 0}</Text>
            <Text style={styles.statLabel}>Carisma</Text>
          </TouchableOpacity>
        </View>

        {/* Bio */}
        <TouchableOpacity style={styles.bioContainer} onPress={() => setEditModalVisible(true)}>
          <Icon name="information-outline" size={18} color={colors.primary} />
          <Text style={styles.bioText}>{profile?.bio || 'Clique para adicionar uma bio'}</Text>
          <Icon name="pencil" size={14} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Menu de ações */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Friends')}>
            <LinearGradient colors={['rgba(108,99,255,0.15)', 'rgba(108,99,255,0.05)']} style={styles.menuIcon}>
              <Icon name="account-group" size={22} color={colors.primary} />
            </LinearGradient>
            <Text style={styles.menuText}>Amigos</Text>
            <Icon name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Moments')}>
            <LinearGradient colors={['rgba(78,205,196,0.15)', 'rgba(78,205,196,0.05)']} style={styles.menuIcon}>
              <Icon name="newspaper-variant" size={22} color="#4ecdc4" />
            </LinearGradient>
            <Text style={styles.menuText}>Meus Momentos</Text>
            <Icon name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
            <LinearGradient colors={['rgba(108,99,255,0.15)', 'rgba(108,99,255,0.05)']} style={styles.menuIcon}>
              <Icon name="cog" size={22} color={colors.primary} />
            </LinearGradient>
            <Text style={styles.menuText}>Configurações</Text>
            <Icon name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Botão Sair */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LinearGradient colors={['rgba(255,107,107,0.15)', 'rgba(255,107,107,0.05)']} style={styles.logoutGradient}>
            <Icon name="logout" size={20} color="#ff6b6b" />
            <Text style={styles.logoutText}>Sair</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de Edição */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <LinearGradient colors={[colors.card, colors.background]} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Nome</Text>
            <TextInput style={styles.modalInput} value={editNick} onChangeText={setEditNick} maxLength={30} />
            <Text style={styles.modalLabel}>Bio</Text>
            <TextInput style={[styles.modalInput, styles.textArea]} value={editBio} onChangeText={setEditBio} multiline maxLength={150} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleUpdateProfile}>
                <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.modalSaveGradient}>
                  <Text style={styles.modalSaveText}>Salvar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      {/* Modal de Seguidores */}
      <Modal visible={showFollowers} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <LinearGradient colors={[colors.card, colors.background]} style={styles.modalContentSmall}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seguidores</Text>
              <TouchableOpacity onPress={() => setShowFollowers(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {followersList.map((user) => (
                <TouchableOpacity key={user.uid} style={styles.userItem} onPress={() => navigation.navigate('UserProfile', { userId: user.uid, userNick: user.nick, userAvatar: user.avatarUrl })}>
                  {user.avatarUrl ? <Image source={{ uri: user.avatarUrl }} style={styles.userAvatar} /> : <View style={styles.userAvatarPlaceholder}><Icon name="account" size={20} color={colors.textSecondary} /></View>}
                  <Text style={styles.userName}>{user.nick}</Text>
                </TouchableOpacity>
              ))}
              {followersList.length === 0 && <Text style={styles.emptyText}>Nenhum seguidor ainda</Text>}
            </ScrollView>
          </LinearGradient>
        </View>
      </Modal>

      {/* Modal de Seguindo */}
      <Modal visible={showFollowing} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <LinearGradient colors={[colors.card, colors.background]} style={styles.modalContentSmall}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seguindo</Text>
              <TouchableOpacity onPress={() => setShowFollowing(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {followingList.map((user) => (
                <TouchableOpacity key={user.uid} style={styles.userItem} onPress={() => navigation.navigate('UserProfile', { userId: user.uid, userNick: user.nick, userAvatar: user.avatarUrl })}>
                  {user.avatarUrl ? <Image source={{ uri: user.avatarUrl }} style={styles.userAvatar} /> : <View style={styles.userAvatarPlaceholder}><Icon name="account" size={20} color={colors.textSecondary} /></View>}
                  <Text style={styles.userName}>{user.nick}</Text>
                </TouchableOpacity>
              ))}
              {followingList.length === 0 && <Text style={styles.emptyText}>Não está seguindo ninguém</Text>}
            </ScrollView>
          </LinearGradient>
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
  profileHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 10, alignItems: 'center', gap: 16 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 85, height: 85, borderRadius: 42.5, borderWidth: 3, borderColor: colors.primary },
  avatarGradient: { width: 85, height: 85, borderRadius: 42.5, justifyContent: 'center', alignItems: 'center' },
  editAvatarBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.background },
  uploadingOverlay:
cd /home/projetos/follow-voice-chat-room/FollowVoiceChatRoom

# Corrigir ProfileScreen.tsx (versão completa)
cat > src/screens/ProfileScreen.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator, Modal, TextInput
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../services/firebase';
import { getUserProfile, updateUserProfile, getFollowers, getFollowing } from '../services/firestore/index';
import { uploadToCloudinary } from '../services/cloudinary';
import { requestGalleryPermission } from '../services/permissions';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors } from '../utils/colors';

export default function ProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editNick, setEditNick] = useState('');
  const [editBio, setEditBio] = useState('');
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const result = await getUserProfile(auth.currentUser?.uid || '');
    if (result.success) {
      setProfile(result.data);
      setEditNick(result.data.nick);
      setEditBio(result.data.bio || '');
    }
    setLoading(false);
  };

  const handleUploadAvatar = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;
    
    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, async (response) => {
      if (!response.didCancel && !response.errorCode && response.assets?.[0]) {
        setUploading(true);
        const uploadResult = await uploadToCloudinary(response.assets[0].uri);
        if (uploadResult.success) {
          await updateUserProfile(auth.currentUser?.uid || '', { avatarUrl: uploadResult.url });
          await loadProfile();
          Alert.alert('Sucesso', 'Avatar atualizado!');
        }
        setUploading(false);
      }
    });
  };

  const handleUpdateProfile = async () => {
    if (!editNick.trim()) {
      Alert.alert('Erro', 'Nome não pode estar vazio');
      return;
    }
    const result = await updateUserProfile(auth.currentUser?.uid || '', { nick: editNick, bio: editBio });
    if (result.success) {
      await loadProfile();
      setEditModalVisible(false);
      Alert.alert('Sucesso', 'Perfil atualizado!');
    } else {
      Alert.alert('Erro', result.error);
    }
  };

  const loadFollowersList = async () => {
    const result = await getFollowers(auth.currentUser?.uid || '');
    if (result.success) setFollowersList(result.data);
    setShowFollowers(true);
  };

  const loadFollowingList = async () => {
    const result = await getFollowing(auth.currentUser?.uid || '');
    if (result.success) setFollowingList(result.data);
    setShowFollowing(true);
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => auth.signOut() }
    ]);
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
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[colors.card, 'transparent']} style={styles.headerGradient}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Perfil</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <Icon name="cog" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handleUploadAvatar} disabled={uploading} style={styles.avatarContainer}>
            {profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.avatarGradient}>
                <Icon name="account" size={40} color="#fff" />
              </LinearGradient>
            )}
            <View style={styles.editAvatarBadge}>
              <Icon name="camera" size={14} color="#fff" />
            </View>
            {uploading && <View style={styles.uploadingOverlay} />}
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.nick}>{profile?.nick}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(true)}>
                <Icon name="pencil" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.id}>ID: {profile?.numericId || profile?.uid?.slice(-6)}</Text>
            <View style={styles.levelRow}>
              <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.1)']} style={styles.badge}>
                <Icon name="star" size={12} color={colors.primary} />
                <Text style={styles.badgeText}>Nível {profile?.level || 1}</Text>
              </LinearGradient>
              <LinearGradient colors={['rgba(78,205,196,0.2)', 'rgba(78,205,196,0.1)']} style={styles.badge}>
                <Icon name="heart" size={12} color="#4ecdc4" />
                <Text style={styles.badgeText}>Carisma {profile?.charisma || 0}</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statBox} onPress={loadFollowersList}>
            <Text style={styles.statNumber}>{profile?.followers?.length || 0}</Text>
            <Text style={styles.statLabel}>Seguidores</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statBox} onPress={loadFollowingList}>
            <Text style={styles.statNumber}>{profile?.following?.length || 0}</Text>
            <Text style={styles.statLabel}>Seguindo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statBox} onPress={() => Alert.alert('Carisma', 'Ganhe carisma participando de salas!')}>
            <Text style={styles.statNumber}>{profile?.charisma || 0}</Text>
            <Text style={styles.statLabel}>Carisma</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.bioContainer} onPress={() => setEditModalVisible(true)}>
          <Icon name="information-outline" size={18} color={colors.primary} />
          <Text style={styles.bioText}>{profile?.bio || 'Clique para adicionar uma bio'}</Text>
          <Icon name="pencil" size={14} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Friends')}>
            <LinearGradient colors={['rgba(108,99,255,0.15)', 'rgba(108,99,255,0.05)']} style={styles.menuIcon}>
              <Icon name="account-group" size={22} color={colors.primary} />
            </LinearGradient>
            <Text style={styles.menuText}>Amigos</Text>
            <Icon name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Moments')}>
            <LinearGradient colors={['rgba(78,205,196,0.15)', 'rgba(78,205,196,0.05)']} style={styles.menuIcon}>
              <Icon name="newspaper-variant" size={22} color="#4ecdc4" />
            </LinearGradient>
            <Text style={styles.menuText}>Meus Momentos</Text>
            <Icon name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
            <LinearGradient colors={['rgba(108,99,255,0.15)', 'rgba(108,99,255,0.05)']} style={styles.menuIcon}>
              <Icon name="cog" size={22} color={colors.primary} />
            </LinearGradient>
            <Text style={styles.menuText}>Configurações</Text>
            <Icon name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LinearGradient colors={['rgba(255,107,107,0.15)', 'rgba(255,107,107,0.05)']} style={styles.logoutGradient}>
            <Icon name="logout" size={20} color="#ff6b6b" />
            <Text style={styles.logoutText}>Sair</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <LinearGradient colors={[colors.card, colors.background]} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Nome</Text>
            <TextInput style={styles.modalInput} value={editNick} onChangeText={setEditNick} maxLength={30} />
            <Text style={styles.modalLabel}>Bio</Text>
            <TextInput style={[styles.modalInput, styles.textArea]} value={editBio} onChangeText={setEditBio} multiline maxLength={150} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleUpdateProfile}>
                <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.modalSaveGradient}>
                  <Text style={styles.modalSaveText}>Salvar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      <Modal visible={showFollowers} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <LinearGradient colors={[colors.card, colors.background]} style={styles.modalContentSmall}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seguidores</Text>
              <TouchableOpacity onPress={() => setShowFollowers(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {followersList.map((user) => (
                <TouchableOpacity key={user.uid} style={styles.userItem} onPress={() => navigation.navigate('UserProfile', { userId: user.uid, userNick: user.nick, userAvatar: user.avatarUrl })}>
                  {user.avatarUrl ? <Image source={{ uri: user.avatarUrl }} style={styles.userAvatar} /> : <View style={styles.userAvatarPlaceholder}><Icon name="account" size={20} color={colors.textSecondary} /></View>}
                  <Text style={styles.userName}>{user.nick}</Text>
                </TouchableOpacity>
              ))}
              {followersList.length === 0 && <Text style={styles.emptyText}>Nenhum seguidor ainda</Text>}
            </ScrollView>
          </LinearGradient>
        </View>
      </Modal>

      <Modal visible={showFollowing} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <LinearGradient colors={[colors.card, colors.background]} style={styles.modalContentSmall}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seguindo</Text>
              <TouchableOpacity onPress={() => setShowFollowing(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {followingList.map((user) => (
                <TouchableOpacity key={user.uid} style={styles.userItem} onPress={() => navigation.navigate('UserProfile', { userId: user.uid, userNick: user.nick, userAvatar: user.avatarUrl })}>
                  {user.avatarUrl ? <Image source={{ uri: user.avatarUrl }} style={styles.userAvatar} /> : <View style={styles.userAvatarPlaceholder}><Icon name="account" size={20} color={colors.textSecondary} /></View>}
                  <Text style={styles.userName}>{user.nick}</Text>
                </TouchableOpacity>
              ))}
              {followingList.length === 0 && <Text style={styles.emptyText}>Não está seguindo ninguém</Text>}
            </ScrollView>
          </LinearGradient>
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
  profileHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 10, alignItems: 'center', gap: 16 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 85, height: 85, borderRadius: 42.5, borderWidth: 3, borderColor: colors.primary },
  avatarGradient: { width: 85, height: 85, borderRadius: 42.5, justifyContent: 'center', alignItems: 'center' },
  editAvatarBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.background },
  uploadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 42.5 },
  profileInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nick: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  id: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  levelRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15 },
  badgeText: { color: colors.text, fontSize: 11 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, marginTop: 20, gap: 12 },
  statBox: { flex: 1, backgroundColor: 'rgba(22,33,62,0.8)', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statNumber: { color: colors.primary, fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  bioContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(22,33,62,0.6)', marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: 16, gap: 10, borderWidth: 1, borderColor: colors.border },
  bioText: { color: colors.text, fontSize: 13, flex: 1 },
  menuSection: { marginHorizontal: 20, marginTop: 20, backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuText: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '500' },
  logoutButton: { marginHorizontal: 20, marginTop: 24, marginBottom: 40, borderRadius: 16, overflow: 'hidden' },
  logoutGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)', borderRadius: 16 },
  logoutText: { color: '#ff6b6b', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { width: '90%', borderRadius: 24, padding: 20 },
  modalContentSmall: { width: '90%', maxHeight: '80%', borderRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  modalLabel: { color: colors.text, fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.05)', color: colors.text, padding: 14, borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancel: { flex: 1, backgroundColor: 'rgba(255,107,107,0.2)', padding: 14, borderRadius: 14, alignItems: 'center' },
  modalCancelText: { color: '#ff6b6b', fontWeight: 'bold' },
  modalSave: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  modalSaveGradient: { padding: 14, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontWeight: 'bold' },
  userItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  userAvatar: { width: 45, height: 45, borderRadius: 22.5 },
  userAvatarPlaceholder: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(108,99,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  userName: { color: colors.text, fontSize: 15, fontWeight: 'bold' },
  emptyText: { color: colors.textSecondary, textAlign: 'center', padding: 20 },
});
