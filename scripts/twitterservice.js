(function(){

    var app = angular.module("twitter-service",["firebase","token-service"]);

    app.service("TwitterService",['$q','$state','$http','TokenService','$rootScope',function($q,$state,$http,TokenService,$rootScope){
        //Activates the login page for twitter
        this.twitterLoginPage = function($state,twitterError = undefined){
            if(twitterError == undefined){
                //initialize some variables and parameters
                var currUser = TokenService.getCurrentUser();
                var parameters = JSON.stringify({ userID : currUser});
                console.log(parameters)
                //makes post request to server endpoint that gets the user tokens and secrets
                $http.post("/twitter/",parameters)
                    .then(function(response){
                        //opens a new window
                        var win = window.open('https://api.twitter.com/oauth/authenticate?oauth_token='+response.data,"mywindow",'width=560,height=315');
                        if (window.focus) {win.focus()}

                        //makes a firebase request and checks if the server has set the login status of the user to true
                        var twitterRef = firebase.database().ref().child('user_data').child(currUser).child('twitter');
                        twitterRef.on('value',function(snapshot){
                            if(snapshot.val().twitLoggedIn == "true"){
                                //Turns off the reference, closes the window and refreshes the page
                                twitterRef.off();
                                win.close();
                                $state.reload();
                            }
                        });
                    })
                    .catch(function(response){
                        console.log(response);
                    });
            }else{
                console.log(twitterError);
            }
        }
        //makes a request to the twitter servers through the server
        this.makeRequest = function(httpMethod,urlExtension,params=""){
            //initializes some variables
            var deferred = $q.defer();
            var currUser = TokenService.getCurrentUser();
            var twitterRef = firebase.database().ref().child('user_data').child(currUser).child('twitter');
            //makes a request to firebase for the twitter token
            twitterRef.once('value').then(function(snapshot){
                //creates the parameters
                var parameters = JSON.stringify({ user_id : currUser, httpMethod : httpMethod, urlExtension : urlExtension, params : params});
                //makes a post request to the server to make the call to twitters' endpoints
                $http({
                    method: 'POST',
                    url: '/twitter/request/',
                    data: parameters
                }).then(function(response){
                    //if there are no errors in the response
                    if(response.data.errors == undefined)
                        deferred.resolve(response.data);
                    else
                        deferred.reject(response);
                }).catch(function(response){
                    deferred.reject(response);
                });
            });
            return deferred.promise;
        }

        this.sanitizePosts = function(post){
            console.log(post)
            var listOfPosts = [];
            var mediaList = [];
            var mediaCount = 0;
            for(let i=0;i<post.length;i++){
                var sanitizedPost = {};
                sanitizedPost["media"] = "twitter";
                sanitizedPost["id"] = post[i].id_str;
                sanitizedPost["post_url"] = "https://www.twitter.com/" + post[i].user.screen_name + "/status/" + post[i].id_str;
                sanitizedPost["user"] = {
                    "id": post[i].user.id_str,
                    "name": post[i].user.name,
                    "screen_name": post[i].user.screen_name
                };
                sanitizedPost["story"] = "";
                sanitizedPost["created_at"] = post[i].created_at;
                sanitizedPost["epoch_time"] = new Date(post[i].created_at).getTime();
                sanitizedPost["body"] = post[i].text;
                sanitizedPost["reactions"] = {
                    "media_name": "Favourites",
                    "count": post[i].favorite_count
                };
                sanitizedPost["comments"] = {
                    "media_name": "Replies",
                    "count": "0",
                    "recent_comments": []
                };
                sanitizedPost["shares"] = {
                    "media_name": "Retweets",
                    "count":post[i].retweet_count
                };
                if(post[i].entities.media != undefined){
                    for(let j=0;j<post[i].entities.media.length;j++){
                        var mediaDic = {};
                        mediaDic["media_url"] = post[i].entities.media[j].media_url;
                        mediaDic["url"] = post[i].entities.media[j].media;
                        mediaDic["id"] = post[i].entities.media[j].id;
                        mediaList.push(mediaDic);
                    }
                    mediaCount = post[i].entities.media.length
                }
                
                sanitizedPost["attachments"] = {
                    "count": mediaCount,
                    "media" : mediaList
                };
                listOfPosts.push(sanitizedPost);
                mediaList=[];
            }
            return listOfPosts;
        };
    }]);
    

})();