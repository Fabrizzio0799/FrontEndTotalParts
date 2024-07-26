// Import the functions you need from the SDKs you need
import firebase from "firebase/compat/app";
import 'firebase/compat/auth';
import {getFirestore} from 'firebase/firestore' 

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCsO0HdU9V_v0YO3KVi2S5BJINzDfio2oY",
  authDomain: "ordencompra1rst.firebaseapp.com",
  projectId: "ordencompra1rst",
  storageBucket: "ordencompra1rst.appspot.com",
  messagingSenderId: "589714809585",
  appId: "1:589714809585:web:36dcc4bb5afc143ad17f50"
};

// Initialize Firebase

firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export const db= getFirestore();
const provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = () => auth.signInWithPopup(provider);
export default firebase;




/*
const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
*/
