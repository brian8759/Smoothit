// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
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
                    navigator.app.exitApp();
                }
            }
            if (fromState.name === 'intro' && toState.name === 'loading') {
                navigator.app.exitApp();
            }
            if (fromState.name === 'login' && toState.name === 'loading') {
                navigator.app.exitApp();
            }
            if (toState.name === 'intro') {
                if (skipIntro) {
                    $state.go('login');
                }
            }
        });

    skipIntro = LocalStorage.get('skip') === 'true' ? true : false;

    if ($state.is('loading')) {
        $timeout(function() {
            if (skipIntro) {
                $state.go('login');
            } else {
                $state.go('intro');
            }
        }, 1000);
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
  
  .state('secure', {
    url: '/secure',
    templateUrl: 'templates/secure.html',
    controller: 'SecureCtrl'
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
  })

  .state('main', {
    url: '/main',
    templateUrl: 'templates/main.html',
    controller: 'MainCtrl'
  });

  $urlRouterProvider.otherwise("/loading");

});

