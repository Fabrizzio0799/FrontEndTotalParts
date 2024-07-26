import React from "react";
import { useAuth } from "../Contextos/AuthProvider";
import Swal from 'sweetalert2'
import {FormLabel} from "@chakra-ui/react";
function ResetPassword() {


    const { pideReseteo } = useAuth();

    const triggerResetEmail = async () => {
        let correoingresado=null;
        Swal.fire({
            title: 'Ingrese su correo FCS',
            input: 'text',
            inputAttributes: {
                autocapitalize: 'off'
            },
            showCancelButton: true,
            confirmButtonText: 'Aceptar',
            showLoaderOnConfirm: true,
            preConfirm: async (login) => {
                correoingresado=login;
                return await pideReseteo(login);
               
            },
            allowOutsideClick: () => !Swal.isLoading()
        }).then((result) => {
            //console.log(result)
            if (result.isConfirmed) {
               // console.log(result.value);
                if (result.value === correoingresado) {
                    Swal.fire('se ha enviado un correo para el cambio de contraseña. Valore que el correo pudo haber llegado a spam (no deseados)')
                }
                else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Alerta...',
                        text: result.value

                    })
                }
            }

        })

    }

    return (
        <div className="resetPassword-main">

            <FormLabel  mt={2} fontSize="sm" color="blue.400" style={{ width: '70%' }}  onClick={() => (triggerResetEmail())}>Recordar clave</FormLabel>

        </div>
    )
}

export default ResetPassword;
