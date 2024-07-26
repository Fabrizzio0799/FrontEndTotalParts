import React, {useContext}from 'react'
import { createContext } from 'react';
import { useState } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  return context;
};

export const UserProvider = ({ children }) =>{
  
  const [user, setUser] = useState({
    idSesion: ""
  });

  const updateIdSesion = (newIdSesion) => {
    setUser((currentIdSesion) => ({
      ...currentIdSesion,
      idSesion: newIdSesion
    }));
  };

  return (
    <UserContext.Provider value={{ user, updateIdSesion }}>
      {children}
    </UserContext.Provider>
  );
}

  