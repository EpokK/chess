moveStream = new Meteor.Stream("moveStream");

moveStream.permissions.write(function() {
	return true;
});

moveStream.permissions.read(function() {
	return true;
});