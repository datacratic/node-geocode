var http = require('http'),
    sys = require('sys'),
    EventEmitter = require('events').EventEmitter;

var Connection = function (apiKey, pool) {
    if (!apiKey) { throw new(Error)('Connection requires an api key'); }

    this.free = true;
    this.apiKey = apiKey;
    this.pool = pool;
    this.socket = http.createClient(80, 'where.yahooapis.com');
};

Connection.prototype.hashAddress = function (address) {
    address = address.replace(/#/, '');
    return address.trim().replace(/\s+/g, '+');
}

Connection.prototype.generatePath = function (address) {
    address = this.hashAddress(address);
    return '/geocode?flags=J&q=' + address + '&appid=' + this.apiKey;
};

Connection.prototype.request = function (path, callback) {
    this.free = false;
    var request = this.socket.request('GET', path, { host: 'where.yahooapis.com'});
    var that = this;

    request.on('drain', function () {
        that.free = true;
        that.pool.emit('free', that);
    });

    request.on('response', function (response) {
        var responseBody = '';
        response.on('data', function (data) { responseBody += data || '' });

        response.socket.on('error', function (error) {
            callback(new(Error)(error));
            response.removeAllListeners();
        });

        response.on('end', function () {
            var result;
            try {
                result = JSON.parse(responseBody);
            } catch (e) {
                callback(new(Error)('coudn\'t parse response: \n' + responseBody));
                return;
            }

            if (result.ResultSet.Error === 0) {
                callback(null, result.ResultSet.Results);
            } else {
                console.log('error using: ' + path);
                that.pool.sequence.incrementDelay();
                callback(new(Error)(result.ResultSet.ErrorMessage));
            }
        });
    });

    request.end();
};

Connection.prototype.search = function (address, callback) {
    var url = this.generatePath(address);

    console.log('hitting: ' + url);
    this.request(url, callback);
};

this.Connection = Connection;

// ########################################

var Sequence = function (delay) {
    this.running = false;
    EventEmitter.apply(this);

    this.minDelay = 1000;
    this.maxDelay = 3000;

    this.delay = delay;
    this.delayInterval = 10; // 10th of a second
}

sys.inherits(Sequence, EventEmitter);

Sequence.prototype.start = function () {
    if (this.running) return;

    this.running = true;
    var that = this;
    this.on('clockTick', function () {
        setTimeout(function () {
            that.emit('tick');
            that.emit('clockTick');
        }, that.delay);
    });

    this.emit('tick');
    this.emit('clockTick');
}
Sequence.prototype.incrementDelay = function () {
    if (this.delay < this.maxDelay) {
        this.delay += this.delayInterval;
    }
}

Sequence.prototype.decrementDelay = function () {
    if (this.delay > this.minDelay) {
        this.delay -= this.delayInterval;
    }
}

Sequence.prototype.stop = function () {
    //this.removeAllListeners('tick');
    this.removeAllListeners('clockTick');
    this.running = false;
}

exports.Sequence = Sequence;

// ########################################

var Pool = function (apiKey, rps) {
    this.queue = [];
    this.connections = [];
    this.rps = rps || 1;
    this.sequence = new(Sequence)(1000);
    this.emitter = new EventEmitter;

    var that = this;

    var drain = function () {
        var action;
        var connection;
        console.log('queue: ' + that.queue.length);
        if (that.queue.length === 0) {
            //that.sequence.stop();
        } else {
            while (that.rps--) {
                action = that.queue.pop();
                connection = that.getConnection();
                if (connection && action) {
                    connection.search(action.address, action.callback);
                } else {
                    break;
                }
            }
        }
    }

    this.sequence.on('tick', function () {
        console.log('adding another 10');
        that.rps = 10;
        drain();
    });

    this.sequence.on('tick', drain);
    this.emitter.on('free', drain);

    for (var i = 0; i < this.rps; i++) {
        this.connections.push(new(Connection)(apiKey, this));
    }
};

Pool.prototype.emit = function () { return this.emitter.emit.apply(this.emitter, arguments); }
Pool.prototype.on   = function () { return this.emitter.on.apply(this.emitter, arguments); }

Pool.prototype.getConnection = function () {
    for (var i=0; i < this.connections.length; i++) {
        if (this.connections[i].free) { return this.connections[i]; }
    }
};

Pool.prototype.search = function (address, callback) {
    this.queue.push({address: address, callback: callback});
    this.sequence.start();
};

this.Client = Pool;
