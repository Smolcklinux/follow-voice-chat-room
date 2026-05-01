import { db, doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, addDoc, serverTimestamp } from './index';
import { getUserProfile } from './users';

export const followUser = async (currentUserId: string, targetUserId: string) => {
  try {
    await updateDoc(doc(db, 'users', currentUserId), { following: arrayUnion(targetUserId) });
    await updateDoc(doc(db, 'users', targetUserId), { followers: arrayUnion(currentUserId) });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const unfollowUser = async (currentUserId: string, targetUserId: string) => {
  try {
    await updateDoc(doc(db, 'users', currentUserId), { following: arrayRemove(targetUserId) });
    await updateDoc(doc(db, 'users', targetUserId), { followers: arrayRemove(currentUserId) });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const checkIsFollowing = async (currentUserId: string, targetUserId: string) => {
  try {
    const userSnap = await getDoc(doc(db, 'users', currentUserId));
    if (userSnap.exists()) {
      const data = userSnap.data();
      return data.following?.includes(targetUserId) || false;
    }
    return false;
  } catch (error) {
    return false;
  }
};

export const getFriends = async (userId: string) => {
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    const friendsIds = userSnap.data()?.friends || [];
    const friends: any[] = [];
    for (const uid of friendsIds) {
      const friend = await getUserProfile(uid);
      if (friend.success) friends.push(friend.data);
    }
    return { success: true, data: friends };
  } catch (error: any) {
    return { success: true, data: [] };
  }
};
