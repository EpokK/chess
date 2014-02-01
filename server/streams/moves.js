moveStream = new Meteor.Stream("stream");

moveStream.permissions.write(function() {
	return true;
});

moveStream.permissions.read(function() {
	return true;
});