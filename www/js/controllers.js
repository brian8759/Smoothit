'use strict';

var baseURL = 'http://54.68.110.119/smoothit/';
var clientID = '465166072015-hgfci110risj5deonfivs1tfefg8kd3u.apps.googleusercontent.com';
var clientSecret = 'ySRObG-gC6Gl2xyAaDxf0PpP';
var redirectURL = 'http://localhost';
var GoogleScope = 'openid email https://www.googleapis.com/auth/calendar';
var requestToken = '';
var accessToken = '';
var refreshToken = '';
var IDToken = '';
var email = '';
var timeInterval = 10 * 1000; // 10 second
var gap = 100000 * 60 * 1000; // gap for duration
var time = new Date();

// avoid conflicting
jQuery.noConflict();

angular.module('ionicApp.controllers', [])

.controller('IntroCtrl', ['$scope', '$http', '$state', '$ionicSlideBoxDelegate', 'LocalStorage', 
function ($scope, $http, $state, $ionicSlideBoxDelegate, LocalStorage) {
  LocalStorage.set('skip', 'false');
  $scope.next = function () {
    $ionicSlideBoxDelegate.next();
  };
  $scope.previous = function () {
    $ionicSlideBoxDelegate.previous();
  };

  // Called each time the slide changes
  $scope.slideChanged = function (index) {
    $scope.slideIndex = index;
  };

  var errorHandle = function() {
		var alertPopup = $ionicPopup.alert({
			title: 'something wrong',
			template: 'Please sign in again'
		});
		alertPopup.then(function(res) {
			$state.go('login');
		});
	};

  $scope.signin = function() {
  		$http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
		// construct the url part
		var loginUrl = 'https://accounts.google.com/o/oauth2/auth?' + 
						jQuery.param({
				            client_id: clientID,
				            redirect_uri: redirectURL,
				            scope: GoogleScope,
				            approval_prompt: 'force',
				            response_type: 'code',
				            access_type: 'offline'
			        	});
		
		// use inappbrowser to login with google account
		var ref = window.open(loginUrl, '_blank', 'location=no');
		ref.addEventListener('loadstart', function(event) {
			// console.log(event);
			var eventURL = event.url;
			// check if the redirect url is the one we want
			if(eventURL.indexOf('http://localhost') === 0) {
				// parse the requestToken from the eventURL
				var code = eventURL.split("code=")[1].split("&");
				requestToken = code[0];
				$http({ method: "POST", 
						url: "https://accounts.google.com/o/oauth2/token", 
						data: "client_id=" + clientID + "&client_secret=" + 
							   clientSecret + "&redirect_uri=" + redirectURL + 
							   "&grant_type=authorization_code" + "&code=" + requestToken })
	            
	            	.success(function(data) {
	                    accessToken = data.access_token;
	                    IDToken = data.id_token;
	                    refreshToken = data.refresh_token;
	                    $http({ method: "GET", url: "https://www.googleapis.com/oauth2/v1/tokeninfo?id_token=" + IDToken })
	                    .success(function(response) {
	                        email = response.email;
	                        $http({ method: "POST", url: baseURL + email + "/token", 
	                        		data: "access_token=" + accessToken + "&refresh_token=" + refreshToken })
	                        .success(function(res) {
	                        	if(res.status === "success") {
	                        		console.log('Just save user info !');
	                        		$state.go('topEvent');
	                        	} else {
	                        		errorHandle();
	                        	}
	                        })
	                    })
	                    .error(function(response, status) {
	                        errorHandle();
	                    });
	                })
	                .error(function(data, status) {
	                    errorHandle();
	                });
	        	ref.close();
			}
		})
	};
}])

