import { db, collection, addDoc, getDocs, query, orderBy, updateDoc, arrayUnion, arrayRemove, onSnapshot } from './index';

export const getMoments = async () => {
  try {
    const q = query(collection(db, 'moments'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const moments: any[] = [];
    snapshot.forEach(doc => moments.push({ id: doc.id, ...doc.data() }));
    return { success: true, data: moments };
  } catch (error: any) {
    return { success: true, data: [] };
  }
};

export const createMoment = async (userId: string, userNick: string, text: string, userAvatar: string | null, imageUrl: string | null = null) => {
  try {
    await addDoc(collection(db, 'moments'), {
      userId, userNick, userAvatar, text, imageUrl,
      likes: [], comments: [],
      createdAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const likeMoment = async (momentId: string, userId: string, hasLiked: boolean) => {
  try {
    const momentRef = doc(db, 'moments', momentId);
    if (hasLiked) {
      await updateDoc(momentRef, { likes: arrayRemove(userId) });
    } else {
      await updateDoc(momentRef, { likes: arrayUnion(userId) });
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
