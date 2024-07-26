import React, { useState, useEffect, Fragment } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginForm from './Componentes/LoginForm';
import Catalogo from './Componentes/catalogo';
import NavBar from './Componentes/NavBar';
import { AuthProvider } from './Contextos/AuthProvider';
import firebase from './Libs/firebase';
import { UserProvider } from './Contextos/UserProvider';
import ProtectedRoute from './Contextos/ProtectedRoute';
import { Pedido } from './Componentes/Pedido';
import { Borrador } from './Componentes/Borrador';
import  Pedidos  from './Componentes/Pedidos.jsx';







function App() {

  const [user, setUser] = useState(null);
  useEffect(() => {
    firebase.auth().onAuthStateChanged(user => {
      setUser(user);
      
    })
  }, [user]);

  return (
    <Fragment>
      <AuthProvider>
        <UserProvider> 
          <ChakraProvider>
            <Router>
              <NavBar/>
                <Routes>
                  <Route path="/login" element={<LoginForm/>} />
                  <Route path="/" element={<ProtectedRoute><Catalogo/></ProtectedRoute>} />
                  <Route path="/Pedidos" element={<ProtectedRoute><Pedidos/></ProtectedRoute>} />
                  <Route path="/Borrador" element={<ProtectedRoute><Borrador/></ProtectedRoute>} />
                  <Route path='/Pedido' element={<ProtectedRoute><Pedido/></ProtectedRoute>} />
                </Routes>
            </Router>
          </ChakraProvider>
        </UserProvider>
      </AuthProvider>
    </Fragment>
  );
}

export default App;