
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
    
    var app = angular.module("website",['firebase','token-service','update-service','message-service','authentication-service','ui.router','facebook-service','ngMaterial']);

    /////////////////////////////////////////////////////////////////
    //Experimental Controller used for the proxies for fb
    /////////////////////////////////////////////////////////////////
    app.controller("SocialPageController",['$stateParams','$http','$scope','$sce',function($stateParams,$http,$scope,$sce){
        var socialpage = $stateParams.socialpage;
        theScope = this;
        this.pagehtml = "";
        if(socialpage == "facebook"){
            //document.write("<base href='http://www.facebook.com/" + "' />");
            var parameters = {
                params:{
                    "p":socialpage
                }
            };
            $http.get("/page",parameters).then(function(response){
                //gets the parametesr
                console.log(response);
                //var inputFormData = response.data;
                //inputFormData["email"] = "whatisyouraccount@hotmail.com";
                //inputFormData["pass"] = "$pell4968585max";
                theScope.pagehtml = $sce.trustAsHtml(response.data);
                //$http.post("/page",inputFormData).then(function(response){
                    //console.log(response);
                    
                //})
            });
        }
        window.onbeforeunload = function(e) {
            // check condition
            console.log(e);
            return 'Dialog text here.';
        };
    }]);

    //Controller used to aggregrate all the feeds fro different social medias and fuse them together into one feed
    app.controller("MainFeedController",['FBService','$scope','$state',function(FBService,$scope,$state){
        //Initializes some variables
        theScope = this;
        theScope.isLoginButton = false;
        theScope.userFeed = {};  
        var fbLoggedInPromise = FBService.fbIsLoggedIn();
        //Successfully logged in
        fbLoggedInPromise.then(function(response){
            //TODO: ALSO CHECK IF the access token is expired
            //checks if the person is connected, meaning "logged in"
            if(response.status == "connected"){
                //TODO: abstract to the facebook service
                //if they are logged in, go access the user feed
                FBService.fbApiRequest("/me/feed").then(function(response){
                    var userList = [],postList=[],likeList = [],commentList = [],reactionList = [],sharedPostList = [],attachmentList = [];
                    //Sending multiple batch requests to the facebook api, MAX request is 25 so splitting up the batch requests
                    var posts = response;
                    for(var i = 0; i < response.data.length; i++){
                        userList.push({ "method":"GET","relative_url": "/"+posts.data[i].id.split("_")[0]});
                        postList.push({ "method":"GET","relative_url": "/"+posts.data[i].id});
                        commentList.push({ "method":"GET","relative_url": "/"+posts.data[i].id+"/comments"});
                        reactionList.push({ "method":"GET","relative_url": "/"+posts.data[i].id+"/reactions"});
                        sharedPostList.push({ "method":"GET","relative_url": "/"+posts.data[i].id+"/sharedposts"});
                        attachmentList.push({ "method":"GET","relative_url": "/"+posts.data[i].id+"/attachments"});
                    }
                    //sends the request here
                    FBService.fbBatchRequest(userList,postList,commentList,reactionList,sharedPostList,attachmentList).then(function(response){
                        var feedList = FBService.groupByIndex(response);
                        theScope.userFeed = feedList;
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
        //Basically this is the function attached to the login button
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
            //reloads the page state
            $state.reload();
        });
    }]);

    //Account controller used to handle editing the user profile
    app.controller("AccountController",["AuthService",'currentAuth', function(AuthService,currentAuth){
        this.newDisplayName = "";
        this.editProfile = function(){
            if (!(this.newDisplayName == "" || this.newDisplayName == undefined || this.newDisplayName == null)){
                AuthService.editProfile(currentAuth,this.newDisplayName)
            }
        }
    }]);

    //Handler used for logins and sign ups
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

        //Called on signup
        this.createUser = function(){AuthService.createUser(this,this.email,this.password,this.verify)};
        //Called on login
        this.signInUser = function(){AuthService.signInUser(this,this.email,this.password)};

        
    }]);

    //Controller for logged in user navigation
    app.controller("MainPageController",['$mdSidenav','$scope',function($mdSidenav,$scope){
        this.isSideNavOpen = false;
        

        //function to toggle the state of the sidebar
        this.toggleSidebar = function(){
            $mdSidenav("menu").toggle();
        };
        //watches the side nav and adjust the tool bar according to the width of the sidenav
        $scope.$watch('isSideNavOpen',function(isSideNavOpen){

            if(isSideNavOpen){
                $("#mainframe").css('margin-left',$("md-sidenav").width());
            }else{
                $("#mainframe").css('margin-left',0);
            }
            console.log("ha");
        });

    }]);

    //Controller for the home page
    app.controller("HomeController",['currentAuth','$rootScope','$state',function(currentAuth,$rootScope,$state){
        //variable used to tell the UI that the page is loaded
        $rootScope.isLoaded = true;
        //Checks if the user is logged in or not
        if(currentAuth != null){
            //Logged in variable sent to UI
            $rootScope.isLoggedIn = true;
            //Checks if user has a display name or not and displays there email if they do not have one
            if(currentAuth.displayName == null || currentAuth.displayName == ""){
                $rootScope.username = currentAuth.email;
            }else{
                $rootScope.username = currentAuth.displayName;
            }
            //goes to message page if logged in
            $state.go("main.features");
        }else{
            //Goes to login page(nested in home) if user is not logged in.
            $rootScope.isLoggedIn = false;
            $state.go("login");
        }
    }]);

    //Controller that is called before any controller
    app.controller("WebsiteController",['TokenService','UpdateService','AuthService','$rootScope', function (TokenService,UpdateService,AuthService,$rootScope) {
        //initialize all variables here
        $rootScope.username = "";
        $rootScope.isLoaded = false;
    }]);

    //The controller that handles all the messages
    app.controller("MessageController",['MessageService','UpdateService','AuthService','$scope','currentAuth','TokenService','$rootScope',  function (MessageService,UpdateService,AuthService,$scope,currentAuth,TokenService,$rootScope) {
        //loaded variable that is sent to UI
        $rootScope.isLoaded = true;
        //if the user is logged in
        if(currentAuth != null){
            //Sets the current user ID as current user for the service
            TokenService.setCurrentUser(currentAuth.uid);
            //Asks the user if they want notifications enabled
            TokenService.requestPermission();
            //Enables the chat on the UI
            TokenService.enableChat();

            //gets initialization data from the server
            var promise = UpdateService.initializeData(this);
            var theScope = this;
            this.friendList = {};

            //uses the initialization data and updates the UI
            promise.then(function(response){
                $scope.$evalAsync(function(){
                    theScope.friendList = response;
                    console.log(theScope.friendList);

                    //Sets the userlist and initializes the UI with notifications
                    UpdateService.setFriendList(theScope.friendList);
                    UpdateService.initializeUI();
                });
            });

            //resets UI components//
            this.messageToSend = "";
            if(UpdateService.getUserToSend() == ""){
                this.userToSend = "Send To..."; 
            }else{
                this.userToSend = UpdateService.getUserToSend();
            }
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
            this.currUserToSend = function(id){
                console.log(id);
                this.userIDToSend = id;
                this.userToSend = id;
                UpdateService.setUserToSend(id);
                UpdateService.initializeUI();
            };
            //checks if the user has a displayname
            this.hasDisplayName = function(displayName){
                if(displayName == "" || displayName == null || displayName == undefined){
                    return false;
                }
                return true;
            }
        }else{
            //if the user is not authenticated
            $rootScope.isLoggedIn = false;
        }
        
    }]); 
})();
