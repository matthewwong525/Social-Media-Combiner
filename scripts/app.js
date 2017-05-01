
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
    
    var app = angular.module("website",['firebase','token-service','update-service','message-service','authentication-service','ui.router','facebook-service','twitter-service','ngMaterial','ngMessages']);

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
                //inputFormData["pass"] = "LOLOLOLOL";
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

    //Controller for twitter services
    app.controller("TwitterController",['TwitterService','$scope','$rootScope','TokenService','$state',function(TwitterService,$scope,$rootScope,TokenService,$state){
        //Initializes some variables
        theScope = this;
        theScope.twitFeed = {};
        currUser = TokenService.getCurrentUser();
        //makes a request for the timeline
        TwitterService.makeRequest("GET","statuses/home_timeline.json").then(function(response){
            console.log(TwitterService.sanitizePosts(response));
            //sets the variable that will be passed into the html
            theScope.twitFeed = response;
        }).catch(function(response){
            //if the request fails to authenticate or there is some kind of error, sends to login dialog
            console.log(response);
            var twitterRef = firebase.database().ref().child('user_data').child(currUser).child('twitter');
            //updates the server with information that the log in is false
            twitterRef.update({
                twitLoggedIn: "false"
            }).then(function(response){
                //if log in is successful, the state is reloaded

                if(response == undefined || response.data == undefined){
                    errors = undefined;
                }else{
                    errors = response.data.erros;
                }
                TwitterService.twitterLoginPage($state,errors);
            });
            
        });
    }]);

    //Controller used to get facebook things
    app.controller("FacebookController",['FBService','TwitterService','$scope','$state','$mdDialog','$rootScope',function(FBService,TwitterService,$scope,$state,$mdDialog,$rootScope){
        //Initializes some variables
        theScope = this;
        theScope.FBisLoggedIn = false;
        theScope.userFeed = {};
        FBService.fbTryLogIn().then(function(response){});
        var fbLoggedInPromise = FBService.fbIsLoggedIn();
        //Successfully logged in
        fbLoggedInPromise.then(function(response){
            //TODO: ALSO CHECK IF the access token is expired
            //checks if the person is connected, meaning "logged in"
            console.log(response);
            if(response.status == "connected"){
                //store access token in realtime firebase
                //TODO: .then the response so it can store the data first
                FBService.storeAccessToken(response.authResponse);
                theScope.FBisLoggedIn = true;
                //TODO: abstract to the facebook service
                //if they are logged in, go access the user feed
                FBService.fbApiRequest("/me/feed").then(function(response){
                    console.log(response);
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
                        theScope.userFeed = FBService.sanitizePosts(feedList);
                        console.log(FBService.sanitizePosts(feedList));
                    });
                });
            }
        });
        //EVENT fires every time the authentication status changes
        FB.Event.subscribe('auth.login',function(response){
            console.log(response);
            if(response.status == "connected"){
                theScope.FBisLoggedIn = true;
            }else{
                theScope.FBisLoggedIn = false;
            }
            //store access token in realtime firebase
            FBService.storeAccessToken(response.authResponse);
            //reloads the page state
            $state.reload();
        });

        //On the expand like button click
        this.openLikeDialog = function($event, likeObj){
            //stores the likeObj into the rootScope
            $rootScope.likeObj = likeObj;
            $mdDialog.show({
                controller: function LikeDialogController($scope,$mdDialog){
                    //closes the dialog
                    this.close = function() {
                      $mdDialog.cancel();
                    };
                },
                controllerAs: "like",
                templateUrl: './views/like-dialogpage.html',
                parent: angular.element(document.body),
                targetEvent: $event,
                clickOutsideToClose:true,
                fullscreen: true// Only for -xs, -sm breakpoints.
            });
        };

        //On the expand like button click
        this.openShareDialog = function($event, shareObj){
            //stores the likeObj into the rootScope
            $rootScope.shareObj = shareObj;
            $mdDialog.show({
                controller: function LikeDialogController($scope,$mdDialog){
                    //closes the dialog
                    this.close = function() {
                      $mdDialog.cancel();
                    };
                },
                controllerAs: "like",
                templateUrl: './views/share-dialogpage.html',
                parent: angular.element(document.body),
                targetEvent: $event,
                clickOutsideToClose:true,
                fullscreen: true// Only for -xs, -sm breakpoints.
            });
        };

        //On the expand comment button click
        this.openCommentDialog = function($event, commentObj){
            //stores the commentObj into the rootscope
            $rootScope.commentObj = commentObj;
            $mdDialog.show({
                controller: function CommentDialogController($scope,$mdDialog){
                    //closes the dialog
                    this.close = function() {
                      $mdDialog.cancel();
                    };
                },
                controllerAs: "comment",
                templateUrl: './views/comment-dialogpage.html',
                parent: angular.element(document.body),
                targetEvent: $event,
                clickOutsideToClose:true,
                fullscreen: true// Only for -xs, -sm breakpoints.
            });
        }
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
    app.controller("AuthController",["AuthService",'$mdDialog','$scope', function(AuthService,$mdDialog,$scope){
        //used to authenticate users on sign in
        theScope = this;
        this.email = "";
        this.username = "";
        this.password = "";
        this.verify = "";

        this.loginValidation = "";
        this.signUpValidation = "";

        //REGEXs for frontend form validation
        this.EMAIL_REGEXP = /(.+)@(.+){2,}\.(.+){2,}/;
        this.VERIFY_REGEXP = new RegExp("^"+ this.password+"$");

        //Called on signup and hides the dialog
        this.createUser = function(isValid){
            if(isValid){
                AuthService.createUser(this,this.email,this.password,this.verify)
                .then(function(response){
                    if(response != ""){
                        $scope.$evalAsync(function(){
                            theScope.signUpValidation = response;
                        });
                    }else{
                        $mdDialog.hide(); 
                    } 
                });
                
            }
        };
        //Called on login and hides the dialog
        this.signInUser = function(isValid){
            if(isValid){
                AuthService.signInUser(this,this.email,this.password)
                .then(function(response){
                    if(response != ""){
                        $scope.$evalAsync(function(){
                            theScope.loginValidation = response;
                        });
                    }else{
                        $mdDialog.hide(); 
                    } 
                });
            }
        };

        //closes the dialog
        this.close = function() {
          $mdDialog.cancel();
        };
    }]);

    //Controller for logged in user navigation
    app.controller("MainPageController",['$mdSidenav','$scope','FBService','TwitterService','$state',function($mdSidenav,$scope,FBService,TwitterService,$state){
        this.isSideNavOpen = false;
        
        //when someone clicks the facebook button
        this.fbLogin = function(){
            $state.go("main.features.fbfeed");
        }
        this.twitterLogin = function(){
            $state.go("main.features.twitterfeed");
        }

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
        });

    }]);

    //Controller for the home page
    app.controller("HomeController",['currentAuth','$rootScope','$state','$mdDialog','TokenService',function(currentAuth,$rootScope,$state,$mdDialog,TokenService){
        //variable used to tell the UI that the page is loaded
        $rootScope.isLoaded = true;
        //Checks if the user is logged in or not
        if(currentAuth != null){
            //Sets current logged in user
            TokenService.setCurrentUser(currentAuth.uid);
            //Logged in variable sent to UI
            $rootScope.isLoggedIn = true;
            //Checks if user has a display name or not and displays there email if they do not have one
            if(currentAuth.displayName == null || currentAuth.displayName == ""){
                $rootScope.username = currentAuth.email;
            }else{
                $rootScope.username = currentAuth.displayName;
            }
            //goes to message page if logged in
            $state.go("main.features.fbfeed");
        }else{
            //Goes to login page(nested in home) if user is not logged in.
            $rootScope.isLoggedIn = false;
            $state.go("home");
        }

        this.showLoginPrompt = function($event){
            $rootScope.authIndex = 0;
            $mdDialog.show({
                controller: "AuthController",
                controllerAs: "auth",
                templateUrl: './views/authpage.html',
                parent: angular.element(document.body),
                targetEvent: $event,
                clickOutsideToClose:true,
                fullscreen: true// Only for -xs, -sm breakpoints.
            });
        }
        this.showSignUpPrompt = function($event){
            $rootScope.authIndex = 1;
            $mdDialog.show({
                controller: "AuthController",
                controllerAs: "auth",
                templateUrl: './views/authpage.html',
                parent: angular.element(document.body),
                targetEvent: $event,
                clickOutsideToClose:true,
                fullscreen: true// Only for -xs, -sm breakpoints.
            });
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

            //resets UI components//
            this.userToSend = "";
            this.messageToSend = "";
            this.userIDToSend = "";

            //uses the initialization data and updates the UI
            promise.then(function(response){
                theScope.friendList = response;
                $scope.$evalAsync(function(){
                    //Sets the userlist and initializes the UI with notifications
                    UpdateService.setFriendList(theScope.friendList);
                    UpdateService.initializeUI();
                });

                //Saves the data of the current friend you are talking to
                if(UpdateService.getUserToSend() == ""){
                    theScope.userToSend = "Send To..."; 
                }else{
                    //Sets the 
                    console.log(theScope.friendList);
                    theScope.userToSend = theScope.friendList[UpdateService.getUserToSend()].email;
                    theScope.userIDToSend = UpdateService.getUserToSend();
                }
            });

            //sends message to other user
            this.sendMessage = function ($event) {
                if ($event.which === 13) {
                    $event.preventDefault();
                    //prevents send if the message is empty or no user is selected
                    if (!(this.messageToSend == "" || this.userIDToSend == "" || this.userIDToSend == undefined)) {
                        MessageService.sendToServer(this.friendList[this.userIDToSend].email,this.userIDToSend, this.messageToSend);
                        this.messageToSend = "";
                    }
                }
            };
            //when the user clicks on a user to send to
            this.currUserToSend = function(id){
                console.log(id);
                //The id of the user
                this.userIDToSend = id;
                //attachs the name to the UI
                this.userToSend = this.friendList[id].email;
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
