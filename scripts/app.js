
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

messaging.requestPermission().then(function(){
    console.log('Notification permission granted.');
    messaging.getToken();
})

.catch(function(err){
    console.log('Unable to get permission to notify', err);
});

messaging.getToken().then(function(currentToken){
    if(currentToken){
        console.log(currentToken);
    }else{
        console.log("No Instance ID token avialable");
    }
})
.catch(function(err){
    console.log("Error occured while retrieving token",err);
});