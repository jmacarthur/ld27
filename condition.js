var canvas = document.getElementsByTagName('canvas')[0],
ctx = null,
body = document.getElementsByTagName('body')[0];
var frame = 0;
var keysDown = new Array();
var x;
var y;

var playerImage;
var keyImage;
var worldSize = 20;
var userID=0;
var shardID=0;
var mode=0;
var startFrame = 0;

var imageArray;
var inventory;
var playerFlags;
var deathReason = "";
var mapUpdates = "";
var dragging = false;
var holding=0;
var mapOffsetX = 0;
var mapOffsetY = 0;
var gameMode = 0; // Simple mode...
var halt=false;
var originalMapData="";
var deaths = 0;
var wins = 0;
var lastFetchStats = 0;
var imageNumbers = {
space:    0,
brick:    1,
key:      2,
trousers: 3,
shirt:    4,
door:     5,
lockeddoor: 6,
inspector: 7,
barista: 8,
teller: 9,
assistant: 10,
idcard:11,
coins:12,
banknotes:13,
coffee:14,
ticket:15,
ticketinspector:16,
boat:17,
player: 128,
player_trousers: 129,
player_shirt: 130,
player_dressed: 131,
car: 132,
carleft: 133
};

var gameModes = {
waiting: 0,
playing: 1,
dead:    2
};

function inInventory(t)
{
  for(var i=0;i<4;i++) {
    if(inventory[i]==t) {
      return true;
    }
  }
  return false;
}

function isSolid(t) 
{
  return t==1 || (t==5 && (playerFlags & 3) != 3)
    || (t==6 && !inInventory(imageNumbers['key']))
        || (t==7 && !inInventory(imageNumbers['idcard']))
        || (t==16 && !inInventory(imageNumbers['ticket']))
    || t==8 || t==9 ||t==10;
}

function updateStats()
{
  request = new XMLHttpRequest();
  request.open("GET", "api/getstats.pl?u="+userID,false); // Blocking
  data = userID;
  request.send(""+data);
  console.log("Response received, text:");
  console.log(request.responseText);
  lineArray = request.responseText.split("\n");
  for(var l = 0;l< lineArray.length; l++) {
    line = lineArray[l];
    if(line.substr(0,5)=="WON: ") {
      wins = parseInt(line.substr(5));
    }
    if(line.substr(0,6)=="LOST: ") {
      deaths = parseInt(line.substr(6));
    }
  }
  lastFetchStats = frame;
}

