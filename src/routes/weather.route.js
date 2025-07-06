import { Router } from 'express';
import { query, param, body } from 'express-validator';
import { validate } from '../utils/validate.js';
import {
  fetchWeather,
  postWeather,
  getHistoryWeather,
  deleteWeather
} from '../controllers/weather.controller.js';

const router = Router();

router.get(
  '/:source',
  validate([
    param('source').isIn(['OpenWeatherMap','WeatherApi','DB']),
    query('city').notEmpty()
  ]),
  fetchWeather
);

router.post(
  '/',
  validate([
    body('city').notEmpty(),
    body('temperature').isNumeric(),
    body('humidity').isNumeric(),
    body('condition').notEmpty()
    .isIn(['Soleado','Nublado','Lluvioso','Tormenta'])
    .withMessage('Condition must be one of: Soleado, Nublado, Lluvioso, Tormenta')
  ]),
  postWeather
);

router.get(
  '/history/:city',
  validate([param('city').notEmpty()]),
  getHistoryWeather
);

router.delete(
  '/:id',
  validate([param('id').notEmpty()]),
  deleteWeather
);

export default router;
