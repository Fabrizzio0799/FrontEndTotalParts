import { connParams } from "../Libs/conexionhana";
import { queryWhithOutParams } from "../Libs/conexionhana";
import Swal from 'sweetalert2';

const CatalogoQ = `SELECT * FROM "_SYS_BIC"."10059_TOTAL_PARTS_TEST/ITEMS"`;

export const getItems = async () => {
  try {
    const data = await queryWhithOutParams(CatalogoQ, connParams);
    return data; 
  } catch (error) {
    Swal.fire({
      title: 'Error!',
      text: 'Ha ocurrido un error al obtener los ítems',
      icon: 'error',
      confirmButtonText: 'OK'
    });
    throw error;
  }
};
