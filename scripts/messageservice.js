(function(){
    //Used to escape the html
    var entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    function escapeHtml (string) {
      return String(string).replace(/[&<>"'`=\/]/g, function (s) {
        return entityMap[s];
      });
    }

    var app = angular.module('message-service',['token-service','update-service'])
    app.service('MessageService', ['$http', 'TokenService','UpdateService','$firebaseAuth', function ($http,TokenService,UpdateService,$firebaseAuth) {
        //When a message is received from firebase
        messaging.onMessage(function (payload) {
            console.log("Message recieved: ", JSON.stringify(payload.data.message));
            //If the person receiving the message is on chat
            if(payload.data.username == $("#userToSend").attr("send_user_id")){
                //Updates the UI with the message
                var message = payload.data.message.replace("\n", "&#xA;");
                var d = new Date();
                var date= d.getMonth()+"/"+d.getDate()+"/"+d.getFullYear() + " " +d.getHours()+":"+d.getMinutes()+":"+d.getSeconds();
                //TODO: CHANGE CURRENT USER TO DISPLAYNAME OR EMAIL
                $("#incomingText").append(date+" *" + escapeHtml($("#userToSend").attr("placeholder")) + "* :" + "&#xA;" + escapeHtml(message)  + "&#xA;");
            }else{ //send the notification to the user
                //TODO: ALSO MAKE NOTIFICATIONS FROM BACKGROUND MESSAGES
                var notificationRef = UpdateService.setNotification(TokenService.getCurrentUser(),payload.data.username);
                //Updates the UI when the firebase database is updated with the notification
                notificationRef.on('value',function(snapshot){
                    if(snapshot.val()){
                        $("#notification-"+payload.data.username).text(" (" + snapshot.val().notification+")");
                    }
                });
            }
        });
        //when a person wants to send a message to the server
        this.sendToServer = function(currUser,username,message){
            //puts the data into a json string
            var parameters = JSON.stringify({ sendUser: TokenService.getCurrentUser(), receiveUser:username, message: message });
            var d = new Date();
            var date= d.getMonth()+1+"/"+d.getDate()+"/"+d.getFullYear() + " " +d.getHours()+":"+d.getMinutes()+":"+d.getSeconds();
            //TODO: CHANGE CURRENT USER TO DISPLAYNAME OR EMAIL 
            //Updates the UI with the message being sent
            $("#incomingText").append(date+" *" + currUser + "* :" + "&#xA;" + escapeHtml(message) + "&#xA;");
            //makes a post request to the message handler
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