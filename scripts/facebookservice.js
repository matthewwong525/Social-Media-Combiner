(function(){

    var app = angular.module("facebook-service",["firebase","token-service"]);

    app.service("FBService",['$q','$state','$http','TokenService',function($q,$state,$http,TokenService){
        
        this.fbInit = function(){
            if(window.FB == undefined || window.FB == null){
                var deferred = $q.defer();
            
                window.fbAsyncInit = function() {
                    deferred.resolve(
                        FB.init({
                          appId      : '1333544743350684',
                          xfbml      : true,
                          version    : 'v2.8'
                        })
                    
                    );
                    FB.AppEvents.logPageView();
                    console.log("fb init done");
                };
                (function(d, s, id){
                 var js, fjs = d.getElementsByTagName(s)[0];
                 if (d.getElementById(id)) {return;}
                 js = d.createElement(s); js.id = id;
                 js.src = "//connect.facebook.net/en_US/sdk.js";
                 fjs.parentNode.insertBefore(js, fjs);
               }(document, 'script', 'facebook-jssdk'));
                return deferred.promise;
            }
        }
        this.fbIsLoggedIn = function(){
            var deferred = $q.defer();
            FB.getLoginStatus(function(response){
                if(response.status == "connected")
                    deferred.resolve(response);
                else
                    deferred.resolve(response);
            });
            return deferred.promise;
        };
        this.fbTryLogIn = function($state){
            var deferred = $q.defer();
            FB.login(function(response){
                deferred.resolve(response);
            },{scope:'publish_actions,user_posts'});
            return deferred.promise;
        };
        this.fbGetFeed = function(){
            var deferred = $q.defer();
            FB.api(
                "/me/feed",
                function(response){
                    if(response && !response.error){
                        deferred.resolve(response);
                    }else{
                        deferred.reject(response);
                    }
                }
            )
            return deferred.promise;
        };
        this.fbGetPost = function(post_id){
            var deferred = $q.defer();
            FB.api(
                "/"+post_id,
                function(response){
                    if(response && !response.error){
                        deferred.resolve(response);
                    }else{
                        deferred.reject(response);
                    }
                }
            );
            return deferred.promise;
        }
        var httpBatchReq = function(batchRequest){
            var httpPromise = $http({
              url: 'https://graph.facebook.com',
              method: 'POST',
              params: batchRequest, // Make sure to inject the service you choose to the controller
              paramSerializer : '$httpParamSerializerJQLike',
            })
            return httpPromise;
        };

        //TODO: USE AN INTERCEPTOR TO RETRIEVE THE RESLTS BEFORE THEY GET EXECUTED, THEN USE A CLOSURE http://plnkr.co/edit/xjJH1rdJyB6vvpDACJOT?p=preview; http://stackoverflow.com/questions/23021416/how-to-use-angularjs-interceptor-to-only-intercept-specific-http-requests
        this.fbBatchRequest = function(body,isMultiBatchReq=false){
            var currUser = TokenService.getCurrentUser();
            var deferred = $q.defer();
            var accessTokenRef = firebase.database().ref().child('user_data').child(currUser);
            accessTokenRef.once('value').then(function(snapshot){
                if(!isMultiBatchReq){
                    if(snapshot.val().fbAccessToken){
                        var accessToken = snapshot.val().fbAccessToken;
                        var batchRequest = {};
                        batchRequest["batch"] = JSON.stringify(body);
                        batchRequest["access_token"] = accessToken;
                        console.log(batchRequest);
                        $http({
                          url: 'https://graph.facebook.com',
                          method: 'POST',
                          params: batchRequest, // Make sure to inject the service you choose to the controller
                          paramSerializer : '$httpParamSerializerJQLike',
                        }).then(function(response) { deferred.resolve(response); });
                    }else{
                        deferred.reject("fbAccessToken does not exist");
                    }
                }else{
                    var accessToken = snapshot.val().fbAccessToken;
                    var batchRequest = {};
                    var requestArr = [];
                    var bodyArr = [];
                    batchRequest["access_token"] = accessToken;
                    for(var i = 0; i < body.length;i++){
                        batchRequest["batch"] = JSON.stringify(body[i]);
                        bodyArr.push(batchRequest);
                        console.log(bodyArr[i]);
                        requestArr.push(httpBatchReq(bodyArr[i]));
                    }
                    $q.all(requestArr).then(function(response){
                        deferred.resolve(response);
                    });
                }
                
            }).catch(function(response){
                deferred.reject(response);
                
            });
            return deferred.promise;
        }
        this.storeAccessToken = function(responseObj){
            var currUser = TokenService.getCurrentUser();
            var accessTokenRef = firebase.database().ref().child('user_data').child(currUser);
            accessTokenRef.once('value').then(function(snapshot){
                accessTokenRef.set({
                    fbAccessToken: responseObj.accessToken,
                    fbUserID: responseObj.userID,
                    fbexpireTime: responseObj.expiresIn
                });
            });
        }

    }]);

    app.factory("FBFactory",['$q',function($q){
    }]);
})();