.controller('LoginCtrl', ['$scope', '$ionicPopup', '$state', '$http', 'LocalStorage',
function($scope, $ionicPopup, $state, $http, LocalStorage) {
	// for showing user intro
	LocalStorage.set('skip', 'false');
	var errorHandle = function() {
		var alertPopup = $ionicPopup.alert({
			title: 'something wrong',
			template: 'Please sign in again'
		});
		alertPopup.then(function(res) {
			$state.go('login');
		});
	};

	$scope.login = function() {
		$http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
		// construct the url part
		var loginUrl = 'https://accounts.google.com/o/oauth2/auth?' + 
						jQuery.param({
				            client_id: clientID,
				            redirect_uri: redirectURL,
				            scope: GoogleScope,
				            approval_prompt: 'force',
				            response_type: 'code',
				            access_type: 'offline'
			        	});
		
		// use inappbrowser to login with google account
		var ref = window.open(loginUrl, '_blank', 'location=no');
		ref.addEventListener('loadstart', function(event) {
			// console.log(event);
			var eventURL = event.url;
			// check if the redirect url is the one we want
			if(eventURL.indexOf('http://localhost') === 0) {
				// parse the requestToken from the eventURL
				var code = eventURL.split("code=")[1].split("&");
				requestToken = code[0];
				$http({ method: "POST", 
						url: "https://accounts.google.com/o/oauth2/token", 
						data: "client_id=" + clientID + "&client_secret=" + 
							   clientSecret + "&redirect_uri=" + redirectURL + 
							   "&grant_type=authorization_code" + "&code=" + requestToken })
	            
	            	.success(function(data) {
	                    accessToken = data.access_token;
	                    IDToken = data.id_token;
	                    refreshToken = data.refresh_token;
	                    $http({ method: "GET", url: "https://www.googleapis.com/oauth2/v1/tokeninfo?id_token=" + IDToken })
	                    .success(function(response) {
	                        email = response.email;
	                        $http({ method: "POST", url: baseURL + email + "/token", 
	                        		data: "access_token=" + accessToken + "&refresh_token=" + refreshToken })
	                        .success(function(res) {
	                        	if(res.status === "success") {
	                        		console.log('Just save user info !');
	                        		$state.go('topEvent');
	                        	} else {
	                        		errorHandle();
	                        	}
	                        })
	                    })
	                    .error(function(response, status) {
	                        errorHandle();
	                    });
	                })
	                .error(function(data, status) {
	                    errorHandle();
	                });
	        	ref.close();
			}
		})
	};
}])

