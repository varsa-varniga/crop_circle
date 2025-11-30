const tesseract = require('tesseract.js');
const pdf = require('pdf-parse');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class OCRService {
  constructor() {
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.pdf', '.tiff', '.bmp', '.txt'];
  }

  // Extract text from any document
  async extractText(filePath, language = 'eng') {
    try {
      const ext = path.extname(filePath).toLowerCase();
      
      console.log(`🔍 Processing file: ${filePath}, Type: ${ext}`);
      
      if (ext === '.pdf') {
        return await this.extractFromPDF(filePath);
      } else if (ext === '.txt') {
        return await this.extractFromText(filePath);
      } else {
        return await this.extractFromImage(filePath, language);
      }
    } catch (error) {
      console.error('❌ OCR extraction error:', error);
      throw new Error(`OCR extraction failed: ${error.message}`);
    }
  }

  // Extract text from text files
  async extractFromText(filePath) {
    try {
      const text = fs.readFileSync(filePath, 'utf8');
      console.log(`📄 Text file content: ${text.substring(0, 200)}...`);
      
      return {
        text: text,
        confidence: 100,
        words: text.split(' '),
        lines: text.split('\n')
      };
    } catch (error) {
      console.error('❌ Text file reading error:', error);
      throw new Error(`Text file reading failed: ${error.message}`);
    }
  }

  // Extract text from PDF
  async extractFromPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      console.log(`📄 PDF content: ${data.text.substring(0, 200)}...`);
      
      return {
        text: data.text,
        pages: data.numpages,
        info: data.info
      };
    } catch (error) {
      console.error('❌ PDF extraction error:', error);
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  // Extract text from image using Tesseract
  async extractFromImage(filePath, language = 'eng') {
    try {
      console.log(`🖼️ Processing image: ${filePath}`);
      
      // Pre-process image for better OCR
      const processedImage = await this.preprocessImage(filePath);
      
      console.log('🔧 Starting Tesseract OCR...');
      
      const { data } = await tesseract.recognize(processedImage, language, {
        logger: m => console.log('Tesseract:', m)
      });

      console.log(`✅ Image OCR completed. Confidence: ${data.confidence}`);
      console.log(`📝 Extracted text: ${data.text.substring(0, 200)}...`);

      // Clean up processed image
      if (processedImage !== filePath && fs.existsSync(processedImage)) {
        fs.unlinkSync(processedImage);
      }

      return {
        text: data.text,
        confidence: data.confidence,
        words: data.words,
        lines: data.lines
      };
    } catch (error) {
      console.error('❌ Image OCR error:', error);
      throw new Error(`Image OCR failed: ${error.message}`);
    }
  }

  // Pre-process image for better OCR results
  async preprocessImage(filePath) {
    try {
      const processedPath = path.join(
        path.dirname(filePath), 
        `processed_${Date.now()}_${path.basename(filePath)}`
      );
      
      console.log(`🔄 Preprocessing image: ${filePath} -> ${processedPath}`);
      
      await sharp(filePath)
        .grayscale()           // Convert to grayscale
        .normalize()           // Enhance contrast
        .sharpen({ sigma: 1 }) // Sharpen image
        .linear(1.2, -0.1)     // Increase contrast
        .toFile(processedPath);

      console.log('✅ Image preprocessing completed');
      return processedPath;
      
    } catch (error) {
      console.warn('⚠️ Image preprocessing failed, using original:', error.message);
      return filePath;
    }
  }

  // Parse Aadhar card specific data
  async parseAadharCard(text) {
    const aadharData = {
      aadharNumber: null,
      name: null,
      gender: null,
      yearOfBirth: null,
      address: null
    };

    try {
      console.log('🔍 Parsing Aadhar card data...');
      
      // Extract Aadhar number (12 digits)
      const aadharRegex = /\b\d{4}\s?\d{4}\s?\d{4}\b/g;
      const aadharMatch = text.match(aadharRegex);
      if (aadharMatch) {
        aadharData.aadharNumber = aadharMatch[0].replace(/\s/g, '');
        console.log(`✅ Aadhar Number: ${aadharData.aadharNumber}`);
      }

      // Extract name - multiple patterns
      const namePatterns = [
        /Name[:\s]*([^\n\r]+)/i,
        /Name\s*Of\s*Holder[:\s]*([^\n\r]+)/i,
        /([A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+)/ // Simple name pattern
      ];

      for (const pattern of namePatterns) {
        const nameMatch = text.match(pattern);
        if (nameMatch && nameMatch[1] && nameMatch[1].trim().length > 3) {
          aadharData.name = nameMatch[1].trim();
          console.log(`✅ Name: ${aadharData.name}`);
          break;
        }
      }

      // Extract gender
      const genderRegex = /Gender[:\s]*([^\n\r]+)/i;
      const genderMatch = text.match(genderRegex);
      if (genderMatch) {
        aadharData.gender = genderMatch[1].trim();
        console.log(`✅ Gender: ${aadharData.gender}`);
      }

      // Extract year of birth
      const yearRegex = /Year of Birth[:\s]*([^\n\r]+)/i;
      const yearMatch = text.match(yearRegex);
      if (yearMatch) {
        aadharData.yearOfBirth = yearMatch[1].trim();
        console.log(`✅ Year of Birth: ${aadharData.yearOfBirth}`);
      }

      // Extract address
      const addressRegex = /Address[:\s]*([^\n\r]+)/i;
      const addressMatch = text.match(addressRegex);
      if (addressMatch) {
        aadharData.address = addressMatch[1].trim();
        console.log(`✅ Address: ${aadharData.address}`);
      }

      console.log('✅ Aadhar parsing completed:', aadharData);
      return aadharData;
      
    } catch (error) {
      console.error('❌ Aadhar parsing error:', error);
      return aadharData;
    }
  }

  // Parse Land Record specific data
  async parseLandRecord(text) {
    const landData = {
      surveyNumber: null,
      district: null,
      taluk: null,
      village: null,
      area: null,
      ownerName: null
    };

    try {
      console.log('🔍 Parsing Land Record data...');
      
      // Extract survey number
      const surveyRegex = /Survey Number[:\s]*([^\n\r]+)/i;
      const surveyMatch = text.match(surveyRegex);
      if (surveyMatch) {
        landData.surveyNumber = surveyMatch[1].trim();
        console.log(`✅ Survey Number: ${landData.surveyNumber}`);
      }

      // Extract district
      const districtRegex = /District[:\s]*([^\n\r]+)/i;
      const districtMatch = text.match(districtRegex);
      if (districtMatch) {
        landData.district = districtMatch[1].trim();
        console.log(`✅ District: ${landData.district}`);
      }

      // Extract taluk
      const talukRegex = /Taluk[:\s]*([^\n\r]+)/i;
      const talukMatch = text.match(talukRegex);
      if (talukMatch) {
        landData.taluk = talukMatch[1].trim();
        console.log(`✅ Taluk: ${landData.taluk}`);
      }

      // Extract village
      const villageRegex = /Village[:\s]*([^\n\r]+)/i;
      const villageMatch = text.match(villageRegex);
      if (villageMatch) {
        landData.village = villageMatch[1].trim();
        console.log(`✅ Village: ${landData.village}`);
      }

      // Extract area
      const areaRegex = /Area[:\s]*([^\n\r]+)/i;
      const areaMatch = text.match(areaRegex);
      if (areaMatch) {
        landData.area = areaMatch[1].trim();
        console.log(`✅ Area: ${landData.area}`);
      }

      // Extract owner name
      const ownerRegex = /Owner Name[:\s]*([^\n\r]+)/i;
      const ownerMatch = text.match(ownerRegex);
      if (ownerMatch) {
        landData.ownerName = ownerMatch[1].trim();
        console.log(`✅ Owner Name: ${landData.ownerName}`);
      }

      console.log('✅ Land Record parsing completed:', landData);
      return landData;
      
    } catch (error) {
      console.error('❌ Land record parsing error:', error);
      return landData;
    }
  }

  // Parse Income Proof specific data - ADD THIS METHOD
  async parseIncomeProof(text) {
    const incomeData = {
      annualIncome: null,
      name: null,
      district: null,
      occupation: null,
      landSize: null,
      financialYear: null,
      employerName: null
    };

    try {
      console.log('🔍 Parsing Income Proof data...');
      console.log('📝 Text to parse:', text.substring(0, 500));
      
      // Extract annual income - multiple patterns
      const incomePatterns = [
        /Annual Income[:\s]*₹?\s*([\d,]+)/i,
        /Total Income[:\s]*₹?\s*([\d,]+)/i,
        /Income[:\s]*₹?\s*([\d,]+)/i,
        /₹\s*([\d,]+)/,
        /Total[:\s]*₹?\s*([\d,]+)/i,
        /([\d,]+)\s*rupees/gi,
        /([\d,]+)\s*₹/gi
      ];

      for (const pattern of incomePatterns) {
        const incomeMatch = text.match(pattern);
        if (incomeMatch && incomeMatch[1]) {
          // Remove commas and convert to number
          const incomeValue = parseInt(incomeMatch[1].replace(/,/g, ''));
          if (incomeValue > 0) {
            incomeData.annualIncome = incomeValue;
            console.log(`✅ Annual Income: ₹${incomeData.annualIncome}`);
            break;
          }
        }
      }

      // Extract name
      const namePatterns = [
        /Name[:\s]*([^\n\r]+)/i,
        /Name\s*Of[:\s]*([^\n\r]+)/i,
        /Applicant[:\s]*([^\n\r]+)/i
      ];

      for (const pattern of namePatterns) {
        const nameMatch = text.match(pattern);
        if (nameMatch && nameMatch[1] && nameMatch[1].trim().length > 2) {
          incomeData.name = nameMatch[1].trim();
          console.log(`✅ Name: ${incomeData.name}`);
          break;
        }
      }

      // Extract district
      const districtRegex = /District[:\s]*([^\n\r]+)/i;
      const districtMatch = text.match(districtRegex);
      if (districtMatch) {
        incomeData.district = districtMatch[1].trim();
        console.log(`✅ District: ${incomeData.district}`);
      }

      // Extract occupation
      const occupationRegex = /Occupation[:\s]*([^\n\r]+)/i;
      const occupationMatch = text.match(occupationRegex);
      if (occupationMatch) {
        incomeData.occupation = occupationMatch[1].trim();
        console.log(`✅ Occupation: ${incomeData.occupation}`);
      }

      // Extract land size
      const landSizeRegex = /Land Size[:\s]*([\d.]+)\s*acres?/i;
      const landSizeMatch = text.match(landSizeRegex);
      if (landSizeMatch) {
        incomeData.landSize = parseFloat(landSizeMatch[1]);
        console.log(`✅ Land Size: ${incomeData.landSize} acres`);
      }

      // Extract financial year
      const yearRegex = /Financial Year[:\s]*([^\n\r]+)/i;
      const yearMatch = text.match(yearRegex);
      if (yearMatch) {
        incomeData.financialYear = yearMatch[1].trim();
        console.log(`✅ Financial Year: ${incomeData.financialYear}`);
      }

      // If no financial year found, try to extract date
      if (!incomeData.financialYear) {
        const dateRegex = /Date[:\s]*([^\n\r]+)/i;
        const dateMatch = text.match(dateRegex);
        if (dateMatch) {
          incomeData.financialYear = dateMatch[1].trim();
          console.log(`✅ Date: ${incomeData.financialYear}`);
        }
      }

      console.log('✅ Income Proof parsing completed:', incomeData);
      return incomeData;
      
    } catch (error) {
      console.error('❌ Income proof parsing error:', error);
      return incomeData;
    }
  }

  // Parse any document type
  async parseDocument(documentType, text) {
    try {
      console.log(`🔍 Parsing document type: ${documentType}`);
      
      switch (documentType) {
        case 'aadhar':
          return await this.parseAadharCard(text);
        case 'landRecord':
          return await this.parseLandRecord(text);
        case 'incomeProof':
          return await this.parseIncomeProof(text);
        default:
          console.log('⚠️ Unknown document type, returning raw text');
          return { rawText: text.substring(0, 500) }; // Return first 500 chars for unknown types
      }
    } catch (error) {
      console.error(`❌ Document parsing error for ${documentType}:`, error);
      return { rawText: text.substring(0, 500), error: error.message };
    }
  }

  // Validate if document is genuine
  async validateDocument(documentType, extractedData) {
    console.log(`🔍 Validating ${documentType} document...`);
    
    const validations = {
      aadhar: (data) => {
        const isValid = data.aadharNumber && data.aadharNumber.length === 12;
        console.log(`✅ Aadhar validation: ${isValid}`);
        return isValid;
      },
      landRecord: (data) => {
        const isValid = data.surveyNumber && data.district;
        console.log(`✅ Land Record validation: ${isValid}`);
        return isValid;
      },
      incomeProof: (data) => {
        const isValid = data.annualIncome && data.annualIncome > 0;
        console.log(`✅ Income Proof validation: ${isValid}`);
        return isValid;
      }
    };

    const validator = validations[documentType];
    const result = validator ? validator(extractedData) : true; // Default to true for unknown types
    
    console.log(`📊 Validation result for ${documentType}: ${result}`);
    return result;
  }

  // Clean up temporary files
  cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🧹 Cleaned up file: ${filePath}`);
      }
    } catch (error) {
      console.warn(`⚠️ Could not clean up file ${filePath}:`, error.message);
    }
  }
}

module.exports = new OCRService();