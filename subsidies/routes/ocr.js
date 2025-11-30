const express = require('express');
const router = express.Router();
const OCRService = require('../services/ocrService');
const { uploadSingle, uploadMultiple } = require('../middleware/uploadMiddleware');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { getString } = require('../utils/languageHelper');
const fs = require('fs');
const path = require('path');

// Middleware to verify JWT token
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: getString('auth.token.missing', 'en')
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'agrovihan_secret_key_2025'
    );

    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return res.status(404).json({
        success: false,
        message: getString('auth.user.not_found', 'en')
      });
    }

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: getString('auth.token.invalid', 'en'),
      error: error.message
    });
  }
};

// @route   POST /api/ocr/process-document
// @desc    Process a single document and extract information
// @access  Private
router.post('/process-document', authenticateUser, uploadSingle('document'), async (req, res) => {
  try {
    const { documentType, language = 'eng' } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file provided'
      });
    }

    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: 'Document type is required (aadhar, landRecord, incomeProof, etc.)'
      });
    }

    const filePath = req.file.path;
    const userLanguage = req.user.language || 'ta';

    console.log(`Processing ${documentType} document for user: ${req.user.email}`);

    // Extract text from document
    const extractionResult = await OCRService.extractText(filePath, language);
    
    let parsedData = {};
    let isValid = false;

    // Parse based on document type
    switch (documentType) {
      case 'aadhar':
        parsedData = await OCRService.parseAadharCard(extractionResult.text);
        isValid = await OCRService.validateDocument('aadhar', parsedData);
        break;
      
      case 'landRecord':
        parsedData = await OCRService.parseLandRecord(extractionResult.text);
        isValid = await OCRService.validateDocument('landRecord', parsedData);
        break;
      
      case 'incomeProof':
        parsedData = await OCRService.parseIncomeProof(extractionResult.text);
        isValid = await OCRService.validateDocument('incomeProof', parsedData);
        break;
      
      default:
        parsedData = { rawText: extractionResult.text };
        isValid = true; // For unknown types, assume valid
    }

    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.warn('Could not delete temporary file:', cleanupError.message);
    }

    res.json({
      success: true,
      message: getString('ocr.process.success', userLanguage),
      documentType,
      extractedData: parsedData,
      validation: {
        isValid,
        confidence: extractionResult.confidence || 'N/A'
      },
      rawText: extractionResult.text ? extractionResult.text.substring(0, 500) + '...' : 'No text extracted'
    });

  } catch (error) {
    console.error('OCR processing error:', error);
    
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Could not delete temporary file on error:', cleanupError.message);
      }
    }

    const userLanguage = req.user?.language || 'ta';
    res.status(500).json({
      success: false,
      message: getString('ocr.process.failed', userLanguage),
      error: error.message
    });
  }
});

// @route   POST /api/ocr/process-multiple
// @desc    Process multiple documents at once
// @access  Private
router.post('/process-multiple', authenticateUser, uploadMultiple('documents'), async (req, res) => {
  try {
    const { documents } = req.body; // Expected: [{type: 'aadhar', language: 'eng'}, ...]
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No documents provided'
      });
    }

    if (!documents || !Array.isArray(documents)) {
      return res.status(400).json({
        success: false,
        message: 'Documents configuration is required'
      });
    }

    if (req.files.length !== documents.length) {
      return res.status(400).json({
        success: false,
        message: 'Number of files does not match documents configuration'
      });
    }

    const userLanguage = req.user.language || 'ta';
    const results = [];

    // Process each document
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const config = documents[i];

      try {
        const extractionResult = await OCRService.extractText(file.path, config.language || 'eng');
        
        let parsedData = {};
        let isValid = false;

        switch (config.type) {
          case 'aadhar':
            parsedData = await OCRService.parseAadharCard(extractionResult.text);
            isValid = await OCRService.validateDocument('aadhar', parsedData);
            break;
          
          case 'landRecord':
            parsedData = await OCRService.parseLandRecord(extractionResult.text);
            isValid = await OCRService.validateDocument('landRecord', parsedData);
            break;
          
          case 'incomeProof':
            parsedData = await OCRService.parseIncomeProof(extractionResult.text);
            isValid = await OCRService.validateDocument('incomeProof', parsedData);
            break;
          
          default:
            parsedData = { rawText: extractionResult.text };
            isValid = true;
        }

        results.push({
          documentType: config.type,
          fileName: file.originalname,
          extractedData: parsedData,
          validation: {
            isValid,
            confidence: extractionResult.confidence || 'N/A'
          },
          status: 'success'
        });

        // Clean up file
        fs.unlinkSync(file.path);

      } catch (fileError) {
        results.push({
          documentType: config.type,
          fileName: file.originalname,
          error: fileError.message,
          status: 'failed'
        });

        // Clean up file on error
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    res.json({
      success: true,
      message: getString('ocr.process.multiple.success', userLanguage, { count: results.filter(r => r.status === 'success').length }),
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'failed').length
      }
    });

  } catch (error) {
    console.error('Multiple OCR processing error:', error);
    
    // Clean up all files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (cleanupError) {
            console.warn('Could not delete temporary file:', cleanupError.message);
          }
        }
      });
    }

    const userLanguage = req.user?.language || 'ta';
    res.status(500).json({
      success: false,
      message: getString('ocr.process.multiple.failed', userLanguage),
      error: error.message
    });
  }
});

