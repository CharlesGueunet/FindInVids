var s = document.createElement('script');
s.text=""
+"   setTimeout(function() {"
+"      var res = ytplayer.config.args.player_response;"
+"      var jres = JSON.parse(res);"
+"      var tracks = jres.captions.playerCaptionsTracklistRenderer.captionTracks;"
+"      var urls = [];"
+"      tracks.forEach(function(track) {"
+"        var baseUrl = track.baseUrl;"
+"        urls.push(baseUrl);"
+"        var language = track.name.simpleText;"
+"      });"
+"      chrome.runtime.sendMessage('bhdjobmhhnafeemlidbdimgenohlnlkn', {"
+"        action: 'getCaptionList',"
+"        captions: urls"
+"      });"
+"   }, 0);";

(document.head||document.documentElement).appendChild(s);
s.onload = function() {
    s.remove();
};
