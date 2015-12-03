var ipc = require('ipc');

// Add move function
Array.prototype.move = function (from, to) {
  this.splice(to, 0, this.splice(from, 1)[0]);
};

/*************************
* Window manager module
**************************/

var windowMgr = (function(){
  $(document).on('click', '#closeBtn', function(){
    ipc.sendSync('close-window-msg');
  });

  $(document).on('click', '#minimizeBtn', function(){
    ipc.sendSync('minimize-window-msg');
  });

  $(document).on('submit', '#editCheatForm', function(event){
    $('#editCheatModal').modal('hide');
  });

  $('#cheatsUl').delegate('a.cheat-action-edit', 'click', function(event){
    $('#editCheatModal').modal('show');
  });

  ipc.on('new-cheat-window-msg', function(event){
    $('#addBtn').click();
  });

  $('.modal').on('hidden.bs.modal', function(){
    $(this).find('#editCheatForm')[0].reset();
  });

  var remote = require('remote');
  var Menu = remote.require('menu');
  var MenuItem = remote.require('menu-item');

  var menu = new Menu();
  menu.append(new MenuItem({ label: 'Cut', selector: 'cut:', accelerator: 'CmdOrCtrl+X' }));
  menu.append(new MenuItem({ label: 'Copy', selector: 'copy:', accelerator: 'CmdOrCtrl+C' }));
  menu.append(new MenuItem({ label: 'Paste', selector: 'paste:', accelerator: 'CmdOrCtrl+V' }));
  menu.append(new MenuItem({ label: 'Select All', selector: 'selectAll:', accelerator: 'CmdOrCtrl+A' }));

  window.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    menu.popup(remote.getCurrentWindow());
  }, false);

})();

/*************************
* Cheat manager module
**************************/

(function(){
  // initialize
  var cheatList = ipc.sendSync('load-cheats-msg');

  //cache DOM
  var $editCheatForm = $('#editCheatForm');
  var $cheatsView = $('#cheatsView');
  var $cheatsUl = $('#cheatsUl');
  var $tagListUl = $('#tagList');
  var cheatListTemplate = $cheatsView.find('#cheats-template').html();
  var tagListTemplate = $('#tags-template').html();

  // bind events
  $editCheatForm.on('submit', saveEdits);
  $cheatsUl.delegate('a.cheat-action-edit', 'click', loadCheatToEditForm);
  $cheatsUl.delegate('a.cheat-action-delete', 'click', deleteCheat);
  $tagListUl.delegate('a', 'click', filterCheatList);

  _render();

  function _render () {
    // render cheats
    $cheatsUl.html(Mustache.render(cheatListTemplate, cheatList));
    _enableDragAndDrop();

    // render tags
    var tagList = [];
    cheatList.cheats.forEach(function(cheat){
      if (cheat.tags)
      {
        cheat.tags.forEach(function(tag){
          if (tagList.indexOf(tag) === -1)
            tagList.push(tag);
        });
      }
    });
    $tagListUl.html(Mustache.render(tagListTemplate, {"tagList":tagList}));

    _renderTagSelection();
  }

  function _enableDragAndDrop()
  {
    $('.sortable').sortable({
      forcePlaceholderSize: true,
      handle: '.sort-handle'
    })
    .bind('sortupdate', function(e, ui) {
      cheatList.cheats.move(ui.oldElementIndex, ui.elementIndex);
      ipc.send('reorder-cheatlist-msg', {from: ui.oldElementIndex, to: ui.elementIndex});
    });
  }

  function _renderTagSelection()
  {
    $tagListUl.find('li').each(function(i, li){
      var tagItem = $(li);
      if (!tagItem.hasClass('selectedTag'))
        tagItem.find('span').css('visibility', 'hidden');
      else
        tagItem.find('span').css('visibility', 'visible');
    });
  }

  function loadCheatToEditForm(event) {
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

  function saveEdits(event) {
    var $cheatId = $("#inputId").val().trim();
    var sep = /\s*,\s*/;

    if ($cheatId === "") //We have a brand new cheat
    {
      var newCheat = {
        'id': Date.now(),
        'title': $("#inputTitle").val(),
        'notes' : $("#inputNotes").val(),
        'code' : $("#inputCode").val(),
        'tags' : $("#inputTags").val().split(sep)
      };

      if (newCheat.tags.length === 1 && newCheat.tags[0] === '') // no tags
        newCheat.tags = null;

      cheatList.cheats.unshift(newCheat);
      ipc.send('add-cheat-msg', newCheat);
    }
    else // We are editing an existing cheat
    {
      var editedCheat = {
        'id': $cheatId,
        'title': $("#inputTitle").val(),
        'notes' : $("#inputNotes").val(),
        'code' : $("#inputCode").val(),
        'tags' : $("#inputTags").val().split(sep)
      };

      if (editedCheat.tags.length === 1 && editedCheat.tags[0] === '') // no tags
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
    _render();
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

  function filterCheatList(event) {

    $tagListUl.find('li').removeClass('selectedTag');
    var $selectedTag = $(event.target).closest('li');
    $selectedTag.addClass('selectedTag');
    _renderTagSelection();

    var selectedTagText = $selectedTag.text();
    if (selectedTagText === 'All')
    {
      $cheatsUl.find('li').each(function (index, listItem){
        $(listItem).show();
      });
    }
    else {
      $cheatsUl.find('li').each(function (index, listItem){
        $tagSpans = $(listItem).find('span.cheatTags');
        if (!$tagSpans.text().includes(selectedTagText))
        {
          $(listItem).hide();
        }
        else {
          $(listItem).show();
        }
      });
    }

  }

})();
