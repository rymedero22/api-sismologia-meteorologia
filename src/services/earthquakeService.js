import axios from 'axios';
import Earthquake from '../schemas/earthquake.schema.js';

class EarthquakeService {
  /**
   * Busca un evento USGS por eventId y lo mapea al formato local
   * @param {string} eventId
   * @returns {Promise<Object|null>}
   */
  async getUSGSEventById(eventId) {
    try {
      // 1. Intentar consulta directa por eventId
      const params = {
        format: 'geojson',
        eventid: eventId
      };
      const axios = (await import('axios')).default;
      const response = await axios.get(this.USGS_BASE_URL, {
        params,
        timeout: this.REQUEST_TIMEOUT
      });
      if (response.data && response.data.features && response.data.features.length > 0) {
        const mapped = this.mapUSGSData(response.data.features);
        return mapped[0] || null;
      }
      // 2. Si no se encontró, buscar en el listado reciente de USGS (últimos 100)
      const recent = await this.getEarthquakeData('USGS', null, 100);
      if (Array.isArray(recent)) {
        const found = recent.find(ev => ev.eventId === eventId);
        return found || null;
      }
      return null;
    } catch (error) {
      console.error('Error buscando evento USGS por ID:', error);
      return null;
    }
  }

  /**
   * Busca un evento EMSC por eventId y lo mapea al formato local
   * @param {string} eventId
   * @returns {Promise<Object|null>}
   */
  async getEMSCEventById(eventId) {
    try {
      // Aprovechar la lógica de getEarthquakeData para obtener todos los eventos recientes de EMSC
      // y filtrar por eventId
      const allEvents = await this.getEarthquakeData('EMSC', null, 100); // puedes ajustar el límite si lo deseas
      if (Array.isArray(allEvents)) {
        const found = allEvents.find(ev => ev.eventId === eventId);
        return found || null;
      }
      return null;
    } catch (error) {
      console.error('Error buscando evento EMSC por ID (lógica interna):', error);
      return null;
    }
  }
  
  constructor() {
    // URLs base de las APIs
    this.USGS_BASE_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
    this.EMSC_BASE_URL = 'https://www.seismicportal.eu/fdsnws/event/1/query';
    
    // Configuración por defecto
    this.DEFAULT_LIMIT = 10;
    this.REQUEST_TIMEOUT = 10000; // 10 segundos
  }

