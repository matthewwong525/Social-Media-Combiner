from google.appengine.ext import ndb
from google.appengine.api import memcache
import re
import logging
import json
import utils

#TODO: MAKE EMAIL .SOMETHING MATCH FOR 2 OR MORE CHARACTERS
USER_RE = re.compile(r"^[a-zA-Z0-9_-]{3,20}$")
PASS_RE = re.compile(r"^.{6,20}$")
EMAIL_RE = re.compile(r"^[\S]+@[\S]+.[\S]+$")

#TODO: Make a cache for everything

class Users(ndb.Model):
    username = ndb.StringProperty()
    password = ndb.StringProperty(required = True)
    email = ndb.StringProperty(required = True)
    fullname = ndb.StringProperty()
    token = ndb.StringProperty()
    datecreate = ndb.DateTimeProperty(auto_now_add=True)

def user_cache(update=False,updateContent=None):
    key = "users"
    memGet = memcache.get(key)
    ancestor = ndb.Key('user_parent','parent')
    if update:
        if updateContent == None:
            logging.info("beginning db check")
            queryUser = ndb.gql("SELECT * FROM Users WHERE ANCESTOR IS :1 ",ancestor)
            queryUser = list(queryUser)
            if queryUser:
                content = queryUser
            else:
                content = None
        else:
            content = updateContent
        memcache.set(key,content)
    else:
        content = memGet
    return content


#TODO:add transactions
#TODO:make it so that it updates the cache directly by appending to it and database
#after signup this function updates the cache and database
def create_new_userdata(new_user):
    u_user,u_pass,u_verify,u_email = new_user
    parent_key = ndb.Key('user_parent','parent')
    #ID = Users.get_or_insert('newUserID',username='0',email="RandomEmail@RandomEmail.RandomEmail",password="RandomPassword")
    user = Users(username=u_user,id=u_email,parent=parent_key,password=utils.make_pw_hash(str(u_pass)),email=u_email)
    #ID.username = str(int(ID.username)+1)
    user.put()
    #ID.put()
    user_cache(update=True)

#check the credentials on login
def check_creds(u_email,u_pass):
    queryEmail = check_email(u_email)
    #checks if user is in the cache first
    if queryEmail and utils.verify_pw_hash(u_pass,str(queryEmail.password)):
        return True
    else:
        return False


def get_username(email):
    cache = user_cache()
    for users in cache:
        if email in users.email:
            return users.username
    return None

def check_email(email):
    if email:
        cache = user_cache()
        if cache:
            for users in cache:
                if email in users.email:
                    return users
        content = Users.get_by_id(email,ndb.Key('user_parent','parent'))
        if content:
            return content
    return None

def check_token(token):
    if token:
        cache = user_cache()
        if cache:
            for users in cache:
                if users.token and (token in users.token):
                    return users
        content = Users.query(ancestor=ndb.Key('user_parent','parent')).filter(Users.token == token).get()
        if content:
            return content
    return None

def check_user(username):
    if username:
        cache = user_cache()
        if cache:
            for users in cache:
                if username in users.username:
                    return users
        content = Users.query(ancestor=ndb.Key('user_parent','parent')).filter(Users.username == username).get()
        if content:
            return content
    return None

def filter_temp_cache(cache):
    sendDic = {}
    for users in cache:
        tempDic = {}
        if users.fullname == None or users.fullname == "":
            tempDic['displayname'] = users.email
        else:
            tempDic['displayname'] = users.fullname
        tempDic['userid'] = users.username
        tempDic['email'] = users.email
        sendDic[users.username] = tempDic
    return sendDic 


