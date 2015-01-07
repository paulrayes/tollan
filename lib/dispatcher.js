'use strict';

var callbacks = [];

module.exports = {
	/**
	 * Registers a callback for the given event.
	 *
	 * @param  {String}   The name of the event
	 * @param  {Function} The callback function
	 * @return {this}
	 */
	register: function(event, callback) {
		callbacks[event].push(callback);
		return this;
	},

	/**
	 * Calls all registered callbacks for the given event.
	 *
	 * @param  {String} event The name of the event
	 * @param  {Object} data The data for this event
	 * @return {this}
	 */
	dispatch: function(event, data) {
		for (callback in callbacks[event]) {
			callback(data);
		}
		return this;
	}
};
