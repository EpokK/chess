Template.home.events({
    'click .new': function() {
      var id = Games.insert({});
      var game = {
        _id: id
      };
      Router.go('game', game);
    }
  });