var tape = require('tape')
var eos = require('./index')

var fs = require('fs')
var cp = require('child_process')
var net = require('net')
var http = require('http')
var stream = require('stream')

tape('fs writestream destory', function (t) {
	var ws = fs.createWriteStream('/dev/null');

	eos(ws, function(err) {
		t.ok(!!err)
		t.ok(this === ws)
		t.end()
	})

	ws.destroy();
})

tape('fs readstream destroy', function (t) {
	var rs1 = fs.createReadStream('/dev/urandom');

	eos(rs1, function(err) {
		t.ok(!!err)
		t.ok(this === rs1)
		t.end()
	})

	rs1.destroy()
})

tape('fs readstream pipe', function (t) {
	var rs2 = fs.createReadStream(__filename)

	eos(rs2, function(err) {
		t.ifError(err)
		t.ok(this === rs2)
		t.end()
	})

	rs2.pipe(fs.createWriteStream('/dev/null'))
})

tape('fs readstream cancel', function (t) {
	var rs3 = fs.createReadStream(__filename)

	eos(rs3, function(err) {
		t.fail('should not enter')
	})()

	rs3.pipe(fs.createWriteStream('/dev/null'))
	rs3.on('end', function () {
		t.end()
	})
})

tape('exec', function (t) {
	var exec = cp.exec('echo hello world')

	eos(exec, function (err) {
		t.ifError(err)
		t.ok(this === exec)
		t.end()
	})
})

tape('spawn', function (t) {
	var spawn = cp.spawn('echo', ['hello world']);
	eos(spawn, function (err) {
		t.ifError(err)
		t.ok(this === spawn)
		t.end()
	})
})

tape('tcp socket', function (t) {
	t.plan(5)

	var socket = net.connect(50000)

	eos(socket, function(err) {
	  t.ok(!!err)
	  t.ok(this === socket)
	})

	var server = net.createServer(function (socket) {
		eos(socket, function(err) {
			t.ok(!!err)
			t.ok(this === socket)
		})
		socket.destroy()
	}).listen(30000, function () {
		var socket = net.connect(30000)
		eos(socket, function() {
			t.ok(this === socket)
			server.close()
		})
	})
})

tape('http', function (t) {
	t.plan(2)

	var server2 = http.createServer(function(req, res) {
		eos(res, function(err) {
			t.ifError(err)
		})
		res.end()
	}).listen(function() {
		var port = server2.address().port
		http.get('http://localhost:' + port, function(res) {
			eos(res, function(err) {
				t.ifError(err)
				server2.close()
			})
			res.resume()
		})
	})
})

tape('end() and emit(close)', function (t) {
  if (!stream.Writable) return t.end()
  var ws = new stream.Writable()
  
  ws._write = function (data, enc, cb) {
    process.nextTick(cb)
  }

  eos(ws, function (err) {
    t.error(err, 'no error')
    t.end()
  })

  ws.write('hi')
  ws.end()
  ws.emit('close')
})
