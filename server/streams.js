chessStream = new Meteor.Stream('chessStream');

chessStream.permissions.write(function() {
  return true;
});

chessStream.permissions.read(function() {
  return true;
});