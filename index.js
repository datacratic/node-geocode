var http = require('http');

var Client = function (apiKey) {
    if (!apiKey) { throw new(Error)('Client requires an api key'); }

    this.apiKey = apiKey;
    this.socket = http.createClient(80, 'where.yahooapis.com');
};

Client.prototype.generatePath = function (address) {
    address = address.trim().replace(/\s+/g, '+');
    return '/geocode?flags=J&q=' + address + '&appid=' + this.apiKey;
};

Client.prototype.request = function (path, callback) {
    var request = this.socket.request('GET', path, { host: 'where.yahooapis.com'});
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
                callback(new(Error)(result.ResultSet.ErrorMessage));
            }
        });
    });

    request.end();
};

Client.prototype.search = function (address, callback) {
    var url = this.generatePath(address);

    this.request(url, callback);
};

this.Client = Client;
