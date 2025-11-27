import Land from '../models/Land.js';

// @desc    Create new land listing
// @route   POST /api/lands
// @access  Public
const createLandListing = async (req, res) => {
  try {
    console.log('📥 Received request body:', req.body);
    console.log('📎 Received files:', req.files);
    
    const landData = { ...req.body };
    
    // Convert string arrays back to arrays
    if (typeof landData.waterSources === 'string') {
      landData.waterSources = JSON.parse(landData.waterSources);
    }
    if (typeof landData.suitableCrops === 'string') {
      landData.suitableCrops = JSON.parse(landData.suitableCrops);
    }
    
    // Handle file uploads
    if (req.files) {
      if (req.files.ownership) {
        landData.ownershipDocs = req.files.ownership.map(file => file.filename);
      }
      if (req.files.identity) {
        landData.identityDocs = req.files.identity.map(file => file.filename);
      }
      if (req.files.survey) {
        landData.surveyDocs = req.files.survey.map(file => file.filename);
      }
      if (req.files.bank) {
        landData.bankDocs = req.files.bank.map(file => file.filename);
      }
      if (req.files.soilTest) {
        landData.soilTestDocs = req.files.soilTest.map(file => file.filename);
      }
      if (req.files.photos) {
        landData.photos = req.files.photos.map(file => file.filename);
      }
      if (req.files.videos) {
        landData.videos = req.files.videos.map(file => file.filename);
      }
    }
    
    const land = new Land(landData);
    await land.save();
    
    console.log('✅ Land listing created:', land._id);
    
    res.status(201).json({
      success: true,
      message: 'Land listing submitted successfully!',
      data: land
    });
  } catch (error) {
    console.error('❌ Error creating land listing:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating land listing',
      error: error.message
    });
  }
};

// @desc    Get all land listings
// @route   GET /api/lands
// @access  Public
const getAllLandListings = async (req, res) => {
  try {
    const { status, state, district, minArea, maxArea, soilType } = req.query;
    
    let filter = {};
    
    if (status) filter.status = status;
    if (state) filter.state = state;
    if (district) filter.district = district;
    if (soilType) filter.soilType = soilType;
    
    if (minArea || maxArea) {
      filter.totalArea = {};
      if (minArea) filter.totalArea.$gte = Number(minArea);
      if (maxArea) filter.totalArea.$lte = Number(maxArea);
    }
    
    const lands = await Land.find(filter).sort({ createdAt: -1 }).select('-__v');
    
    res.status(200).json({
      success: true,
      count: lands.length,
      data: lands
    });
  } catch (error) {
    console.error('❌ Error fetching land listings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching land listings',
      error: error.message
    });
  }
};

// @desc    Get single land listing by ID
// @route   GET /api/lands/:id
// @access  Public
const getLandById = async (req, res) => {
  try {
    const land = await Land.findById(req.params.id);
    
    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land listing not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: land
    });
  } catch (error) {
    console.error('❌ Error fetching land listing:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching land listing',
      error: error.message
    });
  }
};

// @desc    Update land listing
// @route   PUT /api/lands/:id
// @access  Private (Admin)
const updateLandListing = async (req, res) => {
  try {
    const land = await Land.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land listing not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Land listing updated successfully',
      data: land
    });
  } catch (error) {
    console.error('❌ Error updating land listing:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating land listing',
      error: error.message
    });
  }
};

// @desc    Delete land listing
// @route   DELETE /api/lands/:id
// @access  Private (Admin)
const deleteLandListing = async (req, res) => {
  try {
    const land = await Land.findByIdAndDelete(req.params.id);
    
    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land listing not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Land listing deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting land listing:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting land listing',
      error: error.message
    });
  }
};

// @desc    Approve land listing
// @route   PUT /api/lands/:id/approve
// @access  Private (Admin)
const approveLandListing = async (req, res) => {
  try {
    const land = await Land.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'approved',
        verifiedAt: Date.now(),
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land listing not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Land listing approved successfully',
      data: land
    });
  } catch (error) {
    console.error('❌ Error approving land listing:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving land listing',
      error: error.message
    });
  }
};

export {
  createLandListing,
  getAllLandListings,
  getLandById,
  updateLandListing,
  deleteLandListing,
  approveLandListing
};