.controller('TopEventCtrl', ['$scope', '$http', '$state', '$interval', '$cordovaGeolocation', '$ionicPopup', '$cordovaLocalNotification', '$ionicLoading', 'LocalStorage', '$timeout',
function($scope, $http, $state, $interval, $cordovaGeolocation, $ionicPopup, $cordovaLocalNotification, $ionicLoading, LocalStorage, $timeout) {
	// make an initialize function for this scope, this is some sort of workflow of this scope.
	var posOptions = {timeout: 10000, enableHighAccuracy: false};
	var promise;
	var currentLat;
	var currentLong;
	var curTime;
	var eventTime;
	var timeoutPromise;

	function init() {
		$scope.eventid = '';
		$scope.eventname = '';
		$scope.datetime = '';
		$scope.address = '';
		$scope.show = false;
		LocalStorage.set('notification', 'false');
		LocalStorage.set('confirm', 'false');
		LocalStorage.set('interval', 'false');
	}

	$scope.initialize = function() {
		stopInterval();
		$timeout.cancel(timeoutPromise);
		// since we need to use restful api to get user's topevent at current time, so we hide interface first
		showLoading();
		init();
		// then we can fetch top event
		fetchTopEvent();
		// if we have a top event, then 'checkTrafficTime' will be registered
	};

	// hide loading process
	function showLoading() {
		$ionicLoading.show({
    		templateUrl: 'templates/ionicLoading.html'
  		});
	}

	$scope.getEventList = function() {
		stopInterval();
		$timeout.cancel(timeoutPromise);
    	console.log('stop interval');
    	LocalStorage.set('confirm', 'false');
		$state.go('eventList');
	};

	console.log("in top event");
	
	function fetchTopEvent() {
		$http.get(baseURL + email + '/topEvent')
			 .success(function(res) {
			 	if(res.status === 'success') {
			 		$scope.eventid = res.event.eventid;
			 		$scope.eventname = res.event.eventname;
			 		eventTime = new Date(res.event.datetime);
			 		// convert it to human readable time format
			 		$scope.datetime = eventTime.toLocaleTimeString();
			 		$scope.address = res.event.address;
			 		$scope.show = true;
			 		// we need to startInterval a background process now
			 		startInterval();
			 	} else {
			 		// user don't have event!
			 		$ionicLoading.hide();
			 		console.log("something wrong");
			 	}
			 })
			 .error(function(status, err) {
			 	console.log(err);
			 });
	}

	function startInterval() {
		console.log("Just startInterval");
		stopInterval();
		promise = $interval(checkTraffic, timeInterval);
	}

	function stopInterval() {
		$interval.cancel(promise);
	}

	function convertSecToReadable(seconds) {
		var minutes = ~~(seconds / 60);
		var hours = ~~(minutes / 60);
		minutes = ~~(minutes % 60);
		return hours + " hrs " + minutes + " mins";
	}

	function checkTraffic() {
		// first get user current geolocation
		  $cordovaGeolocation
		    .getCurrentPosition(posOptions)
		    .then(function (position) {
		      currentLat = position.coords.latitude;
		      currentLong = position.coords.longitude;
			  $http({
			  	method: "GET",
			  	url: baseURL + email + "/duration",
			  	params: {
			  		lat: "" + currentLat,
			  		lng: "" + currentLong,
			  	}
			  })
			  .success(function(res) {
			  	if(res.status === 'success') {
			  		curTime = time.getTime();
			  		// console.log(res.event.datetime);
			  		$scope.travelTime = convertSecToReadable(res.duration);
			  		// release the screen to user
			 		$ionicLoading.hide();
			 		$scope.$broadcast('scroll.refreshComplete');
			  		if((Date.parse(res.event.datetime) - curTime) > (res.duration*1000 + gap)) {
			  			// it is not time to alert user, so directly went silent
			  		} else {
			  			// pop up an alert!!
			  			if(LocalStorage.get('confirm') !== 'true') { 
			  				$timeout(function() { confirm(res.event.eventname); }, timeInterval);
			  			}

 						if(LocalStorage.get('notification') !== 'true') { 
 							addNotification();
 						}
			  		}
			  	} else {
			  		console.log(res);
			  	}
			  })
			  .error();
		    }, function(err) {
		      // error
		      console.log(err);
		      errorHandle();
		    });

	}

	function confirm(eventname) {
	   var confirmPopup = $ionicPopup.confirm({
	     title: 'Caution',
	     template: '<p>You need to go for<br><b>' + eventname +'</b></p>',
	     cssClass: '',
	     subTitle: '',
	     templateUrl: '',
	     cancelText: 'Later',
	     cancelType: 'button-default',
	     okText: 'Got it',
	     okType: 'button-positive'
	   });

	   LocalStorage.set('confirm', 'true');
	   // stop regular detecting first, change to timeout mode
	   stopInterval();

	   confirmPopup.then(function(res) {
	     if(res) {
	     	// we got it for this event
	       console.log('You are sure');
	       //  stopInterval notification for this event
	       $scope.cancelNotification();
	       // cancel unfullfilled timeout 
	       $timeout.cancel(timeoutPromise);
	       LocalStorage.set('confirm', 'false');
	       // delete current top event and then fetch a new one.
	       deleteTopEvent();
	     } else {
	     	// remind me later
	       console.log('You are not sure');
	       LocalStorage.set('confirm', 'false');
	       // Need to recheck the traffic in the future
	       $timeout.cancel(timeoutPromise);
	       timeoutPromise = $timeout(function() { checkTraffic(); }, 2 * timeInterval);
	     }
	   });
	}

	function deleteTopEvent() {
		$http.get(baseURL + email + '/ignoredEvent?eventid=' + $scope.eventid)
		     .success(function(res) {
		     	console.log(res);
		     	// we need to update topevent in the view
		     	showLoading();
		     	fetchTopEvent();
		     })
		     .error(function(status, err) {
		     	console.log(err);
		     });
	}

	// when current top event expired, we try to fetch a new top event!!
	// this logic can be done by $timeout(function, timeElapse)
	var now = new Date().getTime();
	var _30_sec_from_now = new Date(now + 30 * 1000);

	function addNotification() {
		//$cordovaLocalNotification.add({
		cordova.plugins.notification.local.schedule({
	        id: '1',
	        title: 'Get ready for',
	        text: $scope.eventname,
	        at: _30_sec_from_now, // starting time
	        every: 'minute'
	      });
	}

	$scope.cancelNotification = function() {
		cordova.plugins.notification.local.cancelAll(function() {
			console.log('callback for canceling all background notifications');
			LocalStorage.set('notification', 'false');
		});
	};

	$scope.doRefresh = function() {
		$scope.initialize();
		//$scope.$broadcast('scroll.refreshComplete');
	};

	cordova.plugins.notification.local.on("click", function (notification) {
    	handleClick(notification);
	});

	cordova.plugins.notification.local.on("schedule", function (notification) {
    	handleSchedule(notification);
	});

	function handleSchedule(notification) {
		LocalStorage.set('notification', 'true');
		console.log('adding notification ' + notification.id);
	}

	function handleClick(notification) {
		console.log(notification.text);
		// Once user click notification, stopInterval it
		$scope.cancelNotification();
	}

	$scope.onSwipeLeft = function() {
		console.log("You just swipe left!!");
		$scope.getEventList();
	};

	$scope.initialize();
}])

