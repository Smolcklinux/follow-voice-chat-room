import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, Image, Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../services/firebase';
import { sendMessage, getMessages, listenToMessages, markMessagesAsRead } from '../services/firestore/index';
import { uploadToCloudinary } from '../services/cloudinary';
import { requestGalleryPermission } from '../services/permissions';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors } from '../utils/colors';

export default function ChatScreen({ route, navigation }: any) {
  const { userId, userNick, userAvatar } = route.params;
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const flatListRef = useRef<any>();

  useEffect(() => {
    loadMessages();
    const unsubscribe = listenToMessages(auth.currentUser?.uid || '', userId, (newMessages) => {
      setMessages(newMessages);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      markMessagesAsRead(auth.currentUser?.uid || '', userId);
    });
    return () => unsubscribe();
  }, [userId]);

  const loadMessages = async () => {
    const result = await getMessages(auth.currentUser?.uid || '', userId);
    if (result.success) {
      setMessages(result.data);
      markMessagesAsRead(auth.currentUser?.uid || '', userId);
    }
    setLoading(false);
  };

  const handleSendText = async () => {
    if (!inputText.trim()) return;
    setSending(true);
    const result = await sendMessage(auth.currentUser?.uid || '', userId, inputText);
    if (result.success) {
      setInputText('');
      await loadMessages();
    }
    setSending(false);
  };

  const handleSendImage = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;
    
    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, async (response) => {
      if (!response.didCancel && !response.errorCode && response.assets?.[0]) {
        setUploadingImage(true);
        const uploadResult = await uploadToCloudinary(response.assets[0].uri);
        if (uploadResult.success) {
          await sendMessage(auth.currentUser?.uid || '', userId, '📷 Imagem', uploadResult.url);
          await loadMessages();
        } else {
          Alert.alert('Erro', 'Falha ao enviar imagem');
        }
        setUploadingImage(false);
      }
    });
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: any) => {
    const isMyMessage = item.from === auth.currentUser?.uid;
    const hasImage = item.imageUrl;
    
    return (
      <View style={[styles.messageWrapper, isMyMessage ? styles.myMessageWrapper : styles.otherMessageWrapper]}>
        {!isMyMessage && (
          <View style={styles.messageAvatar}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
            ) : (
              <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.avatarGradient}>
                <Icon name="account" size={18} color="#fff" />
              </LinearGradient>
            )}
          </View>
        )}
        <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.otherMessage]}>
          {!isMyMessage && <Text style={styles.messageSender}>{userNick}</Text>}
          {hasImage && <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />}
          {item.text && item.text !== '📷 Imagem' && <Text style={styles.messageText}>{item.text}</Text>}
          <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
        </View>
      </View>
    );
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerInfo} onPress={() => navigation.navigate('UserProfile', { userId, userNick, userAvatar })}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.headerAvatar} />
            ) : (
              <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.headerAvatarGradient}>
                <Icon name="account" size={20} color="#fff" />
              </LinearGradient>
            )}
            <Text style={styles.headerTitle}>{userNick}</Text>
          </TouchableOpacity>
          <View style={styles.headerPlaceholder} />
        </View>
      </LinearGradient>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <LinearGradient colors={[colors.card, colors.background]} style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TouchableOpacity onPress={handleSendImage} style={styles.attachButton}>
              <Icon name="image-plus" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Digite uma mensagem..."
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]} onPress={handleSendText} disabled={sending || !inputText.trim()}>
              <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.sendButtonGradient}>
                {sending ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="send" size={20} color="#fff" />}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          {uploadingImage && (
            <View style={styles.uploadingIndicator}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.uploadingText}>Enviando imagem...</Text>
            </View>
          )}
        </LinearGradient>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  headerGradient: { paddingTop: 40, paddingBottom: 15 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 12, gap: 12 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerAvatarGradient: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  headerPlaceholder: { width: 40 },
  messagesList: { padding: 16, flexGrow: 1 },
  messageWrapper: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  myMessageWrapper: { justifyContent: 'flex-end' },
  otherMessageWrapper: { justifyContent: 'flex-start' },
  messageAvatar: { marginRight: 8 },
  avatarImage: { width: 32, height: 32, borderRadius: 16 },
  avatarGradient: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  messageContainer: { maxWidth: '75%', padding: 12, borderRadius: 20 },
  myMessage: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  otherMessage: { backgroundColor: colors.card, borderBottomLeftRadius: 4 },
  messageSender: { color: colors.primary, fontSize: 11, marginBottom: 4 },
  messageText: { color: colors.text, fontSize: 15 },
  messageImage: { width: 200, height: 150, borderRadius: 12, marginBottom: 4 },
  messageTime: { color: 'rgba(255,255,255,0.6)', fontSize: 9, marginTop: 4, textAlign: 'right' },
  inputWrapper: { borderTopLeftRadius: 25, borderTopRightRadius: 25, overflow: 'hidden' },
  inputContainer: { flexDirection: 'row', padding: 12, alignItems: 'center', gap: 8 },
  attachButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.1)' },
  input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 25, paddingHorizontal: 16, paddingVertical: 10, color: colors.text, maxHeight: 100 },
  sendButton: { borderRadius: 22.5, overflow: 'hidden' },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonGradient: { width: 45, height: 45, justifyContent: 'center', alignItems: 'center' },
  uploadingIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8, gap: 8 },
  uploadingText: { color: colors.primary, fontSize: 12 },
});
