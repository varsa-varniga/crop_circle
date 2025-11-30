const mongoose = require('mongoose');
require('dotenv').config();

const Scheme = require('../models/Scheme');

const sampleSchemes = [
  {
    name: "PM-KISAN Scheme",
    nameInTamil: "பி.எம்-கிசான் திட்டம்",
    description: "Income support scheme for all landholding farmer families",
    descriptionInTamil: "நில வைத்திருப்பவர் குடும்பங்களுக்கான வருமான ஆதரவுத் திட்டம்",
    category: "subsidy",
    benefit: "₹6,000 per year in three equal installments",
    benefitAmount: 6000,
    benefitType: "recurring",
    eligibility: {
      minLandSize: 0.1,
      maxLandSize: 100,
      minIncome: 0,
      maxIncome: 1000000,
      applicableCrops: ["All"],
      applicableRoles: ["sprouter", "cultivator"],
      applicableStates: ["Tamil Nadu", "All India"],
      isNationwide: true,
      requiresKYC: true,
      requiresLandProof: true,
      ageLimit: { min: 18, max: 100 }
    },
    applicationProcess: "Online application through state portal or CSC centers",
    requiredDocuments: ["Aadhar Card", "Land Record", "Bank Passbook"],
    processingTime: "2-3 weeks",
    startDate: new Date('2020-01-01'),
    issuingAuthority: "Government of India",
    officialWebsite: "https://pmkisan.gov.in",
    isActive: true
  },
  {
    name: "Tamil Nadu Solar Pump Subsidy",
    nameInTamil: "தமிழ்நாடு சோலார் பம்ப் மானியத் திட்டம்",
    description: "Subsidy for solar agricultural pumps to reduce electricity dependency",
    descriptionInTamil: "மின்சார சார்புகளைக் குறைக்க சோலார் விவசாய பம்புகளுக்கான மானியம்",
    category: "subsidy",
    benefit: "Up to 90% subsidy on solar pumps",
    benefitAmount: 150000,
    benefitType: "one-time",
    eligibility: {
      minLandSize: 1,
      maxLandSize: 50,
      minIncome: 0,
      maxIncome: 300000,
      applicableCrops: ["All"],
      applicableRoles: ["sprouter", "cultivator"],
      applicableStates: ["Tamil Nadu"],
      applicableDistricts: ["Erode", "Coimbatore", "Madurai", "Trichy", "Salem"],
      isNationwide: false,
      requiresKYC: true,
      requiresLandProof: true
    },
    applicationProcess: "Apply through TNEB portal with required documents",
    requiredDocuments: ["Aadhar Card", "Land Record", "Electricity Bill", "Bank Details"],
    processingTime: "4-6 weeks",
    startDate: new Date('2021-04-01'),
    issuingAuthority: "Tamil Nadu Electricity Board",
    isActive: true
  },
  {
    name: "Kisan Credit Card",
    nameInTamil: "கிசான் கிரெடிட் கார்டு",
    description: "Credit card scheme for farmers for agricultural needs",
    descriptionInTamil: "விவசாயத் தேவைகளுக்கான விவசாயிகளுக்கான கிரெடிட் கார்டுத் திட்டம்",
    category: "loan",
    benefit: "Credit up to ₹3,00,000 at 4% interest per annum",
    benefitAmount: 300000,
    benefitType: "variable", // Changed from 'loan' to 'variable'
    eligibility: {
      minLandSize: 0.5,
      maxLandSize: 100,
      minIncome: 0,
      maxIncome: 500000,
      applicableCrops: ["All"],
      applicableRoles: ["sprouter", "cultivator"],
      applicableStates: ["Tamil Nadu", "All India"],
      isNationwide: true,
      requiresKYC: true,
      requiresLandProof: true
    },
    applicationProcess: "Apply through any nationalized bank with required documents",
    requiredDocuments: ["Aadhar Card", "Land Record", "Photos", "Income Proof"],
    processingTime: "2-4 weeks",
    startDate: new Date('1998-08-01'),
    issuingAuthority: "National Bank for Agriculture and Rural Development",
    officialWebsite: "https://nabard.org",
    isActive: true
  },
  {
    name: "Crop Insurance Scheme (PMFBY)",
    nameInTamil: "பயிர் காப்பீட்டுத் திட்டம்",
    description: "Insurance coverage for crops against natural calamities and pests",
    descriptionInTamil: "இயற்கை பேரிடர்கள் மற்றும் பூச்சிகளுக்கு எதிரான பயிர்களுக்கான காப்பீட்டு உத்தரவாதம்",
    category: "insurance",
    benefit: "Premium as low as 2% for Kharif, 1.5% for Rabi crops",
    benefitAmount: 0,
    benefitType: "percentage-based",
    eligibility: {
      minLandSize: 0.1,
      maxLandSize: 100,
      minIncome: 0,
      maxIncome: 500000,
      applicableCrops: ["Paddy", "Wheat", "Pulses", "Oilseeds", "Commercial Crops"],
      applicableRoles: ["sprouter", "cultivator"],
      applicableStates: ["Tamil Nadu", "All India"],
      isNationwide: true,
      requiresKYC: true,
      requiresLandProof: true
    },
    applicationProcess: "Apply through Common Service Centers or bank branches",
    requiredDocuments: ["Aadhar Card", "Land Record", "Crop Details", "Bank Account"],
    processingTime: "1-2 weeks",
    startDate: new Date('2016-01-01'),
    issuingAuthority: "Ministry of Agriculture",
    officialWebsite: "https://pmfby.gov.in",
    isActive: true
  },
  {
    name: "Soil Health Card Scheme",
    nameInTamil: "மண் ஆரோக்கிய அட்டை திட்டம்",
    description: "Provides soil health cards to farmers with nutrient recommendations",
    descriptionInTamil: "விவசாயிகளுக்கு ஊட்டச்சத்து பரிந்துரைகளுடன் மண் ஆரோக்கிய அட்டைகளை வழங்குகிறது",
    category: "training",
    benefit: "Free soil testing and customized fertilizer recommendations",
    benefitAmount: 0,
    benefitType: "one-time",
    eligibility: {
      minLandSize: 0.1,
      maxLandSize: 100,
      minIncome: 0,
      maxIncome: 1000000,
      applicableCrops: ["All"],
      applicableRoles: ["sprouter", "cultivator"],
      applicableStates: ["Tamil Nadu", "All India"],
      isNationwide: true,
      requiresKYC: false,
      requiresLandProof: false
    },
    applicationProcess: "Register at agriculture department office or online portal",
    requiredDocuments: ["Aadhar Card", "Land Details"],
    processingTime: "2-3 weeks",
    startDate: new Date('2015-02-19'),
    issuingAuthority: "Department of Agriculture",
    isActive: true
  },
  {
    name: "Drip Irrigation Subsidy",
    nameInTamil: "டிரிப் பாசன மானியத் திட்டம்",
    description: "Subsidy for drip irrigation systems to conserve water",
    descriptionInTamil: "நீர் சேமிப்புக்காக டிரிப் பாசன அமைப்புகளுக்கான மானியம்",
    category: "infrastructure",
    benefit: "Up to 80% subsidy on drip irrigation equipment",
    benefitAmount: 80000,
    benefitType: "one-time",
    eligibility: {
      minLandSize: 0.5,
      maxLandSize: 50,
      minIncome: 0,
      maxIncome: 300000,
      applicableCrops: ["Vegetables", "Fruits", "Sugarcane", "Cotton"],
      applicableRoles: ["sprouter", "cultivator"],
      applicableStates: ["Tamil Nadu"],
      isNationwide: false,
      requiresKYC: true,
      requiresLandProof: true
    },
    applicationProcess: "Apply through agriculture engineering department",
    requiredDocuments: ["Aadhar Card", "Land Record", "Crop Details", "Bank Passbook"],
    processingTime: "4-8 weeks",
    startDate: new Date('2022-03-01'),
    issuingAuthority: "Tamil Nadu Agricultural Department",
    isActive: true
  },
  {
    name: "Farm Mechanization Subsidy",
    nameInTamil: "பண்ணை இயந்திரமயமாக்கல் மானியத் திட்டம்",
    description: "Subsidy for agricultural machinery and equipment",
    descriptionInTamil: "விவசாய இயந்திரங்கள் மற்றும் உபகரணங்களுக்கான மானியம்",
    category: "equipment",
    benefit: "50% subsidy on tractors, harvesters, and other farm equipment",
    benefitAmount: 500000,
    benefitType: "percentage-based",
    eligibility: {
      minLandSize: 2,
      maxLandSize: 100,
      minIncome: 0,
      maxIncome: 500000,
      applicableCrops: ["All"],
      applicableRoles: ["sprouter", "cultivator"],
      applicableStates: ["Tamil Nadu", "All India"],
      isNationwide: true,
      requiresKYC: true,
      requiresLandProof: true
    },
    applicationProcess: "Apply through approved banks and financial institutions",
    requiredDocuments: ["Aadhar Card", "Land Record", "Income Proof", "Bank Statements"],
    processingTime: "3-6 weeks",
    startDate: new Date('2020-06-01'),
    issuingAuthority: "Ministry of Agriculture",
    isActive: true
  },
  {
    name: "Organic Farming Certification",
    nameInTamil: "கரிம விவசாய சான்றிதழ் திட்டம்",
    description: "Support and certification for organic farming practices",
    descriptionInTamil: "கரிம விவசாய நடைமுறைகளுக்கான ஆதரவு மற்றும் சான்றிதழ்",
    category: "training",
    benefit: "Free certification and technical guidance for organic farming",
    benefitAmount: 0,
    benefitType: "one-time",
    eligibility: {
      minLandSize: 0.5,
      maxLandSize: 50,
      minIncome: 0,
      maxIncome: 200000,
      applicableCrops: ["All"],
      applicableRoles: ["sprouter", "cultivator"],
      applicableStates: ["Tamil Nadu"],
      isNationwide: false,
      requiresKYC: true,
      requiresLandProof: true
    },
    applicationProcess: "Register with agriculture department for certification",
    requiredDocuments: ["Aadhar Card", "Land Record", "Current Farming Practices"],
    processingTime: "4-6 weeks",
    startDate: new Date('2021-10-01'),
    issuingAuthority: "Tamil Nadu Organic Certification Department",
    isActive: true
  }
];

const seedSchemes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/agrovihan', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing schemes
    await Scheme.deleteMany({});
    console.log('✅ Cleared existing schemes');

    // Insert new schemes
    await Scheme.insertMany(sampleSchemes);
    console.log(`✅ Successfully seeded ${sampleSchemes.length} schemes`);

    // Verify the insertion
    const count = await Scheme.countDocuments();
    console.log(`✅ Total schemes in database: ${count}`);

    // List all schemes for verification
    const schemes = await Scheme.find({}).select('name category benefitType isActive');
    console.log('\n📋 Seeded Schemes:');
    schemes.forEach((scheme, index) => {
      console.log(`${index + 1}. ${scheme.name} (${scheme.category}) - Benefit: ${scheme.benefitType} - Active: ${scheme.isActive}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding schemes:', error);
    process.exit(1);
  }
};

seedSchemes();