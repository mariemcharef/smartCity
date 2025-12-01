const soap = require('soap');

async function test() {
  const url = "http://localhost:3003/wsdl?wsdl";
  const client = await soap.createClientAsync(url);

  const [result] = await client.getAQIAsync({ zone: "Centre" });
  console.log("SOAP result:", result);
}

test();
