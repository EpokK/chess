Meteor.publish("moves", function() {
	return Moves.find({});
});