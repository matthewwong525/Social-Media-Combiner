
(function(){

    var app = angular.module("authentication-service",["firebase"]);

    app.service("AuthService",["$firebaseAuth","$http","$window", function($firebaseAuth,$http,$window){
        var Auth = $firebaseAuth();
        //TODO: FRONT END VALIDATION!!!!
        this.currentFbUser;
        this.createUser = function(theScope,email,password,verify){

            Auth.$createUserWithEmailAndPassword(email,password)
                .then(function(firebaseUser){
                    parameters = JSON.stringify({ username: firebaseUser.uid,email: email, password: password, verify: verify });
                    $http.post("/signup/",parameters)
                        .then(function(response){
                            console.log("updated db")
                            this.currentFbUser = firebaseUser;
                            console.log("User created with uid: " +firebaseUser.uid);
                            $window.location.href="/";
                        })
                        .catch(function(response){
                            console.log(response);
                            //TODO: ERROR MESSAGES
                        });
                    
                })
                .catch(function(error){
                    //TODO: delete user from database on server
                    console.log(error);
                });


        };

        this.signInUser = function(theScope,email,password){
            parameters = JSON.stringify({ email: email, password: password});
            console.log(parameters)
            //REDIRECT TO MAIN PAGE AND LOGIN USING FIREBASE AUTH
            Auth.$signInWithEmailAndPassword(email,password)
                .then(function(firebaseUser){
                    console.log("User logged in with uid: " +firebaseUser.uid);
                    this.currentFbUser=firebaseUser;
                    $window.location.href="/";
                })
                .catch(function(error){
                    console.log(error);
                    theScope.invalidCred = "Invalid Email or Pass";
                });
            
        };

        this.getFirebaseUser = function(){
            console.log(this.currentFbUser)
            return this.currentFbUser;

        }

        this.checkLoggedIn= function(){
            return Auth.$requireSignIn();
        };
        Auth.$onAuthStateChanged(function(firebaseUser){
            this.currentFbUser = firebaseUser;
            console.log(this.currentFbUser);
        });

        
        

    }]);

})();