
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
    
    var app = angular.module("website",['firebase','token-service','update-service','message-service','authentication-service','ui.router','facebook-service']);


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
      $stateProvider.state('facebook',{
        url: '/facebook',
        templateUrl: './views/facebookpage.html',
        controller: 'FacebookController',
        controllerAs: 'fb',
        resolve:{
            "fbInit": function(FBService){
                //TODO: ABSTRACT THIS TO THE SERVICE
                return FBService.fbInit();
            },
        
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

    app.controller("FacebookController",['FBService','$scope','$state',function(FBService,$scope,$state){
        theScope = this;
        theScope.isLoginButton = false;  
        var fbLoggedInPromise = FBService.fbIsLoggedIn();
        //Successfully logged in
        fbLoggedInPromise.then(function(response){
            console.log(response);
            if(response.status == "connected"){
                /*FB.ui({
                    method: 'share',
                    mobile_iframe: true,
                    href: 'https://developers.facebook.com/docs/',
                }, function(response){});*/
                FBService.fbGetFeed().then(function(response){
                    var feedList = [];
                    //Sending multiple batch requests to the facebook api, MAX request is 25 so splitting up the batch requests
                    for(var i = 0; i < response.data.length; i++){
                        var postObj = { "method":"GET","relative_url": "/"+response.data[i].id};
                        var likeObj = { "method":"GET","relative_url": "/"+response.data[i].id+"/likes"};
                        var reactionObj = { "method":"GET","relative_url": "/"+response.data[i].id+"/comments"};
                        var sharedPostObj = { "method":"GET","relative_url": "/"+response.data[i].id+"/sharedposts"};
                        var attachmentObj = { "method":"GET","relative_url": "/"+response.data[i].id+"/attachments"};
                        feedList.push([postObj,likeObj,reactionObj,sharedPostObj,attachmentObj]);
                    }
                    FBService.fbBatchRequest(feedList,true).then(function(response){
                        console.log(response);
                    });
                });
            }else{
                //TODO: ERROR MESSAGES FOR LOGIN AND UNKNOWN
                //Activates the login button
                $scope.$evalAsync(function(){
                    theScope.isLoginButton = true;
                });
            }
            
        });
        this.loginButton = function(){
            if(this.isLoginButton){
                FBService.fbTryLogIn($state).then(function(response){});
            }
        }
        //EVENT fires every time the authentication status changes
        FB.Event.subscribe('auth.login',function(response){
            console.log(response);
            //store access token in realtime firebase
            FBService.storeAccessToken(response.authResponse);
            $state.reload();
        });
    }]);

    app.controller("AccountController",["AuthService",'currentAuth', function(AuthService,currentAuth){
        this.newDisplayName = "";
        this.editProfile = function(){
            if (!(this.newDisplayName == "" || this.newDisplayName == undefined || this.newDisplayName == null)){
                AuthService.editProfile(currentAuth,this.newDisplayName)
            }
        }
    }]);

    app.controller("AuthController",["AuthService", function(AuthService){
        //used to authenticate users on sign in
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

    app.controller("WebsiteController",['TokenService','UpdateService','AuthService','$rootScope', function (TokenService,UpdateService,AuthService,$rootScope) {
        //TODO: MAKE A HOME SCREEN
        $rootScope.username = "";
        $rootScope.isLoaded = false;
    }]);

    app.controller("MessageController",['MessageService','UpdateService','AuthService','$scope','currentAuth','TokenService','$rootScope',  function (MessageService,UpdateService,AuthService,$scope,currentAuth,TokenService,$rootScope) {
        $rootScope.isLoaded = true;
        //if the user is logged in
        if(currentAuth != null){
            $rootScope.isLoggedIn = true;
            if(currentAuth.displayName == null || currentAuth.displayName == ""){
                $rootScope.username = currentAuth.email;
            }else{
                $rootScope.username = currentAuth.displayName;
            }
            
            TokenService.setCurrentUser(currentAuth.uid);
            permission = TokenService.requestPermission();
            TokenService.enableChat();

            var promise = UpdateService.initializeData(this);
            var theScope = this;
            this.friendList = {};
            promise.then(function(response){
                $scope.$evalAsync(function(){
                    theScope.friendList = response;
                    console.log(theScope.friendList);

                    //Sets the userlist and initializes the UI with notifications
                    UpdateService.setFriendList(theScope.friendList);
                    UpdateService.initializeUI();
                });
            });
            
            this.messageToSend = "";
            this.userToSend = ""; 
            this.userIDToSend = "";
            this.sendMessage = function ($event) {
                if ($event.which === 13) {
                    $event.preventDefault();
                    //prevents send if the message is empty or no user is selected
                    if (!(this.messageToSend == "" || this.userIDToSend == "" || this.userIDToSend == undefined)) {
                        MessageService.sendToServer(this.userIDToSend, this.messageToSend);
                        this.messageToSend = "";
                    }
                }
            };
            //when the user clicks on a user to send to
            this.currUserToSend = function($event){
                console.log($event.target.id);
                this.userIDToSend = $event.target.id;
                $event.preventDefault();
                this.userToSend = this.friendList[$event.target.id].email;
                UpdateService.setUserToSend($event.target.id);
                UpdateService.initializeUI();
            };

            this.hasDisplayName = function(displayName){
                if(displayName == "" || displayName == null || displayName == undefined){
                    return false;
                }
                return true;
            }
        }else{
            $rootScope.isLoggedIn = false;
        }
        
    }]); 
})();
