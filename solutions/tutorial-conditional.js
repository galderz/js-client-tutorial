var infinispan = require('infinispan');

var connected = infinispan.client({port: 11222, host: '127.0.0.1'});

connected.then(function (client) {

  var clientPut = client.putIfAbsent('cond', 'v0');

  var showPut = clientPut.then(
      function(success) { console.log(':putIfAbsent(cond)=' + success); });

  var clientReplace = showPut.then(
      function() { return client.replace('cond', 'v1'); } );

  var showReplace = clientReplace.then(
      function(success) { console.log('replace(cond)=' + success); });

  var clientGetVersionedForReplace = showReplace.then(
      function() { return client.getVersioned('cond'); });

  var clientReplaceWithVersion = clientGetVersionedForReplace.then(
      function(versioned) {
        console.log('getVersioned(cond)=' + JSON.stringify(versioned));
        return client.replaceWithVersion('cond', 'v2', versioned.version);
      }
  );

  var showReplaceWithVersion = clientReplaceWithVersion.then(
      function(success) { console.log('replaceWithVersion(cond)=' + success); });

  var clientGetVersionedForRemove = showReplaceWithVersion.then(
      function() { return client.getVersioned('cond'); });

  var clientRemoveWithVersion = clientGetVersionedForRemove.then(
      function(versioned) {
        console.log('getVersioned(cond)=' + JSON.stringify(versioned));
        return client.removeWithVersion('cond', versioned.version);
      }
  );

  var showRemoveWithVersion = clientRemoveWithVersion.then(
      function(success) { console.log('removeWithVersion(cond)=' + success)});

  return showRemoveWithVersion.finally(
      function() { return client.disconnect(); });

}).catch(function(error) {

  console.log("Got error: " + error.message);

});