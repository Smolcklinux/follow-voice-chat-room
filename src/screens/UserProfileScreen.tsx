import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../services/firebase';
import { getUserProfile, followUser, unfollowUser, checkIsFollowing } from '../services/firestore/index';
import { colors } from '../utils/colors';

export default function UserProfileScreen({ route, navigation }: any) {
  const { userId, userNick, userAvatar } = route.params;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    const result = await getUserProfile(userId);
    if (result.success) {
      setProfile(result.data);
      setIsCurrentUser(userId === auth.currentUser?.uid);
      if (userId !== auth.currentUser?.uid) {
        const following = await checkIsFollowing(auth.currentUser?.uid || '', userId);
        setIsFollowing(following);
      }
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    if (profile?.numericId) {
      Clipboard.setString(profile.numericId.toString());
      Alert.alert('ID Copiado!', `ID ${profile.numericId} copiado!`);
    }
  };

  const handleFollowToggle = async () => {
    if (isFollowing) {
      const result = await unfollowUser(auth.currentUser?.uid || '', userId);
      if (result.success) setIsFollowing(false);
    } else {
      const result = await followUser(auth.currentUser?.uid || '', userId);
      if (result.success) setIsFollowing(true);
    }
  };

  const sendMessage = () => {
    navigation.navigate('Chat', { userId: profile.uid, userNick: profile.nick, userAvatar: profile.avatarUrl });
  };

  const getGenderColor = () => {
    if (profile?.gender === 'Masculino') return '#6c63ff';
    if (profile?.gender === 'Feminino') return '#ff6b6b';
    return colors.primary;
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
      <LinearGradient colors={[colors.card, 'transparent']} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerPlaceholder} />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[getGenderColor() + '20', 'transparent']} style={styles.coverBanner} />

        <View style={styles.profileContainer}>
          {profile?.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
          ) : (
            <LinearGradient colors={[getGenderColor(), getGenderColor() + '80']} style={styles.avatarGradient}>
              <Icon name="account" size={50} color="#fff" />
            </LinearGradient>
          )}
          
          <Text style={styles.nick}>{profile?.nick}</Text>
          
          <TouchableOpacity onPress={copyToClipboard} style={styles.idContainer}>
            <Icon name="identifier" size={14} color={colors.textSecondary} />
            <Text style={styles.id}>ID: {profile?.numericId || profile?.uid?.slice(-6)}</Text>
            <Icon name="content-copy" size={12} color={colors.primary} />
          </TouchableOpacity>
          
          <View style={styles.badgeContainer}>
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

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profile?.followers?.length || 0}</Text>
            <Text style={styles.statLabel}>Seguidores</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profile?.following?.length || 0}</Text>
            <Text style={styles.statLabel}>Seguindo</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profile?.charisma || 0}</Text>
            <Text style={styles.statLabel}>Carisma</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.card, colors.background]} style={styles.bioCard}>
          <View style={styles.bioHeader}>
            <Icon name="information-outline" size={20} color={colors.primary} />
            <Text style={styles.bioTitle}>Sobre</Text>
          </View>
          <Text style={styles.bioText}>{profile?.bio || '✨ Este usuário ainda não escreveu uma bio'}</Text>
          
          <View style={styles.infoRow}>
            <Icon name="cake-variant" size={16} color={colors.primary} />
            <Text style={styles.infoText}>Idade: {profile?.age || 'Não informada'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="map-marker" size={16} color={colors.primary} />
            <Text style={styles.infoText}>País: {profile?.country || 'Brasil'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="translate" size={16} color={colors.primary} />
            <Text style={styles.infoText}>Idioma: {profile?.language || 'Português'}</Text>
          </View>
        </LinearGradient>

        {!isCurrentUser && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.followButton, isFollowing && styles.followingButton]} onPress={handleFollowToggle}>
              <LinearGradient colors={isFollowing ? ['#4ecdc4', '#44a08d'] : [colors.primary, colors.secondary]} style={styles.followButtonGradient}>
                <Icon name={isFollowing ? "check" : "account-plus"} size={20} color="#fff" />
                <Text style={styles.followButtonText}>{isFollowing ? 'Seguindo' : 'Seguir'}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageButton} onPress={sendMessage}>
              <LinearGradient colors={[colors.card, colors.background]} style={styles.messageButtonGradient}>
                <Icon name="message" size={20} color={colors.primary} />
                <Text style={styles.messageButtonText}>Mensagem</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  headerGradient: { paddingTop: 40, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerPlaceholder: { width: 40 },
  coverBanner: { height: 80, marginTop: -20 },
  profileContainer: { alignItems: 'center', marginTop: -40, paddingHorizontal: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: colors.primary, marginBottom: 12 },
  avatarGradient: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  nick: { color: colors.text, fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  idContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.1)' },
  id: { color: colors.textSecondary, fontSize: 13 },
  badgeContainer: { flexDirection: 'row', gap: 10, marginTop: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: colors.text, fontSize: 12, fontWeight: '500' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 20, gap: 12 },
  statCard: { flex: 1, alignItems: 'center', backgroundColor: colors.card, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  statNumber: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  bioCard: { marginHorizontal: 16, marginTop: 20, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border },
  bioHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  bioTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  bioText: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  infoText: { color: colors.textSecondary, fontSize: 13 },
  actionButtons: { flexDirection: 'row', marginHorizontal: 16, gap: 12, marginTop: 20, marginBottom: 40 },
  followButton: { flex: 1, borderRadius: 30, overflow: 'hidden' },
  followingButton: { borderRadius: 30 },
  followButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  followButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  messageButton: { flex: 1, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  messageButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  messageButtonText: { color: colors.primary, fontSize: 15, fontWeight: 'bold' },
});
