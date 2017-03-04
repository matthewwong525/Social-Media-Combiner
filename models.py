from google.appengine.ext import ndb
from google.appengine.api import memcache
import re
import utils

USER_RE = re.compile(r"^[a-zA-Z0-9_-]{3,20}$")
PASS_RE = re.compile(r"^.{3,20}$")
EMAIL_RE = re.compile(r"^[\S]+@[\S]+.[\S]+$")

class Users(ndb.Model):
    username = ndb.StringProperty(required = True)
    password = ndb.StringProperty(required = True)
    email = ndb.StringProperty(required = True)
    fullname = ndb.StringProperty(required = True)
    datecreate = ndb.DateTimeProperty(auto_now_add=True)

def get_user_error(new_user,errors):
    u_user,u_pass,u_verify,u_email,u_fname = new_user
    err_user,err_pass,err_verify,err_email,err_fname = errors

    if not USER_RE.match(u_user):
        err_user = "Incorrect Username"
    #else:
        #if query.get():
            #err_user = "Username already exists"
    if not PASS_RE.match(u_pass):
        err_pass = "Incorrect Password"
    if not u_pass == u_verify:
        err_verify = "Passwords do not match"
    if not (EMAIL_RE.match(u_email) or u_email == ""):
        err_email = "Incorrect Email Address"
    if u_fname == "":
        err_fname = "A name is required"

    return err_user,err_pass,err_verify,err_email,err_fname

def check_user_error(self,new_user,errors):
    u_user,u_pass,u_verify,u_email,u_fname = new_user
    err_user,err_pass,err_verify,err_email,err_fname = errors

    if err_user == "" and err_pass == "" and err_email=="" and err_verify == "" and err_fname == "":
        self.response.headers.add("Set-Cookie","user_id=%s; Path=/" % utils.make_secret_hash(str(u_user)))
        user = Users(username=u_user,password=utils.make_pw_hash(str(u_pass)),email=u_email,fullname=u_fname)
        user.put()
        self.redirect("/")
    else:
        self.render_signup(u_user,u_email,err_user,err_pass,err_verify,err_email,err_fname)
