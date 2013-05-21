var gotGreek = function(){
	var	config = {
			boundaryPattern:/[\s:!.,\"\(\)«»%$]/,
			nonBoundaryPattern:/[^\s:!.,\"\(\)«»%$]/,
			attributionUrl:'https://s3.amazonaws.com/gotgreek/google.png',
			googleApiKey:'AIzaSyAICISSmAHfsclKJ4eu5UtbhhtWMLUqxcY',
			googleTranslateUrl:'https://www.googleapis.com/language/translate/v2',
			source: '',
			target: '',
			usePowerTip: false,
		},
		//external resources that GotGreek has to load
		resources= {
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
		currentJob = {
			text: '', translation: '', range: null, x:0, y:0
		},
		loaded=false,running=false,initialized=false, cache, cssApplier;
	// loads all external libraries 
	var load = function(){	
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
		config.source = (jQuery('html').attr('lang') || jQuery('html').attr('xml:lang') || 'fr').toLowerCase();
		config.target = (navigator.language.substring(0,2) || navigator.userLanguage.substring(0,2) || 'en').toLowerCase();
		cache={};
		rangy.init();
		currentJob.range= null;
		if (config.usePowerTip){
			cssApplier = rangy.createCssClassApplier('gotGreek-selected',{normalize:true});
		}
		initialized = true;
		gotGreek.boot();
	};
	var translateListener= function(event){
		// remove all existing tooltips
		if(config.usePowerTip){
			jQuery('#powerTip').remove();
			if (currentJob.range !== null){
				cssApplier.undoToRange(currentJob.range);
			}
		}else{
			console.log(jQuery('#gotGreek-box'));
			jQuery('#gotGreek-box').remove();
		}
		if(event.button!==0 || !running){return;}
		// if there is no selection try to wrap a word around click point
		if (rangy.getSelection().isCollapsed){
			currentJob.range = extractWordAt(event.target, event.clientX, event.clientY);
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
		if (/\S/.test(tmp) && /\D/.test(tmp)){
			currentJob.text = tmp.replace(/\s/g,' ');
			currentJob.x = event.clientX;
			currentJob.y = event.clientY;
			if(config.usePowerTip){
				cssApplier.applyToRange(currentJob.range);
			}
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
		if(config.usePowerTip){
			jQuery('.gotGreek-selected').data('powertip','<p><b>en</b>: '+currentJob.translation+
									 '</p><hr><p><b>fr</b>: '+currentJob.text+
									 '</p><img src="'+config.attributionUrl+'">');
			jQuery('.gotGreek-selected').powerTip({placement:'se',smartPlacement:true,manual:true});
			jQuery.powerTip.show(jQuery('.gotGreek-selected'));
		}else{
			jQuery('body').append(
						jQuery(document.createElement('div'))
						.attr('id','gotGreek-box')
						.html(	'<p><b>en</b>: '+currentJob.translation+'</p><hr><p><b>fr</b>: '+currentJob.text+ 
								'</p><img src="'+config.attributionUrl+ '">')
						.css('top',(jQuery(document).scrollTop()+currentJob.y+10)+'px')
						.css('left',(jQuery(document).scrollLeft()+currentJob.x+10)+'px'));
		}
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
	// helper function for translateListener, recursively traverses the DOM in search of the word that contains (x,y) 
	var extractWordAt = function(node,x,y){
		var range,
			currentText = node.nodeValue,
			start, end, counter, tmp, len;
		if (node.nodeType === node.TEXT_NODE && /\S/.test(currentText)){
			// if node is a text node, start digging the word out: slide the range (start,end) along node.nodeValue until
			// the corresponding range contains (x,y) the sliding window (start,end) jumps over non bounding characters.
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
		// if node is an element, go through its children
		else if (node.nodeType === node.ELEMENT_NODE){
			// if (x,y) falls outside of containing rectangle of the node, don't bother.
			if (!boxContainsPoint(node.getBoundingClientRect(), x, y)){ return null; }
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
				load();
			}else if(!initialized){
				init();
			}else if(!running){
				jQuery(window).mouseup(translateListener);
				running = true;
			}else if(running){
				var m = jQuery(document.createElement('div')).attr('id','gotGreek-menu').text('GotGreek is Stopping...');
				
				jQuery('body').append(m);
				jQuery('body').unbind('mouseup',translateListener);
				running = false;
				m.fadeOut(1000,function(){
					if (config.usePowerTip){
						jQuery('#powerTip').remove();
						if(currentJob.range!== null) {
							cssApplier.undoToRange(currentJob.range);
						}
					}else{
						jQuery('#gotGreek-box').remove();
					}
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
