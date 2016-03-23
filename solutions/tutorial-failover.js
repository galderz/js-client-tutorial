var infinispan = require('infinispan');

// Accepts multiple addresses and fails over if connection not possible
var connected = infinispan.client(
  [{port: 99999, host: '127.0.0.1'}, {port: 11222, host: '127.0.0.1'}]);

connected.then(function (client) {

  var members = client.getTopologyInfo().getMembers();

  console.log('Connected to: ' + JSON.stringify(members));

  return client.disconnect();

}).catch(function(error) {

  console.log("Got error: " + error.message);

});
