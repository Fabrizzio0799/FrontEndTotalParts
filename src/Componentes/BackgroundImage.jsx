import React from "react";
import backgrounImage from "../Imagenes/LOGO_TP.png";


const BackgroundImage = () => {
  return (<>
    <div style={{
      backgroundImage: `url(${backgrounImage})`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      width: '100%',
      height: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: -1,
      opacity: 0.1
    }}>
      
    </div>
    <label style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      fontSize: 14,
      color: 'black',
      opacity: 0.5,
      padding: 5,
      borderRadius: 5,
    }}>© - Created by FCS Consultores</label>
    </>
  );
}

export default BackgroundImage;