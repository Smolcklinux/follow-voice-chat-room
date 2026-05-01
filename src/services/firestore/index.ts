import { db } from '../firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  addDoc, query, where, orderBy, onSnapshot, serverTimestamp,
  arrayUnion, arrayRemove, increment, deleteDoc, limit
} from 'firebase/firestore';

export { 
  db, doc, setDoc, getDoc, updateDoc, collection, 
  addDoc, query, where, getDocs, orderBy, limit,
  arrayUnion, arrayRemove, serverTimestamp, deleteDoc,
  onSnapshot, increment
};

export * from './users';
export * from './rooms';
export * from './messages';
export * from './friends';
export * from './moments';
