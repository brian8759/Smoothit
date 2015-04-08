'use strict';

var clientID = '465166072015-hgfci110risj5deonfivs1tfefg8kd3u.apps.googleusercontent.com';
var clientSecret = 'ySRObG-gC6Gl2xyAaDxf0PpP';
  //calendarId: 'brian8759@gmail.com',
//var redirectURL = 'http://localhost/oauth2callback';
var redirectURL = 'http://localhost';
var GoogleScope = 'openid email https://www.googleapis.com/auth/calendar';
//var GoogleScope = 'https://www.googleapis.com/auth/calendar';
var requestToken = '';
var accessToken = '';
var refreshToken = '';
var IDToken = '';
var email = '';
var timeInterval = 5000; // 5 second
var gap = 100000 * 60 * 1000; // gap for duration
var time = new Date();

// avoid conflicting
jQuery.noConflict();

angular.module('ionicApp.controllers', [])

.controller('IntroCtrl', ['$scope', '$state', '$ionicSlideBoxDelegate', 'LocalStorage', function ($scope, $state, $ionicSlideBoxDelegate, LocalStorage) {

  // Called to navigate to the main app
  $scope.startApp = function () {
  	LocalStorage.set('skip', 'true');
    $state.go('login');
  };
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
}])

.controller('MainCtrl', ['$scope', '$state', function ($scope, $state) {
  $scope.toIntro = function () {
    $state.go('intro');
  };
}])

