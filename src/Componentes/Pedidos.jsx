import React, { useEffect, useState } from 'react';
import { Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td, Drawer, DrawerBody, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, useDisclosure, Input } from '@chakra-ui/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logoPdf from "../Imagenes/LOGO_TP.png";
import { faBold } from '@fortawesome/free-solid-svg-icons';

const CarritoCompleto = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [searchKey, setSearchKey] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [fleteValues, setFleteValues] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/catalogo/carritocompleto');
      setData(response.data);
      initializeFleteValues(response.data);
    } catch (error) {
      console.error("There was an error fetching the data!", error);
    }
  };

  const initializeFleteValues = (data) => {
    const values = data.reduce((acc, item) => {
      if (!acc[item.DocNum]) {
        acc[item.DocNum] = {
          fleteNombre: item.FleteNombre || '',
          fletePrecio: item.FletePrecio || 0
        };
      }
      return acc;
    }, {});
    setFleteValues(values);
  };

  const groupByCustomerAndOrder = (orders) => {
    return orders.reduce((acc, item) => {
      if (!acc[item.Comentario]) {
        acc[item.Comentario] = {};
      }
      if (!acc[item.Comentario][item.DocNum]) {
        acc[item.Comentario][item.DocNum] = [];
      }
      acc[item.Comentario][item.DocNum].push(item);
      return acc;
    }, {});
  };

  const openOrders = data.filter(item => item.Status === 2);
  const closedOrders = data.filter(item => item.Status === 3);

  const groupedOpenOrders = groupByCustomerAndOrder(openOrders);
  const groupedClosedOrders = groupByCustomerAndOrder(closedOrders);

  const filteredCustomers = (groupedOrders) => {
    return Object.keys(groupedOrders).filter(customer =>
      customer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  const handleModifyOrder = (order) => {
    setSelectedOrder(order);
    const orderItems = groupedOpenOrders[order.Comentario][order.DocNum];
    setCarrito(orderItems);
    onOpen();
  };

  const handleQuantityChange = async (item, newQuantity) => {
    if (newQuantity <= 0) {
      Swal.fire({
        title: 'Error',
        text: 'La cantidad no puede ser menor a 0',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    } else if (newQuantity > item.EnInventario) {
      Swal.fire({
        title: 'Error',
        text: `No hay suficiente stock, disponible: ${item.EnInventario}`,
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    const data = {
      ...item,
      Cant: newQuantity
    };

    try {
      const response = await fetch(`http://localhost:3000/api/catalogo/carritoupt/${item.DocEntry}/${newQuantity}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Error actualizando la cantidad');
      }

      const updatedData = await response.json();
      if (updatedData.success) {
        setCarrito((prev) =>
          prev.map((ci) => (ci.DocEntry === item.DocEntry ? { ...ci, Cant: newQuantity } : ci))
        );
        updateOrderInData(selectedOrder.Comentario, selectedOrder.DocNum, { ...item, Cant: newQuantity });
      } else {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo actualizar la cantidad',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      Swal.fire({
        title: 'Error',
        text: `Error actualizando la cantidad: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleDiscountChange = async (item, newDiscount) => {
    const data = {
      ...item,
      Descuento: newDiscount
    };

    try {
      const response = await fetch(`http://localhost:3000/api/catalogo/carritoupd/${item.DocEntry}/${newDiscount}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Error actualizando el descuento');
      }

      const updatedData = await response.json();
      if (updatedData.success) {
        setCarrito((prev) =>
          prev.map((ci) => (ci.DocEntry === item.DocEntry ? { ...ci, Descuento: newDiscount } : ci))
        );
        updateOrderInData(selectedOrder.Comentario, selectedOrder.DocNum, { ...item, Descuento: newDiscount });
      } else {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo actualizar el descuento',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error updating discount:', error);
      Swal.fire({
        title: 'Error',
        text: `Error actualizando el descuento: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

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
            const newData = data.filter((item) => item.DocEntry !== docEntry);
            setData(newData);
            if (selectedOrder) {
              const newCarrito = carrito.filter((item) => item.DocEntry !== docEntry);
              setCarrito(newCarrito);
            }
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

  const handleEnviarASAP = async () => {
    const documentLines = carrito.map(item => ({
      ItemCode: item.CodigoArticulo,
      Quantity: item.Cant,
      U_Ubica_Port: item.Almacen,
      DiscountPercent: item.Descuento
    }));

    const documentAdditionalExpenses = [{
      ExpenseCode: 1,
      LineTotal: parseFloat(fleteValues[selectedOrder.DocNum].fletePrecio),
      Remarks: fleteValues[selectedOrder.DocNum].fleteNombre,
      TaxCode: "IVA13S",
      U_tipo_documento: 99
    }];

    const dataToSend = {
      DocDueDate: new Date().toISOString().split('T')[0],
      DocumentLines: documentLines,
      Comments: await Swal.fire({
        title: 'Comentarios',
        input: 'textarea',
        inputPlaceholder: 'Ingrese los comentarios aquí...',
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return 'Necesita escribir algo!';
          }
        }
      }).then(result => result.value),
      DocumentAdditionalExpenses: documentAdditionalExpenses
    };
    const estado = selectedOrder.DocNum;
    if (dataToSend.DocumentLines.length === 0) {
      Swal.fire({
        title: 'Error',
        text: 'No hay artículos en el pedido',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }
    if (dataToSend.Comments === undefined) {
      Swal.fire({
        title: 'Error',
        text: 'Necesita ingresar comentarios',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      Swal.fire({
        title: 'Enviando orden de venta a SAP...',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false
      });
      const response = await fetch(`http://localhost:3000/api/catalogo/uptsap/${estado}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        throw new Error(`Error HTTP! estado: ${response.status}`);
      } else {
        Swal.fire({
          title: 'Éxito',
          text: 'Pedido enviado a SAP correctamente',
          icon: 'success',
          confirmButtonText: 'OK'
        });
        fetchData();
        onClose();
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: `Hubo un error al enviar el pedido a SAP: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleCloseOrder = async (estado) => {
    const Comments = await Swal.fire({
      title: 'Agregar Comentario',
      input: 'textarea',
      inputPlaceholder: 'Ingrese los comentarios aquí...',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return 'Necesita escribir algo!';
        } else if (value.length < 50) {
          return 'El comentario debe tener al menos 50 caracteres.';
        }
      }
    }).then(result => result.value);

    if (!Comments) return;

    try {
      Swal.fire({
        title: 'Cerrando orden en SAP...',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false
      });
      const response = await fetch(`http://localhost:3000/api/catalogo/closeorder/${estado}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ Comments })
      });

      if (!response.ok) {
        throw new Error(`Error HTTP! estado: ${response.status}`);
      } else {
        Swal.fire({
          title: 'Éxito',
          text: 'Pedido cerrado correctamente',
          icon: 'success',
          confirmButtonText: 'OK'
        });
        fetchData();
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: `Hubo un error al cerrar el pedido: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleFleteNombreBlur = async (e, estado) => {
    const newName = e.target.value;
    setFleteValues(prev => ({
      ...prev,
      [estado]: {
        ...prev[estado],
        fleteNombre: newName
      }
    }));

    const regex = /^[a-zA-Z0-9\s]*$/;


    try {
      if (!regex.test(newName)) {
        Swal.fire({
          title: 'Error',
          text: 'El nombre del flete solo puede contener letras y números',
          icon: 'warning',
          confirmButtonText: 'OK'
        });
        return;
      }
      const response = await fetch(`http://localhost:3000/api/catalogo/carritoupfn/${estado}/${newName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error actualizando el nombre del flete');
      }

      const updatedData = await response.json();
      if (updatedData.success) {

        fetchData();
      } else {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo actualizar el nombre del flete',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error updating flete nombre:', error);
      Swal.fire({
        title: 'Error',
        text: `Error actualizando el nombre del flete: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleFletePrecioBlur = async (e, estado) => {
    const newPrice = e.target.value;
    setFleteValues(prev => ({
      ...prev,
      [estado]: {
        ...prev[estado],
        fletePrecio: newPrice
      }
    }));
    const regex = /^[0-9]+([,.][0-9]{1,2})?$/;

    try {
      if (!regex.test(newPrice)) {
        Swal.fire({
          title: 'Error',
          text: 'El precio del flete solo puede contener números y máximo dos decimales',
          icon: 'warning',
          confirmButtonText: 'OK'
        });
        return;
      }
      const response = await fetch(`http://localhost:3000/api/catalogo/carritoupfp/${estado}/${newPrice}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error actualizando el precio del flete');
      }

      const updatedData = await response.json();
      if (updatedData.success) {

        fetchData();
      } else {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo actualizar el precio del flete',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error updating flete precio:', error);
      Swal.fire({
        title: 'Error',
        text: `Error actualizando el precio del flete: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const calculateTotalPrice = () => {
    return carrito.reduce((total, item) => total + (item.Cant * parseFloat(item.Precio) * (1 - item.Descuento / 100)), 0).toFixed(2);
  };

  const calculateTotalItems = () => {
    return carrito.reduce((total, item) => total + item.Cant, 0);
  };

  const handleSearch = async () => {
    try {
      if (!searchKey) {
        Swal.fire({
          title: 'Error',
          text: 'Debe ingresar un término de búsqueda',
          icon: 'warning',
          confirmButtonText: 'OK'
        });
        return;
      }
      const regex = /^[a-zA-Z0-9\s]*$/;
      if (!regex.test(searchKey)) {
        Swal.fire({
          title: 'Error',
          text: 'El término de búsqueda solo puede contener letras y números',
          icon: 'warning',
          confirmButtonText: 'OK'
        });
        return;
      }
      const response = await fetch(`http://localhost:3000/api/catalogo/detailsbyname/${searchKey}`);
      if (!response.ok) {
        throw new Error('Error fetching search results');
      }
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Error fetching search results:', error);
      Swal.fire({
        title: 'Error',
        text: `Error fetching search results: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleAddToOrder = async (item) => {
    const existingItem = carrito.find(ci => ci.CodigoArticulo === item.CodigoArticulo);
    if (existingItem) {
      Swal.fire({
        title: 'Error',
        text: 'El artículo ya está en el pedido',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    const newItem = {
      ...item,
      CardCode: selectedOrder.CardCode,
      Cant: 1,
      Comentario: selectedOrder.Comentario,
      Descuento: 0,
      iva: "IVA13B",
      Estado: selectedOrder.DocNum,
      Status: 2
    };

    try {
      const response = await fetch('http://localhost:3000/api/catalogo/carritoinfo/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newItem)
      });

      if (!response.ok) {
        throw new Error('Error adding item to order');
      }

      const addedItem = await response.json();
      if (addedItem.success) {
        setCarrito((prev) => [...prev, newItem]);
        Swal.fire({
          title: 'Éxito',
          text: 'Artículo agregado al pedido',
          icon: 'success',
          confirmButtonText: 'OK'
        });
        updateOrderInData(selectedOrder.Comentario, selectedOrder.DocNum, newItem);
      } else {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo agregar el artículo al pedido',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error adding item to order:', error);
      Swal.fire({
        title: 'Error',
        text: `Error adding item to order: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const updateOrderInData = (comentario, estado, updatedItem) => {
    setData(prevData =>
      prevData.map(order =>
        order.Comentario === comentario && order.DocNum === estado && order.DocEntry === updatedItem.DocEntry
          ? updatedItem
          : order
      )
    );
  };

  const generatePDF = (customer, orderItems) => {
    const doc = new jsPDF();
    
    // Asegúrate de que orderItems no esté vacío
    if (orderItems.length === 0) {
      console.error("No hay items en la orden");
      return;
    }
  
    // Extraer DocNum de un item cualquiera de orderItems
    const { DocNum, CardCode, Comentario, Vendedor, TipoPago, DocDate, DocDueDate, TextoUsuario } = orderItems[0];
  
    // Ajustar el tamaño del encabezado
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text('TOTAL PARTS GUANACASTE, S.A', 90, 12); 
    doc.setFont("helvetica", "normal");
    // Ajustar el tamaño y la posición del texto
    doc.setFontSize(10); 
    doc.text('Cedula Juridica 3-101657980', 90, 20); 
    doc.text('Dirección: 75 metros Oeste de la Municipalidad de Liberia', 90, 25); 
    doc.text('Teléfono: +(506)2665-2512', 90, 30); 
    doc.text('E-Mail: tc12@airestp.com', 150, 30);
    
    // Ajustar el tamaño y la posición del logotipo
    doc.addImage(logoPdf, 'PNG', 14, 5, 70, 40); 
  
    // Cambiar la fuente a bold y escribir el texto
    doc.setFontSize(12); // Ajustar el tamaño de la fuente si es necesario
    doc.setFont("helvetica", "bold");
    doc.text(`Pedido de cliente No. ${DocNum}`, 100, 44);
    doc.line(90, 45, 190, 45);
    doc.text(`Cliente:  ${CardCode} - ${Comentario}`, 14, 55); 
    
    // Ajustar el tamaño y la posición del texto de la orden de compra
    doc.text(`Fecha: ${DocDate}`, 150, 55); 
    doc.text(`Fecha Entrega: ${DocDueDate}`, 150, 65); 
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10); 
  
    const tableColumn = ["Código", "Descripción del producto/Servicio", "Cantidad", "Precio Unitario", "SubTotal"];
    const tableRows = [];
    
    orderItems.forEach(item => {
      const orderData = [
        item.CodigoArticulo,
        item.NombreArticulo,
        item.Cant,
        parseFloat(item.Precio).toLocaleString(undefined, { minimumFractionDigits: 2 }),
        (item.Cant * parseFloat(item.Precio)).toLocaleString(undefined, { minimumFractionDigits: 2 })
      ];
      tableRows.push(orderData);
    });
    
    // Ajustar el tamaño y la posición de la tabla
    const startY = 80;
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: startY,
      margin: { bottom: 30 }, // Dejar espacio para la línea y el texto de paginación
      didDrawPage: function (data) {
        // Posición después de la tabla
        let finalY = data.cursor.y;
  
        // Añadir texto después de la tabla
        doc.text(`Condiciones de pago: ${TipoPago}`, 14, finalY + 10);
        doc.text(`Vendedor: ${Vendedor}`, 14, finalY + 20);
        doc.text(`Comentarios:`, 14, finalY + 30);
        doc.text(`${TextoUsuario}`, 14, finalY + 33);
        
        // Calcular impuestos y total
        const totalImpuesto = orderItems.reduce((acc, item) => acc + ((item.Cant * parseFloat(item.Precio)) * 0.13), 0);
        const subtotal = orderItems.reduce((acc, item) => acc + (item.Cant * parseFloat(item.Precio)), 0);
        const total = subtotal + totalImpuesto;

        
        doc.text(`Impuesto: ${totalImpuesto.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 150, finalY + 50);
        doc.line(150, finalY + 51, 200, finalY + 51);
        doc.text(`Total: ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 150, finalY + 55);
  
        // Línea separadora al final de la página
        const pageHeight = doc.internal.pageSize.height;
        doc.line(10, pageHeight - 20, 200, pageHeight - 20);
  
        // Agregar paginación
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        doc.text(`Página ${data.pageNumber} de ${pageCount}`, 100, pageHeight - 10, null, null, 'center');
      }
    });
  
    doc.save(`order_${customer}.pdf`);
  };
  
  

  return (
    <Box p="4">
      <Input
        placeholder='Buscar cliente'
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        mb="4"
      />
      <Heading as="h1" size="lg" mb="4">Órdenes Abiertas</Heading>
      <Accordion allowMultiple mb="6">
        {(searchTerm ? filteredCustomers(groupedOpenOrders) : Object.keys(groupedOpenOrders)).map(customer => (
          <AccordionItem key={customer}>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  Cliente: {customer}
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <Accordion allowMultiple>
                {Object.keys(groupedOpenOrders[customer]).map(order => (
                  <AccordionItem key={order}>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          Pedido: {order}
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <Button style={{ marginLeft: '20px', marginBottom: '25px', marginTop: '0px' }} colorScheme="teal" size="sm" onClick={() => handleModifyOrder(groupedOpenOrders[customer][order][0])}>
                        Modificar Pedido
                      </Button>
                      <Button colorScheme="red" style={{ marginLeft: '20px', marginBottom: '25px', marginTop: '0px' }} size="sm" onClick={() => handleCloseOrder(order)}>Cerrar Pedido</Button>
                      <Button colorScheme="blue" style={{ marginLeft: '20px', marginBottom: '25px', marginTop: '0px' }} size="sm" onClick={() => generatePDF(customer, groupedOpenOrders[customer][order])}>Generar PDF</Button>
                      <Box>
                        <Heading as="h3" size="md" mb="4">Flete</Heading>
                        <Input
                          style={{ width: '10%', marginRight: '40px' }}
                          placeholder="Nombre del flete"
                          value={fleteValues[order]?.fleteNombre || ''}
                          onChange={(e) => setFleteValues(prev => ({
                            ...prev,
                            [order]: {
                              ...prev[order],
                              fleteNombre: e.target.value
                            }
                          }))}
                          onBlur={(e) => handleFleteNombreBlur(e, order)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleFleteNombreBlur(e, order); }}
                        />
                        <Input
                          style={{ width: '10%' }}
                          placeholder="Precio del flete"
                          type="number"
                          value={fleteValues[order]?.fletePrecio || 0}
                          onChange={(e) => setFleteValues(prev => ({
                            ...prev,
                            [order]: {
                              ...prev[order],
                              fletePrecio: e.target.value
                            }
                          }))}
                          onBlur={(e) => handleFletePrecioBlur(e, order)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleFletePrecioBlur(e, order); }}
                        />
                      </Box>
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Artículo</Th>
                            <Th>Cantidad</Th>
                            <Th>Descuento</Th>
                            <Th>Precio</Th>
                            <Th>Acción</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {groupedOpenOrders[customer][order].map(item => (
                            <Tr key={item.DocEntry}>
                              <Td>{item.NombreArticulo}</Td>
                              <Td>{item.Cant}</Td>
                              <Td>{item.Descuento}%</Td>
                              <Td>₡{parseFloat(item.Precio).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Td>

                              <Td>
                                <Button colorScheme="red" size="sm" onClick={() => handleEliminarItem(item.DocEntry)}>
                                  Eliminar
                                </Button>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>

      <Heading as="h1" size="lg" mb="4">Órdenes Cerradas</Heading>
      <Accordion allowMultiple>
        {(searchTerm ? filteredCustomers(groupedClosedOrders) : Object.keys(groupedClosedOrders)).map(customer => (
          <AccordionItem key={customer}>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  Cliente: {customer}
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <Accordion allowMultiple>
                {Object.keys(groupedClosedOrders[customer]).map(order => (
                  <AccordionItem key={order}>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          Pedido: {order}
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Artículo</Th>
                            <Th>Cantidad</Th>
                            <Th>Precio</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {groupedClosedOrders[customer][order].map(item => (
                            <Tr key={item.DocEntry}>
                              <Td>{item.NombreArticulo}</Td>
                              <Td>{item.Cant}</Td>
                              <Td>₡{parseFloat(item.Precio).toFixed(2)}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Modificar Pedido</DrawerHeader>
          <DrawerBody>
            <Heading as="h3" size="md" mb="4">Artículos en el Pedido</Heading>
            <Table variant="simple" mb="4">
              <Thead>
                <Tr>
                  <Th>Artículo</Th>
                  <Th>Cantidad</Th>
                  <Th>Descuento</Th>
                  <Th>Precio</Th>
                </Tr>
              </Thead>
              <Tbody >
                {carrito.length > 0 ? (
                  carrito.map((item, index) => (
                    <Tr key={index}>
                      <Td >{item.NombreArticulo.slice(0,20)}...</Td>
                      <Td style={{ display: 'flex' }}>
                        <button onClick={() => handleQuantityChange(item, item.Cant - 1)} style={{ paddingRight: '10px', fontSize: '25px' }}><strong>-</strong></button>
                        <Input
                          style={{ width: '50px' }}
                          type="number"
                          value={item.Cant}
                          onChange={(e) => setCarrito((prev) =>
                            prev.map((ci) => (ci.DocEntry === item.DocEntry ? { ...ci, Cant: parseInt(e.target.value) } : ci))
                          )}
                          onBlur={(e) => handleQuantityChange(item, parseInt(e.target.value))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleQuantityChange(item, parseInt(e.target.value));
                            }
                          }}
                          min="0"
                          max={item.EnInventario}
                        />
                        <button onClick={() => handleQuantityChange(item, item.Cant + 1)} style={{ paddingLeft: '8px', fontSize: '20px' }}><strong>+</strong></button>
                      </Td>
                      <Td>
                        <Input
                          type="number"
                          value={item.Descuento}
                          onChange={(e) => setCarrito((prev) =>
                            prev.map((ci) => (ci.DocEntry === item.DocEntry ? { ...ci, Descuento: parseFloat(e.target.value) } : ci))
                          )}
                          onBlur={(e) => handleDiscountChange(item, parseFloat(e.target.value))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleDiscountChange(item, parseFloat(e.target.value));
                            }
                          }}
                          min="0"
                          max="100"
                        />
                      </Td>
                      <Td>₡{parseFloat(item.Precio).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Td>

                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan="4" style={{ textAlign: 'center' }}>No hay artículos en el carrito</Td>
                  </Tr>
                )}
                {carrito.length > 0 && (
                  <Tr>
                    <Td colSpan="1" style={{ textAlign: 'left', fontWeight: 'bold' }}><strong>Total</strong></Td>
                    <Td colSpan="1" style={{ textAlign: 'center', fontWeight: 'bold' }}>{calculateTotalItems()} </Td>
                    <Td colSpan="1"></Td>
                    <Td><strong>₡{Intl.NumberFormat('es-CR', { minimumFractionDigits: 2 }).format(calculateTotalPrice())}</strong></Td>
                  </Tr>
                )}
              </Tbody>
            </Table>

            <Heading as="h3" size="md" mb="4">Agregar Nuevos Artículos</Heading>
            <Box mb="4">
              <Input
                placeholder="Buscar artículo"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              <Button mt="2" colorScheme="teal" onClick={handleSearch}>Buscar</Button>
            </Box>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Artículo</Th>
                  <Th>Inventario</Th>
                  <Th>Precio</Th>
                  <Th>Acción</Th>
                </Tr>
              </Thead>
              <Tbody>
                {searchResults.length > 0 ? (
                  searchResults.map((item, index) => (
                    <Tr key={index}>
                      <Td>{item.NombreArticulo}</Td>
                      <Td>{item.EnInventario}</Td>
                      <Td>₡{parseFloat(item.Precio).toFixed(2)}</Td>
                      <Td>
                        <Button colorScheme="teal" size="sm" onClick={() => handleAddToOrder(item)}>
                          Agregar
                        </Button>
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan="4" style={{ textAlign: 'center' }}>No se encontraron artículos</Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </DrawerBody>
          <DrawerFooter>

            <Button variant="outline" mr={3} onClick={onClose}>
              Cerrar
            </Button>
            <Button colorScheme="teal" onClick={() => { handleEnviarASAP(); onClose(); }}>Enviar a SAP</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default CarritoCompleto;
