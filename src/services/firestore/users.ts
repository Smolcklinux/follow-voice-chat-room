import { db, doc, setDoc, getDoc, updateDoc } from './index';

export const createUserProfile = async (userId: string, userData: any) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      uid: userId,
      nick: userData.nick || '',
      email: userData.email || '',
      avatarUrl: userData.avatarUrl || null,
      bio: userData.bio || '',
      gender: userData.gender || '',
      country: userData.country || '',
      language: userData.language || 'Português',
      age: userData.age || null,
      profileCompleted: false,
      level: 1,
      charisma: 0,
      wealth: 0,
      followers: [],
      following: [],
      friends: [],
      createdAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    }
    return { success: false, error: 'Usuário não encontrado' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    await updateDoc(doc(db, 'users', userId), updates);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const searchUsers = async (searchTerm: string) => {
  try {
    const usersRef = collection(db, 'users');
    const term = searchTerm.toLowerCase().trim();
    const q = query(usersRef, where('nick', '>=', term), where('nick', '<=', term + '\uf8ff'), limit(20));
    const snapshot = await getDocs(q);
    const users: any[] = [];
    snapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
    return { success: true, data: users };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