.controller('EventCtrl', ['$scope', '$state', '$http', '$q', '$ionicLoading', '$rootScope', 
function($scope, $state, $http, $q, $ionicLoading, $rootScope) {
	//email = 'fuqiang3701@gmail.com';
	console.log("In event list!");
	$scope.show = false;

	function showLoading() {
		$ionicLoading.show({
    		templateUrl: 'templates/ionicLoading.html'
  		});
	}

	$scope.goBack = function() {
		$state.go('topEvent');
	};

	$scope.doRefresh = function() {
		$scope.init();
		// showLoading();
		// $scope.getEvents()
		// .then(function(res) {
		// 	convert(res.events);
		// 	$scope.eventList = res.events;
		// 	if(res.events.length === 0) $scope.show = true;
		// 	$ionicLoading.hide();
		// 	$scope.$broadcast('scroll.refreshComplete');
		// }, function(status) {
		// 	$scope.pageError = status;
		// 	$ionicLoading.hide();
		// });
	};

	function convert(events) {
		var len = events.length;
		for(var i = 0; i < len; i++) {
			events[i].datetime = new Date(events[i].datetime).toLocaleTimeString();
		}
	}

	$scope.init = function() {
		showLoading();
		$scope.getEvents()
		.then(function(res) {
			convert(res.events);
			$scope.eventList = res.events;
			if(res.events.length === 0) $scope.show = true;
			$ionicLoading.hide();
			$scope.$broadcast('scroll.refreshComplete');
		}, function(status) {
			$scope.pageError = status;
			$ionicLoading.hide();
		});
	};

	$scope.getEvents = function() {
		var defer = $q.defer();
		$http.get(baseURL + email + '/eventList')
			 .success(function(res) {
			 	defer.resolve(res);
			 })
			 .error(function(status, err) {
			 	defer.reject(status);
			 });
		return defer.promise;
	};

	$scope.onSwipeRight = function() {
		console.log("You just swipe right!!");
		$scope.goBack();
	};

	$scope.init();
}]);



