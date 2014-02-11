Meteor.startup(function() {
  Session.set('moves_loaded', false);
  Session.set('games_loaded', false);
});

Meteor.subscribe('moves', function() {
  Session.set('moves_loaded', true);
});

Meteor.subscribe('games', function() {
  Session.set('games_loaded', true);
});