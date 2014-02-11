Meteor.methods({
  save: function(game, fen, source, target, turn, round) {
    var move = {
      gameId: game,
      round: round,
      fen: fen,
      date: Date.parse(new Date()),
      source: source,
      target: target,
      turn: (turn == 'w')?'white':'black'
    };
    Moves.insert(move);
    console.log('newMove methods');
    moveStream.emit('newMove', move);
  },
  reset: function() {
    Moves.remove({});
    moveStream.emit('reset');
  }
});