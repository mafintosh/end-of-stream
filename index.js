var once = require('once');

var noop = function() {};

var patch = function(stream, fn) { // ensure a 'finish' event - even for 0.8 streams
	var end = stream.end;
	stream.end = function() {
		fn();
		end.apply(this, arguments);
	};
};

var eos = function(stream, opts, callback) {
	if (typeof opts === 'function') return eos(stream, null, opts);
	if (!opts) opts = {};

	callback = once(callback || noop);

	var ws = stream._writableState;
	var rs = stream._readableState;
	var readable = opts.readable || (opts.readable !== false && stream.readable);
	var writable = opts.writable || (opts.writable !== false && stream.writable);

	var onfinish = function() {
		writable = false;
		if (!readable) callback();
	};

	var onend = function() {
		readable = false;
		if (!writable) callback();
	};

	var onclose = function() {
		if (readable && !(rs && rs.ended)) return callback(new Error('premature close'));
		if (writable && !(ws && ws.ended)) return callback(new Error('premature close'));
	};

	if (writable && !ws) patch(stream, onfinish);

	stream.on('end', onend);
	stream.on('finish', onfinish);
	stream.on('error', callback);
	stream.on('close', onclose);

	stream.on('abort', onclose); // not really a stream event but needed for request compat...

	return stream;
};

module.exports = eos;