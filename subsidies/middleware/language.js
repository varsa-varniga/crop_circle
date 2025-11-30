const { getString } = require('../utils/languageHelper');

const languageMiddleware = (req, res, next) => {
  // Get language from user preference, query param, or header
  req.language = req.user?.language || 
                 req.query.lang || 
                 req.headers['accept-language']?.split(',')[0] || 
                 'tamil';
  
  // Add translation function to response
  res.translate = (key, variables = {}) => {
    return getString(key, req.language, variables);
  };
  
  next();
};

module.exports = languageMiddleware;