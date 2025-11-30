import Availability from "../models/availabilityModel.js";

// @desc    Get availability for a user
// @route   GET /api/availability/:userId
// @access  Public
export const getAvailability = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query; // Optional: filter by month/year

    let query = { userId };
    
    // If month and year provided, filter by date
    if (month && year) {
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = `${year}-${month.padStart(2, '0')}-31`;
      query.date = { $gte: startDate, $lte: endDate };
    }

    const availability = await Availability.find(query);
    
    // Convert array to object for easier frontend use
    const availabilityMap = {};
    availability.forEach(item => {
      availabilityMap[item.date] = {
        available: item.available,
        morning: item.timeSlots.morning,
        afternoon: item.timeSlots.afternoon,
        evening: item.timeSlots.evening,
        notes: item.notes
      };
    });

    res.json({
      success: true,
      data: availabilityMap,
      count: availability.length
    });
  } catch (error) {
    console.error('❌ Get availability error:', error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching availability"
    });
  }
};

// @desc    Update availability for specific date
// @route   PUT /api/availability/:userId
// @access  Public
export const updateAvailability = async (req, res) => {
  try {
    const { userId } = req.params;
    const { date, available, timeSlots, notes } = req.body;

    if (!userId || !date) {
      return res.status(400).json({
        success: false,
        message: "User ID and date are required"
      });
    }

    // Find and update or create new
    const availability = await Availability.findOneAndUpdate(
      { userId, date },
      {
        userId,
        date,
        available,
        timeSlots: {
          morning: timeSlots?.morning || false,
          afternoon: timeSlots?.afternoon || false,
          evening: timeSlots?.evening || false
        },
        notes: notes || ""
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true 
      }
    );

    res.json({
      success: true,
      message: "Availability updated successfully",
      data: availability
    });
  } catch (error) {
    console.error('❌ Update availability error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Availability entry already exists for this date"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Server error while updating availability"
    });
  }
};

// @desc    Bulk update availability for multiple dates
// @route   POST /api/availability/:userId/bulk
// @access  Public
export const bulkUpdateAvailability = async (req, res) => {
  try {
    const { userId } = req.params;
    const { availabilityData } = req.body; // Array of {date, available, timeSlots}

    if (!userId || !availabilityData || !Array.isArray(availabilityData)) {
      return res.status(400).json({
        success: false,
        message: "User ID and availability data array are required"
      });
    }

    const operations = availabilityData.map(item => ({
      updateOne: {
        filter: { userId, date: item.date },
        update: {
          userId,
          date: item.date,
          available: item.available,
          timeSlots: {
            morning: item.timeSlots?.morning || false,
            afternoon: item.timeSlots?.afternoon || false,
            evening: item.timeSlots?.evening || false
          },
          notes: item.notes || ""
        },
        upsert: true
      }
    }));

    const result = await Availability.bulkWrite(operations);

    res.json({
      success: true,
      message: "Bulk availability updated successfully",
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount
      }
    });
  } catch (error) {
    console.error('❌ Bulk update availability error:', error);
    res.status(500).json({
      success: false,
      message: "Server error while bulk updating availability"
    });
  }
};

// @desc    Delete availability for specific date
// @route   DELETE /api/availability/:userId/:date
// @access  Public
export const deleteAvailability = async (req, res) => {
  try {
    const { userId, date } = req.params;

    const result = await Availability.findOneAndDelete({ userId, date });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Availability entry not found"
      });
    }

    res.json({
      success: true,
      message: "Availability deleted successfully"
    });
  } catch (error) {
    console.error('❌ Delete availability error:', error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting availability"
    });
  }
};

// @desc    Get availability summary for user
// @route   GET /api/availability/:userId/summary
// @access  Public
export const getAvailabilitySummary = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    let query = { userId };
    if (month && year) {
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = `${year}-${month.padStart(2, '0')}-31`;
      query.date = { $gte: startDate, $lte: endDate };
    }

    const availability = await Availability.find(query);
    
    const summary = {
      totalDays: availability.length,
      availableDays: availability.filter(a => a.available).length,
      morningSlots: availability.filter(a => a.timeSlots.morning).length,
      afternoonSlots: availability.filter(a => a.timeSlots.afternoon).length,
      eveningSlots: availability.filter(a => a.timeSlots.evening).length
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('❌ Get availability summary error:', error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching availability summary"
    });
  }
};