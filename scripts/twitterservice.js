(function(){

    var app = angular.module("twitter-service",["firebase","token-service"]);

    app.service("TwitterService",['$q','$state','$http','TokenService','$rootScope',function($q,$state,$http,TokenService,$rootScope){
        this.twitterLoginPage = function(){
            var deferred = $q.defer();
            var currUser = TokenService.getCurrentUser();
            var parameters = JSON.stringify({ userID : currUser});
            console.log(parameters)
            $http.post("/twitter/",parameters)
                .then(function(response){
                    deferred.resolve(response);
                    var win = window.open('//api.twitter.com/oauth/authenticate?oauth_token='+response.data,"mywindow",'width=560,height=315');
                    if (window.focus) {win.focus()}
                    var twitterRef = firebase.database().ref().child('user_data').child(currUser).child('twitter');
                    twitterRef.on('value',function(snapshot){
                        if(snapshot.val().twitLoggedIn == "true"){
                            twitterRef.off();
                            win.close();
                        }
                    });
                })
                .catch(function(response){
                    deferred.resolve(response);
                    console.log(response);
                });

            return deferred.promise;
        }

        this.makeRequest = function(httpMethod,urlExtension,params=""){
            var deferred = $q.defer();
            var currUser = TokenService.getCurrentUser();
            var twitterRef = firebase.database().ref().child('user_data').child(currUser).child('twitter');
            twitterRef.once('value').then(function(snapshot){
                var twitUserId = snapshot.val().twitUserId
                var parameters = JSON.stringify({ user_id : currUser, httpMethod : httpMethod, urlExtension : urlExtension, params : params});
                $http({
                    method: 'POST',
                    url: '/twitter/request/',
                    data: parameters
                }).then(function(response){
                    if(response.data.error != undefined)
                        deferred.resolve(response.data);
                    else
                        deferred.reject(response.data);
                }).catch(function(response){
                    deferred.reject(response);
                });
            });
            return deferred.promise;
        }
    }]);
    

})();