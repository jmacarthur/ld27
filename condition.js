var canvas = document.getElementsByTagName('canvas')[0],
ctx = null,
body = document.getElementsByTagName('body')[0];
var frame = 0;
var keysDown = new Array();
var x;
var y;
var playerImage;

function init() {
    x = 320-64;
    y = 320;
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

    // Now parse that...
    lineArray = request.responseText.split("\n");
    for(var l = 0;l< lineArray.length; l++) {
	line = lineArray[l];
	charArray = line.split(",");
	for(var c=0;c<charArray.length;c++) {
	    mapArray[c][l] = parseInt(charArray[c]);
	}
    }
}

function canMove(x,y)
{

    var startx = Math.floor(x/64);
    var endx = Math.floor((x+63)/64);
    var starty = Math.floor(y/64);
    var endy = Math.floor((y+63)/64);
    for(gx = startx; gx <= endx; gx++) {
	for(gy = starty; gy <= endy; gy++) {
	    if(mapArray[gx][gy]>0) {
		return false;
	    }
	}
    }
    return true;
}

function animate() {
    var dx = 0;
    var dy = 0;
    var speed = 4;
    if(keysDown[38]) {
	dy = -1;
    }
    else if(keysDown[40]) {
	dy = 1;
    }
    if(keysDown[37]) {
	dx = -1;
    }
    else if(keysDown[39]) {
	dx = 1;
    }

    if(dx != 0 && canMove(x+dx*speed,y)) {
	x += dx*speed;
    }
    if(dy != 0 && canMove(x,y+dy*speed)) {
	y += dy*speed;
    }
}

function draw() {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0,0,640,480);
    frame ++;

    // Draw the map
    ctx.fillStyle="#ffffff";
    for(var gx = 0;gx<8;gx++) {
	for(var gy = 0; gy< 8; gy++) {
	    if(mapArray[gx][gy]==1) {
		ctx.fillRect(gx*64,gy*64,64,64)
	    }
	}
    }

    ctx.drawImage(playerImage, x,y);

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