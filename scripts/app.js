
// Initialize Firebase
var config = {
    apiKey: "AIzaSyDi1uj0-1YBfxpNF6L-NFOaFyfzEQo323w",
    authDomain: "mywebapp-123.firebaseapp.com",
    databaseURL: "https://mywebapp-123.firebaseio.com",
    storageBucket: "mywebapp-123.appspot.com",
    messagingSenderId: "808569769768"
};
firebase.initializeApp(config);
//Retrieve Firebase Messaging object
var messaging = firebase.messaging();

(function(){
    
    var app = angular.module("website",['firebase','token-service','update-service','message-service','authentication-service','ui.router']);
    app.factory("Auth", ["$firebaseAuth",
      function($firebaseAuth) {
        return $firebaseAuth();
      }
    ]);


    app.run(["$rootScope", "$state", function($rootScope, $state) {
      $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
        // We can catch the error thrown when the $requireSignIn promise is rejected
        // and redirect the user back to the home page
        console.log(error);
        if (error === "AUTH_REQUIRED") {
          $state.go("login");
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
        controller: 'MessageController',
        controllerAs: 'message',
        resolve: {
            // controller will not be loaded until $waitForSignIn resolves
            // Auth refers to our $firebaseAuth wrapper in the factory below
            "currentAuth": ["Auth", function(Auth) {
                console.log(Auth.$requireSignIn());
              return Auth.$requireSignIn();
              
            }]
          }
      });
      $stateProvider.state('login',{
        url: '/login',
        templateUrl: './views/loginpage.html',
        controller: 'AuthController',
        controllerAs: 'auth'

      });
      $stateProvider.state('signup',{
        url: '/signup',
        templateUrl: './views/signuppage.html',
        controller: 'AuthController',
        controllerAs: 'auth'

      });
      
    }]);

    app.controller("AuthController",["AuthService", function(AuthService){
        
        this.email = "";
        this.username = "";
        this.password = "";
        this.verify = "";
        this.err_email ="";
        this.err_pass = "";
        this.err_verify= "";
        this.invalidCred = "";

        this.createUser = function(){AuthService.createUser(this,this.email,this.password,this.verify)};
        this.signInUser = function(){AuthService.signInUser(this,this.email,this.password)};

        
    }]);

    app.controller("WebsiteController",['TokenService','UpdateService','AuthService', function (TokenService,UpdateService,AuthService) {
        //TODO: MAKE A HOME SCREEN
    }]);

    app.controller("MessageController",['MessageService','UpdateService','AuthService','$scope','currentAuth','TokenService',  function (MessageService,UpdateService,AuthService,$scope,currentAuth,TokenService) {
        console.log(currentAuth);
        if(currentAuth != null){
            
            TokenService.setCurrentUser(currentAuth.uid);
            permission = TokenService.requestPermission();
            UpdateService.initializeUI();
            TokenService.enableChat();

            var promise = UpdateService.initializeData(this);
            var theScope = this;
            this.friendList = {};
            promise.then(function(response){
                $scope.$evalAsync(function(){
                    theScope.friendList = response;
                    console.log(theScope.friendList);
                });
            });
            
            this.messageToSend = "";
            this.userToSend = ""; 
            this.sendMessage = function ($event) {
                if ($event.which === 13) {
                    $event.preventDefault();
                    console.log(this.userToSend==undefined);
                    //prevents send if the message is empty or no user is selected
                    if (!(this.messageToSend == "" || this.userToSend == "" || this.userToSend == undefined) && AuthService.checkLoggedIn()) {
                        MessageService.sendToServer(this.userToSend, this.messageToSend);
                        this.messageToSend = "";
                    }
                }
            };
            this.currUserToSend = function($event){
                if(AuthService.checkLoggedIn()){
                    console.log($event.target.id);
                    $event.preventDefault();
                    //TODO: ADD .displayname at the back*****
                    this.userToSend = this.friendList[$event.target.id.displayname];
                    UpdateService.setUserToSend($event.target.id);
                    UpdateService.initializeUI();
                }
            };
        }
        
    }]); 
})();
