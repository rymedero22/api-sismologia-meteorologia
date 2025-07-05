
import { Router } from "express";
import { query, param, body } from "express-validator"

import { validate } from "../utils/validate.js"

const router = Router();

router.get(`/:source`, validate([
    param('source').isIn(['USGS', 'EMSC', 'DB']).withMessage('Source must be one of USGS, EMSC, or DB'),
    query('country').isString().notEmpty().withMessage('Country query parameter is optional but must be a non-empty string if provided')
]), (req, res) =>{
    // ?: source must be in ['USGS', 'EMSC', 'DB']
    const source = req.params.source
    const country = req.query.country   

    res.send({
        'magnitude': 5.4,
        'depth': 30,
        'location': 'Cochimbo, Chile',
        'date': "2023-04-04"
    })
})

router.get(`/history/:country`, param('country').isString().notEmpty().withMessage('country is required') , (req, res) =>{
    const country = req.params.country
    console.log(`Params recieved: ${country}`)
        res.send({
            'country': country? country : 'Lima',
            'data': [
                {
                    'magnitude': 5.4,
                    'depth': 30,
                    'location': 'Cochimbo, Chile',
                    'date': "2023-04-04"
                }
            ]
        })
})


router.post('/', validate([
    body('location').isString().notEmpty().withMessage('Location is required'),
    body('magnitude').isNumeric().withMessage('Magnitude is required and must be a number'),
    body('depth').isNumeric().withMessage('Depth is required and must be a number'),
    body('date').isISO8601().withMessage('Date is required and must be a valid ISO 8601 date format')
]),(req, res) => {
    console.info(`Params recieved: ${req.body}`)
    res.send({
        'id': 'sismo_id12312'
    })
})


router.delete(`/:id`, param('id').notEmpty().withMessage('Id is required'), (req, res) => {
    const id = req.params.id
    console.log(`Params recieved: ${id}`)
        res.send({
            'message': `Registro con id ${id} eliminado correctamente`
        });
    });

export default router;