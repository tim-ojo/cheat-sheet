var app = require('app');
var fs = require('fs');
var ipc = require('ipc');
var BrowserWindow = require('browser-window');
var Menu = require('menu');
var MenuItem = require('menu-item');
var shell = require('shell');

var userCheatList = null;
var userDataFilePath = __dirname + '/../data/userData.json';

// Add move function
Array.prototype.move = function (from, to) {
  this.splice(to, 0, this.splice(from, 1)[0]);
};

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

ipc.on('load-cheats-msg', function(event) {
  var userDataFileContents = fs.readFileSync(userDataFilePath);
  userCheatList = JSON.parse(userDataFileContents);

  event.returnValue = userCheatList;
});

ipc.on('add-cheat-msg', function (event, newCheat) {
  userCheatList.cheats.unshift(newCheat);
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

ipc.on('reorder-cheatlist-msg', function (event, reorder) {
  userCheatList.cheats.move(reorder.from, reorder.to);
  persistToDataStoreAsync();
})

function persistToDataStoreAsync() {
  fs.writeFile(userDataFilePath, JSON.stringify(userCheatList), function (err) {
    if (err)
    {
      // TODO: send a message to the UI to display an error
    }
  });
}

/**********************
*  Application Menu
***********************/
app.once('ready', function() {
  var template;
  if (process.platform == 'darwin') {
    template = [
      {
        label: 'Cheat Sheet',
        submenu: [
          {
            label: 'About Cheat Sheet',
            selector: 'orderFrontStandardAboutPanel:'
          },
          {
            type: 'separator'
          },
          {
            label: 'Services',
            submenu: []
          },
          {
            type: 'separator'
          },
          {
            label: 'Hide Cheat Sheet',
            accelerator: 'Command+H',
            selector: 'hide:'
          },
          {
            label: 'Hide Others',
            accelerator: 'Command+Shift+H',
            selector: 'hideOtherApplications:'
          },
          {
            label: 'Show All',
            selector: 'unhideAllApplications:'
          },
          {
            type: 'separator'
          },
          {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: function() { app.quit(); }
          },
        ]
      },
      {
        label: 'File',
        submenu: [
          {
            label: 'New Cheat',
            accelerator: 'Command+N',
            click: function() {
              var focusedWindow = BrowserWindow.getFocusedWindow();
              if (focusedWindow)
                focusedWindow.webContents.send('new-cheat-window-msg');
            }
          },
        ]
      },
      {
        label: 'Edit',
        submenu: [
          {
            label: 'Undo',
            accelerator: 'Command+Z',
            selector: 'undo:'
          },
          {
            label: 'Redo',
            accelerator: 'Shift+Command+Z',
            selector: 'redo:'
          },
          {
            type: 'separator'
          },
          {
            label: 'Cut',
            accelerator: 'Command+X',
            selector: 'cut:'
          },
          {
            label: 'Copy',
            accelerator: 'Command+C',
            selector: 'copy:'
          },
          {
            label: 'Paste',
            accelerator: 'Command+V',
            selector: 'paste:'
          },
          {
            label: 'Select All',
            accelerator: 'Command+A',
            selector: 'selectAll:'
          },
        ]
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Reload',
            accelerator: 'Command+R',
            click: function() {
              var focusedWindow = BrowserWindow.getFocusedWindow();
              if (focusedWindow)
                focusedWindow.reload();
            }
          },
          {
            label: 'Toggle Developer Tools',
            accelerator: 'Alt+Command+I',
            click: function() {
              var focusedWindow = BrowserWindow.getFocusedWindow();
              if (focusedWindow)
                focusedWindow.toggleDevTools();
            }
          },
        ]
      },
      {
        label: 'Window',
        submenu: [
          {
            label: 'Minimize',
            accelerator: 'Command+M',
            selector: 'performMiniaturize:'
          },
          {
            label: 'Close',
            accelerator: 'Command+W',
            selector: 'performClose:'
          },
          {
            type: 'separator'
          },
          {
            label: 'Bring All to Front',
            selector: 'arrangeInFront:'
          },
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Learn More',
            click: function() { shell.openExternal('https://github.com/tim-ojo/cheat-sheet') }
          },
          {
            label: 'Report an Issue',
            click: function() { shell.openExternal('https://github.com/tim-ojo/cheat-sheet/issues') }
          }
        ]
      }
    ];
  } else {
    template = [
      {
        label: '&File',
        submenu: [
          {
            label: '&New Cheat',
            accelerator: 'Ctrl+N',
            click: function() {
              var focusedWindow = BrowserWindow.getFocusedWindow();
              if (focusedWindow)
                focusedWindow.webContents.send('new-cheat-window-msg');
            }
          },
          {
            label: '&Close',
            accelerator: 'Ctrl+W',
            click: function() {
              var focusedWindow = BrowserWindow.getFocusedWindow();
              if (focusedWindow)
                focusedWindow.close();
            }
          },
        ]
      },
      {
        label: '&Edit',
        submenu: [
          {
            label: 'Undo',
            accelerator: 'Ctrl+Z',
            role: 'undo'
          },
          {
            label: 'Redo',
            accelerator: 'Ctrl+Y',
            role: 'redo'
          },
          {
            type: 'separator'
          },
          {
            label: 'Cut',
            accelerator: 'Command+X',
            role: 'cut'
          },
          {
            label: 'Copy',
            accelerator: 'Command+C',
            role: 'copy'
          },
          {
            label: 'Paste',
            accelerator: 'Command+V',
            role: 'paste'
          },
          {
            label: 'Select All',
            accelerator: 'Command+A',
            role: 'selectall'
          },
        ]
      },
      {
        label: '&View',
        submenu: [
          {
            label: '&Reload',
            accelerator: 'Ctrl+R',
            click: function() {
              var focusedWindow = BrowserWindow.getFocusedWindow();
              if (focusedWindow)
                focusedWindow.reload();
            }
          },
          {
            label: 'Toggle &Developer Tools',
            accelerator: 'Shift+Ctrl+I',
            click: function() {
              var focusedWindow = BrowserWindow.getFocusedWindow();
              if (focusedWindow)
                focusedWindow.toggleDevTools();
            }
          },
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Learn More',
            click: function() { shell.openExternal('https://github.com/tim-ojo/cheat-sheet') }
          },
          {
            label: 'Report an Issue',
            click: function() { shell.openExternal('https://github.com/tim-ojo/cheat-sheet/issues') }
          }
        ]
      }
    ];
  }

  var menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
});
