var infinispan = require('infinispan');

// client() method returns a Promise that represents completion successful connection
var connected = infinispan.client({port: 11222, host: '127.0.0.1'});
connected.then(function(client) {
  console.log("Connected");
  var putGetRemove = client.put('key', 'value').then(function() {
    var p0 = client.get('key').then(function(value) {
      console.log(':get(`key`) = ' + value);
    });
    return p0.then(function() {
      return client.remove('key').then(function(success) {
        console.log(':remove(`key`) = ' + success);
      })
    });
  });

  var conditional = putGetRemove.then(function() {
    var p0 = client.putIfAbsent('cond', 'v0').then(function(success) {
      console.log(':putIfAbsent() success = ' + success);
    });
    var p1 = p0.then(function() {
      return client.replace('cond', 'v1').then(function (success) {
        console.log(':replace() success = ' + success);
      })
    });
    var p2 = p1.then(function() {
      return client.getVersioned('cond').then(function (versioned) {
        console.log(':getVersioned() = ' + versioned.value);
        return client.replaceWithVersion('cond', 'v2', versioned.version, {previous: true}).then(function (prev) {
          console.log(':replaceWithVersion previous = ' + prev)
        })
      });
    });
    var p3 = p2.then(function() {
      return client.get('cond').then(function(value) {
        console.log(':get(`cond`) = ' + value);
      })
      });
    return p3.then(function() {
      return client.getVersioned('cond').then(function (versioned) {
        console.log(':getVersioned() = ' + versioned.value);
        return client.removeWithVersion('cond', versioned.version).then(function (success) {
          console.log(':removeWithVersion = ' + success);
        })
      });
    });
  });

  var multi = conditional.then(function() {
    var data = [
      {key: 'multi1', value: 'v1'},
      {key: 'multi2', value: 'v2'},
      {key: 'multi3', value: 'v3'}];
    return client.putAll(data).then(function() {
      var keys = ['multi2', 'multi3'];
      return client.getAll(keys).then(function(entries) {
        console.log('Entries are: ' + JSON.stringify(entries));
      });
    })
  });

  var iterated = multi.then(function() {
    return client.iterator(1).then(function(it) {
      // Simple recursive loop over iterator next() call
      function loop(promise, fn) {
        return promise.then(fn).then(function (entry) {
          return !entry.done ? loop(it.next(), fn) : entry.value;
        });
      }

      return loop(it.next(), function (entry) {
        console.log(':iterator.next = ' + JSON.stringify(entry));
        return entry;
      });
    })
  });

  var expiry = iterated.then(function() {
    return client.put('expiry', 'value', {lifespan: '1s'}).then(function() {
      return client.containsKey('expiry').then(function(found) {
        console.log(':before expiration -> containsKey(`expiry`) = ' + found);
      }).then(function() {
        return client.size().then(function(size) {
          console.log(':before expiration -> size = ' + size);
        })
      })
    });
  });

  var expired = expiry.then(function() {
    sleepFor(1100); // sleep to force expiration
    return client.containsKey('expiry').then(function(found) {
      console.log(':after expiration -> containsKey(`expiry`) = ' + found);
    }).then(function() {
      return client.size().then(function(size) {
        console.log(':after expiration -> size = ' + size);
      })
    })
  });

  var withMeta = expired.then(function() {
    return client.put('meta', 'v0', {maxIdle: '1h'}).then(function() {
      return client.getWithMetadata('meta').then(function(valueWithMeta) {
        console.log(':getWithMetadata `meta` = ' + JSON.stringify(valueWithMeta));
      })
    })
  });

  var withNamedCache = withMeta.then(function() {
    var connected = infinispan.client(
            // Accepts multiple addresses and fails over if connection not possible
            [{port: 99999, host: '127.0.0.1'}, {port: 11222, host: '127.0.0.1'}],
            {cacheName: 'namedCache'});

    return connected.then(function(namedCache) {
      console.log('Connected to cache `namedCache`');
      var addListeners = namedCache.addListener('create', function(key) {
        console.log('event -> created `' + key + '` key');
      }).then(function(listenerId) {
        // Multiple callbacks can be associated with a single client-side listener.
        // This is achieved by registering listeners with the same listener id
        // as shown in the example below.
        var onModify = namedCache.addListener('modify', function(key) {
          console.log('event -> modified `' + key + '` key');
        }, {listenerId: listenerId});
        return onModify.then(function () {
            return namedCache.addListener('remove', function (key) {
              console.log('event -> removed `' + key + '` key');
            }, {listenerId: listenerId});
          });
      });

      var crud = addListeners.then(function(listenerId) {
        var create = namedCache.putIfAbsent('named1', 'v0');
        var modify = create.then(function() {
          return namedCache.replace('named1', 'v1');
        });
        var remove = modify.then(function() {
          return namedCache.remove('named1');
        });
        return remove.then(function() {
          return namedCache.removeListener(listenerId);
        });
      });

      return crud.finally(function() {
        // Regardless of the result, disconnect client
        return namedCache.disconnect();
      });
    })
  });

  return withNamedCache.then(function() { return client.clear(); }).finally(function() {
    // Regardless of the result, disconnect client
    return client.disconnect().then(function() { console.log("Disconnected") });
  });
}).catch(function(error) {
  console.log("Got error: " + error.message);
});

function sleepFor(sleepDuration){
  var now = new Date().getTime();
  while(new Date().getTime() < now + sleepDuration){ /* do nothing */ }
}
