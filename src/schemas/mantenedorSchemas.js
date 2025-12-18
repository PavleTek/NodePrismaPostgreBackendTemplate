/**
 * Mantenedor Validation Schemas (OPTIONAL)
 * 
 * Validation is OPTIONAL - if no schema exists for a type, data is accepted as-is.
 * This allows for rapid development while still supporting validation when needed.
 * 
 * To add validation for a type, add a schema entry below.
 * 
 * Schema structure:
 * - fields: object defining each field with:
 *   - type: 'string' | 'number' | 'boolean' | 'array' | 'object'
 *   - required: boolean
 *   - reference: optional, references another mantenedor type
 *   - validate: optional, custom validation function
 */

const schemas = {
  // Add validation schemas here only when you need them.
  // Types without schemas will accept any data.
  // 
  // Example:
  // INVOICE_CONCEPT: {
  //   fields: {
  //     code: { type: 'string', required: true },
  //     costTypeId: { type: 'number', required: true, reference: 'COST_TYPE' },
  //   },
  // },
};

/**
 * Validates a mantenedor's data against its type schema
 * If no schema exists, validation is SKIPPED (returns valid: true)
 * 
 * @param {string} type - The mantenedor type
 * @param {object} data - The data object to validate
 * @param {Function} referenceChecker - Async function to check if a reference exists
 * @returns {Promise<{valid: boolean, errors: string[]}>}
 */
async function validateMantenedor(type, data, referenceChecker) {
  const schema = schemas[type];
  const errors = [];

  // No schema = no validation required, allow everything
  if (!schema) {
    return { valid: true, errors: [] };
  }

  for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
    const value = data[fieldName];

    // Check required fields
    if (fieldSchema.required && (value === undefined || value === null || value === '')) {
      errors.push(`Field '${fieldName}' is required`);
      continue;
    }

    // Skip validation if field is not present and not required
    if (value === undefined || value === null) {
      continue;
    }

    // Type validation
    switch (fieldSchema.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`Field '${fieldName}' must be a string`);
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`Field '${fieldName}' must be a number`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`Field '${fieldName}' must be a boolean`);
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`Field '${fieldName}' must be an array`);
        }
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          errors.push(`Field '${fieldName}' must be an object`);
        }
        break;
    }

    // Reference validation
    if (fieldSchema.reference && referenceChecker) {
      const exists = await referenceChecker(fieldSchema.reference, value);
      if (!exists) {
        errors.push(`Field '${fieldName}' references non-existent ${fieldSchema.reference} with id ${value}`);
      }
    }

    // Custom validation
    if (fieldSchema.validate && typeof fieldSchema.validate === 'function') {
      const customError = fieldSchema.validate(value);
      if (customError) {
        errors.push(customError);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Gets the schema for a given type
 * @param {string} type - The mantenedor type
 * @returns {object|null} The schema or null if not found
 */
function getSchema(type) {
  return schemas[type] || null;
}

/**
 * Checks if a type has validation enabled
 * @param {string} type - The mantenedor type
 * @returns {boolean} True if validation schema exists
 */
function hasValidation(type) {
  return !!schemas[type];
}

module.exports = {
  schemas,
  validateMantenedor,
  getSchema,
  hasValidation,
};
