
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
const messaging = firebase.messaging();

(function(){
    
    var app = angular.module('website',[])
    
    app.config(['$interpolateProvider', function($interpolateProvider) {
      $interpolateProvider.startSymbol('{/');
      $interpolateProvider.endSymbol('/}');
    }]);

    app.controller("WebsiteController", function (TokenService) {
        console.log("hello world");
        this.loggedIn = function (isLoggedIn,currentUser) {
            if (isLoggedIn) {
                TokenService.setCurrentUser(currentUser);
                permission = TokenService.requestPermission();
        		if(permission){
        		    token = TokenService.getToken();
        			console.log(token);
        		}
        		TokenService.enableChat();
        	}
        };
    });

    app.controller("MessageController", function (MessageService) {
        this.messageToSend = "";
        this.userToSend = ""; 
        this.userList = "";
        this.sendMessage = function ($event) {
            if ($event.which === 13) {
                $event.preventDefault();
                if (this.messageToSend != "" || this.userToSend != "" ) {
                    var userToSend = $("#userToSend").val();
                    MessageService.sendToServer(userToSend, this.messageToSend);
                    this.messageToSend = "";
                }
            }
        };
        this.currUserToSend = function($event){
            console.log($event.target.id);
            this.userToSend = $event.target.id;
        };
        this.myUserList = function(list){
            console.log(list);
        };
    });
    app.service('MessageService', ['$http', function ($http) {
        messaging.onMessage(function (payload) {
            console.log("Message recieved: ", JSON.stringify(payload.data.message));
            var message = payload.data.message.replace("\n", "&#xA;");
            $("#incomingText").append("Received --> *" + payload.data.username + "* :" + "&#xA;" + message + "&#xA;");
        });
        this.sendToServer = function(username,message){
            var parameters = JSON.stringify({ username: username, message: message })
            $("#incomingText").append("You --> *" + username + "* :" + "&#xA;" + message + "&#xA;");
            $http.post("/sendMessageToUser/",parameters)
                .then(function(response){
                    console.log(response);
                })
                .catch(function(response){
                    console.log(response);
                    //TODO: ERROR MESSAGES
                });
        };
    }]);

    app.service('TokenService', ['$http', function ($http) {
        var currentUser = "";
    	//On the token refresh I want to re asign the token
    	messaging.onTokenRefresh(function(){
    		messaging.getToken()
    			.then(function(refreshedToken){
    				console.log("Token refreshed");
    				setTokenSentToServer(false);
    				sendTokenToServer(refreshedToken);
    			})
    			.catch(function(err){
    				console.log('Unable to retrieve refreshed token ',err);
    			});
    	})

    	var sendTokenToServer = function(currentToken) {
    		//TODO: use setTokenSentToServer
	        if (true) {
	            console.log("Sending token to server...");
	            //TODO Send the current token to server
	            console.log(currentToken);
	            var parameters = JSON.stringify({ token: currentToken, username: currentUser });
	            
	            $http.post("/sendTokenToServer/",parameters)
		            .then(function(response){
		            	console.log(response);
		            })
		            .catch(function(response){
		            	console.log(response);
		            	//TODO: ERROR MESSAGES
		            });

	            setTokenSentToServer(true);
	        } else {
	            console.log("Token already sent to server");
	        }
	    }
    	this.enableChat = function () {
    	    $("textarea").removeAttr("disabled");
    	}
        this.requestPermission = function () {
            messaging.requestPermission().then(function () {
                console.log('Notification permission granted.!!!');
                //Get Token from the server
                messaging.getToken().then(function (currentToken) {
	                if (currentToken) {
	                    //Have a send token to server functionality
	                    sendTokenToServer(currentToken);
	                } else {
	                    console.log("No Instance ID token avialable");
	                }
	            }).catch(function (err) {
	                console.log("Error occured while retrieving token", err);
	            });
            }).catch(function (err) {
                console.log('Unable to get permission to notify', err);
            });
        }
        this.setCurrentUser = function (username) {
            currentUser = username;
        }
        
    }]);

    //TODO: use services, factories, modules and dependencies
    function isTokenSentToServer() {
        if (window.localStorage.getItem('sentToServer') == 1) {
            return true;
        }
        return false;
    }

    function setTokenSentToServer(sent) {
        window.localStorage.setItem('sentToServer', sent ? 1 : 0);
    }

    
})();
