var app = require('app');
var fs = require('fs');
var ipc = require('ipc');
var BrowserWindow = require('browser-window');

var userCheatList = null;
var userDataFilePath = __dirname + '/../data/userData.json';

/**********************
*  Application Startup
***********************/
app.on('ready', function(){
  var iconPath = __dirname + '/../frontend/img/cs_logo1_256.png';

  var mainWindow = new BrowserWindow({
    width: 480,
    height: 600,
    frame: false,
    icon: iconPath
  });
  mainWindow.loadUrl('file://' + __dirname + '/../frontend/index.html');

  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  ipc.on('close-window-msg', function(event, arg){
    mainWindow.close();
  });
  ipc.on('minimize-window-msg', function(event, arg) {
    mainWindow.minimize();
  });

});

/**********************
*  Application Quit
***********************/
app.on('window-all-closed', function() {
  app.quit();
});


/****************************
* Cheat management functions
*****************************/

ipc.on('load-cheats-msg', function(event, arg) {
  var userDataFileContents = fs.readFileSync(userDataFilePath);
  userCheatList = JSON.parse(userDataFileContents);

  event.returnValue = userCheatList;
});

ipc.on('add-cheat-msg', function (event, newCheat) {
  userCheatList.cheats.push(newCheat);
  persistToDataStoreAsync();
});

ipc.on('edit-cheat-msg', function (event, modifiedCheat) {
  cheatSearchResult = userCheatList.cheats.filter(function (cheat) {
                        return cheat.id == modifiedCheat.id;
                       });

  if (cheatSearchResult.length > 0)
  {
    cheatSearchResult[0].title = modifiedCheat.title;
    cheatSearchResult[0].notes = modifiedCheat.notes;
    cheatSearchResult[0].code = modifiedCheat.code;
    cheatSearchResult[0].tags = modifiedCheat.tags;

    persistToDataStoreAsync();
  }
});

ipc.on('delete-cheat-msg', function (event, cheatId) {
  userCheatList.cheats = userCheatList.cheats.filter(function (cheat) {
                        return cheat.id != cheatId;
                       });

  persistToDataStoreAsync();
});

function persistToDataStoreAsync() {
  fs.writeFile(userDataFilePath, JSON.stringify(userCheatList), function (err) {
    if (err)
    {
      // TODO: send a message to the UI to display an error
    }
  });
}
