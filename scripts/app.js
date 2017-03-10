
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

    app.controller("WebsiteController",function(){
        console.log("hello world");
        this.loggedIn = function(isLoggedIn){
            alert("hi");
        };
        
    });

})();

function requestPermission(){
    messaging.requestPermission().then(function(){
        console.log('Notification permission granted.');
        getToken();
    }).catch(function(err){
        console.log('Unable to get permission to notify', err);
    });
}

function getToken(){
    messaging.getToken().then(function(currentToken){
        if(currentToken){
            console.log(currentToken);
            //TODO: send token to the server
        }else{
            console.log("No Instance ID token avialable");
        }
    }).catch(function(err){
        console.log("Error occured while retrieving token",err);
    });
}


function isTokenSentToServer() {
    if (window.localStorage.getItem('sentToServer') == 1) {
          return true;
    }
    return false;
  }

function setTokenSentToServer(sent) {
    window.localStorage.setItem('sentToServer', sent ? 1 : 0);
}

function sendTokenToServer(currentToken){
    if(!isTokenSentToServer()){
        console.log("Sending token to server...");
        //TODO Send the current token to server
        setTokenSentToServer(true);
    }else{
        console.log("Token already sent to server");
    }
}