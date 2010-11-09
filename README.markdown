Node Geocode
============

> Geocoding wrapper around Yahoo's PlaceFinder API

Example:
--------

    var Client = require('node-geocode').Client;

    var api = new(Client)('MyYahooAppId');

    api.search('1410, rue Stanley, montreal QC', function (err, result) {
        if (err) throw err;
        console.log(result);
    });

    // should provide:
    [ { quality: 87
      , latitude: '45.499437'
      , longitude: '-73.573876'
      , offsetlat: '45.499334'
      , offsetlon: '-73.573977'
      , radius: 500
      , name: ''
      , line1: '1410 Rue Stanley'
      , line2: 'Montreal, QC  H3A'
      , line3: ''
      , line4: 'Canada'
      , house: '1410'
      , street: 'Rue Stanley'
      , xstreet: ''
      , unittype: ''
      , unit: ''
      , postal: 'H3A'
      , neighborhood: ''
      , city: 'Montreal'
      , county: 'Montreal'
      , state: 'Quebec'
      , country: 'Canada'
      , countrycode: 'CA'
      , statecode: 'QC'
      , countycode: ''
      , uzip: 'H3A'
      , hash: 'D505DF529F412415'
      , woeid: 12697163
      , woetype: 11
      }
    ]


License:
--------

Apache v2. See `LICENSE`.

Copyleft: Braithwaite Patrick Sean
