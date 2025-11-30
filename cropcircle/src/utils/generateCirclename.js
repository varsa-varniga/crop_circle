// src/utils/generateCircleName.js

// List of adjectives for variety
const adjectives = [
  "Golden",
  "Green",
  "Sunny",
  "Flourishing",
  "Bountiful",
  "Radiant",
  "Healthy",
  "Vibrant",
  "Prosperous",
  "Lush",
];

// List of suffixes
const suffixes = ["Circle", "Club", "Community", "Hub", "Garden"];

/**
 * Generates a dynamic, friendly Crop Circle name
 * @param {string} cropName - name of the crop, e.g., "Wheat"
 * @param {string} district - optional district name for uniqueness
 * @returns {string} friendly circle name
 */
export const generateCircleName = (cropName, district = "") => {
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  // Optionally include district for uniqueness
  const districtPart = district ? ` of ${district}` : "";

  return `${randomAdj} ${cropName} ${randomSuffix}${districtPart}`;
};