  /**
   * Obtiene datos sísmicos según la fuente especificada
   * @param {string} source - Fuente de datos (USGS, EMSC, DB)
   * @param {string} country - País para filtrar (opcional)
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Object>} Datos sísmicos
   */
  async getEarthquakeData(source, country = null, limit = this.DEFAULT_LIMIT) {
    try {
      switch (source.toUpperCase()) {
        case 'USGS':
          return await this.getFromUSGS(country, limit);
        case 'EMSC':
          return await this.getFromEMSC(country, limit);
        case 'DB':
          return await this.getFromDatabase(country, limit);
        default:
          throw new Error(`Fuente no válida: ${source}`);
      }
    } catch (error) {
      console.error(`Error obteniendo datos de ${source}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene datos de la API de USGS
   * @param {string} country - País para filtrar
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Object>} Datos de USGS
   */
  async getFromUSGS(country = null, limit = this.DEFAULT_LIMIT) {
    try {
      const params = {
        format: 'geojson',
        limit: limit,
        orderby: 'time',
        starttime: this.getDateDaysAgo(30) // Últimos 30 días
      };

      const response = await axios.get(this.USGS_BASE_URL, {
        params,
        timeout: this.REQUEST_TIMEOUT
      });

      if (!response.data || !response.data.features || response.data.features.length === 0) {
        return this.createNoDataResponse(country);
      }

      // Procesar y filtrar datos
      let earthquakes = this.mapUSGSData(response.data.features);
      if (country) {
        earthquakes = this.filterByCountry(earthquakes, country);
      }
      earthquakes = earthquakes.slice(0, limit);
      return earthquakes.length > 0 ? earthquakes : this.createNoDataResponse(country);

    } catch (error) {
      console.error('Error conectando con USGS:', error);
      return this.createNoDataResponse(country, 'Error conectando con USGS');
    }
  }

  /**
   * Obtiene datos de la API de EMSC
   * @param {string} country - País para filtrar
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Object>} Datos de EMSC
   */
  async getFromEMSC(country = null, limit = this.DEFAULT_LIMIT) {
    try {
      const params = {
        format: 'json',
        limit: limit,
        orderby: 'time-desc',
        starttime: this.getDateDaysAgo(30) // Últimos 30 días
      };

      const response = await axios.get(this.EMSC_BASE_URL, {
        params,
        timeout: this.REQUEST_TIMEOUT
      });

      console.log('Respuesta EMSC:', response.data);

      // EMSC devuelve los datos en response.data.features
      if (!response.data || !Array.isArray(response.data.features) || response.data.features.length === 0) {
        console.log('No features en respuesta EMSC');
        return this.createNoDataResponse(country);
      }

      // Procesar y filtrar datos
      let earthquakes = this.mapEMSCData(response.data.features);
      console.log('Earthquakes mapeados EMSC:', earthquakes);
      if (country) {
        earthquakes = this.filterByCountry(earthquakes, country);
        console.log('Earthquakes tras filtro país:', earthquakes);
      }
      earthquakes = earthquakes.slice(0, limit);
      console.log('Earthquakes tras slice:', earthquakes);
      return earthquakes.length > 0 ? earthquakes : this.createNoDataResponse(country);

    } catch (error) {
      console.error('Error conectando con EMSC:', error);
      return this.createNoDataResponse(country, 'Error conectando con EMSC');
    }
  }

  /**
   * Obtiene datos de la base de datos local
   * @param {string} country - País para filtrar
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Object>} Datos de la BD
   */
  async getFromDatabase(country = null, limit = this.DEFAULT_LIMIT) {
    try {
      let query = {};
      
      if (country) {
        query.country = new RegExp(country, 'i');
      }

      const earthquakes = await Earthquake.find(query)
        .sort({ date: -1 })
        .limit(limit);
      if (earthquakes.length === 0) {
        return this.createNoDataResponse(country);
      }
      return earthquakes.map(eq => eq.toProjectFormat());

    } catch (error) {
      console.error('Error consultando base de datos:', error);
      throw new Error('Error interno del servidor');
    }
  }

  /**
   * Mapea datos de USGS al formato del proyecto
   * @param {Array} features - Features de USGS
   * @returns {Array} Datos mapeados
   */
  mapUSGSData(features) {
    return features.map(feature => {
      const props = feature.properties || {};
      const coords = feature.geometry && feature.geometry.coordinates ? feature.geometry.coordinates : [];
      const geojsonCoordinates = {
        type: 'Point',
        coordinates: [
          coords[0] !== undefined ? coords[0] : null,
          coords[1] !== undefined ? coords[1] : null
        ]
      };
      return {
        magnitude: props.mag || 0,
        depth: coords[2] || 0,
        location: props.place || 'Ubicación desconocida',
        date: props.time ? new Date(props.time).toISOString().split('T')[0] : null,
        country: this.extractCountryFromLocation(props.place || ''),
        source: 'USGS',
        url: props.url || null,
        title: props.title || null,
        coordinates: geojsonCoordinates,
        eventId: feature.id || props.code || null, // SIEMPRE usar id global, fallback a code si no hay id
        alert: props.alert || null,
        significance: props.sig || null
      };
    });
  }

  /**
   * Mapea datos de EMSC al formato del proyecto
   * @param {Array} events - Eventos de EMSC
   * @returns {Array} Datos mapeados
   */
  mapEMSCData(events) {
    return events.map(feature => {
      const props = feature.properties || {};
      const geom = feature.geometry || {};
      const coords = Array.isArray(geom.coordinates) ? geom.coordinates : [null, null, null];
      const geojsonCoordinates = {
        type: 'Point',
        coordinates: [
          coords[0] !== undefined ? coords[0] : null,
          coords[1] !== undefined ? coords[1] : null
        ]
      };
      return {
        magnitude: props.mag || 0,
        depth: props.depth != null ? props.depth : (coords[2] != null ? coords[2] : 0),
        location: props.flynn_region || props.description || 'Ubicación desconocida',
        date: props.time ? new Date(props.time).toISOString().split('T')[0] : null,
        country: this.extractCountryFromLocation(props.flynn_region || props.description || ''),
        source: 'EMSC',
        coordinates: geojsonCoordinates,
        eventId: feature.id || props.unid || null, // SIEMPRE usar id global, fallback a unid
        alert: null,
        significance: null
      };
    });
  }

  /**
   * Extrae el país de una cadena de ubicación
   * @param {string} location - Cadena de ubicación
   * @returns {string} País extraído
   */
  extractCountryFromLocation(location) {
    if (!location) return 'UNKNOWN';

    // Si hay coma, el país suele estar después de la última coma
    const parts = location.split(',');
    if (parts.length > 1) {
      const possibleCountry = parts[parts.length - 1].trim().toUpperCase();
      // Si contiene un país conocido, lo devolvemos
      const countryPatterns = {
        'CHILE': /chile/i,
        'PERU': /peru|perú/i,
        'MEXICO': /mexico|méxico/i,
        'COLOMBIA': /colombia/i,
        'ECUADOR': /ecuador/i,
        'ARGENTINA': /argentina/i,
        'BOLIVIA': /bolivia/i,
        'VENEZUELA': /venezuela/i,
        'JAPAN': /japan/i,
        'INDONESIA': /indonesia/i,
        'ROMANIA': /romania/i,
        'HAWAII': /hawaii/i,
        'SLOVENIA': /slovenia/i,
        'TURKEY': /turkey/i,
        'AFRICA': /africa/i
      };
      for (const [country, pattern] of Object.entries(countryPatterns)) {
        if (pattern.test(possibleCountry)) {
          return country;
        }
      }
      // Si no, devolvemos el texto igual
      return possibleCountry;
    }
    // Si no hay coma, buscar país por patrones
    const countryPatterns = {
      'CHILE': /chile/i,
      'PERU': /peru|perú/i,
      'MEXICO': /mexico|méxico/i,
      'COLOMBIA': /colombia/i,
      'ECUADOR': /ecuador/i,
      'ARGENTINA': /argentina/i,
      'BOLIVIA': /bolivia/i,
      'VENEZUELA': /venezuela/i,
      'JAPAN': /japan/i,
      'INDONESIA': /indonesia/i,
      'ROMANIA': /romania/i,
      'HAWAII': /hawaii/i,
      'SLOVENIA': /slovenia/i,
      'TURKEY': /turkey/i,
      'AFRICA': /africa/i
    };
    for (const [country, pattern] of Object.entries(countryPatterns)) {
      if (pattern.test(location)) {
        return country;
      }
    }
    return 'UNKNOWN';
  }

  /**
   * Filtra terremotos por país
   * @param {Array} earthquakes - Lista de terremotos
   * @param {string} country - País a filtrar
   * @returns {Array} Terremotos filtrados
   */
  filterByCountry(earthquakes, country) {
    const countryPattern = new RegExp(country, 'i');
    return earthquakes.filter(eq => 
      countryPattern.test(eq.country) || countryPattern.test(eq.location)
    );
  }

  /**
   * Crea respuesta cuando no hay datos
   * @param {string} country - País consultado
   * @param {string} error - Mensaje de error opcional
   * @returns {Object} Respuesta sin datos
   */
  createNoDataResponse(country, error = null) {
    return {
      message: "No hay registros sísmicos",
      country: country || 'ALL',
      error: error
    };
  }

  /**
   * Obtiene fecha de días atrás en formato ISO
   * @param {number} days - Días hacia atrás
   * @returns {string} Fecha en formato ISO
   */
  getDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  /**
   * Guarda un terremoto en la base de datos
   * @param {Object} earthquakeData - Datos del terremoto
   * @returns {Promise<Object>} Terremoto guardado
   */
  async saveEarthquake(earthquakeData) {
    try {
      // Validar que el país esté presente
      if (!earthquakeData.country && earthquakeData.location) {
        earthquakeData.country = this.extractCountryFromLocation(earthquakeData.location);
      }
      // Si coordinates viene en formato antiguo (latitude/longitude), lo convertimos a GeoJSON
      if (earthquakeData && earthquakeData.coordinates && (
        typeof earthquakeData.coordinates.latitude === 'number' && typeof earthquakeData.coordinates.longitude === 'number'
      )) {
        earthquakeData.coordinates = {
          type: 'Point',
          coordinates: [
            earthquakeData.coordinates.longitude,
            earthquakeData.coordinates.latitude
          ]
        };
      }
      // Si el registro es manual (POST sin eventId/source), construimos coordinates si vienen lat/lon sueltos
      if (!earthquakeData.coordinates && typeof earthquakeData.longitude === 'number' && typeof earthquakeData.latitude === 'number') {
        earthquakeData.coordinates = {
          type: 'Point',
          coordinates: [earthquakeData.longitude, earthquakeData.latitude]
        };
      }
      // Si no hay eventId, generar uno único para registros locales
      if (!earthquakeData.eventId) {
        earthquakeData.eventId = `LOCAL-${Date.now()}-${Math.floor(Math.random()*10000)}`;
      }
      // Validar unicidad de eventId (USGS, EMSC, LOCAL)
      const exists = await Earthquake.findOne({ eventId: earthquakeData.eventId });
      if (exists) {
        throw { code: 11000, message: 'Duplicate eventId' };
      }
      const earthquake = new Earthquake(earthquakeData);
      const savedEarthquake = await earthquake.save();
      return {
        id: savedEarthquake._id,
        eventId: savedEarthquake.eventId,
        message: 'Terremoto guardado exitosamente'
      };
    } catch (error) {
      console.error('Error guardando terremoto:', error);
      throw error;
    }
  }

  /**
   * Obtiene historial de terremotos por país
   * @param {string} country - País a consultar
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Object>} Historial de terremotos
   */
  async getHistoryByCountry(country, limit = 50) {
    try {
      const earthquakes = await Earthquake.findByCountry(country, limit);
      
      if (earthquakes.length === 0) {
        return {
          country: country.toUpperCase(),
          message: "No hay registros sísmicos",
          data: []
        };
      }

      return {
        country: country.toUpperCase(),
        data: earthquakes.map(eq => ({
          id: eq._id,
          magnitude: eq.magnitude,
          depth: eq.depth,
          location: eq.location,
          date: eq.date.toISOString().split('T')[0],
          source: eq.source
        }))
      };

    } catch (error) {
      console.error('Error obteniendo historial:', error);
      throw error;
    }
  }

  /**
   * Elimina un terremoto por ID
   * @param {string} id - ID del terremoto
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  async deleteEarthquake(id) {
    try {
      const result = await Earthquake.findByIdAndDelete(id);
      
      if (!result) {
        throw new Error('Terremoto no encontrado');
      }

      return {
        message: `Registro con id ${id} eliminado correctamente`
      };

    } catch (error) {
      console.error('Error eliminando terremoto:', error);
      throw error;
    }
  }
}

export default new EarthquakeService();
