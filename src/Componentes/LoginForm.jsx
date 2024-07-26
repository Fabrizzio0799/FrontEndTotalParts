import React, { useState } from 'react';
import { auth } from '../Libs/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { Box, Button, Input, FormControl, FormLabel, Heading, VStack } from '@chakra-ui/react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import logo from '../Imagenes/LOGOTP.png';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const MySwal = withReactContent(Swal);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user.emailVerified) {
        MySwal.fire({
          icon: 'success',
          title: 'Inicio de sesión exitoso',
          showConfirmButton: false,
          timer: 1500,
        });
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        MySwal.fire({
          icon: 'warning',
          title: 'Verificación de correo pendiente',
          text: 'Por favor, verifica tu correo electrónico antes de continuar.',
        });
      }
    } catch (error) {
      MySwal.fire({
        icon: 'error',
        title: 'Error al iniciar sesión',
        text: error.message,
      });
    }
  };

  const handlePasswordReset = async () => {
    const { value: email } = await MySwal.fire({
      title: 'Ingrese su correo electrónico',
      input: 'text',
      inputAttributes: {
        autocapitalize: 'off'
      },
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      showLoaderOnConfirm: true,
      preConfirm: async (email) => {
        try {
          await sendPasswordResetEmail(auth, email);
          return email;
        } catch (error) {
          MySwal.showValidationMessage(
            `Error: ${error.message}`
          );
        }
      },
      allowOutsideClick: () => !MySwal.isLoading()
    });

    if (email) {
      MySwal.fire(
        'Correo enviado',
        'Se ha enviado un correo para el cambio de contraseña. Verifique que el correo pudo haber llegado a spam (no deseados)',
        'success'
      );
    }
  };

  return (
    <Box
      bg="#e6e6e6"
      p={6}
      rounded="md"
      w={80}
      boxShadow="md"
      mx="auto"
      mt="100px"
    >
      <img src={logo} alt="logo" style={{ width: '100%', marginBottom: '20px' }} />
      <VStack spacing={4}>
        <Heading as="h1" size="lg" color="blue.600" >Iniciar Sesión</Heading>
        <form onSubmit={handleLogin}>
          <FormControl id="email">
            <FormLabel>Correo electrónico</FormLabel>
            <Input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              bg="gray.100"
              textColor={'black'}
            />
          </FormControl>
          <FormControl id="password" mt={4}>
            <FormLabel>Contraseña</FormLabel>
            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              bg="gray.100"
              textColor={'black'}
            />
          </FormControl>
          <FormLabel
            mt={2}
            fontSize="sm"
            color="blue.400"
            onClick={handlePasswordReset}
            cursor="pointer" // Asegúrate de que parezca clicable
            style={{ color: "#1d5d65" }}
          >
            ¿Olvidaste tu contraseña?
          </FormLabel>
          <Button
            type="submit"
            colorScheme="blue"
            variant="solid"
            width="full"
            mt={6}
            style={{ backgroundColor: "#1d5d65" }}
          >
            Iniciar sesión
          </Button>
        </form>
      </VStack>
    </Box>
  );
};

export default LoginForm;
