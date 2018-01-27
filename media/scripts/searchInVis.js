(function() {
   var searchInVideo;
   var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
   // For debug: bkg.console.log(elmt);
   var bkg = chrome.extension.getBackgroundPage();

   searchInVideo = {
      init: function() {
         searchInVideo.getURL();
      },
      getURL: function() {
         chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
            var urlStr = tabs[0].url;
            searchInVideo.checkURL(urlStr);
         });
      },
      checkURL: function(urlStr) {
         if(urlStr.match(/www.youtube.com\/watch/)) {
            var urlObj = new URL(urlStr);
            searchInVideo.processYoutubeURL(urlObj.searchParams.get("v"));
         } else {
            $(".menuElmt").hide();
            searchInVideo.appendResult("Unavailable here :(");
         }
      },
      processYoutubeURL: function(idVideo){
         $("#search").click( function() {
            searchInVideo.appendResult(idVideo);
         });
      },
      appendResult: function(elmt) {
         $("#searchInVideo").append(elmt, "<br/>");
      }
   };

   if (typeof window !== "undefined" && window !== null) {
      window.searchInVideo = searchInVideo;
   }
   window.onload = function() {
      return searchInVideo.init();
   };
}).call(this);
