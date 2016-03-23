var infinispan = require('infinispan');

var connected = infinispan.client(
  {port: 11222, host: '127.0.0.1'}, {cacheName: 'namedCache'});

connected.then(function (client) {

  console.log('Connected to `namedCache`');

  return client.disconnect();

}).catch(function(error) {

  console.log("Got error: " + error.message);

});
