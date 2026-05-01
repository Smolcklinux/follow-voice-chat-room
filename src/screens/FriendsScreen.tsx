import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, TextInput, Alert, RefreshControl, ActivityIndicator
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../services/firebase';
import { 
  getFriends, searchUsers, followUser, unfollowUser, checkIsFollowing,
  getFriendRequests, acceptFriendRequest, getUserProfile
} from '../services/firestore/index';
import { colors } from '../utils/colors';

export default function FriendsScreen({ navigation }: any) {
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('amigos');
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    if (activeTab === 'amigos') {
      await loadFriends();
    } else {
      await loadFriendRequests();
    }
    setLoading(false);
  };

  const loadFriends = async () => {
    const result = await getFriends(auth.currentUser?.uid || '');
    if (result.success) setFriends(result.data);
  };

  const loadFriendRequests = async () => {
    const result = await getFriendRequests(auth.currentUser?.uid || '');
    if (result.success) setFriendRequests(result.data);
  };

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setSearching(true);
    const result = await searchUsers(searchText);
    if (result.success) {
      const filtered = result.data.filter((u: any) => u.uid !== auth.currentUser?.uid);
      setSearchResults(filtered);
      const statusMap: Record<string, boolean> = {};
      for (const user of filtered) {
        statusMap[user.uid] = await checkIsFollowing(auth.currentUser?.uid || '', user.uid);
      }
      setFollowingStatus(statusMap);
    }
    setSearching(false);
  };

  const handleFollowToggle = async (targetUser: any) => {
    const isFollowing = followingStatus[targetUser.uid];
    
    if (isFollowing) {
      const result = await unfollowUser(auth.currentUser?.uid || '', targetUser.uid);
      if (result.success) {
        setFollowingStatus(prev => ({ ...prev, [targetUser.uid]: false }));
        Alert.alert('Sucesso', `Você deixou de seguir ${targetUser.nick}`);
      }
    } else {
      const result = await followUser(auth.currentUser?.uid || '', targetUser.uid);
      if (result.success) {
        setFollowingStatus(prev => ({ ...prev, [targetUser.uid]: true }));
        Alert.alert('Sucesso', `Você está seguindo ${targetUser.nick}`);
      }
    }
  };

  const handleAcceptRequest = async (requestId: string, fromUserId: string) => {
    const result = await acceptFriendRequest(requestId, auth.currentUser?.uid || '', fromUserId);
    if (result.success) {
      Alert.alert('Sucesso', 'Amigo adicionado!');
      loadFriendRequests();
      loadFriends();
    } else {
      Alert.alert('Erro', result.error);
    }
  };

  const openChat = (user: any) => {
    navigation.navigate('Chat', { userId: user.uid, userNick: user.nick, userAvatar: user.avatarUrl });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderFriendItem = ({ item }: any) => (
    <TouchableOpacity style={styles.friendCard} onPress={() => navigation.navigate('UserProfile', { userId: item.uid, userNick: item.nick, userAvatar: item.avatarUrl })}>
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
      ) : (
        <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.avatarGradient}>
          <Icon name="account" size={24} color="#fff" />
        </LinearGradient>
      )}
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.nick}</Text>
        <Text style={styles.friendStatus}>Online</Text>
      </View>
      <TouchableOpacity style={styles.chatButton} onPress={() => openChat(item)}>
        <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.chatButtonGradient}>
          <Icon name="chat" size={18} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderRequestItem = ({ item }: any) => (
    <View style={styles.requestCard}>
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={styles.avatarSmall} />
      ) : (
        <LinearGradient colors={['#ff6b6b', '#f093fb']} style={styles.avatarSmallGradient}>
          <Icon name="account" size={20} color="#fff" />
        </LinearGradient>
      )}
      <View style={styles.requestInfo}>
        <Text style={styles.requestName}>{item.nick}</Text>
        <Text style={styles.requestMessage}>Quer ser seu amigo</Text>
      </View>
      <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptRequest(item.requestId, item.uid)}>
        <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.acceptButtonGradient}>
          <Icon name="check" size={16} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderSearchResult = ({ item }: any) => {
    const isFollowing = followingStatus[item.uid];
    return (
      <View style={styles.searchResultCard}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatarSmall} />
        ) : (
          <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.avatarSmallGradient}>
            <Icon name="account" size={20} color="#fff" />
          </LinearGradient>
        )}
        <View style={styles.searchResultInfo}>
          <Text style={styles.searchResultName}>{item.nick}</Text>
          <Text style={styles.searchResultId}>ID: {item.numericId || item.uid?.slice(-6)}</Text>
        </View>
        <TouchableOpacity style={[styles.followButton, isFollowing && styles.followingButton]} onPress={() => handleFollowToggle(item)}>
          <LinearGradient colors={isFollowing ? ['#4ecdc4', '#44a08d'] : [colors.primary, colors.secondary]} style={styles.followButtonGradient}>
            <Text style={styles.followButtonText}>{isFollowing ? 'Seguindo' : 'Seguir'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) {
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
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Amigos</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'amigos' && styles.activeTab]} onPress={() => setActiveTab('amigos')}>
          <Text style={[styles.tabText, activeTab === 'amigos' && styles.activeTabText]}>Amigos ({friends.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'solicitacoes' && styles.activeTab]} onPress={() => setActiveTab('solicitacoes')}>
          <Text style={[styles.tabText, activeTab === 'solicitacoes' && styles.activeTabText]}>Solicitações ({friendRequests.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Busca */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color={colors.primary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar usuários..."
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

      {/* Resultados da Busca */}
      {searchText.length > 0 && (
        <View style={styles.searchResults}>
          <Text style={styles.searchResultsTitle}>Resultados da busca</Text>
          {searching ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.searchLoader} />
          ) : searchResults.length > 0 ? (
            <FlatList data={searchResults} keyExtractor={(item) => item.uid} renderItem={renderSearchResult} scrollEnabled={false} />
          ) : (
            <View style={styles.noResults}>
              <Icon name="emoticon-sad-outline" size={40} color={colors.textSecondary} />
              <Text style={styles.noResultsText}>Nenhum usuário encontrado</Text>
            </View>
          )}
        </View>
      )}

      {/* Conteúdo Principal */}
      {searchText.length === 0 && (
        <FlatList
          data={activeTab === 'amigos' ? friends : friendRequests}
          keyExtractor={(item) => activeTab === 'amigos' ? item.uid : item.requestId}
          renderItem={activeTab === 'amigos' ? renderFriendItem : renderRequestItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="account-group" size={60} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>
                {activeTab === 'amigos' ? 'Nenhum amigo ainda' : 'Nenhuma solicitação'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'amigos' ? 'Adicione amigos para começar a conversar!' : 'Suas solicitações aparecerão aqui'}
              </Text>
            </View>
          }
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  headerGradient: { paddingTop: 40, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  tabs: { flexDirection: 'row', marginHorizontal: 20, marginVertical: 16, backgroundColor: 'rgba(22,33,62,0.8)', borderRadius: 30, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 25 },
  activeTab: { backgroundColor: colors.primary },
  tabText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  activeTabText: { color: colors.text },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 20, borderRadius: 12, paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  searchInput: { flex: 1, color: colors.text, paddingVertical: 12 },
  searchResults: { marginHorizontal: 20, marginBottom: 20 },
  searchResultsTitle: { color: colors.primary, fontSize: 13, fontWeight: 'bold', marginBottom: 12 },
  searchLoader: { marginTop: 20 },
  noResults: { alignItems: 'center', padding: 30 },
  noResultsText: { color: colors.textSecondary, marginTop: 12 },
  listContent: { paddingHorizontal: 16, paddingBottom: 30 },
  friendCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 12, marginBottom: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarGradient: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  avatarSmall: { width: 45, height: 45, borderRadius: 22.5 },
  avatarSmallGradient: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  friendInfo: { flex: 1, marginLeft: 12 },
  friendName: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  friendStatus: { color: '#4ecdc4', fontSize: 11, marginTop: 2 },
  chatButton: { borderRadius: 25, overflow: 'hidden' },
  chatButtonGradient: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  requestCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 12, marginBottom: 12 },
  requestInfo: { flex: 1, marginLeft: 12 },
  requestName: { color: colors.text, fontSize: 15, fontWeight: 'bold' },
  requestMessage: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  acceptButton: { borderRadius: 20, overflow: 'hidden' },
  acceptButtonGradient: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  searchResultCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 10, marginBottom: 8 },
  searchResultInfo: { flex: 1, marginLeft: 12 },
  searchResultName: { color: colors.text, fontSize: 15, fontWeight: 'bold' },
  searchResultId: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  followButton: { borderRadius: 20, overflow: 'hidden' },
  followingButton: { borderRadius: 20 },
  followButtonGradient: { paddingHorizontal: 16, paddingVertical: 8 },
  followButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  emptyText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8 },
});
