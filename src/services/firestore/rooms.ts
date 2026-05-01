import { db, collection, doc, addDoc, getDoc, getDocs, query, where, updateDoc, deleteDoc, orderBy, serverTimestamp, onSnapshot, limit, increment } from './index';

export const createVoiceRoom = async (roomData: any) => {
  try {
    const docRef = await addDoc(collection(db, 'rooms'), {
      ...roomData,
      members: [roomData.ownerId],
      seats: Array(10).fill(null),
      popularity: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getActiveRooms = async () => {
  try {
    const q = query(collection(db, 'rooms'), where('isActive', '==', true), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const rooms: any[] = [];
    snapshot.forEach(doc => rooms.push({ id: doc.id, ...doc.data() }));
    return { success: true, data: rooms };
  } catch (error: any) {
    return { success: true, data: [] };
  }
};

export const getPopularRooms = async (limitCount = 30) => {
  try {
    const q = query(collection(db, 'rooms'), where('isActive', '==', true), orderBy('popularity', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    const rooms: any[] = [];
    snapshot.forEach(doc => rooms.push({ id: doc.id, ...doc.data() }));
    return { success: true, data: rooms };
  } catch (error: any) {
    return { success: true, data: [] };
  }
};

export const sendRoomMessage = async (roomId: string, userId: string, userName: string, userAvatar: string | null, text: string) => {
  try {
    await addDoc(collection(db, 'rooms', roomId, 'messages'), {
      userId, userName, userAvatar, text,
      timestamp: serverTimestamp(),
      type: 'user'
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const listenToRoomMessages = (roomId: string, callback: (messages: any[]) => void) => {
  const q = query(collection(db, 'rooms', roomId, 'messages'), orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const messages: any[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      messages.push({ id: doc.id, ...data, timestamp: data.timestamp?.toDate?.() || new Date() });
    });
    callback(messages);
  });
};
