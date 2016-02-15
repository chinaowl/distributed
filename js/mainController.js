angular
  .module('fireideaz')
  .controller('MainCtrl', ['$firebaseArray', '$scope', '$filter', '$window', 'Utils', 'Auth', '$rootScope',
    function($firebaseArray, $scope, $filter, $window, utils, auth, $rootScope) {
      $scope.loading = true;
      $scope.messageTypes = utils.messageTypes;
      $scope.utils = utils;
      $scope.newBoard = { name: '' };
      $scope.userId = $window.location.hash.substring(1) || '';
      $scope.sortField = '$id';

      function getBoardAndMessages(userData) {
        $scope.userId = $window.location.hash.substring(1) || '499sm';

        var messagesRef = new Firebase("https://blinding-torch-6662.firebaseio.com/messages/" + $scope.userId);
        var board = new Firebase("https://blinding-torch-6662.firebaseio.com/boards/" + $scope.userId);

        board.on("value", function(board) {
          $scope.board = board.val();
          $scope.boardId = $rootScope.boardId = board.val().boardId;
          $scope.boardContext = $rootScope.boardContext = board.val().boardContext;

          new Clipboard('#copy-board');
        });


        $scope.boardRef = board;
        $scope.userUid = userData.uid;
        $scope.messages = $firebaseArray(messagesRef);
        $scope.loading = false;
      }

      if($scope.userId !== '') {
        var messagesRef = new Firebase("https://blinding-torch-6662.firebaseio.com/messages/" + $scope.userId);
        auth.logUser($scope.userId, getBoardAndMessages);
      } else {
        $scope.loading = false;
      }

      $scope.seeNotification = function() {
         localStorage.setItem('funretro1', true);
       };
 
       $scope.showNotification = function() {
         return !localStorage.getItem('funretro1') && $scope.userId !== '';
       };

      $scope.droppedEvent = function(dragEl, dropEl) {
        if(dragEl !== dropEl) {
          $scope.dragEl = dragEl;
          $scope.dropEl = dropEl;

          utils.openDialogMergeCards($scope);
        }
      };

      $scope.dropped = function(dragEl, dropEl) {
        var drag = $('#' + dragEl);
        var drop = $('#' + dropEl);

        var dropMessageRef = new Firebase("https://blinding-torch-6662.firebaseio.com/messages/" + $scope.userId + '/' + drop.attr('messageId'));
        var dragMessageRef = new Firebase("https://blinding-torch-6662.firebaseio.com/messages/" + $scope.userId + '/' + drag.attr('messageId'));

        dropMessageRef.once('value', function(dropMessage) {
          dragMessageRef.once('value', function(dragMessage) {
            dropMessageRef.update({
              text: dropMessage.val().text + ' | ' + dragMessage.val().text
            });

            dragMessageRef.remove();
            utils.closeAll();
          });
        });
      }

      $scope.boardNameChanged = function() {
        $scope.newBoard.name = $scope.newBoard.name.replace(/\s+/g,'');
      };

      $scope.getSortOrder = function() {
        if($scope.sortField === 'votes') {
          return true;
        } else {
          return false;
        }
      };

      $scope.createNewBoard = function() {
        $scope.loading = true;
        utils.closeAll();
        var newUser = utils.createUserId();
        $scope.userId = newUser;

        var callback = function(userData) {
          var board = new Firebase("https://blinding-torch-6662.firebaseio.com/boards/" + $scope.userId);
          board.set({
            boardId: $scope.newBoard.name,
            date_created: new Date().toString(),
            columns: $scope.messageTypes,
            user_id: userData.uid
          });

          window.location.href = window.location.origin + window.location.pathname + "#" + newUser;

          $scope.newBoard.name = '';
        };

        auth.createUserAndLog(newUser, callback);
      };

      $scope.deleteBoard = function() {
        var result = window.confirm('Are you sure you want to delete it?');
        if (result) {
          $($scope.messages).each(function(index, message) {
            $scope.messages.$remove(message);
          });

          $scope.board.$delete();
        }
      };

      $scope.clipboardText = function() {

        if($scope.board) {
        var clipboard = '';

        $($scope.board.columns).each(function(index, column) {
          clipboard += '\n' + column.value + ' \n';

          $($scope.messages).each(function(index2, message) {
            if(message.type.id === column.id) {
              clipboard += '- ' + message.text + ' (' + message.votes + ' votes) \n';
            }
          });
        });

        return clipboard;
        }
      }

      $scope.changeBoardContext = function() {
        $scope.boardRef.update({
          boardContext: $scope.boardContext
        });
      };

      $scope.toggleVote = function(key, votes) {
        if(!localStorage.getItem(key)) {
          messagesRef.child(key).update({ votes: votes + 1, date: Firebase.ServerValue.TIMESTAMP });
          localStorage.setItem(key, 1);
       } else {
         messagesRef.child(key).update({ votes: votes - 1, date: Firebase.ServerValue.TIMESTAMP });
         localStorage.removeItem(key);
       }
      };

      $scope.addNewColumn = function(name) {
        $scope.board.columns[utils.getNextId($scope.board) - 1] = {
          value: name,
          id: utils.getNextId($scope.board)
        };

        var boardColumns = new Firebase("https://blinding-torch-6662.firebaseio.com/boards/" + $scope.userId + '/columns');
        boardColumns.set(utils.toObject($scope.board.columns));

        utils.closeAll();
      };

      $scope.changeColumnName = function(id, newName) {
        $scope.board.columns[id - 1] = {
          value: newName,
          id: id
        };

        var boardColumns = new Firebase("https://blinding-torch-6662.firebaseio.com/boards/" + $scope.userId + '/columns');
        boardColumns.set(utils.toObject($scope.board.columns));

        utils.closeAll();
      };

      $scope.deleteLastColumn = function() {
          $scope.board.columns.pop();
          var boardColumns = new Firebase("https://blinding-torch-6662.firebaseio.com/boards/" + $scope.userId + '/columns');
          boardColumns.set(utils.toObject($scope.board.columns));
          utils.closeAll();
      };

      $scope.deleteMessage = function(message) {
      		$scope.messages.$remove(message);
          utils.closeAll();
      };

      function addMessageCallback(message) {
        var id = message.key();
        angular.element($('#' + id)).scope().isEditing = true;
        $('#' + id).find('textarea').focus();
      }

      $scope.addNewMessage = function(type) {
      	$scope.messages.$add({
          text: '',
          user_id: $scope.userUid,
          type: { id: type.id },
          date: Firebase.ServerValue.TIMESTAMP,
          votes: 0
        }).then(addMessageCallback);
      };

      $($window).bind('hashchange', function () {
        $scope.loading = true;
        $scope.userId = $window.location.hash.substring(1) || '';
        auth.logUser($scope.userId, getBoardAndMessages);
      });
    }]
  );
