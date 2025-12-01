const express = require('express');
const cors = require('cors');
const axios = require('axios');
const soap = require('soap');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const app = express();
app.use(cors());
app.use(express.json());

const packageDef = protoLoader.loadSync('alert.proto');
const grpcObj = grpc.loadPackageDefinition(packageDef);
const EmergencyClient = grpcObj.emergency.EmergencyService;
const grpcClient = new EmergencyClient('emergency-grpc:3004', grpc.credentials.createInsecure());

app.get('/planTrip', async (req, res) => {
  try {
    const zone = req.query.zone || 'Centre';

    // Mock AQI response (would normally call SOAP)
    const baseAQI = zone.toLowerCase().includes('centre') ? 130 : 60;
    const aqi = baseAQI;

    const recommendedZone = aqi > 100 ? 'Lac' : zone;

    const transportResp = await axios.get('http://transport-rest:3001/transport/availability');

    const gqlQuery = { 
      query: `query { places(zone: ${recommendedZone}) { id name type zone } }` 
    };
    const placesResp = await axios.post('http://places-graphql:3002/', gqlQuery, {
      headers: { 'Content-Type': 'application/json' }
    });


    res.json({
      initial_zone: zone,
      aqi,
      recommended_zone: recommendedZone,
      transport: transportResp.data,
      places: placesResp.data.data.places
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/aqi', async (req, res) => {
  try {
    const zone = req.query.zone || 'Centre';
    
    // For now, return mock data since SOAP parsing is problematic
    const baseAQI = zone.toLowerCase().includes('centre') ? 130 : 60;
    const pollutants = {
      NO2: baseAQI * 0.3,
      CO2: baseAQI * 0.2,
      O3: baseAQI * 0.1
    };
    
    res.json({
      zone: zone,
      aqi: baseAQI,
      pollutants: pollutants
    });
  } catch (err) {
    console.error('AQI error:', err);
    res.status(500).json({ error: err.message });
  }
});


app.post('/sendAlert', (req, res) => {
  const payload = req.body;
  grpcClient.SendAlert(payload, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(response);
  });
});


const PORT = process.env.PORT || 3005;
app.listen(PORT, ()=>console.log(`Orchestrator listening ${PORT}`));
