from google.appengine.ext import ndb
from google.appengine.api import memcache
import re
import logging
import json
import utils

#TODO: Make a cache for everything
class Users(ndb.Model):
    user_id = ndb.StringProperty()
    password = ndb.StringProperty(required = True)
    email = ndb.StringProperty(required = True)
    fullname = ndb.StringProperty()
    token = ndb.StringProperty()
    datecreate = ndb.DateTimeProperty(auto_now_add=True)
    twitter_token = ndb.StringProperty()
    twitter_secret = ndb.StringProperty()

#A user cache that stores the contents of the database into the memcache
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
    user = Users(user_id=u_user,id=u_user,parent=parent_key,password=utils.make_pw_hash(str(u_pass)),email=u_email)
    user.put()
    user_cache(update=True)

#Not used, but may be used
def get_by_id(user_id):
    users = Users.get_by_id(user_id,ndb.Key('user_parent','parent'))
    return users

#Not used, but may be used
def check_email(email):
    if email:
        cache = user_cache()
        if cache:
            for users in cache:
                if email in users.email:
                    return users
        content = Users.query(ancestor=ndb.Key('user_parent','parent')).filter(Users.email == email).get()
        if content:
            return content
    return None

#checks if the token is in the cache, then checks the database
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

#checks if the user is in the cache, then checks the database
def check_user(user_id):
    if user_id:
        cache = user_cache()
        if cache:
            for users in cache:
                if user_id in users.user_id:
                    return users
        content = Users.query(ancestor=ndb.Key('user_parent','parent')).filter(Users.user_id == user_id).get()
        if content:
            return content
    return None

#filters the user cache to a dictionary with only necessary data (displayname, userid, email)
def filter_temp_cache(cache):
    sendDic = {}
    for users in cache:
        tempDic = {}
        if users.fullname == None or users.fullname == "":
            tempDic['displayname'] = ""
        else:
            tempDic['displayname'] = users.fullname
        tempDic['userid'] = users.user_id
        tempDic['email'] = users.email
        sendDic[users.user_id] = tempDic
    return sendDic 

#stores twitter token data into the database
def store_twitter_data(token,token_secret,user_id):
    logging.info(user_id)
    user = Users.get_by_id(user_id,ndb.Key('user_parent','parent'))
    user.twitter_token = token
    user.twitter_secret = token_secret
    user.put()
