import Sprouter from '../models/Sprouter.js';

// Create sprouter profile
const createSprouter = async (req, res) => {
  try {
    const {
      fullName, phone, aadhaarLast4, email,
      village, district, state, pincode,
      landSize, landType, soilType,
      incomeRange, experience, mainCrops
    } = req.body;

    let sprouter = await Sprouter.findOne({ phone });
    
    if (sprouter) {
      return res.status(400).json({
        success: false,
        message: 'Sprouter with this phone number already exists'
      });
    }

    sprouter = new Sprouter({
      fullName,
      phone,
      aadhaarLast4,
      email,
      address: { village, district, state, pincode },
      landDetails: { landSize: parseFloat(landSize), landType, soilType },
      financialInfo: { incomeRange },
      farmingExperience: { experience, mainCrops }
    });

    await sprouter.save();

    res.status(201).json({
      success: true,
      message: 'Sprouter profile created successfully',
      sprouter: {
        id: sprouter._id,
        fullName: sprouter.fullName,
        phone: sprouter.phone,
        email: sprouter.email,
        address: sprouter.address,
        landDetails: sprouter.landDetails
      }
    });

  } catch (error) {
    console.error('Sprouter creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get sprouter profile by phone
const getSprouter = async (req, res) => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const sprouter = await Sprouter.findOne({ phone }).select('-__v');

    if (!sprouter) {
      return res.status(404).json({
        success: false,
        message: 'Sprouter not found'
      });
    }

    res.json({
      success: true,
      sprouter
    });

  } catch (error) {
    console.error('Get sprouter error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all sprouters
const getAllSprouters = async (req, res) => {
  try {
    const sprouters = await Sprouter.find()
      .select('fullName phone address landDetails registrationDate status')
      .sort({ registrationDate: -1 });

    res.json({
      success: true,
      count: sprouters.length,
      sprouters
    });

  } catch (error) {
    console.error('Get all sprouters error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update sprouter profile
const updateSprouter = async (req, res) => {
  try {
    const { phone } = req.query;
    const updates = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const sprouter = await Sprouter.findOneAndUpdate(
      { phone },
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!sprouter) {
      return res.status(404).json({
        success: false,
        message: 'Sprouter not found'
      });
    }

    res.json({
      success: true,
      message: 'Sprouter profile updated successfully',
      sprouter
    });

  } catch (error) {
    console.error('Update sprouter error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export {
  createSprouter,
  getSprouter,
  updateSprouter,
  getAllSprouters
};