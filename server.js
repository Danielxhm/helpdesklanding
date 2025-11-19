const express = require('express');
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');

const app = express();
const port = 3000;
const N8N_URL = "https://governor-europe-robbie-specs.trycloudflare.com/webhook/assistify";
// Lista de carnets autorizados
const CARNEts_AUTORIZADOS = new Set([
    '482915', '037428', '691204', '558392', '824719',
    '109563', '772840', '345912', '983026', '410587'
]);

// Habilitar CORS
app.use(cors());

// Almacenamiento en memoria
let requests = [];
let currentId = 1;


// Middleware para datos no-multipart
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint para obtener solicitudes
app.get('/api/requests', (req, res) => {
    res.json(requests);
});

// Middleware para validar carnet autorizado
const validarCarnet = (req, res, next) => {
    const { numeroCarnet } = req.body;
    
    if (!numeroCarnet) {
        return res.status(400).json({ 
            error: 'El número de carnet es obligatorio' 
        });
    }
    
    // Limpiar y formatear el carnet (eliminar espacios y convertir a string)
    const carnetLimpio = String(numeroCarnet).trim();
    
    if (!CARNEts_AUTORIZADOS.has(carnetLimpio)) {
        console.warn(` Intento de acceso no autorizado con carnet: ${carnetLimpio}`);
        return res.status(403).json({ 
            error: 'Carnet no autorizado. Comuníquese con soporte para habilitar su acceso.',
            carnet: carnetLimpio
        });
    }
    
    // Guardar el carnet limpio para usar en el procesamiento
    req.body.numeroCarnet = carnetLimpio;
    next();
};

// Endpoint para recibir solicitud - CON VALIDACIÓN DE CARNET
app.post("/submit-form", validarCarnet, (req, res) => {
    try {
        const { numeroCarnet, categoria, problema } = req.body;

        if (!categoria || !problema) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios: categoria o problema'
            });
        }

        const newRequest = {
            id: currentId++,
            numeroCarnet,
            categoria,
            problema,
            timestamp: new Date().toISOString()
        };

        requests.push(newRequest);

        console.log(` Nueva solicitud recibida [ID: ${newRequest.id}] de carnet: ${numeroCarnet}`);

        // Mandar solo texto a n8n
        axios.post(N8N_URL, newRequest)
            .then(r => console.log("Enviado a n8n"))
            .catch(err => console.error("Error n8n:", err.message));

        return res.status(201).json({
            message: "Solicitud recibida exitosamente",
            requestId: newRequest.id
        });

    } catch (error) {
        console.error('Error crítico:', error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});


// Endpoint de salud
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        uptime: process.uptime().toFixed(2),
        timestamp: new Date().toISOString(),
        carnetsAutorizados: Array.from(CARNEts_AUTORIZADOS),
        pendingRequests: requests.length
    });
});


// Manejador de errores general
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString()
    });
});
// Servir archivos estáticos 
app.use(express.static('public'));


// Iniciar el servidor
app.listen(port, () => {
    console.log(`\nServidor HelpDesk iniciado en http://localhost:${port}`);
    console.log(`Carnets autorizados: ${Array.from(CARNEts_AUTORIZADOS).join(', ')}`);
    console.log(`\nEndpoints disponibles:`);
    console.log(`   GET  /api/requests  - Listar todas las solicitudes`);
    console.log(`   POST /submit-form  - Enviar nueva solicitud (requiere carnet autorizado)`);
    console.log(`   GET  /health        - Estado del servidor\n`);
});