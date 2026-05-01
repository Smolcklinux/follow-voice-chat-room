import { db, collection, doc, addDoc, getDocs, query, where, updateDoc, orderBy, onSnapshot, serverTimestamp, increment, setDoc } from './index';
import { getUserProfile } from './users';

export const sendMessage = async (fromUserId: string, toUserId: string, text: string, imageUrl: string | null = null) => {
  try {
    const chatId = [fromUserId, toUserId].sort().join('_');
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      from: fromUserId, to: toUserId, text, imageUrl,
      timestamp: serverTimestamp(), read: false, delivered: true
    });
    await setDoc(doc(db, 'chats', chatId), {
      participants: [fromUserId, toUserId],
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      lastSender: fromUserId,
      [`unreadCount.${toUserId}`]: increment(1)
    }, { merge: true });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getChats = async (userId: string) => {
  try {
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', userId));
    const snapshot = await getDocs(q);
    const chats: any[] = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const otherUserId = data.participants.find((id: string) => id !== userId);
      const profile = await getUserProfile(otherUserId);
      if (profile.success) {
        chats.push({
          id: doc.id,
          uid: otherUserId,
          nick: profile.data.nick,
          avatarUrl: profile.data.avatarUrl,
          lastMessage: data.lastMessage,
          lastMessageTime: data.lastMessageTime?.toDate?.()?.toLocaleTimeString() || '',
          unreadCount: data.unreadCount?.[userId] || 0
        });
      }
    }
    return { success: true, data: chats };
  } catch (error: any) {
    return { success: true, data: [] };
  }
};

export const listenToMessages = (currentUserId: string, otherUserId: string, callback: (messages: any[]) => void) => {
  const chatId = [currentUserId, otherUserId].sort().join('_');
  const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const messages: any[] = [];
    snapshot.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));
    callback(messages);
  });
};
