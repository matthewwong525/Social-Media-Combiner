
(function(){

    var app = angular.module("authentication-service",["firebase"]);

    app.service("AuthService",["$firebaseAuth","$http","$window", function($firebaseAuth,$http,$window){
        var Auth = $firebaseAuth();
        var currentFbUser;
        //TODO: FRONT END VALIDATION!!!!
        this.createUser = function(theScope,email,password,verify){
            parameters = JSON.stringify({ email: email, password: password, verify: verify });
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
                                currentFbUser = firebaseUser;
                                console.log("User created with uid: " +firebaseUser.uid);
                                $window.location.href="/";
                            })
                            .catch(function(error){
                                //TODO: delete user from database on server
                                console.log(error);
                            });
                        
                    }else{
                        theScope.err_email = response.data.err_email;
                        theScope.err_pass = response.data.err_pass;
                        theScope.err_verify = response.data.err_verify;
                    }
                })
                .catch(function(response){
                    console.log(response);
                    //TODO: ERROR MESSAGES
                });

        };

        this.signInUser = function(theScope,email,password){
            parameters = JSON.stringify({ email: email, password: password});
            console.log(parameters)
            //REDIRECT TO MAIN PAGE AND LOGIN USING FIREBASE AUTH
            Auth.$signInWithEmailAndPassword(email,password)
                .then(function(firebaseUser){
                    console.log("User logged in with uid: " +firebaseUser.uid);
                    currentFbUser=firebaseUser;
                    $window.location.href="/";
                })
                .catch(function(error){
                    console.log(error);
                    theScope.invalidCred = "Invalid Email or Pass"
                });
            
        };

        this.checkLoggedIn= function(){
            console.log(currentFbUser);
            if(currentFbUser == undefined){
                return true;
            }else{
                return false;
            }
        };

        Auth.$onAuthStateChanged(function(firebaseUser){
            currentFbUser=firebaseUser;
        });
        

    }]);

})();