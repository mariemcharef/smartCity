const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDef = protoLoader.loadSync('alert.proto');
const grpcObj = grpc.loadPackageDefinition(packageDef);
const emergency = grpcObj.emergency;

// Temporary in-memory storage
const alerts = [];

function SendAlert(call, callback) {
  const alert = {
    id: (alerts.length + 1).toString(),
    message: call.request.message,
    timestamp: new Date().toISOString(),
  };
  alerts.push(alert);
  console.log('Received alert:', alert);
  callback(null, { status: 'received' });
}

function GetAlerts(call, callback) {
  callback(null, { alerts });
}

const server = new grpc.Server();
server.addService(emergency.EmergencyService.service, {
  SendAlert,
  GetAlerts,
});

const PORT = process.env.PORT || '0.0.0.0:3004';
server.bindAsync(PORT, grpc.ServerCredentials.createInsecure(), () => {
  server.start();
  console.log('gRPC server started on', PORT);
});
