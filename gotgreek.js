var gotGreek = function(){
	//TODO 	increase z-index of menu
	//TODO	remove gotgreek.css?
	//TODO 	jump over scrip elements
	//TODO	change listeners so that right click does not fire translate
	//TODO	write test cases in QUnit
	//TODO 	cleanup all the names!
	/*TODO 	extract source language from html.lang and 
			target language from navigator.lang
			1- how to give further options (say if they are both english: ooh! Merriam Webster has free Api with 1000 queries per day)
			2- is html.lang the only resource I have?
	*/
			
	/*TODO	powertip does allow me to change the tooltip ID but then none of the 
			styles would apply to it (making the tooltip become a block at the end of the page)
			since the css is defined only in terms of ids!
	*/
	//TODO	two immediate clicks ->bug
	var	config = {
					boundaryPattern:/[\s:!.,\"\(\)«»%$]/,
					nonBoundaryPattern:/[^\s:!.,\"\(\)«»%$]/,
					attributionUrl:'https://raw.github.com/amirio/got-greek/master/google.png',
					googleApiKey:'AIzaSyAICISSmAHfsclKJ4eu5UtbhhtWMLUqxcY',
					googleTranslateUrl:'https://www.googleapis.com/language/translate/v2',
					source: 'fr',
					target: 'en',
					resources: {
						jQuery: {
							url: '//cdnjs.cloudflare.com/ajax/libs/jquery/2.0.0/jquery.min.js',
							loaded: (typeof jQuery !== 'undefined')
						},
						powerTip: {
							url: '//cdnjs.cloudflare.com/ajax/libs/jquery-powertip/1.2.0/jquery.powertip.js',
							//url: '//cdnjs.cloudflare.com/ajax/libs/jquery-powertip/1.2.0/jquery.powertip.min.js',
							//url: 'http://localhost/powertip/jquery.powertip.js',
							loaded: (typeof jQuery !== 'undefined')?(typeof jQuery.fn.powerTip !== 'undefined'):false
						},
						powerTipCss: {
							url: '//cdnjs.cloudflare.com/ajax/libs/jquery-powertip/1.2.0/css/jquery.powertip.min.css',
							loaded: (typeof jQuery !== 'undefined')?(typeof jQuery.fn.powerTip !== 'undefined'):false
						},
						rangyCore: {
							url: '//rangy.googlecode.com/svn/trunk/dev/rangy-core.js',
							loaded: (typeof rangy !== 'undefined')
						},
						rangyCssApplier: {
							url: '//rangy.googlecode.com/svn/trunk/dev/rangy-cssclassapplier.js',
							loaded: (typeof rangy !== 'undefined')?(typeof rangy.modules.CssClassApplier !== undefined):false
						}
					}
				 },
		loaded=false,running=false,initialized=false, cache,
		//TODO can I remove all this currentX? should I?
		currentSource, currentTranslation, currentRange, cssApplier;
	var load = function(){
		console.log('loading GotGreek...');
		var m = document.createElement('div');
		m.setAttribute('id','gotGreek-menu');
		m.appendChild(document.createTextNode('Loading ...'));

		document.body.appendChild(m);
		yepnope([{
			test: config.resources.jQuery.loaded,
			nope: config.resources.jQuery.url,
			callback: yepnopeCallback
		},{
			test: config.resources.powerTip.loaded,
			nope: [config.resources.powerTip.url,config.resources.powerTipCss.url],
			callback: yepnopeCallback
		},{
			test: config.resources.rangyCore.loaded,
			nope: config.resources.rangyCore.url,
			callback: yepnopeCallback
		},{
			test: config.resources.rangyCssApplier.loaded,
			nope: config.resources.rangyCssApplier.url,
			callback: yepnopeCallback
		}]);
	};
	var terminateLoad= function(){
		var check=true;
		for (r in config.resources){
			check = check && config.resources[r].loaded;
		}
		if (check){
			loaded = true;
			jQuery('#gotGreek-menu').remove();
			gotGreek.boot();
		}
	}
	var yepnopeCallback= function(url,key,result){
		for (var r in config.resources){
			if (config.resources[r].url === url){
				console.log(r+' was not here and is now loaded');
				config.resources[r].loaded = true;
				break;
			}
		}
		terminateLoad();
	};
	var init = function(){
		//TODO what if the user is not connected to Internet
		// or for any other reason one of these resources was unavailable?
		console.log('initializing GotGreek...');
		cache={};
		rangy.init();
		currentRange= null;
		cssApplier = rangy.createCssClassApplier('gotGreek-selected',{normalize:true});
		initialized = true;
		console.log('GotGreek initialized.');
		gotGreek.boot();
	};
	var translateListener= function(event){
		if(!running){return;}
		var text,translation;
		console.log(rangy.getSelection().isCollapsed);
		// if there is no selection try to wrap a word around click point
		if (rangy.getSelection().isCollapsed){
			currentRange = extractWordAt(event.target, event.clientX, event.clientY);
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
			//this next line is necessary because
			//rangy destroys the range when applyToRange is invoked
			rangy.getSelection().setSingleRange(currentRange);
			if (cache[text]){
				//return overlayTranslation(cache[text]);
			}
			currentSource = text;
			//send request to Google
			if(text.trim()!== ''){
				$.ajax(/*config.googleTranslateUrl,*/{
					url: config.googleTranslateUrl,
					type: 'GET',
					dataType: 'jsonp',
					success: gotGreek.jsonCallback,
					//TODO handle error properly	
					error: function(xhr, status){console.log(xhr);console.log(status);},
					data: {
						key: config.googleApiKey,
						source: config.source,
						target: config.target,
						q: text,
					}
				});
			}
		}
	};
	var pushToLimits= function(range){
		var startNodeValue = range.startContainer.nodeValue,
			endNodeValue = range.endContainer.nodeValue,
			start= range.startOffset,
			end = range.endOffset;
		//TODO startNodeValue and endNodeValue might be null
		while (start > 0 && startNodeValue && config.nonBoundaryPattern.test(startNodeValue[start-1])){
			start--;
			console.log('moving back');
		}
		while (endNodeValue && end < endNodeValue.length-1 && config.nonBoundaryPattern.test(endNodeValue[end])){
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
				
				tmp =currentText.substring(start).search(config.nonBoundaryPattern);
				if(tmp === -1) {break;}
				start += tmp;
				range.setStart(node,start);
				
				tmp = currentText.substring(start).search(config.boundaryPattern);
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
			//TODO jquery
			for (counter = 0, len= node.childNodes.length; counter < len ; counter++){
				tmp = extractWordAt(node.childNodes[counter],x,y);
				if (tmp && /\S/.test(tmp.toString())){ return tmp; }
			}
		}
		return null;
	};	
	var boxContainsPoint = function(box, x, y){
		if (box.bottom > y && box.top < y && box.left< x && box.right > x){
			return true;
		}
		return false;
	};
	
	/*
	 * the public interface of gotGreek:
	*/
	return{
		//this function is the only function that is called from the bookmarklet
		boot : function(){
			if(!loaded){
				console.log('loading');
				load();
			}
			else if(!initialized){
				init();
			}
			else if(!running){
				jQuery('body').mouseup(translateListener);
				//TODO this causes a bit of funny behavior
				//TODO change it!
				jQuery('body').mousedown(function(){
					jQuery('#powerTip').remove();
					if(currentRange!==null){
						cssApplier.undoToRange(currentRange);
					}
					rangy.getSelection().removeAllRanges();
				});
				running = true;
				console.log('GotGreek Started.');
			}
			else if(running){
				jQuery('body').unbind('mouseup',translateListener);
				running = false;
				console.log('GotGreek Stopped.');
			}
		},
		
		//the jsonp callback function
		jsonCallback : function(response){
			console.log('recieved translation from Google Translate');
			currentTranslation = response.data.translations[0].translatedText;
			console.log('translation is: '+currentTranslation);
			//TODO what if for some reason currentSource is changed by another request to translate
			// before jsonCallback is called. SOLUTION: make a custom function that calles jsonCallback with a currentrange and currentSource argument.
			// also give an argument to overlayTranslation
			cache[currentSource]=currentTranslation;
			/*jQuery('.gotGreek-selected').data('powertip','<p>en: '+currentTranslation+
									 '</p><hr><p>fr: '+currentSource+
									 '</p><img src="'+config.attributionUrl+
									 '"class="gotGreek-attribution">');
			jQuery('.gotGreek-selected').powerTip({placement:'se',smartPlacement:true,manual:true});
			jQuery.powerTip.show(jQuery('.gotGreek-selected'));*/
		}
	};
}();
