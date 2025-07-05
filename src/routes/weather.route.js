import { Router } from "express";
import { query, param, body } from "express-validator"

import Weather from "../schemas/weather.schema.js";
const router = Router();

import { validate } from "../utils/validate.js"


router.get(`/:source`, validate([
    param('source').isIn(['OpenWeatherMap', 'WeatherApi', 'DB']).withMessage('Source must be one of OpenWeatherMap, WeatherApi, or DB'),
    query('city').isString().notEmpty().withMessage('City query parameter is required')
]), async (req, res) => {
    // ?: source must be like ['OpenWeatherMap','WeatherApi','DB']
    // ?: this endpoint must received a query param named city
    try {
        const source = req.params.source
        const city = req.query.city

        console.info(`Params recieved: ${source} query: ${city}`)
        if (source == 'DB'){
            const weather = await Weather.findOne({ city: city })
            res.status(200).send({
                id : weather._id,
                city: weather.city,
                temperature: weather.temperature,
                humidity: weather.humidity,
                condition: weather.condition
            })
        } else {
            res.send({source})
        }

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal Server Error' })
    }
    
})

router.post('/', validate([
    body('city').notEmpty().withMessage('City is required'),
    body('temperature').isNumeric().withMessage('Weather must be a number'),
    body('humidity').isNumeric().withMessage('Humidity must be a number'),
    body('condition').notEmpty().withMessage('Condition is required')
]), async (req, res) => {
    try {
        console.info(`Params recieved: `, req.body)
        const { city, weather, humidity, condition } = req.body;
        const weatherSaved = await Weather.create({
            city,
            weather,
            humidity,
            condition
        })
        console.info(weatherSaved)
        res.status(201).send({
            id: weatherSaved._id
        })
    } catch (error) {
        console.error(error)
        res.status(500).send({
            message: 'Internal Server Error'
        })

    }
    // ?: this endpoint must received a body with city, weather and humidity

})

router.get(`/history/:city`, validate([
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