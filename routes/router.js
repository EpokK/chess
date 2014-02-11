Router.configure({
	layoutTemplate: '',
	loadingTemplate: 'loading',
	waitOn: function() {
		// return Meteor.subscribe('moves');
	}
});

Router.map(function() {
	this.route('home', {
		path: '/',
		template: 'home'
	});

	this.route('home', {
		path: '/home',
		template: 'home'
	});

	this.route('games', {
		path: '/games',
		template: 'games'
	});

	this.route('game', {
		template: 'board',
		path: '/games/:_id',
		data: function() {
			Session.set('currentGameId', this.params._id);
			return Games.findOne(this.params._id);
		},
		load: function() {

		}
	});
});