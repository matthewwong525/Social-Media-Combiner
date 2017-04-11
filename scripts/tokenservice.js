(function(){
    var app = angular.module('token-service',[]);
    app.service('TokenService', ['$http','$firebaseAuth', function ($http,$firebaseAuth) {
        var currentUser = "";
        //On the token refresh I want to re assign the token
        messaging.onTokenRefresh(function () {
            //gets the current token
            messaging.getToken()
                .then(function (refreshedToken) {
                    console.log("Token refreshed");
                    setTokenSentToServer(false);
                    //sends the token to server which sets the token on db
                    sendTokenToServer(refreshedToken);
                })
                .catch(function (err) {
                    console.log('Unable to retrieve refreshed token ', err);
                });
        });

        var sendTokenToServer = function (currentToken) {
            //TODO: use setTokenSentToServer
            if (true) {
                var parameters = JSON.stringify({ token: currentToken, username: currentUser  });
                //sends the token to the server
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
        //enables the chat by removing disabled attribute
        this.enableChat = function () {
            $("textarea").removeAttr("disabled");
        };

        //requests permission from the user
        this.requestPermission = function () {
            //sends a notification to the user asking if they want to allow notifications
            messaging.requestPermission().then(function () {
                console.log('Notification permission granted.!!!');
                //Get Token from the server
                messaging.getToken().then(function (currentToken) {
                    if (currentToken) {
                        //Sends the token to the server
                        sendTokenToServer(currentToken);
                        console.log(currentToken);
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
        };
        this.getCurrentUser = function () {
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