// src/services/weather.service.js

import axios from 'axios';

/**
 * Llama a OpenWeatherMap y mapea la respuesta.
 * @param {string} city
 */
async function fetchFromOpenWeatherMap(city) {
    const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather`,
        {
            params: {
                q: city,
                units: 'metric',
                appid: process.env.OPENWEATHERMAP_KEY
            }
        }
    );
    const data = response.data;
    return {
        city: data.name,
        temperature: data.main.temp,
        humidity: data.main.humidity,
        condition: data.weather[0].main
    };
}

/**
 * Llama a WeatherAPI y mapea la respuesta.
 * @param {string} city
 */
async function fetchFromWeatherAPI(city) {
    const response = await axios.get(
        `http://api.weatherapi.com/v1/current.json`,
        {
            params: {
                key: process.env.WEATHERAPI_KEY,
                q: city
            }
        }
    );
    const data = response.data;
    return {
        city: data.location.name,
        temperature: data.current.temp_c,
        humidity: data.current.humidity,
        condition: data.current.condition.text
    };
}

/**
 * Selector de API remota según fuente.
 * @param {string} source  'OpenWeatherMap' | 'WeatherApi'
 * @param {string} city
 */
export async function fetchFromAPI(source, city) {
    const key = source.toLowerCase();
    if (key === 'weatherapi') {
        return fetchFromWeatherAPI(city);
    } else if (key === 'openweathermap') {
        return fetchFromOpenWeatherMap(city);
    } else {
        throw new Error(`Fuente meteorológica inválida: ${source}`);
    }
}

/**
 * Trae todos los registros locales de Mongo ordenados de más reciente a más antiguo.
 * @param {string} city
 * @param {import('mongoose').Model} WeatherModel
 */
export async function fetchFromDB(city, WeatherModel) {
    return WeatherModel.find({ city }).sort({ _id: -1 }).lean();
}

/**
 * Servicio unificado:
 * - si source==='DB' → lee de BD local (el más reciente o null)
 * - si es otra fuente → llama a la API remota
 * @param {string} source  'OpenWeatherMap' | 'WeatherApi' | 'DB'
 * @param {string} city
 * @param {import('mongoose').Model} WeatherModel
 */
export async function getWeather(source, city, WeatherModel) {
    const key = source.toLowerCase();
    if (key === 'db') {
        const registros = await fetchFromDB(city, WeatherModel);
        return registros.length ? registros[0] : null;
    }
    // API remota
    return fetchFromAPI(source, city);
}
