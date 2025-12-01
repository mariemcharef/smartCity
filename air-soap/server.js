const http = require('http');
const fs = require('fs');
const soap = require('soap');

const service = {
  AirService: {
    AirPort: {
     getAQI: function(args) {
        const zone = args.zone || 'unknown';
        const baseAQI = zone.toLowerCase().includes('centre') ? 130 : 60;

        return {
            aqi: baseAQI,
            pollutants: {
            NO2: baseAQI * 0.3,
            CO2: baseAQI * 0.2,
            O3: baseAQI * 0.1
            }
        };
        }

    }
  }
};

const xml = fs.readFileSync('air.wsdl', 'utf8');

const server = http.createServer(function(req, res) {
  res.statusCode = 404; 
  res.end();
});

server.listen(3003, function() {
  soap.listen(server, '/wsdl', service, xml);
  console.log('SOAP Air service listening on port 3003');
});
