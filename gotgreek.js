var gotGreek = function(){
	var	loaded=false,running=false,initialized=false,
		boundaryPattern=/[\s:!.,\"\(\)«»%$]/,
		nonBoundaryPattern=/[^\s:!.,\"\(\)«»%$]/,
		cache, currentTranslate,
		currentX, currentY, bufferX, bufferY, cssApplier, currentRange,
		fromLang='fr', toLang='en',
		attributionURL, closeIconURL, arrowImageURL, googleAPIKey, translateURL;
	
	//**************
	//main functions
	//**************
	var load = function(){
		console.log('loading GotGreek...');
		//have to do without jquery
		var m = document.createElement('div');
		m.setAttribute('id','gotGreek-menu');
		m.appendChild(document.createTextNode('loading...'));
		document.body.appendChild(m);
		loaded=true;
		document.getElementById('gotGreek-menu').className='hidden';
		gotGreek.boot();
	};
	// this function is called only once by gotGreek.boot
	var init = function(from,to,google,close,arrow,apiKey,url){
		//TODO what if the user is not connected to Internet
		// or for any other reason one of these resources was unavailable?
		console.log('initializing GotGreek...');
		fromLang		= from;
		toLang			= to;
		attributionURL	= google;
		closeIconURL	= close;  
		arrowImageURL	= arrow;
		googleAPIKey	= apiKey;
		translateURL    = url;
		cache={};
		initialized = true;
		rangy.init();
		currentRange= null;
		cssApplier = rangy.createCssClassApplier('gotGreek-selected',{normalize:true});
		console.log('GotGreek initialized.');
		gotGreek.boot();
	};
	// all translation operations start here
	var translateListener= function(event){
		if(!running){return;}
		var text,translation;
		currentX=event.clientX;
		currentY=event.clientY;
		console.log(rangy.getSelection().isCollapsed);
		// if there is no selection try to wrap a word around click point
		if (rangy.getSelection().isCollapsed){
			currentRange = extractWordAt(event.target, currentX, currentY);
		}
		// if there is a selection, push it to its bounding limits
		else{
			currentRange = rangy.getSelection().getRangeAt(0);
			pushToLimits(currentRange);
		}
		if(currentRange===null){
			rangy.getSelection().removeAllRanges();
			return;
		}
		text = currentRange.toString();
		// translate the word
		if (/\S/.test(text) && /\D/.test(text)){
			cssApplier.applyToRange(currentRange);
			if (cache[text]){
				return overlayTranslation(cache[text]);
			}
			translation = translate(text);
		}
	};
	var translate = function(text){
		currentTranslate = text;
		if(text.trim()!== ''){
			$.ajax(translateURL,{
				type: 'GET',
				dataType: 'jsonp',
				success: gotGreek.jsonCallback,
				error: function(xhr, status){console.log(xhr);console.log(status);},
				data: {
					key: googleAPIKey,
					source: fromLang,
					target: toLang,
					q: text,
				}
			});
		}
	};
	var pushToLimits= function(range){
		var startNodeValue = range.startContainer.nodeValue,
			endNodeValue = range.endContainer.nodeValue,
			start= range.startOffset,
			end = range.endOffset;
		while (start > 0 && nonBoundaryPattern.test(startNodeValue[start-1])){
			start--;
			console.log('moving back');
		}
		while (end < endNodeValue.length-1 && nonBoundaryPattern.test(endNodeValue[end])){
			console.log('moving forward');
			end++;
		}
		range.setStart(range.startContainer,start);
		range.setEnd(range.endContainer,end);
		return range;
	};

	// recursively finds a word inside node that contains the point (x,y) 
	// and is bounded by boundary characters
	// if no string is found at (x,y) an empty string is returned
	var extractWordAt = function(node,x,y){
		var range,
			currentText = node.nodeValue,
			start, end, counter, tmp, len;
		if (node.nodeType === node.TEXT_NODE && /\S/.test(currentText)){
			// if node is a text node, start digging the word out:
			// slide the range (start,end) along node.nodeValue until
			// the corresponding range contains (x,y)
			// the sliding window (start,end) jumps over non bounding characters.
			start =0;
			while (start< currentText.length){
				range = rangy.createRange();
				
				tmp =currentText.substring(start).search(nonBoundaryPattern);
				if(tmp === -1) {break;}
				start += tmp;
				range.setStart(node,start);
				
				tmp = currentText.substring(start).search(boundaryPattern);
				if (tmp === -1){
					end = currentText.length;
				}else{
					end = start + tmp;
				}
				range.setEnd(node,end);
				if (boxContainsPoint(range.nativeRange.getBoundingClientRect(),x,y)){
					//found the word
					rangy.getSelection().setSingleRange(range);
					return range;
				}
				start = end;
				range.detach();
			}
		}
		// if node is an element, go through its children.
		// if anyone has the word, stop looking
		else if (node.nodeType === node.ELEMENT_NODE){
			// if (x,y) falls outside of containing rectangle of the node, don't bother.
			if (!boxContainsPoint(node.getBoundingClientRect(), x, y)){ return ''; }

			for (counter = 0, len= node.childNodes.length; counter < len ; counter++){
				tmp = extractWordAt(node.childNodes[counter],x,y);
				if (tmp && /\S/.test(tmp.toString())){ return tmp; }
			}
		}
		return null;
	};	
	//TODO come on man!
	var boxContainsPoint = function(box, x, y){
		if (box.bottom > y && box.top < y && box.left< x && box.right > x){
			return true;
		}
		return false;
	};
	
	// overlays the translation response at the point the request was initiated
	var overlayTranslation = function(translation){
		console.log('generating tooltip...');
		$('.gotGreek-selected').data('powertip','<p>en: '+translation+
									 '</p><hr><p>fr: '+currentTranslate+
									 '</p><img src="'+attributionURL+
									 '"class="gotGreek-attribution">');
		$('.gotGreek-selected').powerTip({placement:'se',smartPlacement:true,manual:true});
		$.powerTip.show($('.gotGreek-selected'));
	};
	
	/*
	 * the public interface of gotGreek:
	*/
	return{
		//this function is the only function that is called from the bookmarklet
		boot : function(){
			if(!loaded){
				load();
			}
			else if(!initialized){
				init('fr','en',	'https://raw.github.com/amirio/got-greek/master/google.png',
							'https://raw.github.com/amirio/got-greek/master/close.png',
							'https://raw.github.com/amirio/got-greek/master/arrow.png',
							'AIzaSyAICISSmAHfsclKJ4eu5UtbhhtWMLUqxcY',
							'https://www.googleapis.com/language/translate/v2');
			}
			else if(!running){
				$('body').mouseup(translateListener);
				$('body').mousedown(function(){
					$('#powerTip').remove();
					if(currentRange!==null){
						cssApplier.undoToRange(currentRange);
					}
					rangy.getSelection().removeAllRanges();
				});
				running = true;
				console.log('GotGreek Started.');
			}
			else if(running){
				$('body').unbind('mouseup',translateListener);
				running = false;
				console.log('GotGreek Stopped.');
			}
		},
		
		//the jsonp callback function
		jsonCallback : function(response){
			console.log('recieved translation from Google Translate');
			var translation = response.data.translations[0].translatedText;
			console.log('translation is: '+translation);
			//TODO what if for some reason currentTranslate is changed by another request to translate
			// before jsonCallback is called
			cache[currentTranslate]=translation;
			overlayTranslation(translation);
		}
	};
}();
