import axios from "axios";

/**
 * Get district name from GPS coordinates using OpenStreetMap Nominatim API.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} - District name (or 'Unknown District')
 */
export const getDistrictFromGPS = async (lat, lng) => {
  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: {
        lat,
        lon: lng,
        format: "json",
        addressdetails: 1,
      },
      headers: {
        "User-Agent": "CropCirclesApp/1.0",
      },
    });

    const address = response.data.address;

    // Try to find district, fallback to state or unknown
    const district =
      address.county || address.state_district || address.city_district || address.state || "Unknown District";

    return district;
  } catch (error) {
    console.error("Error fetching district:", error.message);
    return "Unknown District";
  }
};