// @route   POST /api/ocr/auto-fill-profile
// @desc    Automatically fill user profile from documents
// @access  Private
router.post('/auto-fill-profile', authenticateUser, uploadMultiple('documents'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No documents provided'
      });
    }

    const userLanguage = req.user.language || 'ta';
    const profileUpdates = {};
    const processedDocuments = [];

    // Process each document and collect data
    for (const file of req.files) {
      try {
        const extractionResult = await OCRService.extractText(file.path, 'eng+ tam'); // Support English and Tamil
        
        // Try to detect document type automatically
        const text = extractionResult.text.toLowerCase();
        let documentType = 'unknown';
        
        if (text.includes('aadhar') || text.includes('unique identification') || text.includes('government of india')) {
          documentType = 'aadhar';
          const aadharData = await OCRService.parseAadharCard(extractionResult.text);
          
          if (aadharData.name && !profileUpdates.name) {
            profileUpdates.name = aadharData.name;
          }
          if (aadharData.address) {
            // Extract district from address
            const tamilDistricts = ['chennai', 'coimbatore', 'madurai', 'tiruchirappalli', 'salem', 'erode', 'tirunelveli', 'vellore'];
            for (const district of tamilDistricts) {
              if (aadharData.address.toLowerCase().includes(district)) {
                profileUpdates.district = district.charAt(0).toUpperCase() + district.slice(1);
                break;
              }
            }
          }
          
          processedDocuments.push({
            type: 'aadhar',
            data: aadharData,
            isValid: await OCRService.validateDocument('aadhar', aadharData)
          });

        } else if (text.includes('survey') || text.includes('land') || text.includes('patta') || text.includes('chitta')) {
          documentType = 'landRecord';
          const landData = await OCRService.parseLandRecord(extractionResult.text);
          
          if (landData.area) {
            // Extract numeric area value
            const areaMatch = landData.area.match(/([\d.]+)/);
            if (areaMatch) {
              profileUpdates.landSize = parseFloat(areaMatch[1]);
            }
          }
          if (landData.district && !profileUpdates.district) {
            profileUpdates.district = landData.district;
          }
          
          processedDocuments.push({
            type: 'landRecord',
            data: landData,
            isValid: await OCRService.validateDocument('landRecord', landData)
          });

        } else if (text.includes('income') || text.includes('salary') || text.includes('form 16') || text.includes('itr')) {
          documentType = 'incomeProof';
          const incomeData = await OCRService.parseIncomeProof(extractionResult.text);
          
          if (incomeData.annualIncome) {
            profileUpdates.annualIncome = incomeData.annualIncome;
          }
          
          processedDocuments.push({
            type: 'incomeProof',
            data: incomeData,
            isValid: await OCRService.validateDocument('incomeProof', incomeData)
          });
        }

        // Clean up file
        fs.unlinkSync(file.path);

      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
        processedDocuments.push({
          type: 'unknown',
          fileName: file.originalname,
          error: fileError.message,
          status: 'failed'
        });
        
        // Clean up file on error
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    // Update user profile with extracted data
    if (Object.keys(profileUpdates).length > 0) {
      const updateQuery = {};
      
      if (profileUpdates.name) updateQuery.name = profileUpdates.name;
      if (profileUpdates.district) updateQuery['financialProfile.district'] = profileUpdates.district;
      if (profileUpdates.landSize) updateQuery['financialProfile.landSize'] = profileUpdates.landSize;
      if (profileUpdates.annualIncome) updateQuery['financialProfile.annualIncome'] = profileUpdates.annualIncome;

      await User.findByIdAndUpdate(req.user._id, { $set: updateQuery });
    }

    const updatedUser = await User.findById(req.user._id);

    res.json({
      success: true,
      message: getString('ocr.autoFill.success', userLanguage, { fields: Object.keys(profileUpdates).length }),
      profileUpdates,
      processedDocuments,
      updatedProfile: {
        name: updatedUser.name,
        district: updatedUser.financialProfile.district,
        landSize: updatedUser.financialProfile.landSize,
        annualIncome: updatedUser.financialProfile.annualIncome
      },
      eligibilityScore: updatedUser.calculateEligibilityScore()
    });

  } catch (error) {
    console.error('Auto-fill profile error:', error);
    
    // Clean up all files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (cleanupError) {
            console.warn('Could not delete temporary file:', cleanupError.message);
          }
        }
      });
    }

    const userLanguage = req.user?.language || 'ta';
    res.status(500).json({
      success: false,
      message: getString('ocr.autoFill.failed', userLanguage),
      error: error.message
    });
  }
});

module.exports = router;