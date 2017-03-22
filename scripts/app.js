
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
    
    var app = angular.module("website",['firebase','token-service','update-service','message-service']);
    
    app.config(['$interpolateProvider', function($interpolateProvider) {
      $interpolateProvider.startSymbol('{/');
      $interpolateProvider.endSymbol('/}');
    }]);

    app.controller("WebsiteController",['TokenService','UpdateService', function (TokenService,UpdateService) {
        console.log("hello world");
        this.loggedIn = function (isLoggedIn,currentUser) {
            if (isLoggedIn) {
                TokenService.setCurrentUser(currentUser);
                permission = TokenService.requestPermission();
                UpdateService.initializeUI();
        		TokenService.enableChat();
        	}
        };
    }]);

    app.controller("MessageController",['MessageService','UpdateService',  function (MessageService,UpdateService) {
        this.messageToSend = "";
        this.userToSend = ""; 
        this.sendMessage = function ($event) {
            if ($event.which === 13) {
                $event.preventDefault();
                console.log(this.userToSen==undefined);
                //prevents send if the message is empty or no user is selected
                if (!(this.messageToSend == "" || this.userToSend == "" || this.userToSend == undefined)) {
                    MessageService.sendToServer(this.userToSend, this.messageToSend);
                    this.messageToSend = "";
                }
            }
        };
        this.currUserToSend = function($event){
            console.log($event.target.id);
            $event.preventDefault();
            this.userToSend = $event.target.id;
            UpdateService.setUserToSend(this.userToSend);
            UpdateService.initializeUI();
        };
    }]);

    

    

    

    
})();
