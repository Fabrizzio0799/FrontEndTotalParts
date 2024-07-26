
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    setPersistence,
    browserSessionPersistence
} from "firebase/auth";
import { auth, db } from '../Libs/firebase';
import { doc, getDoc } from 'firebase/firestore';


const authContext = createContext();

export const useAuth = () => {
    const context = useContext(authContext);
    return context;
}

export const AuthProvider = ({ children }) => {

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [Rol, setRol] = useState(null);

    async function pideReseteo(email) {
        // console.log(email)
        const Google = await auth.sendPasswordResetEmail(email).then(() => {
            return email;
        }).catch((error) => {
            return error.message
        });
        //console.log(Google)
        return Google;
    }
    
    const getById = async(id)=>{
        const docRef = doc(db,"Roles",id);
        const docSnap = await getDoc(docRef)
        setRol(docSnap.data())
        //console.log(docSnap.data())

    }

    const signUp = (email, psw) => createUserWithEmailAndPassword(auth, email, psw);
    const signIn = async (email, psw) => {
        try {
            await setPersistence(auth, browserSessionPersistence)
                .then(() => {
                    return signInWithEmailAndPassword(auth, email, psw);
                })
            return await signInWithEmailAndPassword(auth, email, psw)
                .catch((e) => { throw e })
        } catch (error) {
            throw error
        }

    };
    const signout = () => signOut(auth)

    useEffect(() => {
        const unsubscirbe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);

            setLoading(false);

        })
        return () => { unsubscirbe() }
    }, []);

    useEffect(() => {
        if(user){
            getById(user.uid)
        }
    }, [user]);
 
    return (
        <authContext.Provider value={{ signUp, signIn, signout, user, Rol, loading, pideReseteo }}>
            {children}
        </authContext.Provider>
    );

}