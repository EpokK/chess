Moves = new Meteor.Collection("moves");
Games = new Meteor.Collection("games");

Meteor.methods({
  save: function(fen, source, target, turn, round) {
    var move = {
      round: round,
      fen: fen,
      date: Date.parse(new Date()),
      source: source,
      target: target,
      turn: (turn == 'w')?'white':'black'
    };
    Moves.insert(move);
    moveStream.emit('newMove', move);
  },
  reset: function() {
    Moves.remove({});
  }

});

if (Meteor.isClient) {
  var lastMove;
  var round = 0;
  var fenStart = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  Meteor.startup(function() {
    Session.set('data_loaded', false);
  });

  Meteor.subscribe('moves', function() {
    Session.set('data_loaded', true);
    // lastMove = Moves.find({}, {sort: {date: -1}, limit: 1 }).fetch()[0];
  });

  moveStream = new Meteor.Stream("moveStream");

  moveStream.on('newMove', function(move) {
    if(move.fen !== game.fen()) {
      game.move({
        from: move.source,
        to: move.target,
        promotion: 'q'
      });
      board.move(move.source + '-' + move.target);
      if(move.turn === 'black') {
        game.set_turn('b');
      } else {
        game.set_turn('w');
      }

      updateStatusAndRound();
    }
  });

  Template.board.helpers({
    moves: function() {
      // if(Session.get('data_loaded')) {
        return Moves.find({});
      // } else {
        // return [];
      // }
    }
  });

  Template.board.rendered = function() {
    if(!this._rendered) {
      this._rendered = true;

      board,
      game = new Chess();

      // do not pick up pieces if the game is over
      // only pick up pieces for the side to move
      var onDragStart = function(source, piece, position, orientation) {
        if (game.game_over() === true ||
            (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
          return false;
        }
      };

      var onDrop = function(source, target) {
        // see if the move is legal
        var move = game.move({
          from: source,
          to: target,
          promotion: 'q' // NOTE: always promote to a pawn for example simplicity
        });
        var fen = game.fen();
        var turn = game.turn();

        // illegal move
        if (move === null) return 'snapback';

        round = round + 1;

        updateStatusAndRound();

        Meteor.call('save', fen, source, target, turn, round);
      };

      // update the board position after the piece snap
      // for castling, en passant, pawn promotion
      var onSnapEnd = function() {
        board.position(game.fen());
      };

      reset = function() {
        board.start();
        game.reset();
        updateStatusAndRound();
        Meteor.call('save', game.fen(), null, null, 'white', 0);
      };

      updateStatusAndRound = function() {
        var moveColor = (game.turn() === 'w')?'White':'Black';
        var statusElement = document.getElementById('status');
        var roundElement = document.getElementById('round');

        // checkmate?
        if (game.in_checkmate() === true) {
          status = 'Game over, ' + moveColor + ' is in checkmate.';
        }

        // draw?
        else if (game.in_draw() === true) {
          status = 'Game over, drawn position';
        }

        // game still on
        else {
          status = moveColor + ' to move';

          // check?
          if (game.in_check() === true) {
            status += ', ' + moveColor + ' is in check';
          }
        }

        statusElement.innerHTML = status;
        roundElement.innerHTML = round;
      };

      // Appele lors du load de la page : init
      // du chessboard avec le dernier fen en base
      var init = function() {
        var lastMove = Moves.find({}, {sort: {date: -1}, limit: 1 }).fetch()[0];
        var fen = lastMove && lastMove.fen;
        round = (lastMove && lastMove.round)?lastMove.round:0;

        // init ChessBoard
        board = new ChessBoard('board', {
          draggable: true,
          position: (fen)?fen:'start',
          onDragStart: onDragStart,
          onDrop: onDrop,
          onSnapEnd: onSnapEnd
        });

        // init turn
        if(lastMove && lastMove.turn) {
          if(lastMove.turn === 'black') {
            game.set_turn('b');
          } else {
            game.set_turn('w');
          }
        } else {
          lastMove = {};
          lastMove.turn = 'white';
          game.set_turn('w');
        }

        // Load fen
        if(fen && fen !== fenStart) {
          game.load(fen);
        }

        updateStatusAndRound();

        // if(fen !== game.fen()) {
        //   console.log('save after init');
        //   Meteor.call('save', game.fen(), lastMove.source, lastMove.target, lastMove.turn);
        // }
      }

      Meteor.defer(function() {
        init();
      });
    }
  }
}
