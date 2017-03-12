from google.appengine.ext import ndb
from google.appengine.api import memcache
import re
import logging
import utils

USER_RE = re.compile(r"^[a-zA-Z0-9_-]{3,20}$")
PASS_RE = re.compile(r"^.{3,20}$")
EMAIL_RE = re.compile(r"^[\S]+@[\S]+.[\S]+$")

#TODO: Make a cache for everything

class Users(ndb.Model):
    username = ndb.StringProperty(required = True)
    password = ndb.StringProperty(required = True)
    email = ndb.StringProperty(required = True)
    fullname = ndb.StringProperty(required = True)
    token = ndb.StringProperty()
    datecreate = ndb.DateTimeProperty(auto_now_add=True)

def user_cache(update=False):
    key = "users"
    memGet = memcache.get(key)
    ancestor = ndb.Key('user_parent','parent')
    if update:
        #logging.info(ancestor)
        queryUser = ndb.gql("SELECT * FROM Users WHERE ANCESTOR IS :1 ",ancestor)
        queryUser = list(queryUser)
        if queryUser:
            content = queryUser
        else:
            content = None
        memcache.set(key,content)
    else:
        content = memGet
    return content


def get_user_error_signup(new_user,errors):
    #TODO: check same email and same user in database
    u_user,u_pass,u_verify,u_email,u_fname = new_user
    err_user,err_pass,err_verify,err_email,err_fname = errors

    content = user_cache()
    queryUser = check_user_in_cache(u_user,content)


    if not USER_RE.match(u_user):
        err_user = "Incorrect Username"
    elif queryUser:
        err_user = "Username already exists"
    if not PASS_RE.match(u_pass):
        err_pass = "Incorrect Password"
    if not u_pass == u_verify:
        err_verify = "Passwords do not match"
    if not (EMAIL_RE.match(u_email) or u_email == ""):
        err_email = "Incorrect Email Address"
    if u_fname == "":
        err_fname = "A name is required"

    return err_user,err_pass,err_verify,err_email,err_fname

def signup_user_check(self,new_user,errors):
    u_user,u_pass,u_verify,u_email,u_fname = new_user
    err_user,err_pass,err_verify,err_email,err_fname = errors

    if err_user == "" and err_pass == "" and err_email=="" and err_verify == "" and err_fname == "":
        self.response.headers.add("Set-Cookie","user_id=%s; Path=/" % utils.make_secret_hash(str(u_user)))
        update_userdata(new_user)
        self.redirect("/")
    else:
        self.render_signup(u_user,u_email,u_fname,err_user,err_pass,err_verify,err_email,err_fname)

#TODO:add transactions
#TODO:make it so that it updates the cache directly by appending to it and database
#after signup this function updates the cache and database
def update_userdata(new_user):
    u_user,u_pass,u_verify,u_email,u_fname = new_user
    parent_key = ndb.Key('user_parent','parent')
    user = Users(parent=parent_key,username=u_user,password=utils.make_pw_hash(str(u_pass)),email=u_email,fullname=u_fname)
    #user.key = ndb.Key(Users,u_user)
    user.put()
    user_cache(update=True)

#check the credentials on login
def check_creds(u_user,u_pass):
    content = user_cache()
    queryUser = check_user_in_cache(u_user,content)
    logging.info(content)
    if queryUser and utils.verify_pw_hash(u_pass,str(queryUser.password)):
        return True
    else:
        return False

#checks if the user is in the cache and if the cache is empty(True if user exists, false if it does not exist)
def check_user_in_cache(u_user,content):
    specific_user = None
    if content:
        for users in content:
            if u_user in users.username:
                specific_user = users
                break
    else:
        specific_user = None
    return specific_user
