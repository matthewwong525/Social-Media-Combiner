// Initialize Firebase
var config = {
    apiKey: "AIzaSyDi1uj0-1YBfxpNF6L-NFOaFyfzEQo323w",
    authDomain: "mywebapp-123.firebaseapp.com",
    databaseURL: "https://mywebapp-123.firebaseio.com",
    storageBucket: "mywebapp-123.appspot.com",
    messagingSenderId: "808569769768"
};
firebase.initializeApp(config);

(function(){

    var app = angular.module("authentication",["firebase"]);

    app.config(['$interpolateProvider', function($interpolateProvider) {
      $interpolateProvider.startSymbol('{/');
      $interpolateProvider.endSymbol('/}');
    }]);

    app.controller("AuthController",["$firebaseAuth","$http","$window","$scope", function($firebaseAuth,$http,$window,$scope){
        var Auth = $firebaseAuth();
        this.email = "";
        this.username = "";
        this.password = "";
        this.verify = "";
        this.err_email ="";
        this.err_pass = "";
        this.err_verify= "";
        this.createUser = function(){
            parameters = JSON.stringify({ email: this.email, password: this.password, verify: this.verify });
            $http.post("/signup/",parameters)
                .then(function(response){
                    if(response.data.success){
                        //REDIRECT TO MAIN PAGE AND LOGIN USING FIREBASE AUTH
                        Auth.$createUserWithEmailAndPassword(response.data.email,response.data.password)
                            .then(function(firebaseUser){
                                //Update display name as well
                                firebaseUser.updateProfile({
                                    displayName : response.data.username
                                });
                                console.log("User created with uid: " +firebaseUser.uid);
                            })
                            .catch(function(error){
                                //TODO: delete from database on server
                                console.log(error);
                            });
                        //$window.location.href="/";
                    }else{
                        //function(){
                        //FUCK IT JUST CHANGE THE DOM WITH JQUERY
                            $scope.$evalAsync(function(){
                                this.err_email = response.data.err_email;
                                this.err_pass = response.data.err_pass;
                                this.err_verify = response.data.err_verify;
                                console.log(this.err_email+"asdf")
                            });
                        //},true);
                        
                        
                        console.log(this.err_email);
                    }
                })
                .catch(function(response){
                    console.log(response);
                    //TODO: ERROR MESSAGES
                });

        };
        this.signInUser = function(){
            //Auth
        };
        

    }]);

})();