import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../utils/colors';

const APP_VERSION = '1.0.0';

export default function AboutScreen({ navigation }: any) {
  const features = [
    { icon: 'microphone-variant', name: 'Salas de voz', desc: 'Converse ao vivo' },
    { icon: 'account-group', name: 'Amigos', desc: 'Conecte-se com pessoas' },
    { icon: 'chat', name: 'Mensagens', desc: 'Chat instantâneo' },
    { icon: 'newspaper-variant', name: 'Momentos', desc: 'Compartilhe sua vida' },
  ];

  return (
    <LinearGradient colors={[colors.background, '#0f0f1a']} style={styles.container}>
      <LinearGradient colors={[colors.card, 'transparent']} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sobre</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.logoCircle}>
            <Icon name="microphone-variant" size={55} color="#fff" />
          </LinearGradient>
          <Text style={styles.appName}>FOLLOW VOICE</Text>
          <Text style={styles.appVersion}>Versão {APP_VERSION}</Text>
        </View>

        <LinearGradient colors={[colors.card, colors.background]} style={styles.descriptionCard}>
          <Text style={styles.description}>
            Follow Voice é um app de salas de voz interativas onde você pode conectar-se com pessoas,
            fazer amigos, compartilhar momentos e muito mais!
          </Text>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Características</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <LinearGradient key={index} colors={[colors.card, colors.background]} style={styles.featureCard}>
                <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.05)']} style={styles.featureIcon}>
                  <Icon name={feature.icon} size={24} color={colors.primary} />
                </LinearGradient>
                <Text style={styles.featureName}>{feature.name}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </LinearGradient>
            ))}
          </View>
        </View>

        <View style={styles.creditsContainer}>
          <Text style={styles.creditsText}>© 2026 Follow Voice</Text>
          <Text style={styles.creditsSubtext}>Todos os direitos reservados</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { paddingTop: 40, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  logoContainer: { alignItems: 'center', marginTop: 20, marginBottom: 24 },
  logoCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  appName: { color: colors.text, fontSize: 24, fontWeight: 'bold', marginTop: 16 },
  appVersion: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  descriptionCard: { marginHorizontal: 20, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: colors.border },
  description: { color: colors.text, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  section: { marginHorizontal: 20, marginTop: 24 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featureCard: { width: '48%', padding: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  featureIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  featureName: { color: colors.text, fontSize: 14, fontWeight: 'bold' },
  featureDesc: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  creditsContainer: { alignItems: 'center', marginTop: 32, marginBottom: 40 },
  creditsText: { color: colors.textSecondary, fontSize: 12 },
  creditsSubtext: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
});
