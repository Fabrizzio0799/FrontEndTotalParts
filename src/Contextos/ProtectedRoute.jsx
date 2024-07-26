import React, { useEffect } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from './AuthProvider';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log(user);
    if (!loading && !user) {
      Swal.fire({
        title: 'Acceso Denegado',
        text: 'Necesitas estar logueado para acceder a esta página.',
        icon: 'warning',
        confirmButtonText: 'Ok'
      }).then(() => {
        window.location.href = '/login';
      });
    }
  }, [loading, user]);

  if (loading) return (<h1>Cargando...</h1>);
  if (!user) return null; 

  return <>{children}</>;
};

export default ProtectedRoute;
