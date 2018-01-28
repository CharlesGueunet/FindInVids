function getAllCaptionsVG(videoId) {
    return new Promise(function(resolve, reject) {
        getCaptionsVGList(videoId).then(
            function(data) {
                console.log('getCaptionsVG -> got list');
                console.log(data);
                
                var langList = [];
                // Parse list
                $(data).find('track').each(function() {
                    langList.push($(this).attr('lang_code'));
                });
                
                if (langList.length > 0) {            
                    var lang0 = langList[0];
                    var dataArray = [];
                    langList.shift();
                    getOneCaptionVG(lang0, langList, dataArray, videoId, resolve, reject);
                }   
            }, 
            function(error) {
                reject();
            });
    });
}


function getCaptionsVGList(videoId) {
    var apiURL = 'https://video.google.com/timedtext?type=list&v=';
    var listURL = apiURL + videoId;
    
    return {
        then: function(success, error) {
            $.ajax({
                url: listURL,
                type: 'GET',
                success: function(data) {
                    console.log('success!');
                    console.log(data);
                    success(data);
                },
                error: function(data) {
                    console.log('error!');
                    console.log(data);
                    error(data);
                }
            });
        }
    }
}

function getOneCaptionVG(lang, langList, dataArray, videoId, resolve, reject)
{
    var apiURL = 'https://video.google.com/timedtext';
    var captionsURL = apiURL + '?lang=' + lang + '&v=' + videoId;
    
    $.ajax({
        url: captionsURL,
        type: 'GET',
        success: function(data) {
            console.log('success!');
            console.log(data);
            dataArray.push(data);
            if (langList.length > 0) {
                lang = langList[0];
                langList.shift();
                getOneCaptionVG(lang, langList, dataArray, videoId);
            } else {
                console.log('Successfully got all subs.');
                resolve();
            }
        },
        error: function(data) {
            console.log('error!');
            console.log(data);
            reject();
        }
    });
}

function getOneCaptionCF(url0, urlList, dataArray, resolve, reject) {
    console.log('getting one caption CF');
    console.log(url0);
    $.ajax({
        url: url0,
        type: 'GET',
        success: function(data) {
            console.log('success!');
            console.log(data);
            dataArray.push(data);
            if (urlList.length > 0) {
                url0 = urlList[0];
                urlList.shift();
                getOneCaptionCF(url0, urlList, dataArray, resolve, reject);
            } else {
                resolve(dataArray);
            }
        },
        error: function(data) {
            console.log('error!');
            console.log(data);
            reject();
        }
    });
}

function getAllCaptionsCF(videoId) {
    return new Promise(function(resolve, reject) {
        try {
            var res = ytplayer.config.args.player_response;
            var jres = JSON.parse(res);
            var tracks = jres.captions.playerCaptionsTracklistRenderer.captionTracks;
                
            console.log('got tracks');
            console.log(tracks);
            var urls = [];
            tracks.forEach(function(track) {
                var baseUrl = track.baseUrl;
                urls.push(baseUrl);
                var language = track.name.simpleText;
            });
            
            if (urls.length > 0) {
                var dataArray = [];
                var url0 = urls[0];
                urls.shift();
                getOneCaptionCF(url0, urls, dataArray, resolve, reject);
            } else {
                console.log('No CF captions available.');
                reject();
            }
            
        } catch (err) {
            reject();
        }
    });
}

function getCaptions(videoId) {
    // Use player config to get remote captions path.
    getAllCaptionsCF(videoId).then(
        function(data) {
            console.log('Loaded subtitles by config.');
            console.log(data);
            processCaptions(data);
        },
        function(error) {
            console.log('Failed to load subtitles by config.');
            // In case of trouble,
            // rollback to legacy video.google.com API
            getAllCaptionsVG(videoId).then(
                function(data) {
                    console.log('Successfully loaded subtitles by common API.');
                    processCaptions(data);
                },
                function(error) {
                    console.log('Failed to load subtitles by common API.');
                }
            );
        }
    );
}

function processCaptions(captions) {
    var dictionary = new Map();
    
    captions.forEach(function(caption) {
        $(caption).find('text').each(function(t) {
            var start = $(this).attr('start');
            var content = $('<html>' + $(this).text() + '</html>').text();
            console.log(start + ' ' + content);
            
            var words = content.match(/\S+/g);
            if (words && words.length > 0 && words[0] !== "") {
                words.forEach(w) {
                    var d = dictionary.get(w);
                    if (d !== null) {
                        d.push(start);
                    } else {
                        dictionary.set(w, [start]);
                    }
                }
            } 
        });
    });
}

function findTimesForWord(word, dictionary) {
    var times = dictionary.get(word);
    if (times !== null) {
        console.log(times);
    }
}

(function() {
    function l(u, i) {
        var d = document;
        if (!d.getElementById(i)) {
            var s = d.createElement('script');
            s.src = u;
            s.id = i;
            d.body.appendChild(s);
        }
    }
    if (!($.ajax)) l('//code.jquery.com/jquery-3.2.1.min.js', 'jquery')
})();
