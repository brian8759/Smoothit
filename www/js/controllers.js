var clientID = '885179545921-a7cn7493fhh2o2uva62qc3eoutgs2tls.apps.googleusercontent.com';
var clientSecret = 'c8HEJxHyVW5XrenNTIrgvYO2';
  //calendarId: 'brian8759@gmail.com',
var redirectURL = 'http://localhost/oauth2callback';
var GoogleScope = 'openid email https://www.googleapis.com/auth/calendar';
//var GoogleScope = 'https://www.googleapis.com/auth/calendar';
var requestToken = '';
var accessToken = '';
var refreshToken = '';
var IDToken = '';
var email = '';

// avoid conflicting
jQuery.noConflict();

angular.module('ionicApp.controllers', [])

.controller('IntroCtrl', ['$scope', '$state', '$ionicSlideBoxDelegate', function ($scope, $state, $ionicSlideBoxDelegate) {

  // Called to navigate to the main app
  $scope.startApp = function () {
    $state.go('login');
  };
  $scope.next = function () {
    //$ionicSlideBoxDelegate.select($ionicSlideBoxDelegate.next());
    $ionicSlideBoxDelegate.next();
  };
  $scope.previous = function () {
    //$ionicSlideBoxDelegate.select($ionicSlideBoxDelegate.previous());
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
			if(eventURL.indexOf('http://localhost/oauth2callback') === 0) {
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

.controller('SecureCtrl', ['$scope', '$state', '$http', function($scope, $state, $http) {
	$scope.accessToken = accessToken;
	$scope.refreshToken = refreshToken;
	$scope.IDToken = IDToken;
	console.log("In secure!");
	$scope.smooth = function() {
		console.log("Do something!");
		$state.go('eventsList');
	}
}])

.controller('EventCtrl', ['$scope', '$state', '$http', '$q', function($scope, $state, $http, $q) {
	console.log("In event list!");

	$scope.init = function(){
		$scope.page = 1;
		$scope.getImages()
		.then(function(res){
		  // success
		  // console.log('Images: ', res)
		  $scope.imageList = res.shots;
		}, function(status){
		  // err
		  $scope.pageError = status;
		});
	}

	$scope.setActive = function(index){
		angular.forEach($scope.imageList, function(image){
		  image.active = false;
		})

		$scope.imageList[index].active = true
	};

	$scope.getImages = function(){
		var defer = $q.defer();

		$http.jsonp('http://api.dribbble.com/shots/everyone?page=' + $scope.page +  '&callback=JSON_CALLBACK')
			.success(function(res){
			  defer.resolve(res)
			})
			.error(function(status, err){
			  defer.reject(status)
			});

		return defer.promise;
	}

	$scope.nextPage = function(){
		$scope.page += 1;

		$scope.getImages()
		.then(function(res){
		  if($scope.imageList[0]){
		    $scope.imageList = $scope.imageList.concat(res.shots)
		  }
		  else{
		    $scope.imageList = res.shots;
		  }
		  // console.log('nextPage: ', $scope.imageList)
		  $scope.$broadcast('scroll.infiniteScrollComplete');
		})
	};

	$scope.init();
}]);



