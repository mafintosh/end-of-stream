var assert = require('assert');
var eos = require('./index');

var expected = 10;
var fs = require('fs');
var cp = require('child_process');
var net = require('net');

var pumpify = require('pumpify');
var through = require('through2');

var ws = fs.createWriteStream('/dev/null');
eos(ws, function(err) {
	expected--;
	assert(!!err);
	assert(this === ws);
	if (!expected) process.exit(0);
});
ws.close();

var rs1 = fs.createReadStream('/dev/random');
eos(rs1, function(err) {
	expected--;
	assert(!!err);
	assert(this === rs1);
	if (!expected) process.exit(0);
});
rs1.close();

var rs2 = fs.createReadStream(__filename);
eos(rs2, function(err) {
	expected--;
	assert(!err);
	assert(this === rs2);
	if (!expected) process.exit(0);
});
rs2.pipe(fs.createWriteStream('/dev/null'));

var rs3 = fs.createReadStream(__filename);
eos(rs3, function(err) {
	assert(this === rs);
	throw new Error('no go');
})();
rs3.pipe(fs.createWriteStream('/dev/null'));

var exec = cp.exec('echo hello world');
eos(exec, function(err) {
	expected--;
	assert(!err);
	assert(this === exec);
	if (!expected) process.exit(0);
});

var spawn = cp.spawn('echo', ['hello world']);
eos(spawn, function(err) {
	expected--;
	assert(!err);
	assert(this === spawn);
	if (!expected) process.exit(0);
});

var socket = net.connect(50000);
eos(socket, function(err) {
	expected--;
	assert(!!err);
	assert(this === socket);
	if (!expected) process.exit(0);
});

var server = net.createServer(function(socket) {
	eos(socket, function() {
		expected--;
		assert(this === socket);
		if (!expected) process.exit(0);
	});
	socket.destroy();
}).listen(30000, function() {
	var socket = net.connect(30000);
	eos(socket, function() {
		expected--;
		assert(this === socket);
		if (!expected) process.exit(0);
	});
});

// Succeeds
var rs4 =	fs.createReadStream('/dev/random');
var p1 = pumpify(
	through(),
	through(function(chunk, _, cb) {
		cb(new Error('test'));
	}),
	through()
)
eos(rs4.pipe(p1), function(err) {
	expected--;
	assert(err);
	assert(err.message !== 'premature close', 'does not close with premature close');
});

// Fails
var rs5 =	fs.createReadStream('/dev/random');
var pumpifyErr = pumpify(
	through(),
	through(function(chunk, _, cb) {
		cb(new Error('test'));
	}),
	fs.createWriteStream('/dev/null')
)
eos(rs5.pipe(pumpifyErr), function(err) {
	expected--;
	assert(err);
	assert(err.message !== 'premature close', 'does not close with premature close');
});

setTimeout(function() {
	assert(expected === 0);
	process.exit(0);
}, 1000);
