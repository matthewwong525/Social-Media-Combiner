(function(){
    var app = angular.module("website");
    app.run(["$rootScope", "$state", function($rootScope, $state) {
      $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
        // We can catch the error thrown when the $requireSignIn promise is rejected
        // and redirect the user back to the home page
        console.log(error);
        if (error === "AUTH_REQUIRED") {
          $state.go("home");
        }
      });
    }]);


    app.config(['$interpolateProvider','$stateProvider', '$urlRouterProvider','$locationProvider','$mdIconProvider',function($interpolateProvider,$stateProvider,$urlRouterProvider,$locationProvider,$mdIconProvider) {
      //Changes the symbol in the html for angular to work with jinja 2
      $interpolateProvider.startSymbol('{/');
      $interpolateProvider.endSymbol('/}');
      $locationProvider.html5Mode(true);
      $urlRouterProvider.otherwise('/');
      $mdIconProvider.defaultIconSet('icons/mdi.svg');


      $stateProvider.state('home',{
        url: '/',
        templateUrl: './views/index.html',
        controller: 'HomeController',
        controllerAs: 'home',
        resolve: {
            // controller will not be loaded until $waitForSignIn resolves
            // Auth refers to our $firebaseAuth wrapper in the factory below
            "currentAuth": ["Auth", function(Auth) {
                console.log(Auth.$waitForSignIn());
              return Auth.$waitForSignIn();
              
            }]
          },
        
      });
      $stateProvider.state('main',{
        url: '/',
        abstract:true,
        templateUrl: './views/mainpage.html',
        controller: 'MainPageController',
        controllerAs: 'main',
        resolve: {
            // controller will not be loaded until $requireSignIn resolves
            // Auth refers to our $firebaseAuth wrapper in the factory below
            "currentAuth": ["Auth", function(Auth) {
                console.log(Auth.$requireSignIn());
              return Auth.$requireSignIn();
              
            }]
          },

      });
      //A child state of main and provides the parent
      $stateProvider.state('main.features',{
        views:{
          'mainfeed@main': {
            templateUrl: './views/mainfeed.html',
            controller: 'MainFeedController',
            controllerAs: 'mainfeed',
            resolve:{
              "fbInit": function(FBService){
                return FBService.fbInit();
              }
            }
          },
          'messages@main': {
            templateUrl: './views/messagepage.html',
            controller: 'MessageController',
            controllerAs: 'message',
          },
        }
      });

      $stateProvider.state('socialpage',{
        url: "/{socialpage:(?:facebook)}",
        templateUrl: "/views/socialpage.html",
        controller: "SocialPageController",
        controllerAs: "sp",
        resolve: {
            // controller will not be loaded until $waitForSignIn resolves
            // Auth refers to our $firebaseAuth wrapper in the factory below
            "currentAuth": ["Auth", function(Auth) {
                console.log(Auth.$requireSignIn());
              return Auth.$requireSignIn();
            }]
        }
      });
      $stateProvider.state('account',{
        url: '/account',
        templateUrl: './views/accountpage.html',
        controller: 'AccountController',
        controllerAs: 'account',
        resolve: {
            // controller will not be loaded until $waitForSignIn resolves
            // Auth refers to our $firebaseAuth wrapper in the factory below
            "currentAuth": ["Auth", function(Auth) {
                console.log(Auth.$requireSignIn());
              return Auth.$requireSignIn();
              
            }]
          }
      });
      $stateProvider.state('logout',{
        url: '/logout',
        resolve: {
            "signOut" : ["Auth", function(Auth) {
                Auth.$signOut();
            }],
            //initializes facebook for logout
            "initFB": function(FBService){
                return FBService.fbInit();
            }
        },
        onEnter: function(){
            FB.logout(function(response){
                console.log(response);
            });
            window.location.replace("/");
        } 
      });
      $stateProvider.state('login',{
        parent:'home',
        templateUrl: './views/loginpage.html',
        controller: 'AuthController',
        controllerAs: 'auth'

      });
      $stateProvider.state('signup',{
        parent:'home',
        templateUrl: './views/signuppage.html',
        controller: 'AuthController',
        controllerAs: 'auth'

      });
      
    }]);
})();