function pollForStart()
{
    request = new XMLHttpRequest();
    console.log("Attempting to log in as user "+userID);
    if(gameMode==1) {
      request.open("GET", "api/poll.pl?u="+userID,false); // Blocking
    }
    else
    {
      request.open("GET", "api/poll_simple.pl?u="+userID,false); // Blocking
    }
    data = userID;
    request.send(""+data);
    console.log("Response received, text:");
    console.log(request.responseText);
    lineArray = request.responseText.split("\n");
    time = -1;
    mapUpdatesCompressed = "";
    inventoryString="0,0,0,0";
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
        else if(line.substr(0,11)=="Inventory: ") {
          inventoryString=line.substr(11);
        }
        else if(line.substr(0,7)=="Shard: ") {          
          shardID=parseInt(line.substr(7));
        }
        else if(line.substr(0,12)=="MapUpdates: ") {
          mapUpdatesCompressed = line.substr(12);
          console.log("Got map updates: "+mapUpdatesCompressed);
        }
    }
    if(time==-1) {
      console.log("Still waiting.");
    }
    else
    {
      if(playerFlags & 4) {
        console.log("Our game has been terminated.");
        mode = 2;        
      }
      else
      {
        console.log("Turn started. x="+x+", y="+y+", time="+time);
        mode = 1;
        startFrame = frame;
        inventory = inventoryString.split(",");
        // Parse the previous map updates...
        readMap(originalMapData);
        if(mapUpdatesCompressed != "") {
          console.log("Processing compressed update "+mapUpdatesCompressed);
          updateArray = mapUpdatesCompressed.split(":");
          for(var u in updateArray) {
            if(updateArray[u] == "") { continue; }
            console.log("Processing map update "+updateArray[u]);
            bits = updateArray[u].split("x");
            mx = parseInt(bits[0]);
            my = parseInt(bits[1]);
            v = parseInt(bits[2]);
            mapArray[mx][my]=v;
          }
        }
        mapUpdates = "";
      }
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

function readMap(text)
{
  // Now parse that...
  lineArray = text.split("\n");
  for(var l = 0;l< lineArray.length; l++) {
    line = lineArray[l];
    charArray = line.split(",");
    if(charArray.length>1) {
      for(var c=0;c<charArray.length;c++) {
        mapArray[c][l] = parseInt(charArray[c]);
      }
    }
  }
}

function init() {
  // First check for a cookie containing a user id.
  cookie = document.cookie;
  console.log("Cookie contains: "+cookie);
  fields = cookie.split("; ");
  for(var f in fields) {
    console.log("Field in cookie:" +fields[f]);
    if(fields[f].substr(0,7)=="userid=") {
      userID = parseInt(fields[f].substr(7));
      console.log("Read user ID "+userID);
      updateStats();
    }
  }
    x = 320-64;
    y = 320;
    inventory = new Array(4);
    for(var i=0;i<4;i++) {
      inventory[i] = 0;
    }
    imageMap = new Array();
    loadImages(['player','key','trousers','shirt', 'brick', 'door',
                'player_trousers','player_shirt','player_dressed',
                'car','carleft', 'assistant','teller','inspector',
                'barista','lockeddoor', 'coins','banknotes','idcard',
                'coffee','ticket','ticketinspector','boat']);
    
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
    originalMapData = request.responseText;

    readMap(originalMapData);

    if(userID==0 || gameMode==1) {

      if(gameMode==1) {
        request.open("GET", "api/login.pl",false); // Blocking
      }
      else
      {
        request.open("GET", "api/login_simple.pl",false); // Blocking
      }
      request.send(null);
      console.log(request.responseText);
      
      // Now parse that...
      lineArray = request.responseText.split("\n");
      for(var l = 0;l< lineArray.length; l++) {
	line = lineArray[l];
        if(line.substr(0,8)=="USERID: ") {
          userID = parseInt(line.substr(8));
        }
        if(line.substr(0,7)=="SHARD: ") {
          shardID = parseInt(line.substr(7));
        }
      }
    }
    if(userID==0 || (shardID==0 && gameMode==1)) {
      console.log("Login failed. (userID="+userID+", shardID="+shardID+")");
      return false;
    }
    else
    {
      console.log("Login complete: UserID="+userID+", shard "+shardID);
    }
    console.log("Writing userID "+userID+" to cookie");
    document.cookie = "userid="+userID;
    mode = 4; // Default, we are waiting for our turn.
    return true;
}


function formatInventory()
{
  var invString=""+inventory[0];
  for(var i=1;i<4;i++) {
    invString+=","+inventory[i];
  }
  return invString;
}

function sendDataToServer()
{
    // Contact the server and get the map...
    request = new XMLHttpRequest();
    request.open("POST", "api/sendMap.pl",false); // Blocking
    var dataString = "Coords: "+x+","+y+"\n";
    dataString += "UserID: "+userID+"\n";
    dataString += "Flags: "+playerFlags+"\n";
    dataString += "Shard: "+shardID+"\n";
    dataString += "Inventory: "+formatInventory()+"\n";
    dataString += mapUpdates;
    request.send(dataString);
    console.log("Data sent...");
    console.log(request.responseText);
    mode = 0;
    updateStats();
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

function removeFromInventory(item)
{
  for(var i=0;i<4;i++) {
    if(inventory[i]==item) {
      inventory[i]=0;
      return;
    }
  }
}


function updateMap(gx,gy,val)
{
  mapArray[gx][gy] = val;
  mapUpdates += "MapUpdate: "+gx+","+gy+","+val+"\n";
}

function attemptCollect(x,y)
{
    var startx = Math.floor(x/64);
    var endx = Math.floor((x+63)/64);
    var starty = Math.floor(y/64);
    var endy = Math.floor((y+63)/64);
    for(gx = startx; gx <= endx; gx++) {
	for(gy = starty; gy <= endy; gy++) {
          if(mapArray[gx][gy]==imageNumbers['key']) {
            updateMap(gx,gy,0);
            addToInventory(2);
          }
          if(mapArray[gx][gy]==imageNumbers['trousers']) {
            updateMap(gx,gy,0);
            playerFlags |= 0x1;           
            addToInventory(12);
          }
          if(mapArray[gx][gy]==imageNumbers['shirt']) {
            updateMap(gx,gy,0);
            playerFlags |= 0x2;
          }
          if(mapArray[gx][gy]==imageNumbers['idcard']) {
            updateMap(gx,gy,0);
            playerFlags |= 0x2;
            addToInventory(imageNumbers['idcard']);
          }
          if(mapArray[gx][gy]==imageNumbers['boat']) {
            playerFlags |= 0x8;
            win();
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

function attemptDragDrop(gx,gy,thing)
{
  console.log("Attempt drop at "+gx+","+gy);
  mapThing = mapArray[gx][gy];
  // Dest can't be too far away
  dx = (gx*64-x);
  dy = (gy*64-y);
  dist = dx*dx+dy*dy;
  if(dist > (128*128)) {
    console.log("Too far away.");
    return;
  }
  if(thing==imageNumbers['coins'] && mapThing==imageNumbers['barista']) {
    removeFromInventory(thing);
    addToInventory(imageNumbers['coffee']);
    return;
  }
  if(thing==imageNumbers['idcard'] && mapThing==imageNumbers['teller']) {
    addToInventory(imageNumbers['banknotes']);
    return;
  }
  if(thing==imageNumbers['banknotes'] && mapThing==imageNumbers['assistant']) {
    removeFromInventory(thing);
    addToInventory(imageNumbers['ticket']);
    return;
  }
}

function configureOffset()
{
  if(x>320) { mapOffsetX = x-320; } else { mapOffsetX = 0; }
  if(y>240) { mapOffsetY = y-240; } else { mapOffsetY = 0; }
}

function squaresCollide(x1,y1,x2,y2,xsize)
{
  var dx = Math.abs(x1-x2);
  var dy = Math.abs(y1-y2);
  if(dx>=xsize){ return false;}
  if(dy>=64){ return false;}
  return true;
}

function die(reason)
{
  playerFlags |= 4;
  deathReason = reason;
  sendDataToServer();
  mode = 2;
}

function win()
{
  playerFlags |= 8;
  sendDataToServer();
  mode = 3;
}

function draw() {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0,0,640,480);
  
  // Draw the map
  ctx.fillStyle="#ffffff";
  configureOffset();
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

    playerImageNo = imageNumbers['player']+(playerFlags & 3);
    ctx.drawImage(imageMap[playerImageNo], x-mapOffsetX,y-mapOffsetY);

    // Draw cars
    // This also check for collisions
    for(c=0;c<4;c++) {
      carx = c*320+(frame%80)*4;
      cary = 480+128;
      ctx.drawImage(imageMap[imageNumbers['car']], carx-mapOffsetX,cary-mapOffsetY);
      if(squaresCollide(carx,cary,x,y,48)) {
        die("Collided with a vehicle");
      }
      carx = (64*worldSize)-(c*320+(frame%80)*4);
      cary = 480+128+64;
      ctx.drawImage(imageMap[imageNumbers['carleft']], carx-mapOffsetX,cary-mapOffsetY);
      if(squaresCollide(carx,cary,x,y,48)) {
        die("Collided with a vehicle");
      }
    }
  
    for(var i = 0;i<4;i++) {
      if(inventory[i]!=0) {
        ctx.drawImage(imageMap[inventory[i]], i*64,480-64);
      }
    }

    // Debug
  ctx.fillStyle = "#0000ff";
  ctx.fillText("Shard "+shardID,32,32);
    

}

function drawWaitScreen() {
  ctx.fillStyle = "#404040";
  ctx.fillRect(0,0,640,480);
}

function plural(x)
{
  if(x!=1) { return "s"; }
  return "";
}

function drawStats()
{
  if((frame - lastFetchStats)>250) {
    updateStats();
  }
  ctx.fillStyle = "#000000";
  ctx.fillText("You have contributed to:",32,320);
  ctx.fillText(wins+" successful day"+plural(wins)+" and",32,320+32);
  ctx.fillText(deaths+" unsuccessful day"+plural(deaths),32,320+64);
}

function drawRepeat() {
  frame ++;

  if(halt && mode==1) {
    sendDataToServer();
    mode=4;
  }

  if(mode==0) {
    // Waiting for our turn.

    drawWaitScreen();
    ctx.fillStyle = "#000000";
    ctx.fillText("(asleep?)",32,32);
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

    ctx.fillStyle = "#000000";
    ctx.fillText("You failed to complete your day",32,32);
    ctx.fillText(deathReason,32,64);
    ctx.fillText("Press space to continue",32,128);
    drawStats();
  }
  else if(mode==3) {
    ctx.fillStyle = "#008000";
    ctx.fillRect(0,0,640,480);

    ctx.fillStyle = "#000000";
    ctx.fillText("You caught the boat",32,32);
    ctx.fillText("Press space to continue",32,128);
    drawStats();
  }
  else if(mode==4) {
    // Title screen / not connecting
    drawWaitScreen();
    ctx.fillStyle = "#000000";
    ctx.fillText("Game paused, press space to start.",32,128); 
    drawStats();
  }
  setTimeout('drawRepeat()',20);
}


if (canvas.getContext('2d')) {
    ctx = canvas.getContext('2d');
    ctx.font="bold 32px Arial";
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
        if(c==81) {
          halt = true;
        }
        if(c==32) {
          halt = false;
          mode = 0;
        }
    };

    body.onkeyup = function (event) {
	var c = event.keyCode;
        keysDown[c] = 0;
    };

    body.onmousedown = function(event) {
      mousex = event.clientX - canvas.offsetLeft;
      mousey = event.clientY - canvas.offsetTop;
      if(mousey>(480-64) && mousey<480 && mousex<=(64*4)) 
      {
        dragging = true;
        slot = Math.floor(mousex/64);
        holding = inventory[slot];
        console.log("Picked up "+holding);
      }
    }
    body.onmouseup = function(event) {
      if(dragging && holding!=0)
      {
        mousex = event.clientX - canvas.offsetLeft;
        mousey = event.clientY - canvas.offsetTop;
        console.log("Dropping "+holding+" at "+mousex+","+mousey);
        gx = Math.floor((mousex+mapOffsetX)/64);
        gy = Math.floor((mousey+mapOffsetY)/64);
        attemptDragDrop(gx,gy,holding);
      }
      holding = 0;
      dragging = false;
    }

    // Clear canvas
    ctx.fillStyle = "#000000";
    ctx.fillRect(0,0,640,480);
    if(init()) {      
      drawRepeat();
    }

    
}