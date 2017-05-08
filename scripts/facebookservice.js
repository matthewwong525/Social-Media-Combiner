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
                          appId      : '1646450122046674',
                          xfbml      : true,
                          version    : 'v2.9'
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
            },{scope:'user_posts'}); //scope is for extra permissions
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
            var accessTokenRef = firebase.database().ref().child('user_data').child(currUser).child('facebook');
            //takes arguments and converts it to an array
            var body = [].slice.call(arguments); 
            accessTokenRef.once('value').then(function(snapshot){
                //if an access token exists, use the access token and call the API with the arguments
               if(snapshot.val() && snapshot.val().fbAccessToken){
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
            var accessTokenRef = firebase.database().ref().child('user_data').child(currUser).child('facebook');
            accessTokenRef.once('value').then(function(snapshot){
                //sets the userID, accesstoken, and expirytime to the firebase database
                accessTokenRef.update({
                    fbAccessToken: responseObj.accessToken,
                    fbUserID: responseObj.userID,
                    fbexpireTime: responseObj.expiresIn
                });
            });
        };
        this.sanitizePosts = function(post){
            var listOfPosts = [];
            var mediaList = [];
            for(let i=0;i<post.length;i++){
                var sanitizedPost = {};
                sanitizedPost["media"] = "facebook";
                sanitizedPost["id"] = post[i][1].body.id;
                sanitizedPost["post_url"] = "//facebook.com/" + post[i][1].body.id;
                sanitizedPost["user"] = {
                    "id": post[i][0].body.id,
                    "name": post[i][0].body.name,
                    "screen_name": ""
                };
                sanitizedPost["story"] = post[i][1].body.story;
                sanitizedPost["created_at"] = post[i][1].body.created_time;
                sanitizedPost["epoch_time"] = new Date(post[i][1].body.created_time).getTime();
                sanitizedPost["body"] = post[i][1].body.message;
                sanitizedPost["reactions"] = {
                    "media_name": "Reactions",
                    "count": post[i][3].body.data.length,
                    "recent_likes": post[i][3].body.data
                };
                sanitizedPost["comments"] = {
                    "media_name": "Comments",
                    "count": post[i][2].body.data.length,
                    "recent_comments": post[i][2].body.data
                };
                sanitizedPost["shares"] = {
                    "media_name": "Shares",
                    "count":post[i][4].body.data.length,
                    "recent_shares": post[i][4].body.data
                };
                for(let j=0;j<post[i][5].body.data.length;j++){
                    var mediaDic = {};
                    mediaDic["media_url"] = post[i][5].body.data[j].media.image.src;
                    mediaDic["url"] = post[i][5].body.data[j].target.url;
                    mediaDic["id"] = post[i][5].body.data[j].target.id;
                    mediaList.push(mediaDic);
                }
                sanitizedPost["attachments"] = {
                    "count": post[i][5].body.data.length,
                    "media" : mediaList
                };
                listOfPosts.push(sanitizedPost);
                mediaList = [];
            }
            return listOfPosts;
        };

    }]);
})();