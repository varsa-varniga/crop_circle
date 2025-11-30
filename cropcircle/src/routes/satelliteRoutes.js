import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import https from 'https';

const router = express.Router();

// ✅ Load Earth Engine credentials
let earthEngineKey;
try {
  earthEngineKey = JSON.parse(readFileSync('./earth_engine_key.json', 'utf8'));
  console.log('✅ Earth Engine key loaded successfully');
} catch (error) {
  console.error('❌ Failed to load earth_engine_key.json:', error.message);
  console.log('⚠️  Using simulation mode only');
}

// Enhanced simulation fallback
const getEnhancedSimulatedData = (lat, lng, farmSize) => {
  const baseNDVI = 0.65 + (Math.random() * 0.25);
  const baseNDWI = 0.15 + (Math.random() * 0.2);
  const baseSAVI = 0.6 + (Math.random() * 0.25);
  
  const score = Math.round((baseNDVI * 60) + (baseNDWI * 20) + (baseSAVI * 20));
  const co2Sequestration = 2.5 * (0.5 + baseNDVI * 0.5) * farmSize;

  return {
    score: score,
    healthScore: score,
    indices: { 
      ndvi: parseFloat(baseNDVI.toFixed(3)), 
      ndwi: parseFloat(baseNDWI.toFixed(3)), 
      savi: parseFloat(baseSAVI.toFixed(3)) 
    },
    ndvi: parseFloat(baseNDVI.toFixed(3)), 
    ndwi: parseFloat(baseNDWI.toFixed(3)), 
    savi: parseFloat(baseSAVI.toFixed(3)),
    co2Sequestration: parseFloat(co2Sequestration.toFixed(2)),
    latitude: lat, 
    longitude: lng, 
    farmSize: farmSize,
    vegetationHealth: baseNDVI > 0.7 ? "Excellent" : baseNDVI > 0.5 ? "Good" : "Moderate",
    waterContent: baseNDWI > 0.2 ? "Well Watered" : baseNDWI > 0.1 ? "Moderate" : "Dry",
    soilHealth: baseSAVI > 0.6 ? "Healthy Soil" : baseSAVI > 0.4 ? "Moderate" : "Poor",
    confidence: "High",
    timestamp: new Date().toISOString(),
    dataSource: "Sentinel-2 Satellite Simulation",
    coordinates: { latitude: lat, longitude: lng },
    satelliteImage: `https://api.maptiler.com/maps/satellite/${lng},${lat},12/512x512.jpg?key=${process.env.MAPTILER_KEY}`,
    isRealData: false,
    message: "Using enhanced simulation"
  };
};

// ✅ Satellite analysis endpoint
router.post('/satellite-analysis', async (req, res) => {
  try {
    const { latitude, longitude, farmSize } = req.body;
    
    console.log('🛰️ Received satellite analysis request:', { latitude, longitude, farmSize });

    // Always use simulation for now to ensure it works
    const simulatedData = getEnhancedSimulatedData(latitude, longitude, farmSize);
    res.json({
      success: true,
      data: simulatedData,
      message: "Using enhanced simulation"
    });

  } catch (error) {
    console.error('❌ Satellite analysis endpoint error:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
});

// ✅ Image proxy endpoint
router.get('/satellite-image-proxy', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    console.log('🖼️ Proxying image request:', url.substring(0, 100) + '...');

    https.get(url, (imageResponse) => {
      if (imageResponse.statusCode !== 200) {
        console.error('❌ Failed to fetch image:', imageResponse.statusCode);
        return res.status(500).json({ error: 'Failed to fetch satellite image' });
      }

      res.set('Content-Type', imageResponse.headers['content-type'] || 'image/png');
      res.set('Cache-Control', 'public, max-age=86400');
      res.set('Access-Control-Allow-Origin', '*');

      imageResponse.pipe(res);
    }).on('error', (error) => {
      console.error('❌ Image proxy error:', error);
      res.status(500).json({ error: 'Failed to load image' });
    });

  } catch (error) {
    console.error('❌ Image proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Satellite API',
    earthEngine: earthEngineKey ? 'READY' : 'SIMULATION MODE',
    timestamp: new Date().toISOString()
  });
});

export default router;