(function(){

    var app = angular.module("facebook-service",["firebase"]);

    app.service("FBService",['$q','$state',function($q,$state){
        
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
        }
        this.fbTryLogIn = function($state){
            var deferred = $q.defer();
            FB.login(function(response){
                deferred.resolve(response);
            },{scope:'publish_actions,user_posts'});
            return deferred.promise;
        }
        this.fbGetFeed = function(){
            var deferred = $q.defer();
            FB.api(
                "/me/home",
                function(response){
                    if(response && !response.error){
                        deferred.resolve(response);
                    }else{
                        deferred.reject(response)
                    }
                }
            )
            return deferred.promise;
        }

    }]);

    app.factory("FBFactory",['$q',function($q){
    }]);
})();