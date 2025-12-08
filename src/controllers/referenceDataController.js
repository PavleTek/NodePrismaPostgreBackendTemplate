const prisma = require('../lib/prisma');

// Get all countries
const getCountries = async (req, res) => {
  try {
    const { important } = req.query;
    const where = {};
    
    if (important !== undefined) {
      where.important = important === 'true';
    }
    
    const countries = await prisma.country.findMany({
      where,
      orderBy: { name: 'asc' }
    });
    
    res.status(200).json({
      message: 'Countries retrieved successfully',
      countries
    });
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all currencies
const getCurrencies = async (req, res) => {
  try {
    const { important } = req.query;
    const where = {};
    
    if (important !== undefined) {
      where.important = important === 'true';
    }
    
    const currencies = await prisma.currency.findMany({
      where,
      orderBy: { name: 'asc' }
    });
    
    res.status(200).json({
      message: 'Currencies retrieved successfully',
      currencies
    });
  } catch (error) {
    console.error('Get currencies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all languages
const getLanguages = async (req, res) => {
  try {
    const { important } = req.query;
    const where = {};
    
    if (important !== undefined) {
      where.important = important === 'true';
    }
    
    const languages = await prisma.language.findMany({
      where,
      orderBy: { name: 'asc' }
    });
    
    res.status(200).json({
      message: 'Languages retrieved successfully',
      languages
    });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update country important flag
const updateCountryImportant = async (req, res) => {
  try {
    const { id } = req.params;
    const { important } = req.body;
    
    if (typeof important !== 'boolean') {
      res.status(400).json({ error: 'important must be a boolean' });
      return;
    }
    
    const country = await prisma.country.update({
      where: { id: parseInt(id) },
      data: { important }
    });
    
    res.status(200).json({
      message: 'Country updated successfully',
      country
    });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Country not found' });
    } else {
      console.error('Update country important error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Update currency important flag
const updateCurrencyImportant = async (req, res) => {
  try {
    const { id } = req.params;
    const { important } = req.body;
    
    if (typeof important !== 'boolean') {
      res.status(400).json({ error: 'important must be a boolean' });
      return;
    }
    
    const currency = await prisma.currency.update({
      where: { id: parseInt(id) },
      data: { important }
    });
    
    res.status(200).json({
      message: 'Currency updated successfully',
      currency
    });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Currency not found' });
    } else {
      console.error('Update currency important error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Update language important flag
const updateLanguageImportant = async (req, res) => {
  try {
    const { id } = req.params;
    const { important } = req.body;
    
    if (typeof important !== 'boolean') {
      res.status(400).json({ error: 'important must be a boolean' });
      return;
    }
    
    const language = await prisma.language.update({
      where: { id: parseInt(id) },
      data: { important }
    });
    
    res.status(200).json({
      message: 'Language updated successfully',
      language
    });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Language not found' });
    } else {
      console.error('Update language important error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = {
  getCountries,
  getCurrencies,
  getLanguages,
  updateCountryImportant,
  updateCurrencyImportant,
  updateLanguageImportant
};

