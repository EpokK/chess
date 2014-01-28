Moves = new Meteor.Collection("moves");

if (Meteor.isClient) {
  Template.board.rendered = function() {
    if(!this._rendered) {
      this._rendered = true;

      var board,
        game = new Chess(),
        statusEl = $('#status'),
        fenEl = $('#fen'),
        pgnEl = $('#pgn');

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

        // illegal move
        if (move === null) return 'snapback';

        updateStatus();
      };

      // update the board position after the piece snap
      // for castling, en passant, pawn promotion
      var onSnapEnd = function() {
        board.position(game.fen());
      };

      var updateStatus = function() {
        var status = '';
        var moveColor = 'White';

        if (game.turn() === 'b') {
          moveColor = 'Black';
        }

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

        statusEl.html(status);
        fenEl.html(game.fen());
        pgnEl.html(game.pgn());
      };

      var save = function() {
        var fen = game.fen();

        Moves.insert({fen: fen, date: Date.parse()});
      };

      var getFen = function() {
        var move = Moves.find({}, {sort: {date: -1}});

        if(move) {
          return move.fen;
        } else {
          return false;
        }
      };

      var cfg = {
        draggable: true,
        position: (getFen())?getFen():'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
      };

      board = new ChessBoard('board', cfg);

      updateStatus();
    }
  }
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
