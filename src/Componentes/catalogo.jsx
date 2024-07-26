import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import { showLoadingAlert, closeLoadingAlert } from "../Asistente/fetchData";
import Swal from "sweetalert2";
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerCloseButton,
  Table,
  Tbody,
  Td,
  Th,
  Tr,
  useDisclosure,
  Thead,
  Input
} from "@chakra-ui/react";
import "../Estilos/catalogo.css";
import Factura from "../Imagenes/icon_factura.svg";

const Catalogo = () => {
  const [filterType, setFilterType] = useState('1');
  const [searchKey, setSearchKey] = useState('');
  const [apiData, setApiData] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(localStorage.getItem('selectedEmail') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [carrito, setCarrito] = useState([]);
  const itemsPerPage = 48;
  const { isOpen, onOpen, onClose } = useDisclosure();


  useEffect(() => {
    const fetchClients = async () => {
      try {
        showLoadingAlert();
        const response = await fetch('http://localhost:3000/api/client');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setClientes(data);
      } catch (error) {
        console.error('Error fetching clients:', error);
        Swal.fire({
          title: 'Error',
          text: `Hubo un error al cargar los clientes: ${error.message}`,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } finally {
        closeLoadingAlert();
      }
    };

    fetchClients();
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedEmail', selectedEmail);
    if (selectedEmail) {
      fetchCarrito();
    }
  }, [selectedEmail]);

  const fetchCarrito = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/catalogo/carrito/${selectedEmail}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCarrito(data);
    } catch (error) {
      console.error('Error fetching carrito:', error);
    }
  };

  const fetchApiData = async (url) => {
    try {
      showLoadingAlert();
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`No hay resultados para la búsqueda: ${searchKey}`);
      }
      const data = await response.json();
      setApiData(data);
      setCurrentPage(1); 
      Swal.fire({
        title: 'Éxito',
        text: 'Datos cargados correctamente',
        icon: 'success',
        confirmButtonText: 'OK'
      }); 
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire({
        title: 'Error',
        text: `Hubo un error al cargar los datos: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      
    }
  };

  const handleSearch = () => {
    if (!filterType || !searchKey) {
      Swal.fire({
        title: 'Error',
        text: 'Necesita seleccionar un filtro y llenar el campo de búsqueda',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    let url = 'http://localhost:3000/api/catalogo/';
    switch (filterType) {
      case '1':
        url += `detailsbyname/${searchKey}`;
        break;
      case '2':
        url += `detailsbyid/${searchKey}`;
        break;
      case '3':
        url += `detailsbycategory/${searchKey}`;
        break;
      case '4':
        url += `detailsbystore/${searchKey}`;
        break;
      default:
        break;
    }
    fetchApiData(url);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddToCart = (item) => {
    if (!selectedEmail) {
      Swal.fire({
        title: 'Error',
        text: 'Debe seleccionar un cliente antes de agregar un producto al carrito',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }
  
    Swal.fire({
      title: 'Agregar al carrito',
      text: 'Seleccione la cantidad',
      input: 'number',
      inputPlaceholder: `Cantidad (max ${item.EnInventario})`,
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || isNaN(value) || value <= 0) {
          return 'Debe ingresar una cantidad válida mayor a cero';
        } else if (value > item.EnInventario) {
          return `No puede seleccionar más de ${item.EnInventario} artículos`;
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const cantidad = parseInt(result.value);

        const nombreCliente = clientes.find(cliente => cliente.CodigoCliente === selectedEmail).NombreCliente;
        const data = {
          CodigoArticulo: item.CodigoArticulo,
          NombreArticulo: item.NombreArticulo,
          Almacen: item.Almacen,
          TextoUsuario: item.TextoUsuario,
          Categoria: item.Categoria,
          EnInventario: item.EnInventario,
          Precio: item.Precio,
          CardCode: selectedEmail,
          Status: 1,
          Cant: cantidad,
          Comentario: nombreCliente,
          Descuento: 0,
          iva: "IVA13B",
          Estado: "0"
        };
  
        fetch('http://localhost:3000/api/catalogo/carritoinfo/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            Swal.fire({
              title: 'Éxito',
              text: 'Producto agregado al carrito correctamente',
              icon: 'success',
              confirmButtonText: 'OK'
            });
            fetchCarrito(); // Update carrito state
          } else {
            Swal.fire({
              title: 'Error',
              text: 'No se pudo agregar el producto al carrito',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        })
        .catch((error) => {
          Swal.fire({
            title: 'Error',
            text: 'No se pudo agregar el producto al carrito'+error,
            icon: 'error',
            confirmButtonText: 'OK'
          });
        });
      }
    });
  };

  const fechaActual = new Date().toISOString().split('T')[0];

  const navigate = useNavigate();

  const handlePedido = () => {
    const clienteData = clientes.find(cliente => cliente.CodigoCliente === selectedEmail);
    navigate('/Pedido', {
      state: {
        cliente: selectedEmail,
        clienteName: clienteData.NombreCliente
      }
    });
  };

  const totalPages = Math.ceil(apiData.length / itemsPerPage);

  const currentData = apiData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const imgurl = `http://localhost:2001/imagenTopal/`;

  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const options = clientes.map(cliente => ({
    value: cliente.CodigoCliente,
    label: cliente.NombreCliente
  }));

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
          prev.map((ci) => (ci.CodigoArticulo === item.CodigoArticulo ? { ...ci, Cant: newQuantity } : ci))
        );
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
          prev.map((ci) => (ci.CodigoArticulo === item.CodigoArticulo ? { ...ci, Descuento: newDiscount } : ci))
        );
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

  const calculateTotalPrice = () => {
    return carrito.reduce((acc, item) => acc + (item.Cant * parseFloat(item.Precio) * (1- item.Descuento / 100)), 0).toFixed(2)
  }

  return (
    <div className="main-container">
      <div className="button-group"></div>
      <div className="filter-group">
        <div className="filter-item">
          <label>Fecha</label>
          <input type="date" value={fechaActual} readOnly />
        </div>
        <div className="filter-item">
          <label>Cliente</label>
          <Select
            placeholder="Buscar cliente"
            value={options.find(option => option.value === selectedEmail)}
            onChange={(option) => setSelectedEmail(option.value)}
            options={options}
          />
        </div>
        <div className="filter-item">
          <label>Filtro</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">Seleccione un filtro</option>
            <option value="1">Nombre de articulo</option>
            <option value="2">Código del Artículo</option>
            <option value="3">Categoria</option>
            <option value="4">Ubicacion</option>
          </select>
        </div>
        <div className="filter-item">
          <label>Búsqueda</label>
          <input
            type="text"
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            onKeyDown={handleKeyPress}
          />
        </div>
      </div>
      <div className="search-button-container">
        <button className="search-button" onClick={handleSearch}>Buscar</button>
      </div>
      <div className="product-container">
        {currentData.map((item) => (
          <div className="product" key={item.DocEntry}>
            <div>
              <img
                src={imgurl + item.TextoUsuario}
                alt={item.NombreArticulo}
              />
              <div>
                <h4>{item.NombreArticulo}</h4>
                <p>Código: {item.CodigoArticulo}</p>
                <p>Ubicacion: {item.Almacen.replace("1-X001-", "")}</p>
                <p>Categoria: {item.Categoria}</p>
                <p>Inventario: {item.EnInventario}</p>
                <div>
                  <button className="add-button" onClick={() => handleAddToCart(item)} style={{ color: 'white' }}><strong>CRC {parseFloat(item.Precio).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {apiData.length > itemsPerPage && (
        <div className="pagination-container">
          <button className="pagination-button" onClick={handlePreviousPage} disabled={currentPage === 1}>
            Anterior
          </button>
          <span>Página {currentPage} de {totalPages}</span>
          <button className="pagination-button" onClick={handleNextPage} disabled={currentPage === totalPages}>
            Siguiente
          </button>
        </div>
      )}
      <button className="floating-button" onClick={onOpen}><img src={Factura} alt="" style={{ maxHeight: '45px', maxWidth: '45px' }} /></button>
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size={'lg'}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Carrito</DrawerHeader>
          <DrawerBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Nombre</Th>
                  <Th style={{textAlign:'center'}}>Cant.</Th>
                  <Th>Precio</Th>
                  <Th>Descuento</Th>
                </Tr>
              </Thead>
              <Tbody>
                {carrito.length > 0 ? (
                  carrito.map((item, index) => (
                    <Tr key={index}>
                      <Td>{item.NombreArticulo.slice(0,20)}...</Td>
                      <Td style={{display:'flex'}}>
                        <button onClick={() => handleQuantityChange(item, item.Cant - 1)} style={{paddingRight:'10px', fontSize:'25px'}}><strong>-</strong></button>
                        <Input
                          style={{width:'auto', textAlign:'center'}}
                          type="number"
                          value={item.Cant}
                          onChange={(e) => setCarrito((prev) => 
                            prev.map((ci) => (ci.CodigoArticulo === item.CodigoArticulo ? { ...ci, Cant: parseInt(e.target.value) } : ci))
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
                        <button onClick={() => handleQuantityChange(item, item.Cant + 1)} style={{paddingLeft:'8px', fontSize:'20px'}}><strong>+</strong></button>
                      </Td>
                      <Td>₡{parseFloat(item.Precio).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Td>
                      <Td>
                        <Input
                          type="number"
                          value={item.Descuento}
                          onChange={(e) => setCarrito((prev) => 
                            prev.map((ci) => (ci.CodigoArticulo === item.CodigoArticulo ? { ...ci, Descuento: parseFloat(e.target.value) } : ci))
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
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan="4" style={{ textAlign: 'center' }}>No hay artículos en el carrito</Td>
                  </Tr>
                )}
                {carrito.length > 0 && (
                  <Tr>
                    <Td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}><strong>Total</strong></Td>
                    <Td><strong>₡{Intl.NumberFormat('es-CR',{minimumFractionDigits: 2}).format(calculateTotalPrice())}</strong></Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
            
          </DrawerBody>
          <DrawerFooter>
            <button className="action-button" style={{ marginRight: '85px' }} onClick={handlePedido}>
              <Link to="/Pedido">Enviar a SAP</Link>
            </button>
            <button className="action-button" style={{ borderColor: 'gray', backgroundColor: 'whitesmoke', color: 'black' }} onClick={onClose}>Cerrar</button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Catalogo;
