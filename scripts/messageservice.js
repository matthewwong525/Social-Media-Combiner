(function(){
    var app = angular.module('message-service',['token-service','update-service'])
    app.service('MessageService', ['$http', 'TokenService','UpdateService', function ($http,TokenService,UpdateService) {
        var userToSend = "";
        messaging.onMessage(function (payload) {
            console.log("Message recieved: ", JSON.stringify(payload.data.message));
            //If currentUser is not on the user chat
            if(payload.data.username == $("#userToSend").val()){
                var message = payload.data.message.replace("\n", "&#xA;");
                var d = new Date();
                var date= d.getMonth()+"/"+d.getDate()+"/"+d.getFullYear() + " " +d.getHours()+":"+d.getMinutes()+":"+d.getSeconds();
                $("#incomingText").append(date+" *" + payload.data.username + "* :" + "&#xA;" + message + "&#xA;");

            }else{ //send the notification to the user
                //TODO: ALSO MAKE NOTIFICATIONS FROM BACKGROUND MESSAGES
                var notificationRef = UpdateService.setNotification(TokenService.getCurrentUser(),payload.data.username);
                //Updates the UI when the firebase database is updated
                notificationRef.on('value',function(snapshot){
                    if(snapshot.val()){
                        $("#notification-"+payload.data.username).text(" (" + snapshot.val().notification+")");
                    }
                });
            }
        });
        this.sendToServer = function(username,message){
            this.userToSend = username;
            var parameters = JSON.stringify({ sendUser: TokenService.getCurrentUser(), receiveUser:username, message: message });
            var d = new Date();
            var date= d.getMonth()+1+"/"+d.getDate()+"/"+d.getFullYear() + " " +d.getHours()+":"+d.getMinutes()+":"+d.getSeconds();
            $("#incomingText").append(date+" *" + TokenService.getCurrentUser() + "* :" + "&#xA;" + message + "&#xA;");
            $http.post("/sendMessageToUser/",parameters)
                .then(function(response){
                    //sets the notifications for the person who is being sent the message
                    UpdateService.setNotification(username,TokenService.getCurrentUser());
                })
                .catch(function(response){
                    console.log(response);
                    //TODO: ERROR MESSAGES
                });
        };
    }]);

})();