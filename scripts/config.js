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


    app.config(['$interpolateProvider','$stateProvider', '$urlRouterProvider','$locationProvider',function($interpolateProvider,$stateProvider,$urlRouterProvider,$locationProvider) {
      $interpolateProvider.startSymbol('{/');
      $interpolateProvider.endSymbol('/}');
      $locationProvider.html5Mode(true);
      $urlRouterProvider.otherwise('/');

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
      $stateProvider.state('message',{
        url: '/',
        templateUrl: './views/messagepage.html',
        controller: 'MessageController',
        controllerAs: 'message',
        resolve: {
            // controller will not be loaded until $waitForSignIn resolves
            // Auth refers to our $firebaseAuth wrapper in the factory below
            "currentAuth": ["Auth", function(Auth) {
                console.log(Auth.$waitForSignIn());
              return Auth.$waitForSignIn();
              
            }]
          }
      });
      $stateProvider.state('mainfeed',{
        url: '/mainfeed',
        templateUrl: './views/mainfeed.html',
        controller: 'MainFeedController',
        controllerAs: 'mainfeed',
        resolve:{
            // controller will not be loaded until $waitForSignIn resolves
            // Auth refers to our $firebaseAuth wrapper in the factory below
            "currentAuth": ["Auth", function(Auth) {
                console.log(Auth.$requireSignIn());
              return Auth.$requireSignIn();
            }],
            "fbInit": function(FBService){
                return FBService.fbInit();
            }
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