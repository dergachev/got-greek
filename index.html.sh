# positional variables

TITLE=$1
URL_PREFIX=$2

bookmarklet_code(){
cat - <<EOT
function run(){
	if (document.getElementById('gotgreekcss')===null){
		var style = document.createElement('link');
		style.id='gotgreekcss';
		style.type ='text/css';
		style.rel='stylesheet';
		style.href='$URL_PREFIX/style.css';
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
    load: '$URL_PREFIX/gotgreek.js',
		callback: runGotGreek
	});
}
function runGotGreek(){
	console.log(typeof gotGreek);
	gotGreek.boot();
}
run();void(0);
EOT
}

CODE=$(bookmarklet_code | tr '\n' ' ' | sed -e 's/	/ /g' -e 's/"/\\"/g')

cat <<EOT
<!DOCTYPE html>
<html>
	<head> 
    <meta charset="utf-8" />
		<title>Got Greek?</title>
		<link href='http://fonts.googleapis.com/css?family=Roboto+Slab' rel='stylesheet' type='text/css'>
    <style>
      body{
        font-family:'Roboto Slab'; 
        line-height:1.5;
        color:#1b2d37;
      }
      #content{
        font-size:22px;
        width:40%;
        margin:2em auto;
      }
      div.intro {
        font-size: 40px;
      }
      #content a{
        background-color:#cddde6;
        padding:5px;
        border-radius:5px;
        text-decoration:none;
        color:inherit;
      }
    </style>
	</head>

	<body>
		<div id='content'>
			<div class='intro'>
        <a href="javascript:$CODE">$TITLE ⚑</a> is a bookmarklet that provides 
        instant translation to and from any language that Google Translate supports.
      </div>

      <p>
      Dans le port d'Amsterdam <br />
      Y a des marins qui chantent <br />
      Les rêves qui les hantent <br />
      Au large d'Amsterdam <br />
      Dans le port d'Amsterdam <br />
      Y a des marins qui dorment <br />
      Comme des oriflammes <br />
      Le long des berges mornes <br />

      --<em>Amsterdam, par Jacques Brel</em>
    </p>

		</div>
	</body>
</html>
EOT
