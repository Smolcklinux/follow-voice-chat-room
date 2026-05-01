import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
  FlatList, TextInput, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth, db } from '../services/firebase';
import { generateAgoraToken, AGORA_APP_ID } from '../services/agora';
import { getUserProfile, sendRoomMessage, listenToRoomMessages } from '../services/firestore/index';
import { requestMicrophonePermission } from '../services/permissions';
import { colors } from '../utils/colors';
import { RtcEngine } from 'react-native-agora';

const SEATS_COUNT = 10;

export default function AgoraVoiceRoom({ navigation, route }: any) {
  const { roomId, roomName } = route.params;
  const [engine, setEngine] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [muted, setMuted] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [seats, setSeats] = useState(Array(SEATS_COUNT).fill(null));
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const flatListRef = useRef<any>();

  useEffect(() => {
    loadData();
    return () => {
      if (engine) {
        engine.leaveChannel();
        engine.destroy();
      }
    };
  }, []);

  const loadData = async () => {
    const profile = await getUserProfile(auth.currentUser?.uid || '');
    if (profile.success) {
      setUserProfile(profile.data);
    }
    await checkPermissionsAndConnect();
  };

  const checkPermissionsAndConnect = async () => {
    const hasMic = await requestMicrophonePermission();
    if (!hasMic) {
      Alert.alert('Permissão Necessária', 'O app precisa do microfone');
      setConnecting(false);
      return;
    }
    await initAgora();
  };

  const initAgora = async () => {
    try {
      const rtcEngine = await RtcEngine.create(AGORA_APP_ID);
      setEngine(rtcEngine);
      
      rtcEngine.addListener('JoinChannelSuccess', () => {
        setConnected(true);
        setConnecting(false);
      });
      
      await rtcEngine.setChannelProfile(1);
      await rtcEngine.setClientRole(1);
      
      const uid = Math.floor(Math.random() * 100000);
      const tokenResult = await generateAgoraToken(roomId, uid, 'publisher');
      
      await rtcEngine.joinChannel(tokenResult.success ? tokenResult.token : null, roomId, null, uid);
      
      loadMessages();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível conectar');
      setConnecting(false);
    }
  };

  const loadMessages = async () => {
    const unsubscribe = listenToRoomMessages(roomId, (newMessages) => {
      setMessages(newMessages);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => unsubscribe();
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    await sendRoomMessage(roomId, auth.currentUser?.uid || '', userProfile?.nick, userProfile?.avatarUrl, chatInput);
    setChatInput('');
  };

  const renderMessage = ({ item }: any) => {
    const isMyMessage = item.userId === auth.currentUser?.uid;
    return (
      <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.otherMessage]}>
        {!isMyMessage && <Text style={styles.messageSender}>{item.userName}</Text>}
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

  if (connecting) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Conectando...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={[colors.background, '#0f0f1a']} style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[colors.card, 'transparent']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.roomTitle}>{roomName}</Text>
        <View style={[styles.statusDot, connected && styles.statusConnected]} />
      </LinearGradient>

      {/* Botão de Microfone */}
      <View style={styles.audioControls}>
        <TouchableOpacity style={styles.audioButton} onPress={() => engine?.muteLocalAudioStream(!muted)}>
          <LinearGradient colors={muted ? ['#ff6b6b', '#ee5a52'] : [colors.primary, '#4ecdc4']} style={styles.audioButtonGradient}>
            <Icon name={muted ? "microphone-off" : "microphone"} size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.audioButtonText}>{muted ? 'Microfone desligado' : 'Microfone ligado'}</Text>
      </View>

      {/* Chat */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.chatContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={{ maxHeight: 200 }}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.chatInput}
            placeholder="Digite uma mensagem..."
            placeholderTextColor={colors.textSecondary}
            value={chatInput}
            onChangeText={setChatInput}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <LinearGradient colors={[colors.primary, '#4ecdc4']} style={styles.sendButtonGradient}>
              <Icon name="send" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary, marginTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20 },
  roomTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.textSecondary },
  statusConnected: { backgroundColor: '#4ecdc4' },
  audioControls: { alignItems: 'center', marginVertical: 20 },
  audioButton: { borderRadius: 50, overflow: 'hidden' },
  audioButtonGradient: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  audioButtonText: { color: colors.textSecondary, marginTop: 8 },
  chatContainer: { flex: 1, paddingHorizontal: 16, paddingBottom: 20 },
  inputContainer: { flexDirection: 'row', gap: 10, paddingTop: 10 },
  chatInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 25, paddingHorizontal: 16, paddingVertical: 10, color: colors.text },
  sendButton: { borderRadius: 25, overflow: 'hidden' },
  sendButtonGradient: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  messageBubble: { maxWidth: '80%', padding: 10, borderRadius: 16, marginBottom: 8 },
  myMessage: { backgroundColor: colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  otherMessage: { backgroundColor: colors.card, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  messageSender: { color: '#4ecdc4', fontSize: 11, marginBottom: 2 },
  messageText: { color: colors.text, fontSize: 14 },
});
