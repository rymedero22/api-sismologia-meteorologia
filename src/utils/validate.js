// utils/validate.js
import { body, validationResult } from 'express-validator';

// Validaciones para Clima
export const weatherValidations = [
  body('city').notEmpty().withMessage('Ciudad es requerida'),
  body('temperature').isNumeric().withMessage('Temperatura debe ser numérica'),
  body('humidity').isInt({ min: 0, max: 100 }).withMessage('Humedad inválida'),
];

// Validaciones para Sismos
export const earthquakeValidations = [
  body('magnitude').isFloat({ min: 1, max: 10 }).withMessage('Magnitud inválida'),
  body('depth').isInt({ min: 1 }).withMessage('Profundidad inválida'),
  body('location').notEmpty().withMessage('Ubicación es requerida'),
];


export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() }); // 400 en lugar de 408
    }
    next();
  };
};