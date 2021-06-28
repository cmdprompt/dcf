define([], function () {

	var _export = function() {
		var _lock = false;

		this.getLock = function () {
			if (!_lock) {
				console.log('Success: Lock Acquired');
				_lock = true;
				return true;
			};
			console.log('Fail: Already Locked');
			return false;
		};

		this.unlock = function () {
			_lock = false;
		};

		this.isLocked = function () {
			return _lock;
		};
	};

	return _export;
});