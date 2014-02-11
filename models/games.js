Games = new Meteor.Collection("games");

Games.allow({
	insert: function() {
		return true;
	},
	remove: function() {
		return false;
	},
	update: function() {
		return false;
	}
});