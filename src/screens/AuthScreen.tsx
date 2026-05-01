import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../utils/colors';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { createUserProfile } from '../services/firestore/index';

export default function AuthScreen({ navigation }: any) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Erro', 'Senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const tempNick = email.split('@')[0];
        await updateProfile(userCredential.user, { displayName: tempNick });
        await createUserProfile(userCredential.user.uid, { nick: tempNick, email, profileCompleted: false });
        navigation.replace('CompleteProfile');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
    setLoading(false);
  };

  return (
    <LinearGradient colors={[colors.background, '#0f0f1a']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoSection}>
          <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.logoCircle}>
            <Icon name="microphone-variant" size={45} color="#fff" />
          </LinearGradient>
          <Text style={styles.appName}>FOLLOW VOICE</Text>
          <Text style={styles.tagline}>Salas de voz ao vivo</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isLogin ? 'Entrar' : 'Criar Conta'}</Text>
          
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.textSecondary} value={email} onChangeText={setEmail} autoCapitalize="none" />
          
          <View style={styles.passwordContainer}>
            <TextInput style={styles.passwordInput} placeholder="Senha" placeholderTextColor={colors.textSecondary} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon name={showPassword ? "eye-off" : "eye"} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          {!isLogin && (
            <TextInput style={styles.input} placeholder="Confirmar senha" placeholderTextColor={colors.textSecondary} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          )}
          
          <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
            <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.buttonGradient}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isLogin ? 'Entrar' : 'Cadastrar'}</Text>}
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchText}>{isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  logoSection: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  appName: { color: colors.text, fontSize: 28, fontWeight: 'bold' },
  tagline: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: 24, padding: 24 },
  cardTitle: { color: colors.text, fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: colors.text, marginBottom: 16 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 14, marginBottom: 16 },
  passwordInput: { flex: 1, color: colors.text, paddingVertical: 14 },
  button: { borderRadius: 30, overflow: 'hidden', marginTop: 8 },
  buttonGradient: { paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  switchText: { color: colors.primary, textAlign: 'center', marginTop: 20 },
});
