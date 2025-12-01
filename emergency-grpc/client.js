
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDef = protoLoader.loadSync('alert.proto');
const grpcObj = grpc.loadPackageDefinition(packageDef);
const GRPC_TARGET = process.env.GRPC_TARGET || 'emergency-grpc:3004';
const client = new grpcObj.emergency.EmergencyService(GRPC_TARGET, grpc.credentials.createInsecure());

client.SendAlert({ zone: 'Centre', message: 'Test fire', priority: 1 }, (err, resp) => {
  if (err) console.error(err);
  else console.log(resp);
});
