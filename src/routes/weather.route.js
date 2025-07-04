import { Router } from "express";
import { query, param, body } from "express-validator"
const router = Router();

import { validate } from "../utils/validate.js"


router.get(`/:source`,validate([
    param('source').isIn(['OpenWeatherMap', 'WeatherApi', 'DB']).withMessage('Source must be one of OpenWeatherMap, WeatherApi, or DB'),
    query('city').isString().notEmpty().withMessage('City query parameter is required')
]), (req, res) => {
    // ?: source must be like ['OpenWeatherMap','WeatherApi','DB']
    // ?: this endpoint must received a query param named city
    const source = req.params.source
    const city = req.query.city   

    console.info(`Params recieved: ${source} query: ${city}`)
    res.send({
        city,
        "temperature": 22.5,
        'humidity': 78,
        'condition': 'Nublado'
    })
})

router.post('/', validate([
    body('city').isString().notEmpty().withMessage('City is required'),
    body('temperature').isNumeric().withMessage('Weather must be a number'),
    body('humidity').isNumeric().withMessage('Humidity must be a number'),
    body('condition').isString().notEmpty().withMessage('Condition is required')
]), (req, res) => {
    // ?: this endpoint must received a body with city, weather and humidity
    console.info(`Params recieved: ${req.body}`)
    const { city, weather, humidity } = req.body;
    res.send({
        'id': 'clima_id12312'
    })
})

router.get(`/history/:city`,validate([
    param('city').isString().notEmpty().withMessage('City parameter is required')
]), (req, res) => {

    console.log(`Params recieved: ${req.params.city}`)
    const city = req.params.city
    res.send({
        city,
        'data': [
            {
                'id': 'clima_id12312',
                'registro': 'retorna los registros climatologicos historicos buscados en la base de datos',
            }
        ]
    })
})

router.delete(`/:id`, validate([
    param('id').notEmpty().withMessage('ID parameter is required')
]), (req, res) => {
    const id = req.params.id
    console.log(`Params recieved: ${id}`)
    res.send({
        'message': `Registro con id ${id} eliminado correctamente`
    })
})

export default router;