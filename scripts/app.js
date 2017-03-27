
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
    app.config(['$interpolateProvider','$stateProvider', '$urlRouterProvider','$locationProvider',function($interpolateProvider,$stateProvider,$urlRouterProvider,$locationProvider) {
      $interpolateProvider.startSymbol('{/');
      $interpolateProvider.endSymbol('/}');
      $locationProvider.html5Mode(true);
      $urlRouterProvider.otherwise('/');

      $stateProvider.state('home',{
        url: '/',
        templateUrl: './views/index.html',
        controller: 'MessageController',
        controllerAs: 'message'
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
        this.loggedIn = function (isLoggedIn,currentUser) {
            if(isLoggedIn){
                TokenService.setCurrentUser(TokenService.getCurrentUser());
                permission = TokenService.requestPermission();
                UpdateService.initializeUI();
                TokenService.enableChat();
            }
        };
    }]);

    app.controller("MessageController",['MessageService','UpdateService','AuthService','$scope',  function (MessageService,UpdateService,AuthService,$scope) {
        var promise = UpdateService.initializeData($scope);
        theScope = this;
        this.friendList = "";
        promise.then(function(jsonFriendList){
            theScope.friendList = jsonFriendList;
            console.log(theScope.friendList);
        });
        $scope.$watch('friendList',function(){
            console.log(theScope.friendList)
            $scope.$evalAsync(function(){

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
                this.userToSend = $event.target.id;
                UpdateService.setUserToSend(this.userToSend);
                UpdateService.initializeUI();
            }
        };
    }]); 
})();
