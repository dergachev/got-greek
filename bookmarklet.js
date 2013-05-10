javascript:
  function run(){
    if(document.getElementById("gotgreekcss")===null){
      var style=document.createElement("link");
      style.id="gotgreekcss";
      style.type="text/css";
      style.rel="stylesheet"; 
      style.href="https://s3.amazonaws.com/gotgreek/style.css";
      document.head.appendChild(style);
    }
    if (document.getElementById("gotgreekjs")===null){
      var scr=document.body.appendChild(document.createElement("script"));
      scr.id="gotgreekjs";
      scr.type ="text/javascript";
      scr.src="http://raw.github.com/amirio/got-greek/master/gotgreek.js";
      scr.onreadytstatechange = scr.onload = function(){gotGreek.boot();};
    }else{
      gotGreek.boot();
    }
  }
  run();void(0);
