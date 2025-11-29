import FarmProfile from "../models/farmProfileModel.js";

// @desc    Get all farm profiles
// @route   GET /api/farm-profile
// @access  Public
const getAllFarmProfiles = async (req, res) => {
  try {
    const farmProfiles = await FarmProfile.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: farmProfiles,
      count: farmProfiles.length
    });
  } catch (error) {
    console.error('❌ Get all farm profiles error:', error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching farm profiles"
    });
  }
};

// @desc    Get farm profile by user ID
// @route   GET /api/farm-profile/:userId
// @access  Public
const getFarmProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📥 Fetching farm profile for user:', userId);
    
    const farmProfile = await FarmProfile.findOne({ userId: userId });

    if (!farmProfile) {
      return res.status(404).json({
        success: false,
        message: "Farm profile not found"
      });
    }

    console.log('✅ Farm profile found:', farmProfile.farmName);
    res.json({
      success: true,
      data: farmProfile
    });
  } catch (error) {
    console.error('❌ Get farm profile error:', error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching farm profile"
    });
  }
};

// @desc    Create or update farm profile
// @route   POST /api/farm-profile
// @access  Public
const saveFarmProfile = async (req, res) => {
  try {
    const {
      userId,
      farmName,
      location,
      cropsGrown,
      averageYield,
      badges,
      gpsLocation
    } = req.body;

    console.log('📝 Saving farm profile for user:', userId);
    console.log('📦 Received data:', { farmName, location, cropsGrown, averageYield });

    // Validate required fields
    if (!userId || !farmName || !location) {
      return res.status(400).json({
        success: false,
        message: "User ID, farm name and location are required"
      });
    }

    // Process crops grown - convert string to array if needed
    let processedCrops = [];
    if (typeof cropsGrown === 'string') {
      processedCrops = cropsGrown.split(',').map(crop => crop.trim()).filter(crop => crop);
    } else if (Array.isArray(cropsGrown)) {
      processedCrops = cropsGrown;
    }

    // Find existing farm profile or create new one
    let farmProfile = await FarmProfile.findOne({ userId: userId });

    if (farmProfile) {
      // Update existing profile
      farmProfile.farmName = farmName;
      farmProfile.location = location;
      farmProfile.cropsGrown = processedCrops;
      farmProfile.averageYield = averageYield;
      farmProfile.badges = { ...farmProfile.badges, ...badges };
      farmProfile.gpsLocation = gpsLocation;
      
      await farmProfile.save();
      console.log('✅ Farm profile updated:', farmProfile._id);
    } else {
      // Create new profile
      farmProfile = new FarmProfile({
        userId: userId,
        farmName,
        location,
        cropsGrown: processedCrops,
        averageYield,
        badges,
        gpsLocation
      });
      
      await farmProfile.save();
      console.log('✅ New farm profile created:', farmProfile._id);
    }

    res.status(200).json({
      success: true,
      message: "Farm profile saved successfully",
      data: farmProfile
    });
  } catch (error) {
    console.error('❌ Save farm profile error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Farm profile already exists for this user"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Server error while saving farm profile"
    });
  }
};

// @desc    Upload farm photos
// @route   POST /api/farm-profile/upload
// @access  Public
const uploadFarmPhotos = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded"
      });
    }

    const farmProfile = await FarmProfile.findOne({ userId: userId });
    if (!farmProfile) {
      return res.status(404).json({
        success: false,
        message: "Farm profile not found. Please create a farm profile first."
      });
    }

    // Get uploaded file paths
    const newPhotos = req.files.map(file => `/uploads/${file.filename}`);
    
    // Add new photos to existing ones
    farmProfile.farmPhotos = [...farmProfile.farmPhotos, ...newPhotos];
    await farmProfile.save();

    console.log('✅ Photos uploaded for farm:', farmProfile.farmName);

    res.json({
      success: true,
      message: "Photos uploaded successfully",
      photos: farmProfile.farmPhotos
    });
  } catch (error) {
    console.error('❌ Upload farm photos error:', error);
    res.status(500).json({
      success: false,
      message: "Server error while uploading photos"
    });
  }
};

// Export all functions
export {
  getAllFarmProfiles,
  getFarmProfile,
  saveFarmProfile,
  uploadFarmPhotos
};