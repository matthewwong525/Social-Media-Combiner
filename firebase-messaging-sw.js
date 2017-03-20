importScripts('https://www.gstatic.com/firebasejs/3.5.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/3.5.2/firebase-messaging.js');
//importScripts('https://www.gstatic.com/firebasejs/3.5.2/firebase-database.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
firebase.initializeApp({
  'messagingSenderId': '808569769768'
});

const messaging = firebase.messaging();

//TODO: Update notifications in realtime db
messaging.setBackgroundMessageHandler(function (payload) {
    alert(payload);
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    $("#listOfFriends a").each(function(){
        var selector = this;
        var notificationRef = firebase.database().ref().child('notifications').child(currentUser).child(selector.text);
        notificationRef.once('value').then(function(snapshot){
            if(snapshot.val() != null){
                $("#notification-"+selector.text).text(" (" + snapshot.val().notification+")");
            }
        });
    });
});