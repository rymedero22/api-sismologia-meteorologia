
import { Router } from "express";
import { query, param, body } from "express-validator";
import { validate } from "../utils/validate.js";
import earthquakeService from "../services/earthquakeService.js";

const router = Router();

// GET /earthquakes/:source?country=[país]
router.get('/:source', validate([
    param('source').isIn(['USGS', 'EMSC', 'DB']).withMessage('Source must be one of USGS, EMSC, or DB'),
    query('country').optional().isString().notEmpty().withMessage('Country query parameter is optional but must be a non-empty string if provided')
]), async (req, res) => {
    try {
        const { source } = req.params;
        const { country } = req.query;

        console.info(`Fetching earthquake data from ${source}${country ? ` for country: ${country}` : ''}`);

        const earthquakeData = await earthquakeService.getEarthquakeData(source, country);

        // Si es un mensaje de "no hay registros", devolver con código 200 pero mensaje específico
        if (earthquakeData.message && earthquakeData.message.includes("No hay registros")) {
            return res.status(200).json(earthquakeData);
        }

        // Si hay error de conexión, devolver 503
        if (earthquakeData.error) {
            return res.status(503).json({
                message: "Servicio temporalmente no disponible",
                details: earthquakeData.error
            });
        }

        // Respuesta exitosa
        res.status(200).json(earthquakeData);

    } catch (error) {
        console.error('Error in GET /:source:', error);
        res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
});

// GET /earthquakes/history/:country
router.get('/history/:country', validate([
    param('country').isString().notEmpty().withMessage('Country parameter is required')
]), async (req, res) => {
    try {
        const { country } = req.params;

        console.log(`Fetching earthquake history for country: ${country}`);

        const historyData = await earthquakeService.getHistoryByCountry(country);

        res.status(200).json(historyData);

    } catch (error) {
        console.error('Error in GET /history/:country:', error);
        res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
});

// POST /earthquakes
router.post('/', validate([
    // Si NO se manda eventId+source USGS/EMSC, los campos manuales son obligatorios
    body('location')
      .if((value, { req }) => !(req.body.eventId && ['USGS', 'EMSC'].includes((req.body.source || '').toUpperCase())))
      .isString().notEmpty().withMessage('Location is required'),
    body('magnitude')
      .if((value, { req }) => !(req.body.eventId && ['USGS', 'EMSC'].includes((req.body.source || '').toUpperCase())))
      .isNumeric().withMessage('Magnitude is required and must be a number'),
    body('depth')
      .if((value, { req }) => !(req.body.eventId && ['USGS', 'EMSC'].includes((req.body.source || '').toUpperCase())))
      .isNumeric().withMessage('Depth is required and must be a number'),
    body('date')
      .if((value, { req }) => !(req.body.eventId && ['USGS', 'EMSC'].includes((req.body.source || '').toUpperCase())))
      .isISO8601().withMessage('Date is required and must be a valid ISO 8601 date format'),
    body('country').optional().isString().notEmpty().withMessage('Country must be a non-empty string if provided'),
    body('eventId').optional().isString(),
    body('source').optional().isString()
]), async (req, res) => {
    try {
        let source = req.body.source ? req.body.source.toUpperCase() : 'LOCAL';
        let eventId = req.body.eventId || null;
        let earthquakeData = null;

        // Si se envía eventId y source USGS/EMSC, buscar en la API externa
        if (eventId && ['USGS', 'EMSC'].includes(source)) {
            // Buscar el evento en la API externa
            let externalData = null;
            if (source === 'USGS') {
                externalData = await earthquakeService.getUSGSEventById(eventId);
            } else if (source === 'EMSC') {
                externalData = await earthquakeService.getEMSCEventById(eventId);
            }
            if (!externalData) {
                return res.status(404).json({
                    message: `No se encontró el evento ${eventId} en ${source}`
                });
            }
            earthquakeData = externalData;
        } else {
            // Si el source no es USGS/EMSC, lo forzamos a LOCAL
            if (!['USGS', 'EMSC'].includes(source)) {
                source = 'LOCAL';
            }
            earthquakeData = {
                location: req.body.location,
                magnitude: parseFloat(req.body.magnitude),
                depth: parseFloat(req.body.depth),
                date: new Date(req.body.date),
                country: req.body.country || null,
                source: source,
                eventId: eventId
            };
        }

        console.info('Saving earthquake data:', earthquakeData);
        const result = await earthquakeService.saveEarthquake(earthquakeData);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error in POST /:', error);

        // Si es error de validación de Mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: "Datos de entrada inválidos",
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        // Si es error de duplicado
        if (error.code === 11000) {
            return res.status(409).json({
                message: "El registro ya existe",
                error: "Duplicate entry"
            });
        }

        res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
});

// DELETE /earthquakes/:id
router.delete('/:id', validate([
    param('id').isMongoId().withMessage('ID must be a valid MongoDB ObjectId')
]), async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`Deleting earthquake with ID: ${id}`);

        const result = await earthquakeService.deleteEarthquake(id);

        res.status(200).json(result);

    } catch (error) {
        console.error('Error in DELETE /:id:', error);

        // Si el terremoto no fue encontrado
        if (error.message.includes('no encontrado')) {
            return res.status(404).json({
                message: "Registro no encontrado",
                error: `No existe un terremoto con ID: ${req.params.id}`
            });
        }

        // Si el ID no es válido
        if (error.name === 'CastError') {
            return res.status(400).json({
                message: "ID inválido",
                error: "El ID proporcionado no tiene un formato válido"
            });
        }

        res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
});

export default router;