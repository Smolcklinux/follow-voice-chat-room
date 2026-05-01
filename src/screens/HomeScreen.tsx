import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, RefreshControl, ActivityIndicator, FlatList, TextInput, Modal, Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../services/firebase';
import { getActiveRooms, getPopularRooms, createVoiceRoom, getUserProfile } from '../services/firestore/index';
import { colors } from '../utils/colors';

export default function HomeScreen({ navigation }: any) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [popularRooms, setPopularRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('todos');
  const [modalVisible, setModalVisible] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const profile = await getUserProfile(auth.currentUser?.uid || '');
    if (profile.success) setUserProfile(profile.data);
    
    const roomsResult = await getActiveRooms();
    if (roomsResult.success) setRooms(roomsResult.data);
    
    const popularResult = await getPopularRooms();
    if (popularResult.success) setPopularRooms(popularResult.data);
    
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      Alert.alert('Erro', 'Digite um nome para a sala');
      return;
    }
    
    const result = await createVoiceRoom({
      name: newRoomName,
      description: newRoomDesc,
      ownerId: auth.currentUser?.uid,
      ownerNick: userProfile?.nick,
      ownerAvatar: userProfile?.avatarUrl,
    });
    
    if (result.success) {
      Alert.alert('Sucesso', 'Sala criada!');
      setModalVisible(false);
      setNewRoomName('');
      setNewRoomDesc('');
      loadData();
    } else {
      Alert.alert('Erro', result.error);
    }
  };

  const enterRoom = (room: any) => {
    navigation.navigate('VoiceRoom', { roomId: room.id, roomName: room.name });
  };

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    const result = await getActiveRooms();
    if (result.success) {
      const filtered = result.data.filter((room: any) => 
        room.name.toLowerCase().includes(searchText.toLowerCase()) ||
        room.ownerNick?.toLowerCase().includes(searchText.toLowerCase())
      );
      setSearchResults(filtered);
    }
  };

  const renderRoomCard = ({ item, index }: { item: any; index: number }) => {
    const isTopThree = index < 3 && activeTab === 'popular';
    return (
      <TouchableOpacity style={[styles.roomCard, isTopThree && styles.topRoomCard]} onPress={() => enterRoom(item)}>
        {isTopThree && (
          <View style={styles.rankBadge}>
            {index === 0 && <Icon name="crown" size={20} color="#FFD700" />}
            {index === 1 && <Icon name="medal" size={20} color="#C0C0C0" />}
            {index === 2 && <Icon name="medal" size={20} color="#CD7F32" />}
          </View>
        )}
        <View style={styles.roomAvatar}>
          {item.coverImage || item.ownerAvatar ? (
            <Image source={{ uri: item.coverImage || item.ownerAvatar }} style={styles.avatarImage} />
          ) : (
            <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.avatarGradient}>
              <Icon name="microphone-variant" size={24} color="#fff" />
            </LinearGradient>
          )}
          <View style={styles.onlineBadge}>
            <Text style={styles.onlineText}>{item.members?.length || 0}</Text>
          </View>
        </View>
        <View style={styles.roomInfo}>
          <Text style={styles.roomName}>{item.name}</Text>
          <View style={styles.roomOwner}>
            <Icon name="account" size={12} color={colors.textSecondary} />
            <Text style={styles.ownerName}>{item.ownerNick}</Text>
          </View>
          <View style={styles.roomTags}>
            <View style={styles.tag}>
              <Icon name="fire" size={10} color="#FFD700" />
              <Text style={styles.tagText}>{item.popularity || 0}</Text>
            </View>
            <View style={styles.tag}>
              <Icon name="chat" size={10} color={colors.primary} />
              <Text style={styles.tagText}>Ao vivo</Text>
            </View>
          </View>
        </View>
        <Icon name="chevron-right" size={24} color={colors.primary} />
      </TouchableOpacity>
    );
  };

  const currentRooms = activeTab === 'popular' ? popularRooms : rooms;
  const isEmpty = currentRooms.length === 0;

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
          <View>
            <Text style={styles.headerTitle}>Follow Voice</Text>
            <Text style={styles.headerSubtitle}>Salas de voz ao vivo</Text>
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={() => setSearchModalVisible(true)}>
            <Icon name="magnify" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Menu Superior */}
      <View style={styles.topMenu}>
        <TouchableOpacity style={[styles.topMenuItem, activeTab === 'todos' && styles.activeTopMenuItem]} onPress={() => setActiveTab('todos')}>
          <Icon name="format-list-bulleted" size={18} color={activeTab === 'todos' ? colors.text : colors.textSecondary} />
          <Text style={[styles.topMenuText, activeTab === 'todos' && styles.activeTopMenuText]}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.topMenuItem, activeTab === 'popular' && styles.activeTopMenuItem]} onPress={() => setActiveTab('popular')}>
          <Icon name="fire" size={18} color={activeTab === 'popular' ? colors.text : colors.textSecondary} />
          <Text style={[styles.topMenuText, activeTab === 'popular' && styles.activeTopMenuText]}>Popular</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.topMenuItem} onPress={() => setModalVisible(true)}>
          <Icon name="plus-circle" size={18} color={colors.primary} />
          <Text style={styles.topMenuText}>Criar Sala</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Salas */}
      <FlatList
        data={currentRooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => renderRoomCard({ item, index })}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.roomsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="microphone-variant-off" size={60} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Nenhuma sala ativa</Text>
            <Text style={styles.emptyText}>Crie uma sala para começar!</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => setModalVisible(true)}>
              <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.emptyButtonGradient}>
                <Text style={styles.emptyButtonText}>Criar Sala</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal de Busca */}
      <Modal visible={searchModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <LinearGradient colors={[colors.card, colors.background]} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buscar</Text>
              <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchInputWrapper}>
              <Icon name="magnify" size={20} color={colors.primary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar salas..."
                placeholderTextColor={colors.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={handleSearch}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Icon name="close-circle" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.searchResult} onPress={() => { enterRoom(item); setSearchModalVisible(false); }}>
                  <View style={styles.searchResultAvatar}>
                    <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.searchResultGradient}>
                      <Icon name="microphone-variant" size={20} color="#fff" />
                    </LinearGradient>
                  </View>
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>{item.name}</Text>
                    <Text style={styles.searchResultSub}>{item.ownerNick}</Text>
                  </View>
                  <Icon name="arrow-right" size={20} color={colors.primary} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={searchText.length > 0 ? <Text style={styles.noResults}>Nenhuma sala encontrada</Text> : null}
            />
          </LinearGradient>
        </View>
      </Modal>

      {/* Modal de Criar Sala */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <LinearGradient colors={[colors.card, colors.background]} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Criar Sala</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Nome da sala"
              placeholderTextColor={colors.textSecondary}
              value={newRoomName}
              onChangeText={setNewRoomName}
              maxLength={30}
            />
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="Descrição (opcional)"
              placeholderTextColor={colors.textSecondary}
              value={newRoomDesc}
              onChangeText={setNewRoomDesc}
              multiline
              maxLength={100}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleCreateRoom}>
                <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.modalSaveGradient}>
                  <Text style={styles.modalSaveText}>Criar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
  headerSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  searchButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  topMenu: { flexDirection: 'row', marginHorizontal: 20, marginVertical: 16, backgroundColor: 'rgba(22,33,62,0.8)', borderRadius: 30, padding: 4 },
  topMenuItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 25 },
  activeTopMenuItem: { backgroundColor: colors.primary },
  topMenuText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  activeTopMenuText: { color: colors.text },
  roomsList: { paddingHorizontal: 16, paddingBottom: 30 },
  roomCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  topRoomCard: { borderLeftWidth: 3, borderLeftColor: '#FFD700' },
  rankBadge: { width: 30, alignItems: 'center' },
  roomAvatar: { position: 'relative', marginRight: 12 },
  avatarImage: { width: 55, height: 55, borderRadius: 27.5 },
  avatarGradient: { width: 55, height: 55, borderRadius: 27.5, justifyContent: 'center', alignItems: 'center' },
  onlineBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#4ecdc4', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 10 },
  onlineText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  roomInfo: { flex: 1 },
  roomName: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  roomOwner: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ownerName: { color: colors.textSecondary, fontSize: 11 },
  roomTags: { flexDirection: 'row', gap: 8, marginTop: 6 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(108,99,255,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  tagText: { color: colors.textSecondary, fontSize: 10 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  emptyText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8 },
  emptyButton: { marginTop: 20, borderRadius: 25, overflow: 'hidden' },
  emptyButtonGradient: { paddingHorizontal: 24, paddingVertical: 12 },
  emptyButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: colors.text, marginBottom: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, backgroundColor: 'rgba(255,107,107,0.2)', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalCancelText: { color: '#ff6b6b', fontWeight: 'bold' },
  modalSave: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  modalSaveGradient: { paddingVertical: 12, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontWeight: 'bold' },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 16, gap: 12, marginBottom: 20 },
  searchInput: { flex: 1, color: colors.text, paddingVertical: 12 },
  searchResult: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, marginBottom: 8, gap: 12 },
  searchResultAvatar: { width: 45, height: 45, borderRadius: 22.5, overflow: 'hidden' },
  searchResultGradient: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  searchResultInfo: { flex: 1 },
  searchResultName: { color: colors.text, fontSize: 15, fontWeight: 'bold' },
  searchResultSub: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  noResults: { color: colors.textSecondary, textAlign: 'center', marginTop: 20 },
});
