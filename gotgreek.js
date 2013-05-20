var gotGreek = function(){
	//TODO 	remove all console.log
	//TODO	remove gotgreek.css?
	//TODO	change listeners so that right click does not fire translate
	//TODO	write test cases in QUnit
	//TODO 	cleanup all the names!
	/*TODO 	extract source language from html.lang and 
			target language from navigator.lang
			1- how to give further options (say if they are both english: ooh! Merriam Webster has free Api with 1000 queries per day)
			2- is html.lang the only resource I have?
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
			usePowerTip: false,
		},resources= {
			jQuery: {
				url: '//cdnjs.cloudflare.com/ajax/libs/jquery/2.0.0/jquery.min.js',
				loaded: (typeof jQuery !== 'undefined')
			},
			powerTip: {
				url: '//cdnjs.cloudflare.com/ajax/libs/jquery-powertip/1.2.0/jquery.powertip.min.js',
				loaded: !config.usePowerTip || ((typeof jQuery !== 'undefined')?(typeof jQuery.fn.powerTip !== 'undefined'):false)
			},
			powerTipCss: {
				url: '//cdnjs.cloudflare.com/ajax/libs/jquery-powertip/1.2.0/css/jquery.powertip.min.css',
				loaded: !config.usePowerTip || ((typeof jQuery !== 'undefined')?(typeof jQuery.fn.powerTip !== 'undefined'):false)
			},
			rangyCore: {
				url: '//rangy.googlecode.com/svn/trunk/dev/rangy-core.js',
				loaded: (typeof rangy !== 'undefined')
			},
			rangyCssApplier: {
				url: '//rangy.googlecode.com/svn/trunk/dev/rangy-cssclassapplier.js',
				loaded: !config.usePowerTip || ((typeof rangy !== 'undefined')?(typeof rangy.modules.CssClassApplier !== undefined):false)
			}
		},
		loaded=false,running=false,initialized=false, cache,
		//TODO can I remove all this currentX? should I?
		currentSource, currentTranslation, currentRange, cssApplier,currentX,currentY;
	var load = function(){
		
		console.log('loading GotGreek...');
		var m = document.createElement('div');
		m.setAttribute('id','gotGreek-menu');
		m.appendChild(document.createTextNode('Loading ...'));

		document.body.appendChild(m);
		yepnope([{
			test: resources.jQuery.loaded,
			nope: resources.jQuery.url,
			callback: yepnopeCallback
		},{
			test: resources.powerTip.loaded,
			nope: [resources.powerTip.url,resources.powerTipCss.url],
			callback: yepnopeCallback
		},{
			test: resources.rangyCore.loaded,
			nope: resources.rangyCore.url,
			callback: yepnopeCallback
		},{
			test: resources.rangyCssApplier.loaded,
			nope: resources.rangyCssApplier.url,
			callback: yepnopeCallback
		}]);
	};
	var yepnopeCallback= function(url,key,result){
		for (var r in resources){
			if (resources[r].url === url){
				console.log(r+' was not here and is now loaded');
				resources[r].loaded = true;
				break;
			}
		}
		terminateLoad();
	};
	var terminateLoad= function(){
		//TODO handle the case were some resources are unavailable
		var check=true;
		for (r in resources){
			check = check && resources[r].loaded;
		}
		if (check){
			loaded = true;
			jQuery('#gotGreek-menu').remove();
			gotGreek.boot();
		}
	};	
	var init = function(){
		console.log('initializing GotGreek...');
		cache={};
		rangy.init();
		currentRange= null;
		if (config.usePowerTip){
			cssApplier = rangy.createCssClassApplier('gotGreek-selected',{normalize:true});
		}
		initialized = true;
		console.log('GotGreek initialized.');
		gotGreek.boot();
	};
	var translateListener= function(event){
		if(event.button!==0 || !running){return;}
		var text,translation;
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
		//TODO clean the following mess: (why text? just pour it into currentSource after checking condiitons)
		//TODO instead of toString, go through the range and jump over script tags
		text = currentRange.toString();
		// translate the word
		if (/\S/.test(text) && /\D/.test(text)){
			currentX = event.clientX;
			currentY = event.clientY;
			if(config.usePowerTip){
				cssApplier.applyToRange(currentRange);
			}
			rangy.getSelection().setSingleRange(currentRange);
			if (cache[text]){
				//return overlayTranslation(cache[text]);
			}
			currentSource = text;
			//send request to Google
			if(text.trim()!== ''){
				jQuery.ajax(/*config.googleTranslateUrl,*/{
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
	var showTooltip= function(){
		if(config.usePowerTip){
			jQuery('.gotGreek-selected').data('powertip','<p>en: '+currentTranslation+
									 '</p><hr><p>fr: '+currentSource+
									 '</p><img src="'+config.attributionUrl+
									 '"class="gotGreek-attribution">');
			jQuery('.gotGreek-selected').powerTip({placement:'se',smartPlacement:true,manual:true});
			jQuery.powerTip.show(jQuery('.gotGreek-selected'));
		}else{
			//TODO cleanup
			jQuery('body').append(jQuery(document.createElement('div')).attr('id','gotGreek-box').html(
						'<p> en: '+currentTranslation+
						'</p><hr><p>fr: '+currentSource+ '</p><img src="'+config.attributionUrl+
						 '"class="gotGreek-attribution">').css('top',(jQuery(document).scrollTop()+currentY+10)+'px').css('left',
						 											 (jQuery(document).scrollLeft()+currentX+10)+'px'));
		}
	}
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
			}else if(!initialized){
				init();
			}else if(!running){
				jQuery('body').mouseup(translateListener);
				//TODO this causes a bit of funny behavior
				//TODO change it!
				jQuery('body').mousedown(function(){
					if(config.usePowerTip){
						jQuery('#powerTip').remove();
					}else{
						jQuery('#gotGreek-box').remove();
					}
					if(config.usePowerTip && currentRange!==null){
						cssApplier.undoToRange(currentRange);
					}
					rangy.getSelection().removeAllRanges();
				});
				running = true;
				console.log('GotGreek Started.');
			}else if(running){
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
			showTooltip();
		}
	};
}();
