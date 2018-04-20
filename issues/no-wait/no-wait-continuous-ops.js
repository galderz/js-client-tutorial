var _ = require('underscore');
var Promise = require('promise');
var log4js = require('log4js');

var infinispan = require('infinispan');

log4js.configure('../utils/test-log4js.json');

var connected = infinispan.client({port: 11222, host: '127.0.0.1'});

connected.then(function (client) {

  var puts = _.map(_.range(1000), function(i) {
    return client.put(i + '', i + '');
  });

  return Promise.all(puts).finally(function() { return client.disconnect(); });

  // var clientPut = client.put('a', 'b');
  //
  // var clientGet = clientPut.then(
  //     function() { return client.get('a'); });
  //
  // var showGet = clientGet.then(
  //     function(value) { console.log('get(a)=' + value); });
  //
  // return showGet.finally(function() { return client.disconnect(); });

}).catch(function(error) {

  console.log("Got error: " + error.message);

});