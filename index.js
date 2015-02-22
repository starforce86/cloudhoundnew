var express = require('express');
var http = require('http');
var geoip = require('geoip-lite');
var handlebars = require('express-handlebars');
var YaBoss = require('yaboss');
var rss = require('parse-rss');
var htmlparser = require("htmlparser2");
var _ = require('lodash');

var boss = new YaBoss('dj0yJmk9bDJ5TW1lOWN5dFVJJmQ9WVdrOWMwRlFaV2xoTkRnbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD0wMg--', '74299e64b9df127cb52b7dbbc8b5670ed8432a72');
var shareThisKey = 'ezhke2gh772jzxxb439hhcvt';

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
            description = htmlstrip(item.description);
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

            trending = null;
            res.render('local', {
                news: news,
                heading: 'Local News',
                trending: trending
            });
/*        });*/
    });
});

/*app.get('/weather', function(req, res) {
    var geo;
    var place = '';

    if (req.headers['x-forwarded-for']) {
        var ip = req.headers['x-forwarded-for'].split(',').pop();
        geo = geoip.lookup(ip);
    } else {
        geoip.lookup(req.ip);
    }

    //if (geo && geo.ll) {
    //  place = geo.ll[0] + ',' + geo.ll[1];
    //} else
    if (geo && geo.city) {
        place = geo.city;
    } else if (geo && geo.country) {
        place = geo.country;
    } else {
        place = 'world';
    }

    yahooWeather(place, function(err, weather) {
        if (err) {
            console.log(err);
            res.status(500).send('Internal Server Error\n');
        }

        shareThisTrending(shareThisKey, 'weather', 3, function(err, trending) {
            if (err) {
                console.log(err);
                res.status(500).send('Internal Server Error\n');
            }

            res.render('weather', {
                content: weather.content,
                heading: weather.description,
                trending: trending
            });
        });
    });
});*/

registerService(app, 'search', { service: 'web,ads', adsPartner:'domaindev_syn_boss162_ss_search', adsType:'ddc_cloudhound_net', adsUrl:'http://www.cloudhound.net/', adsCount:'5' });

registerRSS(app, 'news', 'news', 'News', 'http://news.yahoo.com/rss');
registerRSS(app, 'world-news', 'news', 'World News', 'http://news.yahoo.com/rss');
registerRSS(app, 'top-news', 'news', 'Top News', 'http://rss.news.yahoo.com/rss/mostviewed');
registerRSS(app, 'stocks', 'stocks', 'Stocks', 'http://finance.yahoo.com/rss/topstories');
registerRSS(app, 'stocks-news', 'stocks', 'Stocks', 'http://finance.yahoo.com/rss/popularstories');
registerRSS(app, 'local-finance', 'finance', 'Local Finance', 'http://finance.yahoo.com/rss/popularstories');
registerRSS(app, 'global-finance', 'finance', 'Global Finance', 'http://finance.yahoo.com/rss/popularstories');
registerRSS(app, 'mlb', 'mlb', 'MLB News', 'http://sports.yahoo.com/mlb/rss.xml');
registerRSS(app, 'nba', 'nba', 'NBA News', 'http://sports.yahoo.com/nba/rss.xml');
registerRSS(app, 'ncaa', 'ncaa', 'NCAA News', 'http://sports.yahoo.com/ncaab/rss.xml');
registerRSS(app, 'nfl', 'nfl', 'NFL News', 'http://sports.yahoo.com/nfl/rss.xml');
registerRSS(app, 'tv', 'tv', 'TV News', 'http://news.feedzilla.com/en_us/headlines/entertainment/television.rss', { excludeDescription: true });
registerRSS(app, 'movies', 'movies', 'Movies', 'http://news.feedzilla.com/en_us/headlines/entertainment/movies.rss', { excludeDescription: true });
registerRSS(app, 'music', 'music',  'Music', 'http://news.feedzilla.com/en_us/headlines/music/top-stories.rss', { excludeDescription: true });
registerRSS(app, 'books', 'books', 'Books', 'http://news.feedzilla.com/en_us/headlines/entertainment/books.rss', { excludeDescription: true });

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});

/*function yahooWeather(city, callback) {
    bossgeo.placefinder({ location: city }, function(err, place) {
        if (err) return callback(err);

        var woeid = place.results[0].woeid;

        rss('http://weather.yahooapis.com/forecastrss?w=' + woeid, function(err, weather) {
            if (err) return callback(err);

            callback(null, {
                content: weather[0]['rss:description']['#'],
                description: weather[0].meta.description
            });
        });
    });
};*/

function registerRSS(app, name, term, heading, url, options) {
    options = options || {};

    app.get('/' + name, function(req, res) {
        rss(url, function(err, data) {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error\n');
            }

            var news = _.filter(data, function(_, idx) {
                return idx < 7;
            });

            news = _.map(news, function(item) {
                var description = '';
                if (!options.excludeDescription) {
                    description = htmlstrip(item.description);
                    if (description.length > 250) {
                        description = description.slice(0, 245) + ' ...';
                    }
                }

                return {
                    image: item['media:content'] && item['media:content']['@'] ? item['media:content']['@'].url : '',
                    description: description,
                    title: item.title,
                    link: item.link
                };
            });

/*            shareThisTrending(shareThisKey, term, 3, function(err, trending) {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Internal Server Error\n');
                }*/

                trending = null;
                res.render('local', {
                    news: news,
                    heading: heading,
                    trending: trending
                });
  /*          });*/
        });
    });
}

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

/*            shareThisTrending(shareThisKey, req.query.query, 3, function(err, trending) {
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

/*function shareThisTrending(key, term, count, callback) {
    var url = 'http://rest.sharethis.com/v1/trending/live?api_key=' + shareThisKey;
    url += '&topic=' + encodeURIComponent(term);
    url += '&url_limit=' + count;
    url += '&range=' + (3600 * 24);

    http.get(url, function(res) {
        var data = '';

        res.on('data', function(chunk) {
            data += chunk;
        });

        res.on('end', function() {
            data = JSON.parse(data);

            var urls = _.map(data.urls, function(url) {
                var snippet = _.unescape(url.snippet);
                if (snippet.length > 128) {
                    snippet = snippet.slice(0, 128) + ' ...'
                }

                return {
                    title: _.unescape(url.title),
                    snippet: snippet,
                    url: url.url
                }
            });

            callback(null, urls);
        });
    }).on('error', function(err) {
        callback(err);
    });
}*/

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

var g_bufParser="";
var parser = new htmlparser.Parser({
    ontext: function(text){
        g_bufParser += text;
    }
});
function htmlstrip(html) {
    g_bufParser="";
    parser.write(html);
    parser.end();
    return g_bufParser;
}