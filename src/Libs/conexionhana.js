


/*
// Este archivo contiene los parámetros de conexión a la base de datos HANA
export const connParams = {
    serverNode: 'hana-003.fcscr-cloud.net:30015',
    uid: 'FCSDESAR',
    pwd: 'Fc2024D3!',    
};

const conn = hana.createConnection();

export const queryWhithOutParams = async (query, connectParams) => {
    try {
        await conn.connect(connectParams);
        const result = await conn.exec(query);
        return result;        
    } catch (error) {
        throw error;
    }
    finally {
        conn.disconnect();
    }

}
*/