angular.module('app.services', [])
	.service('hello', function () {
		return {
			hello:function() {
				console.log("hello world")
			}
	}
})
