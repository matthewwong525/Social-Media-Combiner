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
        controller: 'HomeController',
        controllerAs: 'home',
        resolve: {
            // controller will not be loaded until $waitForSignIn resolves
            // Auth refers to our $firebaseAuth wrapper in the factory below
            "currentAuth": ["Auth", function(Auth) {
                console.log(Auth.$waitForSignIn());
              return Auth.$waitForSignIn();
            }],
            // loads the template in the resolve to prevent preloading template
            "loadTemplate": function($templateRequest){
                return $templateRequest("./views/index.html");
            },
          },
        //checks if the user is logged in and loads the appropriate template
        templateProvider: function(loadTemplate,currentAuth){
          if(currentAuth == null)
              return loadTemplate
        }
        
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
        abstract:true,
        views:{
          'messages@main': {
            templateUrl: './views/messagepage.html',
            controller: 'MessageController',
            controllerAs: 'message',
          },
          'feed' : {
            template: "<div ui-view layout='column'></div>"
          }
        }
        
      });

      $stateProvider.state('main.features.mainfeed',{
        templateUrl: './views/mainfeed.html',
        controller: 'MainFeedController',
        controllerAs: 'mf',
        resolve:{
          "fbInit": function(FBService){
            return FBService.fbInit();
          }
        }
      });

      $stateProvider.state('main.features.fbfeed',{
        templateUrl: './views/fbfeed.html',
        controller: 'FacebookController',
        controllerAs: 'fb',
        resolve:{
          "fbInit": function(FBService){
            return FBService.fbInit();
          }
        }
      });

      $stateProvider.state('main.features.twitterfeed',{
        templateUrl: './views/twitterfeed.html',
        controller: 'TwitterController',
        controllerAs: 'twit',
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

      
    }]);
})();