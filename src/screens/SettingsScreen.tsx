import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../services/firebase';
import { colors } from '../utils/colors';

const APP_VERSION = '1.0.0';

export default function SettingsScreen({ navigation }: any) {
  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => auth.signOut() }
    ]);
  };

  const menuItems = [
    { icon: 'account', title: 'Minha Conta', onPress: () => navigation.navigate('Profile') },
    { icon: 'bell', title: 'Notificações', onPress: () => Alert.alert('Em breve') },
    { icon: 'shield-account', title: 'Privacidade', onPress: () => Alert.alert('Em breve') },
    { icon: 'gavel', title: 'Termos de Serviço', onPress: () => navigation.navigate('About') },
    { icon: 'information', title: 'Sobre o App', onPress: () => navigation.navigate('About') },
  ];

  return (
    <LinearGradient colors={[colors.background, '#0f0f1a']} style={styles.container}>
      <LinearGradient colors={[colors.card, 'transparent']} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configurações</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[colors.card, colors.background]} style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.profileAvatar}>
              <Icon name="account" size={28} color="#fff" />
            </LinearGradient>
            <View>
              <Text style={styles.profileName}>{auth.currentUser?.email?.split('@')[0] || 'Usuário'}</Text>
              <Text style={styles.profileEmail}>{auth.currentUser?.email}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
              <LinearGradient colors={['rgba(108,99,255,0.15)', 'rgba(108,99,255,0.05)']} style={styles.menuIcon}>
                <Icon name={item.icon} size={22} color={colors.primary} />
              </LinearGradient>
              <Text style={styles.menuText}>{item.title}</Text>
              <Icon name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LinearGradient colors={['rgba(255,107,107,0.2)', 'rgba(255,107,107,0.05)']} style={styles.logoutGradient}>
            <Icon name="logout" size={22} color="#ff6b6b" />
            <Text style={styles.logoutText}>Sair da conta</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.versionText}>Versão {APP_VERSION}</Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { paddingTop: 40, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  profileCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: colors.border },
  profileInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileAvatar: { width: 55, height: 55, borderRadius: 27.5, justifyContent: 'center', alignItems: 'center' },
  profileName: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  profileEmail: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  menuSection: { marginHorizontal: 20, marginTop: 20, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(42,42,74,0.5)' },
  menuIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuText: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '500' },
  logoutButton: { marginHorizontal: 20, marginTop: 30, borderRadius: 16, overflow: 'hidden' },
  logoutGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)', borderRadius: 16 },
  logoutText: { color: '#ff6b6b', fontSize: 16, fontWeight: 'bold' },
  versionText: { textAlign: 'center', color: colors.textSecondary, fontSize: 12, marginTop: 30, marginBottom: 20 },
});
