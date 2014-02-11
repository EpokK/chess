Template.board.events({
  'click .smile': function() {

  },
  'click .reset': function() {

  }
});

Template.board.helpers({
  moves: function() {
    return Moves.find({});
  },
  currentGameId: function() {
    return Session.get('currentGameId');
  }
});

var lastMove;
var round = 0;
var fenStart = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

var board,
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

  Meteor.call('save', Session.get('currentGameId'), fen, source, target, turn, round);
};

// update the board position after the piece snap
// for castling, en passant, pawn promotion
var onSnapEnd = function() {
  board.position(game.fen());
};

reset = function() {
  Meteor.call('reset');
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

  if(game.turn() === 'w') {
    $('#whiteClock').addClass('yellow');
    $('#blackClock').removeClass('yellow');
  } else {
    $('#blackClock').addClass('yellow');
    $('#whiteClock').removeClass('yellow');
  }

  statusElement.innerHTML = status;
  roundElement.innerHTML = round;
};

var initCountdowns = function() {
  var blackClock = $('#blackClock');
  var whiteClock = $('#whiteClock');
};

// Appele lors du load de la page : init
// du chessboard avec le dernier fen en base
init = function() {
  var lastMove = Moves.find({gameId: Session.get('currentGameId')}, {sort: {date: -1}, limit: 1 }).fetch()[0];
  var fen = lastMove && lastMove.fen;

  round = (lastMove && lastMove.round)?lastMove.round:0;

  // init ChessBoard
  board = new ChessBoard('board', {
    draggable: true,
    // draggable: Meteor.loggingIn(),
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

  initCountdowns();
}

moveStream = new Meteor.Stream("stream");

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

    round = move.round;

    updateStatusAndRound();
  }
});

moveStream.on('reset', function() {
  board.start();
  game.reset();
  game.set_turn('w');
  round = 0;
  updateStatusAndRound();
});

Template.board.rendered = function() {
  if(!this._rendered) {
    this._rendered = true;
    init();
  }
}