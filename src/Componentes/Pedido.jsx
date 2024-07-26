import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  TableContainer,
  Flex,
  Box,
  Heading,
  Select
} from "@chakra-ui/react";
import "../Estilos/pedido.css";
import { fetchData } from "../Asistente/fetchData";

export const Pedido = () => {
  const [apiData, setApiData] = useState([]);
  const location = useLocation();
  const cliente = location.state?.cliente;
  const clienteName = location.state?.clienteName;
  const [cantidadSolicitada, setCantidadSolicitada] = useState({});
  const [precioFlete, setPrecioFlete] = useState(0);
  const [nombreFlete, setNombreFlete] = useState('');
  const [descuento, setDescuento] = useState({});
  const [iva, setIva] = useState({});
  const [Sellers, setSellers] = useState([]);
  const [SelectedSeller, setSelectedSeller] = useState(localStorage.getItem('selectedSeller') || '');

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/client/s');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSellers(data);
      } catch (error) {
        console.error('Error fetching clients:', error);
        Swal.fire({
          title: 'Error',
          text: `Hubo un error al cargar los clientes: ${error.message}`,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    };

    fetchSellers();
  }, []);

  const options = Sellers.map(Seller => ({
    value: Seller.SlpCode,
    label: Seller.SlpName
  }));

  useEffect(() => {
    localStorage.setItem('selectedSeller', SelectedSeller);
    if (SelectedSeller) {
      fetchData();
    }
  }, [SelectedSeller]);

  const handleSearch = async () => {
    try {
      let url = `http://localhost:3000/api/catalogo/carrito/${cliente}`;
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          // Handle empty cart case
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
    if (cliente) {
      handleSearch();
    }
  }, [cliente]);

  useEffect(() => {
    const initialCantidadSolicitada = {};
    const initialDescuento = {};
    const initialIva = {};
    apiData.forEach(item => {
      initialCantidadSolicitada[item.CodigoArticulo] = item.Cant;
      initialDescuento[item.CodigoArticulo] = item.Descuento;
      initialIva[item.CodigoArticulo] = item.iva;
    });
    setCantidadSolicitada(initialCantidadSolicitada);
    setDescuento(initialDescuento);
    setIva(initialIva);
  }, [apiData]);

  const handleEliminarItem = async (docEntry) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Seguro que deseas eliminar este elemento del carrito?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          let url = `http://localhost:3000/api/catalogo/carritol/${docEntry}`;
          const response = await fetch(url, {
            method: 'DELETE',
          });
          if (!response.ok) {
            throw new Error(`Error HTTP! estado: ${response.status}`);
          } else {
            // Update cart items
            const newData = apiData.filter((item) => item.DocEntry !== docEntry);
            setApiData(newData);
          }
        } catch (error) {
          Swal.fire({
            title: 'Error',
            text: `Hubo un error al eliminar el elemento del carrito: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      }
    });
  };

  const handleCantidadSolicitadaChange = (codigoArticulo, cantidad) => {
    setCantidadSolicitada((prevCantidadSolicitada) => ({
      ...prevCantidadSolicitada,
      [codigoArticulo]: parseInt(cantidad, 10),
    }));
  };

  const handleUpdateCantidadSolicitada = async (docEntry, cantidad, originalCantidad) => {
    if (cantidad === originalCantidad) {
      return;
    }
    const stockDisponible = apiData.find((item) => item.DocEntry === docEntry)?.EnInventario || 0;

    if (cantidad > stockDisponible) {
      Swal.fire({
        title: 'Error',
        text: 'No hay suficiente stock disponible',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/catalogo/carritoupt/${docEntry}/${cantidad}`, {
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update quantity in apiData
      const updatedData = apiData.map(item =>
        item.DocEntry === docEntry ? { ...item, Cant: cantidad } : item
      );
      setApiData(updatedData);

    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: `Hubo un error al actualizar la cantidad solicitada: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleEnviarOrden = async () => {
    const { value: comentario } = await Swal.fire({
      title: 'Comentario',
      text: 'Escribe un comentario para enviar a SAP',
      input: 'text',
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar'
    });

    if (!comentario) {
      return; // User canceled the comment
    }

    const docDueDate = new Date().toISOString().split('T')[0];
    const documentLines = apiData.map(item => ({
      ItemCode: item.CodigoArticulo,
      Quantity: cantidadSolicitada[item.CodigoArticulo] || item.Cant,
      U_Ubica_Port: item.Almacen,
      DiscountPercent: item.Descuento
    }));

    const DocumentAdditionalExpenses = [{
      ExpenseCode: 1,
      LineTotal: precioFlete,
      Remarks: nombreFlete,
      TaxCode: "IVA13S",
      U_tipo_documento: 99
    }];

    const ordenVenta = {
      CardCode: cliente,
      DocDueDate: docDueDate,
      DocumentLines: documentLines,
      Comments: comentario,
      SalesPersonCode: SelectedSeller,
      DocumentAdditionalExpenses: DocumentAdditionalExpenses
    };

    try {
      Swal.fire({
        title: 'Enviando orden de venta a SAP...',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false
      });
      const response = await fetch('http://localhost:3000/api/catalogo/enviarSap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ordenVenta),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } else if (response.status === 200) {
        Swal.fire({
          title: 'Orden de venta enviada a SAP',
          text: 'La orden de venta se ha enviado a SAP correctamente',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      }

      // Refresh cart data
      handleSearch();
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: `Hubo un error al enviar la orden de venta a SAP: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const calculateTotalPriceItems = () => {
    return apiData.reduce((acc, item) => acc + (item.Precio * (cantidadSolicitada[item.CodigoArticulo] || item.Cant)), 0).toFixed(2);
  };

  const calculateTotalDescount = () => {
    return apiData.reduce((acc, item) => acc + (item.Precio * (cantidadSolicitada[item.CodigoArticulo] || item.Cant) * (descuento[item.CodigoArticulo] || item.Descuento) / 100), 0).toFixed(2);
  };

  const calculateTotalIVA = () => {
    return apiData.reduce((acc, item) => {
      const ivaPercentage = item.iva === 'IVA13B' ? 13 : 0;
      return acc + (item.Precio * (cantidadSolicitada[item.CodigoArticulo] || item.Cant) * (ivaPercentage) / 100);}, 0).toFixed(2);
  };

  const calculateTotalPay = () => {
    return parseFloat(
      apiData.reduce((acc, item) => {
        const precioTotal = item.Precio * (cantidadSolicitada[item.CodigoArticulo] || item.Cant);
        const descuentoTotal = precioTotal * (descuento[item.CodigoArticulo] || item.Descuento) / 100;
        const ivaPercentage = item.iva === 'IVA13B' ? 13 : 0;
        const ivaTotal = precioTotal * ivaPercentage / 100;
        return acc + precioTotal - descuentoTotal + ivaTotal;
      }, 0)
    ).toFixed(2);
  };

  const handleDescuentoChange = (codigoArticulo, descuento) => {
    setDescuento((prevDescuento) => ({
      ...prevDescuento,
      [codigoArticulo]: parseInt(descuento, 10),
    }));
  };

  const handleUpdateDescuento = async (docEntry, descuento, originalDescuento) => {
    if (descuento === originalDescuento) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/catalogo/carritoupd/${docEntry}/${descuento}`, {
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update discount in apiData
      const updatedData = apiData.map(item =>
        item.DocEntry === docEntry ? { ...item, Descuento: descuento } : item
      );
      setApiData(updatedData);

    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: `Hubo un error al actualizar el descuento: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  return (
    <div className="pedido-container">
      <Heading as="h1" size="xl" textAlign="center" my={4}>
        Carrito de Compras
      </Heading>
      <Heading as="h2" size="lg" textAlign="center" my={4}>
        Pedido de {cliente} - {clienteName}
      </Heading>
      <Flex justify="space-between" align="center" mb={4}>
        <Box>
          <Flex align="center">
            <Heading as="h3" size="md" mb="4" style={{ paddingRight: '15px' }}>Flete</Heading>
            <Input
              placeholder="Nombre del flete"
              id="nombreFlete"
              type="text"
              size="sm"
              variant="outline"
              value={nombreFlete}
              onChange={(e) => setNombreFlete(e.target.value)}
              mr={2}
            />
            <Input
              id="precioFlete"
              type="number"
              size="sm"
              variant="outline"
              value={precioFlete}
              onChange={(e) => setPrecioFlete(e.target.value)}
            />
          </Flex>
        </Box>
        <Flex>
          <Select
            placeholder="Vendedor"
            value={SelectedSeller}
            onChange={(e) => setSelectedSeller(e.target.value)}
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Button as={Link} to="/" colorScheme="teal" mr={2}>
            Volver
          </Button>
          <Button colorScheme="teal" onClick={handleEnviarOrden}>
            Enviar a SAP
          </Button>
        </Flex>
      </Flex>
      <Box mt={4}>
        <TableContainer>
          <Table variant="striped">
            <Thead>
              <Tr>
                <Th>Cod.Articulo</Th>
                <Th>Nombre</Th>
                <Th>Almacen</Th>
                <Th>Stock</Th>
                <Th>Cantidad Solicitada</Th>
                <Th>Descuento</Th>
                <Th>Impuesto</Th>
                <Th>Precio</Th>
                <Th>Precio Total</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {apiData.length > 0 ? (
                apiData.map((item) => (
                  <Tr key={item.DocEntry}>
                    <Td>{item.CodigoArticulo}</Td>
                    <Td>{item.NombreArticulo.slice(0, 20)}...</Td>
                    <Td>{item.Almacen}</Td>
                    <Td>{item.EnInventario}</Td>
                    <Td>
                      <Input
                        type="number"
                        value={cantidadSolicitada[item.CodigoArticulo] || item.Cant}
                        onChange={(e) => handleCantidadSolicitadaChange(item.CodigoArticulo, e.target.value)}
                        onBlur={() => handleUpdateCantidadSolicitada(item.DocEntry, cantidadSolicitada[item.CodigoArticulo], item.Cant)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateCantidadSolicitada(item.DocEntry, cantidadSolicitada[item.CodigoArticulo], item.Cant);
                          }
                        }}
                        size="sm"
                        variant="outline"
                      />
                    </Td>
                    <Td>
                      <Input
                        type="number"
                        value={descuento[item.CodigoArticulo] || item.Descuento}
                        onChange={(e) => handleDescuentoChange(item.CodigoArticulo, e.target.value)}
                        onBlur={() => handleUpdateDescuento(item.DocEntry, descuento[item.CodigoArticulo], item.Descuento)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateDescuento(item.DocEntry, descuento[item.CodigoArticulo], item.Descuento);
                          }
                        }}
                        size="sm"
                        variant="outline"
                      />
                    </Td>
                    <Td>{item.iva}</Td>
                    <Td>₡{parseFloat(item.Precio).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Td>
                    <Td>₡{parseFloat(item.Precio * (cantidadSolicitada[item.CodigoArticulo] || item.Cant)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Td>
                    <Td>
                      <Button colorScheme="red" onClick={() => handleEliminarItem(item.DocEntry)}>X</Button>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan="11" textAlign="center">No hay artículos en el carrito</Td>
                </Tr>
              )}
              {apiData.length > 0 && (
                <>
                  <Tr>
                    <Td fontWeight="bold">Total</Td>
                    <Td colSpan="3"></Td>
                    <Td>
                      {apiData.reduce((acc, item) => acc + (item.Cant || cantidadSolicitada[item.CodigoArticulo] || item.Cant), 0)}
                    </Td>
                    <Td colSpan="3"></Td>
                    <Td>₡{Intl.NumberFormat('es-CR', { minimumFractionDigits: 2 }).format(calculateTotalPriceItems())}</Td>
                    <Td colSpan="1"></Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Descuento</Td>
                    <Td colSpan="7"></Td>
                    <Td>₡{Intl.NumberFormat('es-CR', { minimumFractionDigits: 2 }).format(calculateTotalDescount())}</Td>
                    <Td colSpan="1"></Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Impuesto</Td>
                    <Td colSpan="7"></Td>
                    <Td>₡{Intl.NumberFormat('es-CR', { minimumFractionDigits: 2 }).format(calculateTotalIVA())}</Td>
                    <Td colSpan="1"></Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Total a Pagar</Td>
                    <Td colSpan="7"></Td>
                    <Td>₡{Intl.NumberFormat('es-CR', { minimumFractionDigits: 2 }).format(calculateTotalPay())}</Td>
                    <Td colSpan="1"></Td>
                  </Tr>
                </>
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </div>
  );
};
