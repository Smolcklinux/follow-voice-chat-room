import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../utils/colors';

export default function SplashScreen({ navigation }: any) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.3);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }),
    ]).start();

    setTimeout(() => navigation.replace('Auth'), 2000);
  }, []);

  return (
    <LinearGradient colors={[colors.background, '#0f0f1a']} style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.logoCircle}>
          <Icon name="microphone-variant" size={70} color="#fff" />
        </LinearGradient>
        <Text style={styles.title}>FOLLOW VOICE</Text>
        <Text style={styles.subtitle}>Conecte-se por voz</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center' },
  logoCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { color: colors.text, fontSize: 28, fontWeight: 'bold', letterSpacing: 2 },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 8 },
});
