yaboss
======

Simple nodejs wrapper for Yahoo BOSS web api


Example
======

```javascript

    var YaBoss = require('yaboss');
    var YaBossClient = new YaBoss('someCustomerKey', 'someCustomerSecret');

    YaBossClient.search('web','yahoo', {count: 10}, function(err,dataFound,response){...});
    YaBossClient.searchWeb('yahoo', {count: 10}, function(err,dataFound,response){...});
    YaBossClient.searchLimitedWeb('yahoo', {count: 10}, function(err,dataFound,response){...});
    YaBossClient.searchImages('yahoo', {count: 10, dimensions: 'medium'}, function(err,dataFound,response){...});
    YaBossClient.searchNews('yahoo', {count: 10}, function(err,dataFound,response){...});
    YaBossClient.searchBlogs('yahoo', {count: 10}, function(err,dataFound,response){...});
    YaBossClient.searchAds('yahoo', {count: 10}, function(err,dataFound,response){...});
    YaBossClient.getGeoSearch('yahoo', {count: 10}, function(err,dataFound,response){...});


```

Full Yahoo BOSS Api documentation
======

[http://developer.yahoo.com/boss/search/boss_api_guide/](http://developer.yahoo.com/boss/search/boss_api_guide/)


Test
======

[![Build Status](https://travis-ci.org/vodolaz095/yaboss.png)](https://travis-ci.org/vodolaz095/yaboss)