var gotGreek = function(){
	var	config = {
			boundaryPattern:/[\s:!.,\"\(\)«»%$]/,
			nonBoundaryPattern:/[^\s:!.,\"\(\)«»%$]/,
			googleApiKey:'AIzaSyAICISSmAHfsclKJ4eu5UtbhhtWMLUqxcY',
			googleTranslateUrl:'https://www.googleapis.com/language/translate/v2',
			source: '',
			target: '',
  };

  //external resources that GotGreek has to load
  var resources= {
    jQuery: {
      url: '//cdnjs.cloudflare.com/ajax/libs/jquery/2.0.0/jquery.min.js',
      loaded: (typeof jQuery !== 'undefined')
    },
    rangyCore: {
      url: '//rangy.googlecode.com/svn/trunk/dev/rangy-core.js',
      loaded: (typeof rangy !== 'undefined')
    }
  };
  var currentJob = {
    text: '', translation: '', range: null, x:0, y:0
  };

  var loaded = false;
  var running = false;
  var initialized = false;
  var cache, cssApplier;

	// loads all external libraries 
	var load = function(){	
		yepnope([{
			test: resources.jQuery.loaded,
			nope: resources.jQuery.url,
			callback: yepnopeCallback
		},{
			test: resources.rangyCore.loaded,
			nope: resources.rangyCore.url,
			callback: yepnopeCallback
		}]);
	};
	var yepnopeCallback= function(url,key,result){
		for (var r in resources){
			if (resources[r].url === url){
				resources[r].loaded = true;
				return terminateLoad();
			}
		}
	};
	// checks if all necessary resources are loaded, if so removes the overlay meny and calls boot
	var terminateLoad= function(){
		//TODO handle the case were some resources are unavailable
		var check=true;
		for (r in resources){
			check = check && resources[r].loaded;
		}
		if (check){
			loaded = true;
			jQuery('#gotGreek-menu').text('GotGreek is Ready!');
			jQuery('#gotGreek-menu').fadeOut(2000,function(){
				jQuery('#gotGreek-menu').remove();
			});
			gotGreek.boot();
		}
	};	
	// initalizes config.source, config.target, and all the state variables
	var init = function(){
		//TODO handle the case where html lang is set to an ISO 639-1 non-compliant value
		config.source = (jQuery('html').attr('lang') || jQuery('html').attr('xml:lang') || 'fr').toLowerCase().substring(0,2);
		config.target = (navigator.language || navigator.userLanguage || 'en').toLowerCase().substring(0,2);
    if (config.source == config.target) {
      config.source = 'fr';
    }
		cache={};
		rangy.init();
		currentJob.range= null;
		initialized = true;
		gotGreek.boot();
	};

	var translateListener = function(event){

    // only pay attention to left-clicks
		if (event.button!==0 || !running) {
      return;
    }

    // no text is selected
    if (rangy.getSelection().isCollapsed){
      if (event.altKey && event.target.nodeName == 'A') {
        // manually select alt-clicked link's text; see http://stackoverflow.com/a/14295222/9621
        currentJob.range = rangy.createRange();
        currentJob.range.selectNodeContents(event.target);
        var sel = rangy.getSelection();
        sel.removeAllRanges();
        sel.addRange(currentJob.range);

      }
      else {
        return;
      }
		}
		// if there is a selection, push it to its bounding limits
		else{
			currentJob.range = rangy.getSelection().getRangeAt(0);
			pushToLimits(currentJob.range);
		}

		if(currentJob.range===null){
			rangy.getSelection().removeAllRanges();
			return;
		}

		//TODO instead of toString, go through the range and jump over script tags
		// if what you found is not garbage translate it
		var tmp=currentJob.range.toString();
		if (typeof tmp !== 'undefined' && /\S/.test(tmp) && /\D/.test(tmp)){
			currentJob.text = tmp;
			currentJob.x = event.clientX;
			currentJob.y = event.clientY;
			rangy.getSelection().setSingleRange(currentJob.range);
			if (cache[currentJob.text]){
				currentJob.translation = cache[currentJob.text];
				return showTooltip();
			}
			//send request to Google
			jQuery.ajax({
				url: config.googleTranslateUrl,
				type: 'GET',
				dataType: 'jsonp',
				success: gotGreek.jsonCallback,
				error: function(xhr, status){console.log(xhr);console.log(status);},
				data: {
					key: config.googleApiKey,
					source: config.source,
					target: config.target,
					q: currentJob.text,
				}
			});
		}
	};

	var showTooltip= function(){
    jQuery('body').append(
          jQuery(document.createElement('div'))
          .attr('id','gotGreek-box')
          .addClass('gotGreek-box')
          .html('<p class="translation">'+currentJob.translation+'</p><hr><p class="text">'+currentJob.text+'</p>')
          .css('top',(jQuery(document).scrollTop()+currentJob.y+10)+'px')
          .css('left',(jQuery(document).scrollLeft()+currentJob.x+10)+'px'));
	};

	// helper function for translateListener, pushes a range to its boundaries
	var pushToLimits= function(range){
		var startNodeValue = range.startContainer.nodeValue,
			endNodeValue = range.endContainer.nodeValue,
			start= range.startOffset,
			end = range.endOffset;
		while (start > 0 && startNodeValue && config.nonBoundaryPattern.test(startNodeValue[start-1])){
			start--;
		}
		while (endNodeValue && end < endNodeValue.length-1 && config.nonBoundaryPattern.test(endNodeValue[end])){
			end++;
		}
		range.setStart(range.startContainer,start);
		range.setEnd(range.endContainer,end);
		return range;
	};

	/*
	 * the public interface of gotGreek:
	*/
	return{
		//this function is the only function that is called from the bookmarklet
		boot : function(){
			if(!loaded){
				load();
			}else if(!initialized){
				init();
			}else if(!running){
				running = true;

        // support alt-clicking on links to translate them
        jQuery('a').click(function(event){
          if (event.altKey) {
            // holding ALT while clicking on a link will prevent navigation
            event.preventDefault();
            // but it's still desirable to clear the previous selection
            rangy.getSelection().removeAllRanges();
          }
        });

        // clear result box on any click (mousedown)
				jQuery('body').mousedown(function(){
          jQuery('.gotGreek-box').remove();
				});

        // display translation of selection (mouseup)
				jQuery('body').mouseup(function(event){
          // Due to race condition triggered by re-clicking on existing selection,
          // we need to add a tiny timeout; see https://code.google.com/p/rangy/issues/detail?id=175
          window.setTimeout(function(){translateListener(event)}, 10);
        });

			}else if(running){
				var m = jQuery(document.createElement('div')).attr('id','gotGreek-menu').text('GotGreek is Stopping...');
				
				jQuery('body').append(m);
				jQuery('body').unbind('mouseup',translateListener);
				running = false;
				m.fadeOut(1000,function(){
          jQuery('.gotGreek-box').remove();
					m.remove();
				});
			}
		},
		jsonCallback : function(response){
			currentJob.translation = response.data.translations[0].translatedText;
			cache[currentJob.text]=currentJob.translation;
			showTooltip();
		}
	};
}();
