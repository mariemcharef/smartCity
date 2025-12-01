const express = require('express');
const cors = require('cors');
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./openapi.yaml");

const app = express();
app.use(cors());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());
const mockLines = {
  "1": { 
    id: "1", 
    name: "Ligne 1 - Centre-Ville ↔ Aéroport", 
    type: "bus",
    timetable: ["06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00"],
    status: "on_time",
    frequency: 30 
  },
  "2": { 
    id: "2", 
    name: "Ligne 2 - Gare ↔ Université", 
    type: "metro",
    timetable: ["06:15", "06:45", "07:15", "07:45", "08:15", "08:45", "09:15"],
    status: "delayed",
    frequency: 30
  },
  "3": { 
    id: "3", 
    name: "Ligne 3 - Port ↔ Zone Industrielle", 
    type: "train",
    timetable: ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00"],
    status: "on_time",
    frequency: 60
  },
  "4": { 
    id: "4", 
    name: "Ligne 4 - Hôpital ↔ Stade", 
    type: "bus",
    timetable: ["06:30", "07:00", "07:30", "08:00", "08:30", "09:00"],
    status: "cancelled",
    frequency: 30
  }
};

const trafficIncidents = [
  { 
    id: "inc_001",
    line: "2", 
    type: "accident", 
    severity: "moderate",
    reason: "Accident de circulation", 
    delay_mins: 12,
    affected_stops: ["Gare Centrale", "Place de la République"],
    estimated_resolution: "10:30"
  },
  { 
    id: "inc_002",
    line: "4", 
    type: "maintenance", 
    severity: "high",
    reason: "Maintenance d'urgence", 
    delay_mins: 0,
    affected_stops: ["all"],
    estimated_resolution: "14:00"
  }
];

const connections = {
  "gare_centrale": {
    stop_name: "Gare Centrale",
    lines_available: ["1", "2", "3"],
    connections: [
      { from: "1", to: "2", walking_time: 3 },
      { from: "1", to: "3", walking_time: 5 },
      { from: "2", to: "3", walking_time: 4 }
    ]
  },
  "place_republique": {
    stop_name: "Place de la République",
    lines_available: ["2", "4"],
    connections: [
      { from: "2", to: "4", walking_time: 2 }
    ]
  }
};

// ==================== ROUTES ====================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Transport REST Service',
    timestamp: new Date().toISOString()
  });
});

app.get('/lines', (req, res) => {
  const { type, status } = req.query;
  let lines = Object.values(mockLines);
  
  if (type) {
    lines = lines.filter(l => l.type === type);
  }
  
  if (status) {
    lines = lines.filter(l => l.status === status);
  }
  
  res.json({ 
    count: lines.length,
    lines: lines 
  });
});

app.get('/lines/:id', (req, res) => {
  const line = mockLines[req.params.id];
  if (!line) {
    return res.status(404).json({ 
      error: 'Line not found',
      line_id: req.params.id
    });
  }
  res.json(line);
});

app.get('/lines/:id/timetable', (req, res) => {
  const line = mockLines[req.params.id];
  if (!line) {
    return res.status(404).json({ 
      error: 'Line not found',
      line_id: req.params.id
    });
  }
  
  res.json({
    line_id: line.id,
    line_name: line.name,
    type: line.type,
    timetable: line.timetable,
    frequency: line.frequency,
    status: line.status
  });
});

app.get('/lines/:id/next-departure', (req, res) => {
  const line = mockLines[req.params.id];
  if (!line) {
    return res.status(404).json({ 
      error: 'Line not found',
      line_id: req.params.id
    });
  }
  
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const nextDeparture = line.timetable.find(time => time > currentTime) || line.timetable[0];
  
  res.json({
    line_id: line.id,
    line_name: line.name,
    current_time: currentTime,
    next_departure: nextDeparture,
    status: line.status,
    estimated_delay: line.status === 'delayed' ? 10 : 0
  });
});

