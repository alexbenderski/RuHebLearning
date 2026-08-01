import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyADFqKVfp0eNGd8ptoFjoo7RJRFDQeHao0',
  authDomain: 'supplysupport-233fe.firebaseapp.com',
  databaseURL: 'https://supplysupport-233fe-default-rtdb.firebaseio.com',
  projectId: 'supplysupport-233fe',
  storageBucket: 'supplysupport-233fe.firebasestorage.app',
  messagingSenderId: '583216125971',
  appId: '1:583216125971:web:2ae9a01fe8e34abff387e6',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
