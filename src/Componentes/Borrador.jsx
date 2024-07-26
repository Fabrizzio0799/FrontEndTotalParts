import React, { useState, useEffect } from "react";
import { 
  Accordion, 
  AccordionItem, 
  AccordionButton, 
  AccordionPanel, 
  AccordionIcon, 
  Box, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  TableContainer,
  Button
} from "@chakra-ui/react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export const Borrador = () => {
  const [apiData, setApiData] = useState([]);
  const navigate = useNavigate();

  const handleTable = async () => {
    try {
      let url = `http://localhost:3000/api/catalogo/allcarritos`;
      const response = await fetch(url);
      if (!response.ok) {
        if (response.body < 1) {
          Swal.fire({
            title: 'Error',
            text: 'No hay carritos',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        const data = await response.json();
        setApiData(data);
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: `Hubo un error al cargar los datos: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  useEffect(() => {
    handleTable();
  }, []);

  const groupByClient = (data) => {
    return data.reduce((acc, item) => {
      const clientKey = item.CardCode + " - " + item.Comentario;
      if (!acc[clientKey]) {
        acc[clientKey] = [];
      }
      acc[clientKey].push(item);
      return acc;
    }, {});
  };

  const extraerCodigoCliente = (cliente) => {
    const match = cliente.match(/^([^ ]+) -/);
    return match ? match[1] : cliente;
  };

  const handleDelete = async (cliente) => {
    Swal.fire({
      title: '¿Borrar carrito?',
      text: '¿Está seguro de que desea resetear el carrito?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const clienteCortado = extraerCodigoCliente(cliente);
          let url = `http://localhost:3000/api/catalogo/carritod/${clienteCortado}`;
          const response = await fetch(url, {
            method: 'DELETE'
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          } else {
            Swal.fire({
              title: 'Carrito eliminado',
              text: 'El carrito ha sido eliminado',
              icon: 'success',
              confirmButtonText: 'OK'
            });
            handleTable();
          }
        } catch (error) {
          Swal.fire({
            title: 'Error',
            text: `Hubo un error al borrar el carrito: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      }
    });
  };

  const handleNavigate = (cliente) => {
    const [cardCode, comentario] = cliente.split(" - ");
    navigate("/Pedido", { state: { cliente: cardCode, clienteName: comentario } });
  };

  const groupedData = groupByClient(apiData);

  return (
    <Box p={4}>
      <Accordion allowMultiple>
        {Object.keys(groupedData).map((cliente) => (
          <AccordionItem key={cliente}>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                {cliente} - {groupedData[cliente].length} Artículos
              </Box>
              <Button colorScheme="teal" style={{marginRight: "20px"}} onClick={() => handleNavigate(cliente)}>Enviar a SAP</Button>
              <Button colorScheme="red" onClick={() => handleDelete(cliente)}>X</Button>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>DocEntry</Th>
                      <Th>Código Artículo</Th>
                      <Th>Nombre Artículo</Th>
                      <Th>Almacén</Th>
                      <Th>Cantidad</Th>
                      <Th>Precio</Th>
                      <Th>Precio total</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {groupedData[cliente] && groupedData[cliente].length > 0 ? (
                      groupedData[cliente].map((item) => (
                        <Tr key={item.DocEntry}>
                          <Td>{item.DocEntry}</Td>
                          <Td>{item.CodigoArticulo}</Td>
                          <Td>{item.NombreArticulo.slice(0,30)}...</Td>
                          <Td>{item.Almacen}</Td>
                          <Td>{item.Cant}</Td>
                          <Td>₡{item.Precio}</Td>
                          <Td>₡{(item.Precio * item.Cant)}</Td>
                        </Tr>
                      ))
                    ) : (
                      <Tr>
                        <Td colSpan="6" style={{ textAlign: 'center' }}>No hay artículos en el carrito</Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </AccordionPanel>
          </AccordionItem>
        ))}
        {apiData.length < 1 && (
          <h2 textAlign="center" p={4}>
            <strong>No hay carritos pendientes</strong>
          </h2>
        )}
      </Accordion>
    </Box>
  );
};
