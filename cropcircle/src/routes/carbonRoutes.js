import express from 'express';
import axios from 'axios';

const router = express.Router();

// Carbon credit API base URL
const CARBON_API_BASE = process.env.CARBON_API_URL || 'http://localhost:3001/api/carbon';

// Proxy satellite analysis request to carbon server
router.post('/satellite-analysis', async (req, res) => {
  try {
    const response = await axios.post(`${CARBON_API_BASE}/satellite-analysis`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Carbon API proxy error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Carbon credit service unavailable'
    });
  }
});

// Proxy health check
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${CARBON_API_BASE}/health`);
    res.json(response.data);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Carbon credit service unavailable'
    });
  }
});

export default router;