import {Nav, Navbar, NavLink} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { UserProvider } from '../Contextos/UserProvider';
import { useAuth } from '../Contextos/AuthProvider';
import "../Estilos/navbar.css"
import SAP from "../Imagenes/LogoB.png"
import Home from "../Imagenes/Home.svg"
import Profile from "../Imagenes/profile.svg"
import out from "../Imagenes/out.svg"


const NavBar = () => {
  const { user } = useAuth();

  const {signout} = useAuth()

    return (
      <Navbar collapseOnSelect expand="sm" style={{ backgroundColor: '#319BA8' }} bg={false} variant={false}>
        <Navbar.Toggle aria-controls="navbarScroll" data-bs-target="navbarScroll" />
        <Navbar.Collapse  id="responsive-navbar-nav">
          <Nav>
            
            
            <NavLink as={Link} className='nav-link-bold' to="/" style={{fontSize: '30px', marginRight: '10px',marginLeft: '10px', display: 'flex', alignItems: 'center', color: 'white'}}><img src={Home} alt='' style={{maxHeight: '25px', maxWidth: '25px', marginRight:'5px'}}/>Total Parts</NavLink>
            {/*<NavLink as={Link} className='nav-link-bold' to="/Manual" style={{fontSize: '30px', marginRight: '10px',marginLeft: '10px', color: 'white'}}>Manual</NavLink>*/}
            <NavLink as={Link} className='nav-link-bold' to="/Borrador" style={{fontSize: '30px', marginRight: '10px',marginLeft: '10px', color: 'white'}}>Borrador</NavLink>
            <NavLink as={Link} className='nav-link-bold' to="/Pedidos" style={{fontSize: '30px', marginRight: '10px',marginLeft: '10px', color: 'white'}}>Ordenes</NavLink>
          </Nav>
          <Nav className="ms-auto">
            {SAP&&<img src={SAP} alt="logo" style={{ width: '50px', marginLeft: '10px' }} />}
            {user&&<NavLink as={Link} to="/login"  onClick={async () => {await signout();console.log("salir")}}><img src={out} style={{ width: '40px', marginLeft: '10px' }}/></NavLink>}
            {!user&&<NavLink as={Link} to="/login" ><img src={Profile} style={{ width: '40px', marginLeft: '10px' }}/></NavLink>}
            <NavLink as={Link} to="/login"></NavLink>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );
  }


export default NavBar;