.controller('LoginCtrl', ['$scope', '$ionicPopup', '$state', '$http', '$location', function($scope, $ionicPopup, $state, $http, $location) {
	$http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

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
			console.log(event);
			var eventURL = event.url;
			// check if the redirect url is the one we want
			if(eventURL.indexOf('http://localhost') === 0) {
				// parse the requestToken from the eventURL
				var code = eventURL.split("code=")[1].split("&");
				requestToken = code[0];
				console.log("requestToken:" + requestToken);
				//Here, the app will use the requestToken to ask for accessToken and refreshToken from Google
				$http({ method: "POST", 
						url: "https://accounts.google.com/o/oauth2/token", 
						data: "client_id=" + clientID + "&client_secret=" + 
							   clientSecret + "&redirect_uri=" + redirectURL + 
							   "&grant_type=authorization_code" + "&code=" + requestToken })
	            
	            	.success(function(data) {
	                    // data = {id_token, access_token, expires_in, refresh_token, token_type}
	                    console.log(data);
	                    accessToken = data.access_token;
	                    IDToken = data.id_token;
	                    refreshToken = data.refresh_token;
	                    $http({ method: "GET", url: "https://www.googleapis.com/oauth2/v1/tokeninfo?id_token=" + IDToken })
	                    .success(function(response) {
	                    	// response has {audience, email, email_verified, expires_in, issued_at, user_id}
	                        console.log(response);
	                        
	                        // we send the email address and accessToken and refreshToken to backend
	                        email = response.email;
	                        console.log(email);
	                        $http({ method: "POST", url: "http://54.68.110.119/smoothit/" + email + "/token", 
	                        		data: "access_token=" + accessToken + "&refresh_token=" + refreshToken })
	                        .success(function(res) {
	                        	if(res.status === "success") {
	                        		// successfully store token and email to backend
	                        		// then try to get the top event
	                        		console.log('Just save user info !');
	                        		$state.go('secure');
	                        		//$state.go('eventList');
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
	}
}])

.controller('SecureCtrl', ['$scope', '$state', '$http', '$ionicPopup', '$cordovaGeolocation', 'LocalStorage', 
function($scope, $state, $http, $ionicPopup, $cordovaGeolocation, LocalStorage) {
	$scope.accessToken = accessToken;
	$scope.refreshToken = refreshToken;
	$scope.IDToken = IDToken;
	console.log("In secure!");

	var errorHandle = function() {
		var alertPopup = $ionicPopup.alert({
			title: 'something wrong',
			template: 'Can not get location'
		});
		alertPopup.then(function(res) {
			$state.go('eventList');
		});
	};

	$scope.smooth = function() {
		console.log("Do something!");
		$state.go('topEvent');
	};

	$scope.getLocation = function() {
		var posOptions = {timeout: 10000, enableHighAccuracy: false};
		  $cordovaGeolocation
		    .getCurrentPosition(posOptions)
		    .then(function (position) {
		      $scope.currentLat = position.coords.latitude;
		      $scope.currentLong = position.coords.longitude;
		      console.log($scope.currentLat);
			  console.log($scope.currentLong);
		    }, function(err) {
		      // error
		      console.log(err);
		      errorHandle();
		    });
	};

	$scope.reset = function() {
		LocalStorage.set('skip', 'false');
	};
}])

.controller('TopEventCtrl', ['$scope', '$http', '$state', '$interval', '$cordovaGeolocation', '$ionicPopup', '$cordovaLocalNotification', '$ionicLoading', 'LocalStorage',
function($scope, $http, $state, $interval, $cordovaGeolocation, $ionicPopup, $cordovaLocalNotification, $ionicLoading, LocalStorage) {
	// hide loading process
	$ionicLoading.show({
    	template: 'Loading Top Event...'
  	});

	LocalStorage.set('notification', 'false');
	LocalStorage.set('confirm', 'false');

	$scope.getEventList = function() {
		$state.go('eventList');
	};

	var posOptions = {timeout: 10000, enableHighAccuracy: false};
	var promise;
	$scope.eventname = '';
	$scope.datetime = '';
	$scope.address = '';
	$scope.show = false;

	console.log("in top event");

	// fetch 
	$http.get('http://54.68.110.119/smoothit/' + email + '/topEvent')
		 .success(function(res) {
		 	if(res.status === 'success') {
		 		$scope.show = true;
		 		console.log(res.event.eventname);
		 		console.log(res.event.datetime);
		 		console.log(res.event.address);
		 		$scope.eventname = res.event.eventname;
		 		$scope.datetime = res.event.datetime;
		 		$scope.address = res.event.address;
		 		console.log($scope.eventname);
		 		console.log($scope.datetime);
		 		console.log($scope.address);
		 		// release the screen to user
		 		$ionicLoading.hide();
		 		// we need to register a background process now
		 		register();
		 	} else {
		 		// user don't have event!
		 		$ionicLoading.hide();
		 		console.log("something wrong");
		 	}
		 })
		 .error(function(status, err) {
		 	console.log(err);
		 });

	function register() {
		console.log("Just register");
		cancel();
		promise = $interval(checkTraffic, timeInterval);
	}

	function cancel() {
		$interval.cancel(promise);
	}


	function checkTraffic() {
		// first get user current geolocation
		  $cordovaGeolocation
		    .getCurrentPosition(posOptions)
		    .then(function (position) {
		      var currentLat = position.coords.latitude;
		      var currentLong = position.coords.longitude;
		      console.log(currentLat);
			  console.log(currentLong);
			  // then we need to call api to get real time travel duration
			  $http({
			  	method: "GET",
			  	url: "http://54.68.110.119/smoothit/" + email + "/duration",
			  	params: {
			  		lat: "" + currentLat,
			  		lng: "" + currentLong,
			  	}
			  })
			  .success(function(res) {
			  	if(res.status === 'success') {
			  		// res.duration is the travel time in seconds
			  		// res.event.datetime is the event time
			  		// check the gap between this two 
			  		var curTime = time.getTime();
			  		console.log(res.event.datetime);
			  		if((Date.parse(res.event.datetime) - curTime) > (res.duration*1000 + gap)) {
			  			// silent
			  		} else {
			  			// pop up an alert
			  			if(LocalStorage.get('notification') !== 'true') confirm(res.event.eventname);

 						if(LocalStorage.get('notification') !== 'true') addNotification();
			  		}
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
	     title: 'Caution!',
	     template: 'You need to go for ' + eventname,
	     cssClass: '',
	     subTitle: '',
	     templateUrl: '',
	     cancelText: 'Later',
	     cancelType: 'button-default',
	     okText: 'Got it',
	     okType: 'button-positive'
	   });

	   LocalStorage.set('notification', 'true');

	   confirmPopup.then(function(res) {
	     if(res) {
	       console.log('You are sure');
	       cancel();
	     } else {
	     	// remind me later
	     	LocalStorage.set('notification', 'false');
	     	// http://54.68.110.119/smoothit/email/ignoredEvent
	       console.log('You are not sure');
	       cancel();
	     }
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

	//addNotification();

	$scope.cancelNotification = function() {
		// $cordovaLocalNotification.cancelAll().then(function () {
  //     		console.log('callback for canceling all background notifications');
  //   	});
		cordova.plugins.notification.local.cancelAll(function() {
			console.log('callback for canceling all background notifications');
		});
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
	}
}])

.controller('EventCtrl', ['$scope', '$state', '$http', '$q', '$ionicLoading', function($scope, $state, $http, $q, $ionicLoading) {
	console.log("In event list!");
	// hide loading process
	$ionicLoading.show({
    	template: 'Loading Events...'
  	});
	// $scope.init = function(){
	// 	$scope.page = 1;
	// 	$scope.getImages()
	// 	.then(function(res){
	// 	  // success
	// 	  // console.log('Images: ', res)
	// 	  $scope.imageList = res.shots;
	// 	}, function(status){
	// 	  // err
	// 	  $scope.pageError = status;
	// 	});
	// }

	$scope.init = function() {
		$scope.page = 1;
		$scope.getEvents()
		.then(function(res) {
			$scope.eventList = res.events;
			$ionicLoading.hide();
		}, function(status) {
			$scope.pageError = status;
			$ionicLoading.hide();
		});
	};

	// $scope.setActive = function(index){
	// 	angular.forEach($scope.imageList, function(image){
	// 	  image.active = false;
	// 	})

	// 	$scope.imageList[index].active = true
	// };

	$scope.getEvents = function() {
		var defer = $q.defer();
		// right now, I hard coded the email address, in the future, should use "email"
		$http.get('http://54.68.110.119/smoothit/' + email + '/eventList')
			 .success(function(res) {
			 	defer.resolve(res);
			 })
			 .error(function(status, err) {
			 	defer.reject(status);
			 });
		return defer.promise;
	};

	// $scope.nextPage = function() {
	// 	$scope.page += 1;
	// 	$scope.getEvents()
	// 	.then(function(res) {
	// 		if($scope.eventList[0]) {
	// 			$scope.eventList = $scope.eventList.concat(res.events);
	// 		} else {
	// 			$scope.eventList = res.events;
	// 		}
	// 		$scope.$broadcast('scroll.infiniteScrollComplete');
	// 	});
	// };

	$scope.init();
}]);



