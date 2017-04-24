(function(){

    var app = angular.module("facebook-service",["firebase","token-service"]);

    app.service("FBService",['$q','$state','$http','TokenService','$rootScope',function($q,$state,$http,TokenService,$rootScope){
        //Initializes facebook API (copy pasted)
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
        //checks if a person is currently logged in and returns a promise
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
        //Attempts to login and returns a promise
        this.fbTryLogIn = function(){
            var deferred = $q.defer();
            FB.login(function(response){
                deferred.resolve(response);
            },{scope:'publish_actions,user_posts'}); //scope is for extra permissions
            return deferred.promise;
        };
        //Makes a request to the API with a specified url
        this.fbApiRequest = function(url){
            var deferred = $q.defer();
            FB.api(
                url,
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
        //Groups the lists togther based on the current index.
        this.groupByIndex = function(returnBody){
            var newReturnBody = [];
            for (var i = 0; i < returnBody[0].data.length;i++){
                var tempList = [];
                for(var j = 0 ; j < returnBody.length;j++){
                    if(returnBody[j].data[i] != undefined){
                        returnBody[j].data[i].body = JSON.parse(returnBody[j].data[i].body);
                        tempList.push(returnBody[j].data[i]);
                    }
                }
                newReturnBody.push(tempList);
            }
            return newReturnBody;
        };
        //a function used to facilitate the batchrequest
        var httpBatchReq = function(batchRequest){
            var httpPromise = $http({
              url: 'https://graph.facebook.com',
              method: 'POST',
              params: batchRequest, // Make sure to inject the service you choose to the controller
              paramSerializer : '$httpParamSerializerJQLike',
            })
            return httpPromise;
        };

        //Make a batched request to the facebook API
        this.fbBatchRequest = function(){
            //gets current user
            var currUser = TokenService.getCurrentUser();
            //creates deferred promise
            var deferred = $q.defer();
            //points to database where the access token lies
            var accessTokenRef = firebase.database().ref().child('user_data').child(currUser);
            //takes arguments and converts it to an array
            var body = [].slice.call(arguments); 
            accessTokenRef.once('value').then(function(snapshot){
                //if an access token exists, use the access token and call the API with the arguments
               if(snapshot.val().fbAccessToken){
                    var accessToken = snapshot.val().fbAccessToken;
                    var requestArr = [];
                    //pushes multiple http requests to the request array
                    for(let i = 0; i < body.length;i++){
                        let batchRequest = {};
                        batchRequest["access_token"] = accessToken;
                        batchRequest["batch"] = JSON.stringify(body[i]);
                        requestArr.push(httpBatchReq(batchRequest));
                    }
                    //when all the batch requests finish
                    $q.all(requestArr).then(function(response){
                        //TODO: CHECK IF IT IS SUCCESSFUL by checking if the "SUCCESS: TRUE" for all objects returned
                        deferred.resolve(response);
                    });
                }else{
                    deferred.reject("fbAccessToken does not exist");
                }
            }).catch(function(response){
                deferred.reject(response);
                
            });
            return deferred.promise;
        }
        //stores the access token into the database
        this.storeAccessToken = function(responseObj){
            var currUser = TokenService.getCurrentUser();
            var accessTokenRef = firebase.database().ref().child('user_data').child(currUser);
            accessTokenRef.once('value').then(function(snapshot){
                //sets the userID, accesstoken, and expirytime to the firebase database
                accessTokenRef.set({
                    fbAccessToken: responseObj.accessToken,
                    fbUserID: responseObj.userID,
                    fbexpireTime: responseObj.expiresIn
                });
            });
        };

    }]);
})();