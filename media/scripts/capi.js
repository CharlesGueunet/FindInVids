var capi = capi || (function() 
{    
    var dictionary = new Map();
    var fullText = new Map();
    
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
                dataArray.push(data);
                if (langList.length > 0) {
                    lang = langList[0];
                    langList.shift();
                    getOneCaptionVG(lang, langList, dataArray, videoId);
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

    function getOneCaptionCF(url0, urlList, dataArray, resolve, reject) {
        $.ajax({
            url: url0,
            type: 'GET',
            success: function(data) {
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

    function getAllCaptionsCF(videoId, urls) {
        return new Promise(function(resolve, reject) {
            try {
                if (urls && urls instanceof Array && urls.length > 0) 
                {
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

    function getCaptions(videoId, urls) {
       return new Promise(function(resolve, reject) {
          
          var bkg = chrome.extension.getBackgroundPage();
          var log = function(msg) {bkg.console.log(msg)};
          
          // Use player config to get remote captions path.
          getAllCaptionsCF(videoId, urls).then(
              function(data) {
                  log('Loaded subtitles by config.');
                  processCaptions(data);
                  resolve();
              },
              function(error) {
                 log('Failed to load subtitles by config.');
                 // In case of trouble,
                 // rollback to legacy video.google.com API
                 getAllCaptionsVG(videoId).then(
                    function(data) {
                       log('Successfully loaded subtitles by common API.');
                       processCaptions(data);
                       resolve();
                    },
                    function(error) {
                       log('Failed to load subtitles by common API.');
                       reject();
                    }
                 );
              }
           );
       });
    }
    
    function processCaptions(captions) {
        dictionary = new Map();
        fullText = new Map();
        
        captions.forEach(function(caption) {
            $(caption).find('text').each(function(t) {
                var start = $(this).attr('start');
                var content = $('<html>' + $(this).text() + '</html>').text();
                // console.log(start + ' ' + content);
                
                var ft = fullText.get(start);
                if (ft !== undefined && ft instanceof Array) {
                    ft.push(content);
                } else {
                    fullText.set(start, [content]);
                }
                
                var words = content.match(/\S+/g);
                if (words && words.length > 0 && words[0] !== "") {
                    words.forEach(function(w) {
                        var d = dictionary.get(w);
                        if (d !== undefined && d instanceof Array) {
                            d.push(start);
                        } else {
                            dictionary.set(w, [start]);
                        }
                    });
                } 
            });
        });
    }

    function findTimesForWord(word) {
        return getDictionary().get(word);
    }
    
    function findTimesForString(string) {
        var result = [];
        if (string === "")
           return result;
        
        getFullText().forEach(function(entry, key) {
            for (var i = 0; i < entry.length; ++i)
                if (entry[i].indexOf(string) > -1) {
                    result.push(key);
                    break;
                }
        });
        
        return result;
    }
    
    function getDictionary() {
       return dictionary;
    }
    
    function getFullText() {
       return fullText;
    }
    
    return {
        getCaptions: getCaptions,
        findWord: findTimesForWord,
        findString: findTimesForString
    };
})();
