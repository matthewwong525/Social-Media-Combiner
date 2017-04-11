
(function(){

    var app = angular.module("authentication-service",["firebase"]);

    app.service("AuthService",["$firebaseAuth","$http","$state", function($firebaseAuth,$http,$state){
        //Gets the authentication from angularfire
        var Auth = $firebaseAuth();
        this.currentFbUser;

        //creates a user on firebase
        this.createUser = function(theScope,email,password,verify){
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
                            $state.go("home");
                        })
                        .catch(function(response){
                            console.log(response);
                            //TODO: ERROR MESSAGES
                            //TODO: delete user from database on server
                        });
                    
                })
                .catch(function(error){
                    console.log(error);
                });
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
                $state.go("home");
            }).catch(function(response){
                console.log(response);
            });
        };

        this.signInUser = function(theScope,email,password){
            //Logs into the website through firebase auth
            Auth.$signInWithEmailAndPassword(email,password)
                .then(function(firebaseUser){
                    //logs in and sets the current firebase user
                    console.log("User logged in with uid: " +firebaseUser.uid);
                    this.currentFbUser=firebaseUser;
                    $state.go("home");
                })
                .catch(function(error){
                    console.log(error);
                    theScope.invalidCred = "Invalid Email or Pass";
                });
            
        };
        //gets current firebase user
        this.getFirebaseUser = function(){
            return this.currentFbUser;
        }

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