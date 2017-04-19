
(function(){

    var app = angular.module("authentication-service",["firebase"]);

    app.service("AuthService",["$firebaseAuth","$http","$window","$q", function($firebaseAuth,$http,$window,$q){
        //Gets the authentication from angularfire
        var Auth = $firebaseAuth();
        this.currentFbUser;

        //creates a user on firebase
        this.createUser = function(theScope,email,password,verify){
            //creates a deferred promise
            var deferred = $q.defer();
            //creates a user with email and password
            Auth.$createUserWithEmailAndPassword(email,password)
                .then(function(firebaseUser){
                    parameters = JSON.stringify({ username: firebaseUser.uid,email: email, password: password, verify: verify });
                    //makes a post request to store the created user into the database
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
                            //TODO: delete user from database on server
                        });
                    deferred.resolve("");
                })
                .catch(function(error){
                    //sets the error messages in the promise
                    console.log(error);
                    deferred.resolve(error.message);
                });
            return deferred.promise;
        };

        //allows a user to edit there profile
        this.editProfile = function(currentAuth,newDisplayName){
            //updates the displayname
            currentAuth.updateProfile({
                displayName : newDisplayName
            }).then(function(response){
                console.log(response);
                //TODO: update database displayname
                //On success redirects to the main page
                $window.location.href="/";
            }).catch(function(response){
                console.log(response);
            });
        };

        this.signInUser = function(theScope,email,password){
            //creates a deferred promise
            var deferred = $q.defer();
            //Logs into the website through firebase auth
            Auth.$signInWithEmailAndPassword(email,password)
                .then(function(firebaseUser){
                    //logs in and sets the current firebase user
                    console.log("User logged in with uid: " +firebaseUser.uid);
                    this.currentFbUser=firebaseUser;
                    $window.location.href="/";
                    deferred.resolve("");
                })
                .catch(function(error){
                    console.log(error);
                    deferred.resolve(error.message);
                });
            return deferred.promise;
        };
        //gets current firebase user
        this.getFirebaseUser = function(){
            return this.currentFbUser;
        };
        //sets current firebase user
        this.setFirebaseUser = function(firebaseUser){
            this.currentFbUser = firebaseUser;
        };

        //on auth change, it changes the current user to the new user, whether or not it is null
        Auth.$onAuthStateChanged(function(firebaseUser){
            this.currentFbUser = firebaseUser;
            console.log(this.currentFbUser);
        });
    }]);
    //returns the $firebaseAuth object used for state intialization
    app.factory("Auth", ["$firebaseAuth",
      function($firebaseAuth) {
        return $firebaseAuth();
      }
    ]);

})();