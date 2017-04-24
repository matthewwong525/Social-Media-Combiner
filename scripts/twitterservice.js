(function(){

    var app = angular.module("twitter-service",["firebase","token-service"]);

    app.service("TwitterService",['$q','$state','$http','TokenService','$rootScope',function($q,$state,$http,TokenService,$rootScope){
        this.twitterLoginPage = function(){
            var deferred = $q.defer();
            $http.post("/twitter")
                .then(function(response){
                    console.log(response);
                    deferred.resolve(response);
                    var win = window.open('//api.twitter.com/oauth/authenticate?'+response.data,"mywindow",'width=560,height=315');
                    if (window.focus) {win.focus()}
                    return false;
                })
                .catch(function(response){
                    deferred.resolve(response);
                    console.log(response);
                });

            return deferred.promise;
        }
    }]);
    

})();