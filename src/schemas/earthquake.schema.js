import mongoose from 'mongoose';

const earthquakeSchema = new mongoose.Schema({
 // Campos principales requeridos por el proyecto
  location: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 500
  },
  magnitude: { 
    type: Number, 
    required: true,
    min: [0, 'Magnitude cannot be negative'],
    max: [10, 'Magnitude cannot exceed 10'],
    validate: {
      validator: function(v) {
        return v >= 0 && v <= 10;
      },
      message: 'Magnitude must be between 0 and 10'
    }
  },
  depth: { 
    type: Number, 
    required: true,
    min: [0, 'Depth cannot be negative'],
    max: [1000, 'Depth cannot exceed 1000km']
  },
  date: { 
    type: Date, 
    required: true,
    validate: {
      validator: function(v) {
        return v <= new Date();
      },
      message: 'Date cannot be in the future'
    }
  },
  country: { 
    type: String, 
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 100
  },
  
  // Campo para identificar la fuente de datos
  source: { 
    type: String, 
    enum: {
      values: ['USGS', 'EMSC', 'DB'],
      message: 'Source must be USGS, EMSC, or DB'
    },
    default: 'DB',
    required: true
  },
  
  // USGS proporciona estos campos
  title: { 
    type: String,
    trim: true,
    maxlength: 300
  },
  
  // Coordenadas geográficas en formato GeoJSON para soporte 2dsphere
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitud, latitud]
      required: true,
      validate: {
        validator: function(arr) {
          return Array.isArray(arr) && arr.length === 2 && arr[0] >= -180 && arr[0] <= 180 && arr[1] >= -90 && arr[1] <= 90;
        },
        message: 'Coordinates must be [longitude, latitude]'
      }
    }
  },
  
  // Campos adicionales útiles para el proyecto
  eventId: {
    type: String,
    unique: true,
    sparse: true, // Permite múltiples documentos con eventId null
    trim: true
  },
  
  // Metadatos para auditoría y filtros
  region: {
    type: String,
    trim: true
  },
  
  // Tipo de alerta (si está disponible)
  alert: {
    type: String,
    enum: ['green', 'yellow', 'orange', 'red', null],
    default: null
  },
  
  // Significancia del evento (valor de 0-1000)
  significance: {
    type: Number,
    min: 0,
    max: 1000
  }
  
}, { 
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
  collection: 'earthquakes',
  
  // Opciones adicionales de mongoose
  toJSON: { 
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { 
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Índices para optimizar consultas específicas del proyecto
earthquakeSchema.index({ country: 1, date: -1 }); // Para GET /history/:country
earthquakeSchema.index({ magnitude: -1, date: -1 }); // Para búsquedas por magnitud
earthquakeSchema.index({ source: 1 }); // Para filtrar por fuente
earthquakeSchema.index({ date: -1 }); // Para ordenar por fecha
earthquakeSchema.index({ coordinates: '2dsphere' }); // Para consultas geoespaciales
earthquakeSchema.index({ eventId: 1 }, { sparse: true }); // Para evitar duplicados de APIs

// Middleware pre-save para extraer país de la ubicación si no se proporciona
earthquakeSchema.pre('save', function(next) {
  if (!this.country && this.location) {
    // Extraer país de la ubicación (ejemplo: "30km NE of Coquimbo, Chile" -> "CHILE")
    const locationParts = this.location.split(',');
    if (locationParts.length > 1) {
      this.country = locationParts[locationParts.length - 1].trim().toUpperCase();
    }
  }
  next();
});

// Método estático para buscar por país
earthquakeSchema.statics.findByCountry = function(country, limit = 10) {
  return this.find({ 
    country: new RegExp(country, 'i') 
  })
  .sort({ date: -1 })
  .limit(limit);
};

// Método estático para buscar por rango de magnitudes
earthquakeSchema.statics.findByMagnitudeRange = function(minMag, maxMag, limit = 10) {
  return this.find({
    magnitude: { $gte: minMag, $lte: maxMag }
  })
  .sort({ magnitude: -1, date: -1 })
  .limit(limit);
};

// Método para formatear respuesta según requerimientos del proyecto
earthquakeSchema.methods.toProjectFormat = function() {
  return {
    magnitude: this.magnitude,
    depth: this.depth,
    location: this.location,
    date: this.date.toISOString().split('T')[0], // Formato YYYY-MM-DD
    country: this.country,
    source: this.source
  };
};

export default mongoose.model('Earthquake', earthquakeSchema);