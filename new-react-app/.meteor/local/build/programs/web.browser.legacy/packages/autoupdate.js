//////////////////////////////////////////////////////////////////////////
//                                                                      //
// This is a generated file. You can view the original                  //
// source in your browser if your browser supports source maps.         //
// Source maps are supported by all recent versions of Chrome, Safari,  //
// and Firefox, and by Internet Explorer 11.                            //
//                                                                      //
//////////////////////////////////////////////////////////////////////////


(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var Retry = Package.retry.Retry;
var DDP = Package['ddp-client'].DDP;
var Mongo = Package.mongo.Mongo;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Symbol = Package['ecmascript-runtime-client'].Symbol;
var Map = Package['ecmascript-runtime-client'].Map;
var Set = Package['ecmascript-runtime-client'].Set;

/* Package-scope variables */
var Autoupdate;

var require = meteorInstall({"node_modules":{"meteor":{"autoupdate":{"autoupdate_client.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                          //
// packages/autoupdate/autoupdate_client.js                                                                 //
//                                                                                                          //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                            //
module.export({
  Autoupdate: function () {
    return Autoupdate;
  }
});
// Subscribe to the `meteor_autoupdate_clientVersions` collection,
// which contains the set of acceptable client versions.
//
// A "hard code push" occurs when the running client version is not in
// the set of acceptable client versions (or the server updates the
// collection, there is a published client version marked `current` and
// the running client version is no longer in the set).
//
// When the `reload` package is loaded, a hard code push causes
// the browser to reload, so that it will load the latest client
// version from the server.
//
// A "soft code push" represents the situation when the running client
// version is in the set of acceptable versions, but there is a newer
// version available on the server.
//
// `Autoupdate.newClientAvailable` is a reactive data source which
// becomes `true` if there is a new version of the client is available on
// the server.
//
// This package doesn't implement a soft code reload process itself,
// but `newClientAvailable` could be used for example to display a
// "click to reload" link to the user.
// The client version of the client code currently running in the
// browser.
var clientArch = Meteor.isCordova ? "web.cordova" : Meteor.isModern ? "web.browser" : "web.browser.legacy";
var autoupdateVersions = ((__meteor_runtime_config__.autoupdate || {}).versions || {})[clientArch] || {
  version: "unknown",
  versionRefreshable: "unknown",
  versionNonRefreshable: "unknown",
  assets: []
};
var Autoupdate = {};
// The collection of acceptable client versions.
var ClientVersions = Autoupdate._ClientVersions = // Used by a self-test.
new Mongo.Collection("meteor_autoupdate_clientVersions");

Autoupdate.newClientAvailable = function () {
  return !!(ClientVersions.findOne({
    _id: clientArch,
    versionNonRefreshable: {
      $ne: autoupdateVersions.versionNonRefreshable
    }
  }) || ClientVersions.findOne({
    _id: clientArch,
    versionRefreshable: {
      $ne: autoupdateVersions.versionRefreshable
    }
  }));
}; // Set to true if the link.onload callback ever fires for any <link> node.


var knownToSupportCssOnLoad = false;
var retry = new Retry({
  // Unlike the stream reconnect use of Retry, which we want to be instant
  // in normal operation, this is a wacky failure. We don't want to retry
  // right away, we can start slowly.
  //
  // A better way than timeconstants here might be to use the knowledge
  // of when we reconnect to help trigger these retries. Typically, the
  // server fixing code will result in a restart and reconnect, but
  // potentially the subscription could have a transient error.
  minCount: 0,
  // don't do any immediate retries
  baseTimeout: 30 * 1000 // start with 30s

});
var failures = 0;

Autoupdate._retrySubscription = function () {
  Meteor.subscribe("meteor_autoupdate_clientVersions", {
    onError: function (error) {
      Meteor._debug("autoupdate subscription failed", error);

      failures++;
      retry.retryLater(failures, function () {
        // Just retry making the subscription, don't reload the whole
        // page. While reloading would catch more cases (for example,
        // the server went back a version and is now doing old-style hot
        // code push), it would also be more prone to reload loops,
        // which look really bad to the user. Just retrying the
        // subscription over DDP means it is at least possible to fix by
        // updating the server.
        Autoupdate._retrySubscription();
      });
    },
    onReady: function () {
      // Call checkNewVersionDocument with a slight delay, so that the
      // const handle declaration is guaranteed to be initialized, even if
      // the added or changed callbacks are called synchronously.
      var resolved = Promise.resolve();

      function check(doc) {
        resolved.then(function () {
          return checkNewVersionDocument(doc);
        });
      }

      var handle = ClientVersions.find().observe({
        added: check,
        changed: check
      });

      function checkNewVersionDocument(doc) {
        if (doc._id !== clientArch) {
          return;
        }

        if (doc.versionNonRefreshable !== autoupdateVersions.versionNonRefreshable) {
          // Non-refreshable assets have changed, so we have to reload the
          // whole page rather than just replacing <link> tags.
          if (handle) handle.stop();

          if (Package.reload) {
            // The reload package should be provided by ddp-client, which
            // is provided by the ddp package that autoupdate depends on.
            Package.reload.Reload._reload();
          }

          return;
        }

        if (doc.versionRefreshable !== autoupdateVersions.versionRefreshable) {
          var waitUntilCssLoads = function (link, callback) {
            var called;

            link.onload = function () {
              knownToSupportCssOnLoad = true;

              if (!called) {
                called = true;
                callback();
              }
            };

            if (!knownToSupportCssOnLoad) {
              var id = Meteor.setInterval(function () {
                if (link.sheet) {
                  if (!called) {
                    called = true;
                    callback();
                  }

                  Meteor.clearInterval(id);
                }
              }, 50);
            }
          };

          var removeOldLinks = function () {
            if (oldLinks.length > 0 && --newLinksLeftToLoad < 1) {
              oldLinks.splice(0).forEach(function (link) {
                link.parentNode.removeChild(link);
              });
            }
          };

          autoupdateVersions.versionRefreshable = doc.versionRefreshable; // Switch out old css links for the new css links. Inspired by:
          // https://github.com/guard/guard-livereload/blob/master/js/livereload.js#L710

          var newCss = doc.assets || [];
          var oldLinks = [];
          Array.prototype.forEach.call(document.getElementsByTagName('link'), function (link) {
            if (link.className === '__meteor-css__') {
              oldLinks.push(link);
            }
          });
          var newLinksLeftToLoad = newCss.length;

          if (newCss.length > 0) {
            newCss.forEach(function (css) {
              var newLink = document.createElement("link");
              newLink.setAttribute("rel", "stylesheet");
              newLink.setAttribute("type", "text/css");
              newLink.setAttribute("class", "__meteor-css__");
              newLink.setAttribute("href", css.url);
              waitUntilCssLoads(newLink, function () {
                Meteor.setTimeout(removeOldLinks, 200);
              });
              var head = document.getElementsByTagName("head").item(0);
              head.appendChild(newLink);
            });
          } else {
            removeOldLinks();
          }
        }
      }
    }
  });
};

Autoupdate._retrySubscription();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/autoupdate/autoupdate_client.js");

/* Exports */
Package._define("autoupdate", exports, {
  Autoupdate: Autoupdate
});

})();
