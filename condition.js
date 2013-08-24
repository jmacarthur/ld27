var canvas = document.getElementsByTagName('canvas')[0],
ctx = null,
body = document.getElementsByTagName('body')[0];
var frame = 0;

function init() {
    // Does nothing
}

function draw() {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0,0,640,480);
    frame ++;

    ctx.beginPath();
    ctx.fillStyle = "#ff0000";  
    ctx.arc(320,240,32,0,2*Math.PI,false);
    ctx.fill();
}


function drawRepeat() {
    draw();
    setTimeout('drawRepeat()',10);
}


if (canvas.getContext('2d')) {
    ctx = canvas.getContext('2d');

    body.onclick = function (event) {
	// Does nothing
    }
    body.onmousemove = function (event) {
	var width = window.innerWidth, 
        height = window.innerHeight, 
	ctx = canvas.getContext('2d');
	mousex = event.clientX - canvas.offsetLeft;
	mousey = event.clientY - canvas.offsetTop;
	// Does nothing else
    };
   
    // Clear canvas
    ctx.fillStyle = "#000000";
    ctx.fillRect(0,0,640,480);
    init();
    drawRepeat();

    
}