var infinispan = require('infinispan');

var connected = infinispan.client({port: 11322, host: '127.0.0.1'});

connected.then(function (client) {

  var members = client.getTopologyInfo().getMembers();

  // Should show all expected cluster members
  console.log('Connected to: ' + JSON.stringify(members));

  // Add your own operations here...

  return client.disconnect();

}).catch(function(error) {

  console.log("Got error: " + error.message);

});
