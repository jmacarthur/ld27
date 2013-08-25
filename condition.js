var canvas = document.getElementsByTagName('canvas')[0],
ctx = null,
body = document.getElementsByTagName('body')[0];
var frame = 0;
var keysDown = new Array();
var x;
var y;

var playerImage;
var keyImage;
var worldSize = 16;
var userID=0;
var shardID=0;
var mode=0;
var startFrame = 0;

var imageArray;
var inventory;
var playerFlags;
var deathdReason = "";
var imageNumbers = {
space:    0,
brick:    1,
key:      2,
trousers: 3,
shirt:    4,
door:     5,

player: 128,
player_trousers: 129,
player_shirt: 130,
player_dressed: 131,
car: 132
};

var gameModes = {
waiting: 0,
playing: 1,
dead:    2
};

function isSolid(t) 
{
  return t==1 || (t==5 && (playerFlags & 3) != 3);
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
        else if(line.substr(0,7)=="Flags: ") {
          playerFlags = parseInt(line.substr(7));
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
      mapUpdates = "";
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
    for(var i=0;i<4;i++) {
      inventory[i] = 0;
    }
    imageMap = new Array();
    loadImages(['player','key','trousers','shirt', 'brick', 'door',
                'player_trousers','player_shirt','player_dressed',
                'car','carleft']);
    
    mapArray = new Array(worldSize);
    for(var i=0;i<worldSize;i++) {
	mapArray[i] = new Array(worldSize);
        for(var j=0;j<worldSize;j++) {
          mapArray[i][j] = 0;
        }
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
        if(charArray.length>1) {
          for(var c=0;c<charArray.length;c++) {
	    mapArray[c][l] = parseInt(charArray[c]);
          }
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
    dataString += "Flags: "+playerFlags+"\n";
    dataString += mapUpdates;
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
          if(gx>=worldSize || gy>=worldSize || gx<0 || gy<0) {
            return false;
          }
          if(isSolid(mapArray[gx][gy])) {
		return false;
	    }
	}
    }
    return true;
}

function addToInventory(item)
{
  for(var i=0;i<4;i++) {
    if(inventory[i]==0) {
      inventory[i]=item;
      return true;
    }
  }
  return false;
}

function updateMap(gx,gy,val)
{
  mapArray[gx][gy] = val;
  mapUpdates += "MapUpdate: "+gx+","+gy+","+val
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
            updateMap(gx,gy,0);
            mapArray[gx][gy]=0;

            addToInventory(2);
          }
          if(mapArray[gx][gy]==3) {
            updateMap(gx,gy,0);
            playerFlags |= 0x1;           
          }
          if(mapArray[gx][gy]==4) {
            mapArray[gx][gy]=0;
            playerFlags |= 0x2;
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

function squaresCollide(x1,y1,x2,y2,xsize)
{
  var dx = Math.abs(x1-x2);
  var dy = Math.abs(y1-y2);
  if(dx>=xsize){ return false;}
  if(dy>=64){ return false;}
  return true;
}

function draw() {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0,0,640,480);
  
  // Draw the map
  ctx.fillStyle="#ffffff";
  mapOffsetX = 0;
  mapOffsetY = 0;
  if(x>320) { mapOffsetX = x-320; }
  if(y>240) { mapOffsetY = y-240; }
  for(var gx = 0;gx<worldSize;gx++) {
    for(var gy = 0; gy< worldSize; gy++) {
      if(mapArray[gx][gy]==0) {
        // Does nothing
      }
      else {
        ctx.drawImage(imageMap[mapArray[gx][gy]], gx*64-mapOffsetX,gy*64-mapOffsetY);
      }
    }
  }
  
    for(var i = 0;i<4;i++) {
      if(inventory[i]!=0) {
        ctx.drawImage(imageMap[inventory[i]], i*64,480-64);
      }
    }
    playerImageNo = imageNumbers['player']+(playerFlags & 3);
    ctx.drawImage(imageMap[playerImageNo], x-mapOffsetX,y-mapOffsetY);

    // Draw cars
    // This also check for collisions
    for(c=0;c<4;c++) {
      carx = c*256+(frame%64)*4;
      cary = 480+128;
      ctx.drawImage(imageMap[imageNumbers['car']], carx-mapOffsetX,cary-mapOffsetY);
      if(squaresCollide(carx,cary,x,y,48)) {
        playerFlags |= 4;
        deathReason = "Collided with a vehicle";
      }
      carx = 1280-(c*256+(frame%64)*4);
      cary = 480+128+64;
      ctx.drawImage(imageMap[imageNumbers['carleft']], carx-mapOffsetX,cary-mapOffsetY);
      if(squaresCollide(carx,cary,x,y,48)) {
        playerFlags |= 4;
        deathReason = "Collided with a vehicle";
      }
    }
}

function drawWaitScreen() {
  ctx.fillStyle = "#404040";
  ctx.fillRect(0,0,640,480);
  
}



function drawRepeat() {
  frame ++;

  if(playerFlags & 4) {
    mode=2;
  }

  if(mode==0) {
    // Waiting for our turn.
    
    drawWaitScreen();
    if(frame % 50 ==0) {
      pollForStart();
    }
  }
  else if(mode==1)
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
  else if(mode==2) {
    ctx.fillStyle = "#800000";
    ctx.fillRect(0,0,640,480);
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