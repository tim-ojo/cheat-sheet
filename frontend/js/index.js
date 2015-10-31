
var ipc = require('ipc');

// Window manager module
(function(){
  $(document).on('click', '#closeBtn', function(){
    ipc.sendSync('close-window-msg');
  });

  $(document).on('click', '#minimizeBtn', function(){
    ipc.sendSync('minimize-window-msg');
  });

  $(document).on('submit', '#addEditCheatForm', function(event){
    $('#addEditCheatModal').modal('hide');
    //event.preventDefault();
  });

  $('#cheatsModule').find('ul').delegate('a.cheat-action-edit', 'click', function(event){
    $('#addEditCheatModal').modal('show');
  });

  // This is for debugging purposes - addEditCheatModal
  $('#addEditCheatModal').on('show.bs.modal', function (e) {
    console.log("showing modal");
  });
  $('#addEditCheatModal').on('shown.bs.modal', function (e) {
    console.log("modal shown");
  });
  $('#addEditCheatModal').on('loaded.bs.modal', function (e) {
    console.log("modal content loaded");
  });
  $('#addEditCheatModal').on('hide.bs.modal', function (e) {
    console.log("hiding modal");
  });
  $('#addEditCheatModal').on('hidden.bs.modal', function (e) {
    console.log("modal hidden");
  });

})();

// Cheat Manager Module
(function(){
  // initialize
  var cheatList = ipc.sendSync('load-cheats-msg', 'sync');
  var visibleCheats = cheatList;

  //cache DOM
  var $addEditCheatForm = $('#addEditCheatForm');
  var $showCheatsMod = $('#cheatsModule');
  var $cheatsUl = $showCheatsMod.find('ul');
  var $tagListUl = $('#tagList');
  var cheatListTemplate = $showCheatsMod.find('#cheats-template').html();
  var tagListTemplate = $('#tags-template').html();

  // bind events
  $addEditCheatForm.on('submit', addEditCheat);
  $cheatsUl.delegate('a.cheat-action-edit', 'click', editCheat);
  $cheatsUl.delegate('a.cheat-action-delete', 'click', deleteCheat);

  _render();

  function _render () {
    // show cheats
    var cheatsHtml = Mustache.render(cheatListTemplate, visibleCheats);
    $cheatsUl.html(cheatsHtml);

    // show tags
    //=> call a method to get the tags list by iterating over the cheats
    var tagList = [];
    cheatList.cheats.forEach(function(cheat){
      if (cheat.tags)
      {
        cheat.tags.forEach(function(tag){
          tagList.push(tag);
        });
      }
    });
    //=> and then do the mustache template render thing to render the tag list
    var tagListHtml = Mustache.render(tagListTemplate, {"tagList":tagList});
    $tagListUl.html(tagListHtml);
  }

  function addEditCheat(event) {
    var $cheatId = $("#inputId").val().trim();

    var sep = /\s*,\s*/;
    if ($cheatId === "")
    {
      var newCheat = {
        'id': Date.now(),
        'title': $("#inputTitle").val(),
        'notes' : $("#inputNotes").val(),
        'code' : $("#inputCode").val(),
        'tags' : $("#inputTags").val().split(sep)
      };

      cheatList.cheats.push(newCheat);
      ipc.send('add-cheat-msg', newCheat);
    }
    else {
      var editedCheat = {
        'id': $cheatId,
        'title': $("#inputTitle").val(),
        'notes' : $("#inputNotes").val(),
        'code' : $("#inputCode").val(),
        'tags' : $("#inputTags").val().split(sep)
      };

      if (editedCheat.tags.length === 1 && editedCheat.tags[0] === '')
        editedCheat.tags = null;

      var cheatSearchResult = $.grep(cheatList.cheats, function(c){ return c.id == $cheatId; });
      if (cheatSearchResult.length > 0)
      {
        cheatSearchResult[0].title = editedCheat.title;
        cheatSearchResult[0].notes = editedCheat.notes;
        cheatSearchResult[0].code = editedCheat.code;
        cheatSearchResult[0].tags = editedCheat.tags;
      }
      ipc.send('edit-cheat-msg', editedCheat);
    }

    event.preventDefault();

    $("#inputTitle").val('');
    $("#inputNotes").val('');
    $("#inputCode").val('');
    $("#inputTags").val('');

    _render();
  }

  function editCheat(event) {
    var $cheat = $(event.target).closest('li');

    $("#inputId").val($cheat.find('.panel-body .cheatId').text().trim());
    $("#inputTitle").val($cheat.find('.panel-body .cheatTitle').text());
    $("#inputNotes").val($cheat.find('.panel-body .cheatNotes').text().trim());
    $("#inputCode").val($cheat.find('.panel-body .cheatCode').text());

    var tagString = $cheat.find('.panel-body .cheatTags').map(function () {
          return $(this).text();
      }).get().join();
    $("#inputTags").val(tagString);
  }

  function deleteCheat(event) {
    var cont = confirm("Confirm deletion");
    if (cont === false)
      return;

    var $cheat = $(event.target).closest('li');
    var cheatId = $cheat.find('.panel-body .cheatId').text().trim();

    cheatList.cheats = cheatList.cheats.filter(function (cheat) {
                          return cheat.id != cheatId;
                         });

    ipc.send('delete-cheat-msg', cheatId);

    _render();
  }

})();
