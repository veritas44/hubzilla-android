/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var hz = {};

hz.register_client = function () {
	if(!hz.hub_url || hz.hub_url === '') {
		window.console.log('Hub URL "hz.hub_url" must be set.');
		return false;
	}
	$.ajax({
		url: 'https://' + hz.hub_url + '/api/client/register/',
		type: 'POST',
		data: {
			'application_name': 'Hubzilla Android',
			'redirect_uris': 'file:///android_asset/www/index.html',
			//'redirect_uris': 'http://localhost:8383/hubzilla-android/index.html',
			'logo_uri': ''
		}
	}).done(function(data) {
		window.console.log(data);
		if( typeof(data.client_id) !== 'undefined' && data.client_id !== '' &&
			typeof(data.client_secret) !== 'undefined' && data.client_secret !== '' ) {
			hz.consumer_key = data.client_id;
			hz.consumer_secret = data.client_secret;
			localStorage.setItem('consumer_key', hz.consumer_key);
			localStorage.setItem('consumer_secret', hz.consumer_secret);
			hz.request_token();
		}
	});

};

hz.request_token = function () {
	if(!hz.hub_url || !hz.consumer_key || !hz.consumer_secret || hz.consumer_key === '' || hz.consumer_secret === '' || hz.hub_url === '') {
		window.console.log('"hz.consumer_key" and "hz.consumer_secret" must be set.');
		return false;
	}

	var oauth = OAuth({
		consumer: {
			key: hz.consumer_key,
			secret: hz.consumer_secret
		}
	});
	var request_data = {
		url: 'https://' + hz.hub_url + '/api/oauth/request_token/',
		method: 'POST',
		data: {
			status: ''
		}
	};
	$.ajax({
		url: request_data.url,
		type: request_data.method,
		data: oauth.authorize(request_data)
	}).done(function(data) {
		window.console.log(data);
		if(data.split('&').length < 2) {
			alert('Error retrieving OAuth token.');
			return false;
		}
		hz.oauth_token = data.split('&')[0].split('=')[1];
		hz.oauth_token_secret = data.split('&')[1].split('=')[1];
		window.console.log('New OAuth token retrieved: ' + hz.oauth_token + ', ' + hz.oauth_token_secret);					

		localStorage.setItem('oauth_token', hz.oauth_token);
		localStorage.setItem('oauth_token_secret', hz.oauth_token_secret);
		hz.authorize_token();
	});

};

hz.authorize_token = function () {
	//alert('Redirecting to hub for authorization...');
	window.location = 'https://' + hz.hub_url + '/api/oauth/authorize/?oauth_token=' + hz.oauth_token; // + '&oauth_verifier=' + hz.oauth_token_secret;
};


hz.access_token = function () {

	$.ajax({
		url: 'https://' + hz.hub_url + '/api/oauth/access_token',
		type: 'POST',
		data: {
			'oauth_token': hz.oauth_token,
			'oauth_verifier': hz.oauth_verifier,
			'oauth_signature_method': 'PLAINTEXT',
			'oauth_consumer_key': hz.consumer_key,
			'oauth_signature': hz.consumer_secret+'&'+hz.oauth_token_secret,
			'oauth_timestamp': hz.timeStamp(),
			'oauth_nonce': hz.randomString(32),
			'oauth_version': '1.0'
		}
	}).done(function(data) {
		window.console.log(data);
		if(data.split('&').length < 2) {
			alert('Error retrieving OAuth access token.');
			return false;
		}
		hz.oauth_token = data.split('&')[0].split('=')[1];
		hz.oauth_token_secret = data.split('&')[1].split('=')[1];
		hz.oauth_token_authorized = true;
		window.console.log('New OAuth access token retrieved: ' + hz.oauth_token + ', ' + hz.oauth_token_secret);					

		localStorage.setItem('oauth_token', hz.oauth_token);
		localStorage.setItem('oauth_token_secret', hz.oauth_token_secret);
		localStorage.setItem('oauth_token_authorized', hz.oauth_token_authorized);
		window.location = 'index.html';
	});
};

hz.timeStamp = function () {
	var time = Math.floor(new Date() / 1000).toString();
//	window.console.log(time);
	return time;
//	.toString();
//	return Date.now();
};

hz.get_data = function (api_path) {

	$.ajax({
		url: 'https://' + hz.hub_url + '/' + api_path,
		type: 'GET',
		data: {
			'oauth_token': hz.oauth_token,
			'oauth_signature_method': 'PLAINTEXT',
			'oauth_consumer_key': hz.consumer_key,
			'oauth_signature': hz.consumer_secret+'&'+hz.oauth_token_secret,
			'oauth_timestamp': hz.timeStamp(),
			'oauth_nonce': hz.randomString(32),
			'oauth_version': '1.0',
			'channel': hz.channel
		}
	}).done(function(data) {
		window.console.log(data);
		$('#data').html(JSON.stringify(data));
	});
	
};

hz.randomString = function (length) {

    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
	
};

$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return results[1] || 0;
    }
}


var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);

		// Start the app
		//localStorage.clear();
		
		hz.hub_url = localStorage.getItem('hub_url');
		hz.channel = localStorage.getItem('channel');
		hz.consumer_key = localStorage.getItem('consumer_key');
		hz.consumer_secret = localStorage.getItem('consumer_secret');
		hz.oauth_token = localStorage.getItem('oauth_token');
		hz.oauth_token_secret = localStorage.getItem('oauth_token_secret');
		hz.oauth_verifier = localStorage.getItem('oauth_verifier');
		hz.oauth_token_authorized = localStorage.getItem('oauth_token_authorized');
		if(hz.oauth_token_authorized === null) {
			hz.oauth_token_authorized = false;
		}
		
		var oauth_token = $.urlParam('oauth_token');
		var oauth_verifier = $.urlParam('oauth_verifier');
		if(oauth_token && oauth_verifier) {
			window.console.log('Token authenticated: ' + oauth_verifier);
			hz.oauth_verifier = oauth_verifier;
			localStorage.setItem('oauth_verifier', hz.oauth_verifier);
			// Get an OAuth access token
			hz.access_token();
			return;
		}
		if( !( hz.hub_url) ) {
			$('#content').load('register.html');
		} else {
			if( !( hz.consumer_key && hz.consumer_secret ) ) {
				hz.register_client();
			} else {
				if(!hz.oauth_token_authorized) {
					if( !( hz.oauth_token && hz.oauth_token_secret) ) {
						hz.request_token();
					} else {
						hz.authorize_token();
					}
				} else {
					$('#content').load('home.html');
				}
			}
		}
		
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        this.receivedEvent('deviceready');
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

app.initialize();