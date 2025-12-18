const prisma = require('../lib/prisma');
const { validateMantenedor } = require('../schemas/mantenedorSchemas');

/**
 * Helper to increment the global mantenedores version
 * Must be called within a transaction
 */
async function incrementVersion(tx) {
  const config = await tx.configuration.findFirst();
  if (config) {
    await tx.configuration.update({
      where: { id: config.id },
      data: { mantenedoresVersion: { increment: 1 } },
    });
  } else {
    await tx.configuration.create({
      data: { mantenedoresVersion: 1 },
    });
  }
}

/**
 * Reference checker for validating cross-references between mantenedores
 */
async function createReferenceChecker(tx) {
  return async (type, id) => {
    const item = await tx.mantenedor.findFirst({
      where: { type, id: parseInt(id) },
    });
    return !!item;
  };
}

/**
 * Get the current mantenedores version
 */
const getVersion = async (req, res) => {
  try {
    let config = await prisma.configuration.findFirst();
    
    if (!config) {
      config = await prisma.configuration.create({
        data: { mantenedoresVersion: 0 },
      });
    }

    res.status(200).json({
      version: config.mantenedoresVersion,
    });
  } catch (error) {
    console.error('Get version error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all mantenedores
 * Returns items grouped by type
 */
const getAll = async (req, res) => {
  try {
    const mantenedores = await prisma.mantenedor.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    let config = await prisma.configuration.findFirst();
    if (!config) {
      config = await prisma.configuration.create({
        data: { mantenedoresVersion: 0 },
      });
    }

    // Group by type
    const itemsByType = {};
    for (const item of mantenedores) {
      if (!itemsByType[item.type]) {
        itemsByType[item.type] = [];
      }
      itemsByType[item.type].push({
        id: item.id,
        name: item.name,
        ...item.data,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
    }

    res.status(200).json({
      version: config.mantenedoresVersion,
      itemsByType,
    });
  } catch (error) {
    console.error('Get all mantenedores error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get mantenedores by type
 * Accepts any type string - no validation against predefined types
 */
const getByType = async (req, res) => {
  try {
    const { type } = req.params;

    // Just validate type is a non-empty string
    if (!type || typeof type !== 'string') {
      return res.status(400).json({ error: 'Type parameter is required' });
    }

    const mantenedores = await prisma.mantenedor.findMany({
      where: { type },
      orderBy: { name: 'asc' },
    });

    const items = mantenedores.map(item => ({
      id: item.id,
      name: item.name,
      ...item.data,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    res.status(200).json({ items });
  } catch (error) {
    console.error('Get by type error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get a single mantenedor by id
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const mantenedor = await prisma.mantenedor.findUnique({
      where: { id: parseInt(id) },
    });

    if (!mantenedor) {
      return res.status(404).json({ error: 'Mantenedor not found' });
    }

    res.status(200).json({
      item: {
        id: mantenedor.id,
        type: mantenedor.type,
        name: mantenedor.name,
        ...mantenedor.data,
        createdAt: mantenedor.createdAt,
        updatedAt: mantenedor.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create a new mantenedor
 * Accepts any type string - validation is optional (only runs if schema exists)
 */
const create = async (req, res) => {
  try {
    const { type, name, ...data } = req.body;

    // Validate type is a non-empty string
    if (!type || typeof type !== 'string' || type.trim().length === 0) {
      return res.status(400).json({ error: 'Type is required' });
    }

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Use transaction for validation and creation
    const result = await prisma.$transaction(async (tx) => {
      // Create reference checker within transaction
      const referenceChecker = await createReferenceChecker(tx);

      // Validate data against schema (optional - skips if no schema exists)
      const validation = await validateMantenedor(type, data, referenceChecker);
      if (!validation.valid) {
        throw { status: 400, errors: validation.errors };
      }

      // Create mantenedor
      const mantenedor = await tx.mantenedor.create({
        data: {
          type: type.trim(),
          name: name.trim(),
          data,
        },
      });

      // Increment version
      await incrementVersion(tx);

      return mantenedor;
    });

    res.status(201).json({
      message: 'Mantenedor created successfully',
      item: {
        id: result.id,
        type: result.type,
        name: result.name,
        ...result.data,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
    });
  } catch (error) {
    if (error.status && error.errors) {
      return res.status(error.status).json({ errors: error.errors });
    }
    console.error('Create mantenedor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update an existing mantenedor
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, ...data } = req.body;

    // Find existing mantenedor
    const existing = await prisma.mantenedor.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Mantenedor not found' });
    }

    // Use transaction for validation and update
    const result = await prisma.$transaction(async (tx) => {
      // Create reference checker within transaction
      const referenceChecker = await createReferenceChecker(tx);

      // Merge existing data with new data
      const mergedData = { ...existing.data, ...data };

      // Validate merged data against schema (optional - skips if no schema exists)
      const validation = await validateMantenedor(existing.type, mergedData, referenceChecker);
      if (!validation.valid) {
        throw { status: 400, errors: validation.errors };
      }

      // Prepare update data
      const updateData = { data: mergedData };
      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
          throw { status: 400, errors: ['Name must be a non-empty string'] };
        }
        updateData.name = name.trim();
      }

      // Update mantenedor
      const mantenedor = await tx.mantenedor.update({
        where: { id: parseInt(id) },
        data: updateData,
      });

      // Increment version
      await incrementVersion(tx);

      return mantenedor;
    });

    res.status(200).json({
      message: 'Mantenedor updated successfully',
      item: {
        id: result.id,
        type: result.type,
        name: result.name,
        ...result.data,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
    });
  } catch (error) {
    if (error.status && error.errors) {
      return res.status(error.status).json({ errors: error.errors });
    }
    console.error('Update mantenedor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete a mantenedor
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Find existing mantenedor
    const existing = await prisma.mantenedor.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Mantenedor not found' });
    }

    // Use transaction for deletion and version increment
    await prisma.$transaction(async (tx) => {
      await tx.mantenedor.delete({
        where: { id: parseInt(id) },
      });

      await incrementVersion(tx);
    });

    res.status(200).json({
      message: 'Mantenedor deleted successfully',
    });
  } catch (error) {
    console.error('Delete mantenedor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all unique types currently in the database
 * Returns types that actually have data stored
 */
const getTypes = async (req, res) => {
  try {
    // Get distinct types from the database
    const typesResult = await prisma.mantenedor.findMany({
      select: { type: true },
      distinct: ['type'],
      orderBy: { type: 'asc' },
    });

    const types = typesResult.map(t => t.type);
    res.status(200).json({ types });
  } catch (error) {
    console.error('Get types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getVersion,
  getAll,
  getByType,
  getById,
  create,
  update,
  remove,
  getTypes,
};
