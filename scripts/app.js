
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

    app.controller("MessageController",  function (MessageService) {
        this.messageToSend = "";
        this.userToSend = ""; 
        this.sendMessage = function ($event) {
            if ($event.which === 13) {
                $event.preventDefault();
                if (this.messageToSend != "" || this.userToSend != "" ) {
                    MessageService.sendToServer(this.userToSend, this.messageToSend);
                    this.messageToSend = "";
                }
            }
        };
        this.currUserToSend = function($event){
            console.log($event.target.id);
            $event.preventDefault();
            this.userToSend = $event.target.id;
            MessageService.getMessages(this.userToSend);

        };
    });
    app.service('MessageService', ['$http', 'TokenService','$q', function ($http,TokenService,$q) {
        messaging.onMessage(function (payload) {
            console.log("Message recieved: ", JSON.stringify(payload.data.message));
            var message = payload.data.message.replace("\n", "&#xA;");
            var d = new Date();
            var date= d.getMonth()+"/"+d.getDate()+"/"+d.getFullYear() + " " +d.getHours()+":"+d.getMinutes()+":"+d.getSeconds();
            $("#incomingText").append(date+" *" + payload.data.username + "* :" + "&#xA;" + message + "&#xA;");
        });
        this.sendToServer = function(username,message){
            var parameters = JSON.stringify({ sendUser: TokenService.getCurrentUser(), receiveUser:username, message: message });
            var d = new Date();
            var date= d.getMonth()+1+"/"+d.getDate()+"/"+d.getFullYear() + " " +d.getHours()+":"+d.getMinutes()+":"+d.getSeconds();
            $("#incomingText").append(date+" *" + TokenService.getCurrentUser() + "* :" + "&#xA;" + message + "&#xA;");
            $http.post("/sendMessageToUser/",parameters)
                .then(function(response){
                    console.log(response);
                })
                .catch(function(response){
                    console.log(response);
                    //TODO: ERROR MESSAGES
                });
        };
        //TODO: MAKE AJAX CALL TO SERVER AND GET MESSAGES
        this.getMessages = function(userToSend){

            $http.get("/sendMessageToUser/",
            {
                params:{
                    "sendUser": TokenService.getCurrentUser(),
                    "receiveUser":userToSend}
            })
                .then(function(response){
                    console.log(response);
                    $("#incomingText").text("");
                    for (i = 0;i<response.data.length;i++){
                        //Updates the UI with message data
                        $("#incomingText").append(response.data[i].datesent+" *" + response.data[i].usersent + "* :" + "&#xA;" + response.data[i].message + "&#xA;");
                    }

                })
                .catch(function(response){
                    console.log(response);
                });
        };
    }]);

    app.service('TokenService', ['$http', function ($http) {
        var currentUser = "";
    	//On the token refresh I want to re asign the token
        messaging.onTokenRefresh(function () {
            messaging.getToken()
    			.then(function (refreshedToken) {
    			    console.log("Token refreshed");
    			    setTokenSentToServer(false);
    			    sendTokenToServer(refreshedToken);
    			})
    			.catch(function (err) {
    			    console.log('Unable to retrieve refreshed token ', err);
    			});
        });

        var sendTokenToServer = function (currentToken) {
            //TODO: use setTokenSentToServer
            if (true) {
                console.log("Sending token to server...");
                //TODO Send the current token to server
                var parameters = JSON.stringify({ token: currentToken, username: currentUser });

                $http.post("/sendTokenToServer/", parameters)
		            .then(function (response) {
		                console.log(response);
		            })
		            .catch(function (response) {
		                console.log(response);
		                //TODO: ERROR MESSAGES
		            });

                setTokenSentToServer(true);
            } else {
                console.log("Token already sent to server");
            }
        };
        this.enableChat = function () {
            $("textarea").removeAttr("disabled");
        };
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
        };

        this.setCurrentUser = function (username) {
            currentUser = username;
            console.log("set user: " + currentUser);
        };
        this.getCurrentUser = function () {
            console.log("gettinguser");
            return currentUser;
        };
        
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
