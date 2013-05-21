javascript:
function run(){
	if (document.getElementById('gotgreekcss')===null){
		var style = document.createElement('link');
		style.id='gotgreekcss';
		style.type ='text/css';
		style.rel='stylesheet';
		style.href='//s3.amazonaws.com/gotgreek/style.css'; 
		document.head.appendChild(style);
		var m = document.createElement('div');
		m.setAttribute('id','gotGreek-menu');
		m.appendChild(document.createTextNode('GotGreek is Loading ...'));
		document.body.appendChild(m);
	}
	if(typeof yepnope === 'undefined'){
		var yepnopeScript = document.createElement('script');
		yepnopeScript.type='text/javascript';
		yepnopeScript.src='//cdnjs.cloudflare.com/ajax/libs/yepnope/1.5.4/yepnope.min.js';
		yepnopeScript.onreadystatechange = yepnopeScript.onload = loadGotGreek;
		document.head.appendChild(yepnopeScript);
	}else{
		loadGotGreek();
	}
}
function loadGotGreek(){
	yepnope({
		load: 'http://localhost/gotgreek/gotgreek.js',
		callback: runGotGreek
	});
}
function runGotGreek(){
	gotGreek.boot();
}
run();void(0);