app.get('/traffic/status', (req, res) => {
  const { severity } = req.query;
  let incidents = trafficIncidents;
  
  if (severity) {
    incidents = incidents.filter(inc => inc.severity === severity);
  }
  
  res.json({ 
    status: incidents.length > 0 ? 'disrupted' : 'normal',
    timestamp: new Date().toISOString(),
    incidents_count: incidents.length,
    incidents: incidents
  });
});

app.get('/traffic/line/:id', (req, res) => {
  const line = mockLines[req.params.id];
  if (!line) {
    return res.status(404).json({ 
      error: 'Line not found',
      line_id: req.params.id
    });
  }
  
  const lineIncidents = trafficIncidents.filter(inc => inc.line === req.params.id);
  
  res.json({
    line_id: line.id,
    line_name: line.name,
    status: line.status,
    incidents: lineIncidents
  });
});

app.get('/connections', (req, res) => {
  res.json({
    count: Object.keys(connections).length,
    connections: Object.values(connections)
  });
});

app.get('/connections/:stop', (req, res) => {
  const connection = connections[req.params.stop];
  if (!connection) {
    return res.status(404).json({ 
      error: 'Stop not found',
      stop_id: req.params.stop
    });
  }
  
  res.json(connection);
});

app.get('/transport/availability', (req, res) => {
  const { line_id, transport_type } = req.query;
  
  if (line_id) {
    const line = mockLines[line_id];
    if (!line) {
      return res.status(404).json({ 
        error: 'Line not found',
        line_id: line_id
      });
    }
    
    return res.json({
      line_id: line.id,
      available: line.status !== 'cancelled',
      status: line.status,
      next_in_minutes: line.status === 'cancelled' ? null : Math.floor(Math.random() * 15) + 1
    });
  }
  
  let availableLines = Object.values(mockLines);
  if (transport_type) {
    availableLines = availableLines.filter(l => l.type === transport_type);
  }
  
  res.json({ 
    available: true,
    total_lines: availableLines.length,
    operational_lines: availableLines.filter(l => l.status !== 'cancelled').length,
    lines: availableLines.map(l => ({
      id: l.id,
      name: l.name,
      type: l.type,
      status: l.status
    }))
  });
});

app.post('/lines/:id/report', (req, res) => {
  const line = mockLines[req.params.id];
  if (!line) {
    return res.status(404).json({ 
      error: 'Line not found',
      line_id: req.params.id
    });
  }
  
  const { issue_type, description, reporter } = req.body;
  
  if (!issue_type || !description) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['issue_type', 'description']
    });
  }
  
  const report = {
    report_id: `rep_${Date.now()}`,
    line_id: req.params.id,
    issue_type: issue_type,
    description: description,
    reporter: reporter || 'anonymous',
    status: 'submitted',
    timestamp: new Date().toISOString()
  };
  
  res.status(201).json({
    message: 'Report submitted successfully',
    report: report
  });
});

app.put('/lines/:id', (req, res) => {
  const line = mockLines[req.params.id];
  if (!line) {
    return res.status(404).json({ 
      error: 'Line not found',
      line_id: req.params.id
    });
  }
  
  const { status } = req.body;
  const validStatuses = ['on_time', 'delayed', 'cancelled'];
  
  if (status && validStatuses.includes(status)) {
    line.status = status;
    res.json({
      message: 'Line status updated',
      line: line
    });
  } else {
    res.status(400).json({ 
      error: 'Invalid status',
      valid_statuses: validStatuses
    });
  }
});

app.delete('/traffic/incidents/:id', (req, res) => {
  const index = trafficIncidents.findIndex(inc => inc.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ 
      error: 'Incident not found',
      incident_id: req.params.id
    });
  }
  
  const removed = trafficIncidents.splice(index, 1);
  res.json({
    message: 'Incident resolved',
    incident: removed[0]
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path 
  });
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚍 Transport REST Service running on port ${PORT}`);
  console.log(`📍 API Base URL: http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});