(function() {
   var searchInVideo;
   var __bind = function(fn, me) { return function() { return fn.apply(me, arguments); }; };
   // For debug: bkg.console.log(elmt);
   var bkg = chrome.extension.getBackgroundPage();
   var log = function(msg) {bkg.console.log(msg)};
   var urls;
   
   searchInVideo = {
      init: function() {
         searchInVideo.getURL()
            .then(searchInVideo.checkURL)
            .then(searchInVideo.processYoutubeURL, searchInVideo.appendResult)
            .then(searchInVideo.appendResult);
      },
      
      getCaptions: function(videoId) {
         return capi.getCaptions(videoId, urls);
      },
      
      getURL: function() {
         return new Promise(function(resolve, reject) {
            chrome.tabs.query({'active': true, 'lastFocusedWindow': true},
            function (tabs) {
               var urlStr = tabs[0].url;
               resolve(urlStr);
            });
         });
      },
      
      checkURL: function(urlStr) {
         return new Promise(function(resolve, reject) {
            if (urlStr.match(/www.youtube.com\/watch/)) {
               var urlObj = new URL(urlStr);
               var v = urlObj.searchParams.get('v');
               resolve(v);
            } else {
               $('.menuElmt').hide();
               reject('Unavailable here :(');
            }
         });
      },
      
      processYoutubeURL: function(idVideo) {
         return new Promise(function(resolve, reject) {
            searchInVideo.injectScript(idVideo)
               .then(
                  searchInVideo.getCaptions,
                  // Failure -> try again with legacy.
                  searchInVideo.getCaptions)
               .then(
                  function() {
                     searchInVideo.listenSearchBar();
                     resolve();
                  },
                  function() { 
                     log('Could not fetch captions.');
                     reject();
                  }
               );
         });
      },
      
      injectScript: function(idVideo) {
         return new Promise(function(resolve, reject) {
            var message = $('#message');
            message.text('Injecting script...');
            
            chrome.runtime.onMessageExternal.addListener(function(request, sender, sendResponse) {
               if (request.action == 'getCaptionList') {
                  var captionList = request.captions;
                  urls = captionList;
                  message.text('Injected script.');
                  resolve(idVideo);
               }
            });

            chrome.tabs.executeScript(null, 
               { file: 'media/scripts/getPagesSource.js'},
               function() {
                  // If you try and inject into an extensions page or the webstore/NTP you'll get an error
                  if (chrome.runtime.lastError) {
                     message.text('There was an error injecting script : \n' + chrome.runtime.lastError.message);
                     reject();
                  }
               });
         });
      },
      
      listenSearchBar: function() {
         $('#search').click(function() {
            var keywords = $('#keywords').val();
            var array = capi.findString(keywords);
            $('#searchInVideo').text('');
            $('#message').text(array.length + ' occurrences.');
            array.forEach(function(e) {
               $('#searchInVideo').append(e, '<br/>');
            });
         });
      },
      
      appendResult: function(e) {
         $('#searchInVideo').append(e, '<br/>');
      }
   };

   if (typeof window !== 'undefined' && window !== null) {
      window.searchInVideo = searchInVideo;
   }
   
   window.onload = function() {
      searchInVideo.init();
   };
}).call(this);
