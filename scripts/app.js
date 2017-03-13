
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

    app.controller("WebsiteController", function (FirebaseService) {
        console.log("hello world");
        this.loggedIn = function (currentUser) {
            if (currentUser != "") {
                FirebaseService.setCurrentUser(currentUser);
        		permission = FirebaseService.requestPermission();
        		if(permission){
        			token = FirebaseService.getToken();
        			console.log(token);
        		}
        	}
        };
        
    });

    app.service('FirebaseService', ['$http', function ($http) {
        var currentUser = "";

    	messaging.onMessage(function(payload){
			console.log("Message recieved: ",payload);
		});
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
	            var parameters = JSON.stringify({ token: currentToken, username: currentUser })
	            
	            $http.post("/sendTokenToServer/"+currentUser,parameters)
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
