var gotGreek = function(){
	var languages = {
			'en':'English',
			'fr':'Français',
			'de':'Deutsch',
			'he':'עברית',
			'hi':'हिन्दी, हिंदी',
			'el':'ελληνικά',
			'pt':'Português',
			'tr':'Türkçe',
			'ar':'العربية',
			'fa':'فارسی',
			'ru':'русский язык',
			'it':'Italiano',
			'es':'Español'},
		running=false,initialized=false,
		boundaryPattern=/[\s:!.,\"\(\)«»%$]/,
		nonBoundaryPattern=/[^\s:!.,\"\(\)«»%$]/,
		cache, menu, currentTranslate,
		currentX, currentY, bufferX, bufferY,
		fromLang, toLang,
		attributionURL, closeIconURL, arrowImageURL, googleAPIKey, googleTranslateURL;
	
	//**************
	//main functions
	//**************

	// this is the main internal function (only invoked when 'Go!' button is pressed), life starts here.
	var go = function(from,to){
		running=true;
		toLang = to;
		fromLang=from;
		cache={};
		
		// set selected values of menu selects
		document.getElementById('gotGreek-to').value=toLang;
		document.getElementById('gotGreek-from').value=fromLang;
		menu.className='hidden';

		document.body.addEventListener('mouseup', translateListener);
		
		// set a different listener for mousemove (for words in <a> elements)
		document.body.addEventListener('mousemove', function(event){
			bufferX = event.clientX;
			bufferY = event.clientY;
			if(event.target.nodeType=== Node.ELEMENT_NODE && event.target.tagName.toLowerCase()==='a'){
				setTimeout(	function(){
							//wait half a second, if the mouse pointer is still 'close enough', start the operation
								if (Math.abs(event.clientX-bufferX)<5 && 
									Math.abs(event.clientY-bufferY)<5){
										currentX = event.clientX;
										currentY = event.clientY;
										var text= extractWordAt(event.target, currentX, currentY);
										if (/\S/.test(text) && /\D/.test(text)){
											translate(text,fromLang,toLang);
										}
										bufferX=0;
										bufferY=0;
								}
							},500);
			}
		});
	};
	// this function is called only once by gotGreek.boot
	var init = function(from,to,google,close,arrow,apiKey,translateUrl){
		fromLang=from;
		toLang=to;
		attributionURL = google;
		closeIconURL   = close;  
		arrowImageURL  = arrow;
		googleAPIKey   = apiKey;
		googleTranslateURL   = translateUrl;
		menu = createMenu();
		document.body.appendChild(menu);
		initialized=  true;
	};

	// all translation operations start here
	var translateListener= function(event){
		if(!running){return;}
		if(menu.className===''){
			menu.className='hidden';
			return;
		}
		var text;
		currentX=event.clientX;
		currentY=event.clientY;
		// if there is no selection try to wrap a word around click point
		if (window.getSelection().isCollapsed){
			text = extractWordAt(event.target, currentX, currentY);
		}
		// if there is a selection, push it to its bounding limits
		else{
			text = pushToLimits(window.getSelection().getRangeAt(0));
		}
		// translate the word
		if (/\S/.test(text) && /\D/.test(text)){
			translate(text,fromLang,toLang);
		}
	};
	
	var translate = function(text,from,to){
		currentTranslate = text;
		if (cache[text]){
			return overlayTranslation(cache[text]);
		}
		var url;
		if(text.trim()!== ''){
			url = googleTranslateURL+'?key='+googleAPIKey+'&source='+from+'&target='+to+'&q='+text+'&callback=gotGreek.jsonCallback';
			jsonp(url);
		}
	};
	var jsonp = function (url) {
		var head = document.head;
		var script = document.createElement('script');
		script.setAttribute('src', url);
		head.appendChild(script);
		head.removeChild(script);
	};
	var pushToLimits= function(range){
		var startNodeValue = range.startContainer.nodeValue,
			endNodeValue = range.endContainer.nodeValue,
			start= range.startOffset,
			end = range.endOffset;
		while (start > 0 && nonBoundaryPattern.test(startNodeValue[start-1])){
			start--;
		}
		while (end < endNodeValue.length-1 && nonBoundaryPattern.test(endNodeValue[end])){
			end++;
		}
		range.setStart(range.startContainer,start);
		range.setEnd(range.endContainer,end);
		return range.toString();
	};

	// recursively finds a word inside node that contains the point (x,y) 
	// and is bounded by boundary characters:
	// any space character, all punctuation marks except for single quote and dash.
	// if no string is found an empty string is returned
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
				range = node.ownerDocument.createRange();
				
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
				if (boxContainsPoint(range.getBoundingClientRect(),x,y)){
					//found the word
					return range.toString();
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
				if (/\S/.test(tmp)){ return tmp; }
			}
		}
		return '';
	};	
	
	// *****************
	// helper functions
	// *****************
	
	var boxContainsPoint = function(box, x, y){
		if (box.bottom > y && box.top < y && box.left< x && box.right > x){
			return true;
		}
		return false;
	};
	// this function is called from init() which is only invoked by gotGreek.boot 
	var createMenu = function(){
		// m is the DOMElement to be returned
		var m = document.createElement('div'),
			fromSelect= document.createElement('select'),
			toSelect= document.createElement('select'),
			option,//  options in select elements
			menuContentWrap,// wraps the contents of menu: both selects and both buttons 
			goButton,killButton,arrowImg;
		m.id='gotGreek-menu';
		m.appendChild(createCloseButton('hide'));
		m.appendChild(createAttribution());
		m.addEventListener('mouseup',function(event){
			event.stopPropagation();
		});
		
		menuContentWrap = document.createElement('div');
		menuContentWrap.id='gotGreek-buttonWrap';
		toSelect.id='gotGreek-to';
		fromSelect.id='gotGreek-from';
		
		// add all languages to selects, set the 'selected' values, and to container
		for (var langCode in languages){
			option= document.createElement('option');
			option.value=langCode;
			option.appendChild(document.createTextNode(languages[langCode]));
			toSelect.appendChild(option.cloneNode(true));
			fromSelect.appendChild(option.cloneNode(true));
		}
		toSelect.value = toLang;
		fromSelect.value=fromLang;
		menuContentWrap.appendChild(fromSelect);
		
		// build arrow img element and add to container
		arrowImg = document.createElement('img');
		arrowImg.className='gotGreek-direction';
		arrowImg.src=arrowImageURL;
		menuContentWrap.appendChild(arrowImg);
		
		menuContentWrap.appendChild(toSelect);
		
		// build the Go! button, and add it to container
		goButton = document.createElement('button');
		goButton.appendChild(document.createTextNode('Go!'));
		goButton.id='gotGreek-go';
		goButton.addEventListener('click',function(){
			var tmpFrom = document.getElementById('gotGreek-from'),
				tmpTo=	  document.getElementById('gotGreek-to');
			go(tmpFrom.options[tmpFrom.selectedIndex].value,
							tmpTo.options[tmpTo.selectedIndex].value);
			document.getElementById('gotGreek-terminate').className='';
		});
		menuContentWrap.appendChild(goButton);

		// build the Stop button, and add it to container
		killButton = document.createElement('button');
		killButton.id='gotGreek-terminate';
		killButton.className='hidden';
		killButton.appendChild(document.createTextNode('Stop GotGreek'));
		killButton.addEventListener('click',function(){
			menu.parentNode.removeChild(menu);
			running = false;
		});
		menuContentWrap.appendChild(killButton);
		
		m.appendChild(menuContentWrap);
		return m;
	};

	// overlays the translation response at the point the request was initiated
	var overlayTranslation = function(translation){
		//don't do anything if translation box is already open
		if(document.getElementById('gotGreek-translation-'+translation)!== null){
			return;
		}

		var box, span, close, attribution;
		box= document.createElement('div');
		box.className='gotGreek-box';
		
		// gotGreek-box is positioned absolutely and is a direct child of body; set offsets:
		box.style.top  = (document.documentElement.scrollTop  + currentY+10) +'px';
		box.style.left = (document.documentElement.scrollLeft + currentX+10) +'px';
		
		box.id = 'gotGreek-translation-'+currentTranslate;	
		span = document.createElement('span');
		span.innerHTML = translation;

		box.appendChild(span);
		box.appendChild(createCloseButton('remove'));
		box.appendChild(createAttribution());
		document.body.appendChild(box);
	};
	// creates and returns a close button and depending on whether action is set to 'hide' or 'remove'
	// sets the mouseup listener
	var createCloseButton = function(action){
		var close = document.createElement('img');
		close.className='gotGreek-close';
		close.src=closeIconURL;
		close.addEventListener('mouseup',function(event){
			event.stopPropagation();
			if(action==='remove'){
				document.body.removeChild(this.parentNode);
			}else if (action==='hide'){
				this.parentNode.className='hidden';
			}
		});
		return close;
	};
	
	// creates attribution to Google element
	var createAttribution = function(){
		var attribution= document.createElement('img');
		attribution.className='gotGreek-attribution';
		attribution.src=attributionURL;
		return attribution;
	};
	
	//*************
	// the public interface of gotGreek:
	//*************
	return{
		//this function is the only function that is called from the bookmarklet
		boot : function(){
			if(!running && !initialized){
				init('fr','en',	'https://raw.github.com/amirio/got-greek/master/google.png',
								'https://raw.github.com/amirio/got-greek/master/close.png',
								'https://raw.github.com/amirio/got-greek/master/arrow.png',
								'AIzaSyAICISSmAHfsclKJ4eu5UtbhhtWMLUqxcY',
								'https://www.googleapis.com/language/translate/v2');
			}
			menu.className='';
		},
		
		//the jsonp callback function
		jsonCallback : function(response){
			var translation = response.data.translations[0].translatedText;
			//TODO what if for some reason currentTranslate is changed by another request to translate
			// before jsonCallback is called
			cache[currentTranslate]=translation;
			overlayTranslation(translation);
		}
	};
}();
