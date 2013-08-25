var canvas = document.getElementsByTagName('canvas')[0],
ctx = null,
body = document.getElementsByTagName('body')[0];
var frame = 0;
var keysDown = new Array();
var x;
var y;

var playerImage;
var keyImage;

var userID=0;
var shardID=0;
var mode=0;
var startFrame = 0;

var imageArray;
var inventory;

var imageNumbers = {
space:    0,
wall:     1,
key:      2,
trousers: 3,
shirt:    4
};

function isSolid(t) 
{
  return t==1;
}

function pollForStart()
{
    request = new XMLHttpRequest();
    console.log("Attempting to log in as user "+userID);
    request.open("GET", "api/poll.pl?u="+userID,false); // Blocking
    data = userID;
    request.send(""+data);
    console.log(request.responseText);
    lineArray = request.responseText.split("\n");
    time = -1;
    for(var l = 0;l< lineArray.length; l++) {
	line = lineArray[l];
	if(line.substr(0,8)=="Coords: ") {
          coordArray=line.match(/\d+/g);
          x = parseInt(coordArray[0]);
          y = parseInt(coordArray[1]);
        }
        else if(line.substr(0,6)=="Time: ") {
          time = line.substr(6);
        }
    }
    if(time==-1) {
      console.log("Still waiting.");
    }
    else
    {
      console.log("Turn started. x="+x+", y="+y+", time="+time);
      mode = 1;
      startFrame = frame;
    }
}

function getImage(name)
{
  image = new Image();
  image.src = 'graphics/'+name+'.png';
  return image;
}

function loadImages(names)
{
  for(var n in names) {
    imageMap[imageNumbers[names[n]]] = getImage(names[n]);
  }
}

function init() {
    x = 320-64;
    y = 320;
    inventory = new Array(4);
    imageMap = new Array();
    loadImages(['player','key','trousers','shirt']);

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

    request.open("GET", "api/login.pl",false); // Blocking
    request.send(null);
    console.log(request.responseText);

    // Now parse that...
    lineArray = request.responseText.split("\n");
    for(var l = 0;l< lineArray.length; l++) {
	line = lineArray[l];
        console.log("Processing response line "+line.substr(0,7)+".");
      
        if(line.substr(0,8)=="USERID: ") {
          userID = parseInt(line.substr(8));
        }
        if(line.substr(0,7)=="SHARD: ") {
          shardID = parseInt(line.substr(7));
        }
    }
    if(userID==0 || shardID==0) {
      console.log("Login failed. (userID="+userID+", shardID="+shardID+")");
      return false;
    }
    else
    {
      console.log("Login complete: UserID="+userID+", shard "+shardID);
    }
    mode = 0; // Default, we are waiting for our turn.
    // Let's poll anyway
    pollForStart();
    return true;
}


function sendDataToServer()
{
    // Contact the server and get the map...
    request = new XMLHttpRequest();
    request.open("POST", "api/sendMap.pl",false); // Blocking
    var dataString = "Coords: "+x+","+y+"\n";
    dataString += "UserID: "+userID+"\n";
    request.send(dataString);
    console.log("Data sent...");
    console.log(request.responseText);
    mode = 0;
}

function canMove(x,y)
{
    var startx = Math.floor(x/64);
    var endx = Math.floor((x+63)/64);
    var starty = Math.floor(y/64);
    var endy = Math.floor((y+63)/64);
    for(gx = startx; gx <= endx; gx++) {
	for(gy = starty; gy <= endy; gy++) {
          if(gx>=8 || gy>=8 || gx<0 || gy<0) {
            return false;
          }
          if(isSolid(mapArray[gx][gy])) {
		return false;
	    }
	}
    }
    return true;
}

function addToInventory(i)
{
  // TODO
}

function attemptCollect(x,y)
{
    var startx = Math.floor(x/64);
    var endx = Math.floor((x+63)/64);
    var starty = Math.floor(y/64);
    var endy = Math.floor((y+63)/64);
    for(gx = startx; gx <= endx; gx++) {
	for(gy = starty; gy <= endy; gy++) {
          if(mapArray[gx][gy]==2) {
            mapArray[gx][gy]=0;
            addToInventory(2);
          }
        }
    }
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
    attemptCollect(x,y);
}

function draw() {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0,0,640,480);
  
  // Draw the map
  ctx.fillStyle="#ffffff";
  for(var gx = 0;gx<8;gx++) {
	for(var gy = 0; gy< 8; gy++) {
	    if(mapArray[gx][gy]==1) {
              ctx.fillRect(gx*64,gy*64,64,64);
	    }
	    else if(mapArray[gx][gy]==0) {
              // Does nothing
	    }
	    else {
              ctx.drawImage(imageMap[mapArray[gx][gy]], gx*64,gy*64);
	    }
	}
    }

    ctx.drawImage(imageMap[imageNumbers['player']], x,y);

}

function drawWaitScreen() {
  ctx.fillStyle = "#404040";
  ctx.fillRect(0,0,640,480);
  
}



function drawRepeat() {
  frame ++;

  if(mode==0) {
    // Waiting for our turn.
    
    drawWaitScreen();
    if(frame % 50 ==0) {
      pollForStart();
    }
  }
  else
  {
    if(frame-startFrame >= 500) {
      sendDataToServer();
    }
    else
    {
      animate();
      draw();
    }
  }
  setTimeout('drawRepeat()',20);
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
    if(init()) {      
      drawRepeat();
    }

    
}