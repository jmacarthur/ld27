var canvas = document.getElementsByTagName('canvas')[0],
ctx = null,
body = document.getElementsByTagName('body')[0];
var frame = 0;
var keysDown = new Array();
var x;
var y;
var playerImage;

function init() {
    x = 320;
    y = 240;
    playerImage = new Image();
    playerImage.src = 'graphics/player.png';
    mapArray = new Array(8);
    for(var i=0;i<8;i++) {
	mapArray[i] = new Array(8);
    }
    // Contact the server and get the map...
    request = new XMLHttpRequest();
    request.open("GET", "data/map.txt",false); // Blocking
    request.send(null);
    console.log(request.responseText);
}

function animate() {
    if(keysDown[38]) {
	y -= 1;
    }
    else if(keysDown[40]) {
	y += 1;
    }
    if(keysDown[37]) {
	x -= 1;
    }
    else if(keysDown[39]) {
	x += 1;
    }

}

function draw() {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0,0,640,480);
    frame ++;

    ctx.beginPath();
    ctx.fillStyle = "#ff0000";  
    ctx.arc(x,y,32,0,2*Math.PI,false);
    ctx.fill();

    ctx.drawImage(playerImage, 32,32);

}


function drawRepeat() {
    animate();
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
    body.onkeydown = function (event) {
	var c = event.keyCode;
        keysDown[c] = 1;
        console.log("Pressed key: "+c);
    };

    body.onkeyup = function (event) {
	var c = event.keyCode;
        keysDown[c] = 0;
    };

    // Clear canvas
    ctx.fillStyle = "#000000";
    ctx.fillRect(0,0,640,480);
    init();
    drawRepeat();

    
}