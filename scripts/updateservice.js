(function(){
    var app = angular.module('update-service',['token-service'])
    app.service('UpdateService',['TokenService','$http', '$q', '$firebaseAuth', function(TokenService,$http,$q,$firebaseAuth){
        var userToSend = "";
        var friendList = {};
        //sets the notification in the db
        this.setNotification = function(currUser,sendUser){
            var notificationRef = firebase.database().ref().child('notifications').child(currUser).child(sendUser);
            notificationRef.once('value').then(function(snapshot){
                //if the notification value does not exist
                if(snapshot.val() === null){
                    notificationRef.set({
                        notification: 1,
                        sentFrom: sendUser
                    });
                //if the notification exists add to the notification
                }else{
                    var newNotificationVal = snapshot.val().notification+1;
                    notificationRef.set({
                        notification: newNotificationVal,
                        sentFrom: sendUser
                    });
                }
            })
            .catch(function(response){
                console.log(response)
            });
            return notificationRef;
        };
        //Initializes all the notifications on the friends list
        var initializeNotification = function(){
            if(TokenService.getCurrentUser() != "" && TokenService.getCurrentUser() != undefined){
                //TODO: LOOP THROUGH NG REPEAT
                for(var key in friendList){
                    if(!friendList.hasOwnProperty(key)) continue;
                    var notificationRef = firebase.database().ref("/notifications/" + TokenService.getCurrentUser()+ "/" + key);
                    notificationRef.once('value').then(function(snapshot){
                        if(snapshot.val() != null){
                            $("#notification-"+snapshot.val().sentFrom).text(" (" + snapshot.val().notification+")");
                        }
                    }).catch(function(response){
                        console.log(response);
                    });
                }
            }
            
        };
        //gets the messages from the database based on the username
        //change so it stores the messages everytime you initialize or refresh
        var getMessages = function(username){
            $http.get("/sendMessageToUser/",
            {
                params:{
                    "sendUser": TokenService.getCurrentUser(),
                    "receiveUser":username
                }
            })
                .then(function(response){
                    console.log(response);
                    $("#incomingText").text("");
                    for (i = 0;i<response.data.length;i++){
                        //Updates the UI with message data
                        $("#incomingText").append(response.data[i].datesent+" *" + response.data[i].usersent + "* :" + "&#xA;" + response.data[i].message + "&#xA;");
                    }
                    //Set notification on UI to nothing and remove the notification from database
                    $("#notification-"+username).text("");
                     var postListRef = firebase.database().ref().child('notifications').child(TokenService.getCurrentUser()).child(username);
                     postListRef.remove();
                })
                .catch(function(response){
                    console.log(response);
                });
        };


        var updateUI = function(){
            //Updates notifications and messages on focus when unfocused
            initializeNotification();
            console.log(userToSend);
            if(!(userToSend == "" || userToSend == undefined)){
                getMessages(userToSend);
            }
        };
        $(window).focus(function(){
            //Updates notifications and messages on focus when unfocused
            //TODO: MAKE IT SO IT IS ONLY FOR THE STATE IN THE MESSAGING
            updateUI();
        });

        this.initializeUI = function(){
            //Updates notifications and messages when everything is refreshed
            updateUI();
        };

        this.setUserToSend = function(username){
            userToSend = username;
        };
        this.setFriendList = function(listOfFriends){
            friendList = listOfFriends;
        }

        this.initializeData = function(){
            var data = "";
            var deferred = $q.defer();
            $http.post("/")
                .then(function(response){
                    console.log(response);
                    return deferred.resolve(response.data);
                })
                .catch(function(response){
                    console.log(response);
                    defer.reject(response);
                });
            return deferred.promise;
        };
        
    }]);

})();