var express = require('express');
var geoip = require('geoip-lite');
var handlebars = require('express-handlebars');
var YaBoss = require('yaboss');
var rss = require('parse-rss');
//var htmlstrip = require('htmlstrip-native');
var _ = require('lodash');

var boss = new YaBoss('dj0yJmk9bDJ5TW1lOWN5dFVJJmQ9WVdrOWMwRlFaV2xoTkRnbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD0wMg--', '74299e64b9df127cb52b7dbbc8b5670ed8432a72');

var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.engine('handlebars', handlebars());
app.set('view engine', 'handlebars');

app.get('/', function(req, res) {
    res.render('index', { action: 'search'} );
});

app.get('/local-news', function(req, res) {
    var geo = geoip.lookup(req.ip);
    var url = 'http://news.yahoo.com/rss';
    if (geo && geo.city) {
        url = 'http://news.search.yahoo.com/rss?p=' + geo.city;
    }

    rss(url, function(err, data) {
        if (err) {
            console.log(err);
            return res.status(500).send('Internal Server Error\n');
        }

        var news = _.filter(data, function(_, idx) {
            return idx < 7;
        });

        news = _.map(news, function(item) {
            //description = htmlstrip.html_strip(item.description);
            description = item.description;
            if (description.length > 250) {
                description = description.slice(0, 245) + ' ...';
            }

            return {
                image: item['media:content'] && item['media:content']['@'] ? item['media:content']['@'].url : '',
                description: description,
                title: item.title,
                link: item.link
            };
        });

/*        shareThisTrending(shareThisKey, geo && geo.city ? geo.city : 'news', 3, function(err, trending) {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error\n');
            }*/

            res.render('local', {
                news: news,
                heading: 'Local News',
                trending: null
            });
/*        });*/
    });
});

registerService(app, 'search', { service: 'web,ads', adsPartner:'domaindev_syn_boss162_ss_search', adsType:'ddc_cloudhound_net', adsUrl:'http://www.cloudhound.net/', adsCount:'5' });

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});

function registerService(app, name, options) {

    if (! typeof options === 'object') {
        options = {};
    }

    app.get('/' + name, function(req, res) {
        if (!req.query.query) {
            return res.render('index', { action: name });
        }

        options.url = '/' + name;
        options.page = parseInt(req.query.page, 10) || 1;

        if (options.market) {
            options.market = req.locale;
        }

        if (options.geo) {
            var geo = geoip.lookup(req.ip);
            if (geo && geo.city) {
                options.append = (options.append || '') + geo.city;
            }

            options.geo = undefined;
        }

        yahooSearch(req.query.query, options, function(err, data) {
            if (err) {
                console.log(err);
                return res.status(500).send({ error: 'Internal Server Error\n' });
            }

  /*          shareThisTrending(shareThisKey, req.query.query, 3, function(err, trending) {
                if (err) {
                    console.log(err);
                    return res.status(500).send({ error: 'Internal Server Error\n' });
                }

                data.trending = trending;*/
                // TODO
                res.render('search', data);
/*            });*/
        });
    });
}

function yahooSearch(term, options, callback) {

    var searchTerm = options.append ? term + ' ' + options.append : term;
    var searchOptions = {};
    searchOptions.count = options.count || 10;
    searchOptions.start = options.page > 0 ? (options.page - 1) * searchOptions.count : 0;
    if (options.age) searchOptions.age = options.age;
    if (options.market) searchOptions.market = options.market;
    if (options.title) searchOptions.title = options.title;

    /* 2014.12.3 Inserted  ads functions by Andrew  -- begin -- */
    if(options.adsPartner) searchOptions.ads__Partner = options.adsPartner;
    if(options.adsType) searchOptions.ads__Type = options.adsType;
    if(options.adsUrl) searchOptions.ads__url = options.adsUrl;
    if(options.adsTest) searchOptions.ads__test = options.adsTest;
    if(options.adsCount) searchOptions.ads__count = options.adsCount;
    /* 2014.12.3 Inserted  ads functions by Andrew  -- end -- */

    boss.search(options.service, searchTerm, searchOptions, function(err, data, response) {

        if (err) return callback(err);

        search = JSON.parse(data).bossresponse["web"];
        adsSearch = JSON.parse(data).bossresponse["ads"];

        yahooSearchRelated(term, function(err, related) {
            if (err) return callback(err);

            callback(null, {
                adsResults: adsSearch.dmtoken,
                results: search.results,
                totalresults: numberWithCommas(search.totalresults),
                related: related,
                term: term,
                pages: pagination({
                    url: options.url,
                    term: term,
                    page: options.page || 1
                })
            });
        })
    });
}

function yahooSearchRelated(term, callback) {

    boss.search('related', term, null, function(err, data, response) {
        if (err) return callback(err);

        related = JSON.parse(data).bossresponse.related;

        callback(null, related.results);
    });
}

function pagination(options) {
    var count = options.count || 10;
    var middle = (count / 2).toFixed();
    var first = (options.page - middle > 0) ? options.page - middle : 1;

    return _.map(_.range(first, first + count), function(p) {
        return {
            url: options.url + '?query=' + options.term + '&page=' + p,
            current: p === options.page,
            page: p
        }
    });
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}