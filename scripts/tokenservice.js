(function(){
    var app = angular.module('token-service',[]);
    app.service('TokenService', ['$http', function ($http) {
        var currentUser = "";
        //On the token refresh I want to re asign the token
        messaging.onTokenRefresh(function () {
            //check if logged in
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