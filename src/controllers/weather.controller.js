// src/controllers/weather.controller.js

import Weather from '../schemas/weather.schema.js';
import { fetchFromAPI, fetchFromDB } from '../services/weather.service.js';

/**
 * GET /weather/:source?city=Ciudad
 * - Si source es DB → devuelve el último registro guardado
 * - Si source es OpenWeatherMap o WeatherApi → llama a la API remota y devuelve datos (sin guardar)
 */
export async function fetchWeather(req, res) {
  try {
    const source = req.params.source;
    const city   = req.query.city;

    if (source === 'DB') {
      const registros = await fetchFromDB(city, Weather);
      if (!registros.length) {
        return res.status(404).json({ message: 'No hay registros climáticos' });
      }
      return res.json(registros[0]);
    }

    // Remoto → sólo leer de la API, no persisto
    const data = await fetchFromAPI(source, city);
    return res.json(data);

  } catch (err) {
    console.error('fetchWeather error:', err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * POST /weather
 * Guarda un reporte manual en la BD local
 */
export async function postWeather(req, res) {
  try {
    const { city, temperature, humidity, condition } = req.body;
    const weatherSaved = await Weather.create({ city, temperature, humidity, condition });
    return res.status(201).json({ id: weatherSaved._id });
  } catch (err) {
    console.error('postWeather error:', err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * GET /weather/history/:city
 * Devuelve todos los registros guardados para esa ciudad
 */
export async function getHistoryWeather(req, res) {
  try {
    const city = req.params.city;
    const registros = await fetchFromDB(city, Weather);
    return res.json(registros);
  } catch (err) {
    console.error('getHistoryWeather error:', err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * DELETE /weather/:id
 * Elimina un registro guardado por POST
 */
export async function deleteWeather(req, res) {
  try {
    const deleted = await Weather.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    return res.json({ message: `Registro con id ${req.params.id} eliminado correctamente` });
  } catch (err) {
    console.error('deleteWeather error:', err);
    return res.status(500).json({ message: err.message });
  }
}
