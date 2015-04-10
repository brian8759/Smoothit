'use strict';

angular.module('ionicApp', ['ionic', 'ngCordova', 'ionicApp.controllers', 'ionicApp.services'])

.run(function($ionicPlatform, $rootScope, LocalStorage, $state, $timeout) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    var skipIntro;

    $rootScope.$on('$stateChangeStart',
        function(event, toState, toParams, fromState) {
            skipIntro = LocalStorage.get('skip') === 'true' ? true : false;

            if (fromState.name === 'login' && toState.name === 'intro') {
                if (skipIntro) {
                    $state.go('intro');
                }
            }
            if (fromState.name === 'intro' && toState.name === 'loading') {
                $state.go('intro');
            }
            if (fromState.name === 'login' && toState.name === 'loading') {
                $state.go('intro');
            }
            if (toState.name === 'intro') {
                if (skipIntro) {
                    $state.go('login');
                }
            }
        });

    // $ionicPlatform.on("resume", function(event) {
    //     console.log('event:' + event);
    //     $rootScope.$broadcast('appResumeEvent');
    // });

    // $ionicPlatform.on("pause", function(event) {
    //     console.log('event:' + event);
    //     $rootScope.$broadcast('appPauseEvent');
    // });

    skipIntro = LocalStorage.get('skip') === 'true' ? true : false;

    if ($state.is('loading')) {
        $timeout(function() {
            if (skipIntro) {
                $state.go('login');
            } else {
                $state.go('intro');
            }
        }, 1400);
    }

  });
})

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
  .state('loading', {
    url: '/loading',
    templateUrl: 'templates/loading.html'
  })

  .state('intro', {
    url: '/intro',
    templateUrl: 'templates/intro.html',
    controller: 'IntroCtrl'
  })

  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'LoginCtrl'
  })

  .state('topEvent', {
    url: '/topEvent',
    templateUrl: 'templates/topEvent.html',
    controller: 'TopEventCtrl'
  })

  .state('eventList', {
    url: '/eventList',
    templateUrl: 'templates/eventList.html',
    controller: 'EventCtrl'
  });

  $urlRouterProvider.otherwise("/loading");

});

