from google.appengine.ext import ndb
from google.appengine.api import memcache
import time
import logging
import utils
import hashlib
import hmac
from urllib import quote_plus

class Tokens(ndb.Model):
    user_id = ndb.StringProperty(required = True)
    token = ndb.StringProperty(required = True)
    token_secret = ndb.StringProperty(required = True)
    datecreate = ndb.DateTimeProperty(auto_now_add=True)

#gets token from database
def get_token(token):
    this_token = Tokens.get_by_id(token,ndb.Key('token_parent','parent'))
    if this_token:
        return this_token
    return None

#stores the token and secret from twitter oauth into the database
def store_token(user_id,token,token_secret):
    logging.info("about to store")
    parent_key = ndb.Key('token_parent','parent')
    this_token = Tokens(parent=parent_key,id=token,token=token,token_secret=token_secret,user_id=user_id)
    this_token.put()

#returns the headers for a twitter request
def twitter_headers(http_method,url,callback_url,param_list,auth_token="",auth_token_secret=""):
    #adds all the oauth parameters to a list
    oauth_consumer_key='oauth_consumer_key=ic9xnJgR2vY62zxbTceIP52Hv'
    oauth_signature_method='oauth_signature_method=HMAC-SHA1'
    oauth_timestamp= 'oauth_timestamp='+str(int(time.time()))
    oauth_token='oauth_token='+quote_plus(auth_token)
    oauth_nonce='oauth_nonce='+utils.make_salt()
    oauth_version='oauth_version=1.0'
    oauth_callback='oauth_callback='+ quote_plus(callback_url)
    param_list.extend((oauth_consumer_key,oauth_nonce,oauth_signature_method,oauth_timestamp,oauth_version,oauth_token))

    oauth_signature = 'oauth_signature='+ sign_request(param_list,http_method,url,auth_token_secret)
    param_list.append(oauth_signature)
    param_list = change_param_list(param_list)

    #removes all empty items in the parameter list
    for item in param_list:
        if item.split("=")[1] == "" or item.split("=")[1] == None:
            param_list.remove(item)

    headers = {'Content-Type': 'application/x-www-form-urlencoded','Authorization': 'OAuth '+','.join(param_list)}
    logging.info(headers)
    return headers
    
#converts the param list so it can work as headers. adds "" to the value
def change_param_list(paramList):
    new_param_list = []
    for item in paramList:
        key,value = item.split("=",1)
        new_param_list.append(key + '="' + value + '"')
    return new_param_list

#signs the request and returns the urlencoded signature
def sign_request(paramList,http_method,url,token_secret):
    #TODO: put in config file
    company_secret = quote_plus("6mptuvQQDigbyPqisyYZQ56Ta7JogGVTBibXNnZExxVfATVS0D")
    client_secret = quote_plus(token_secret)
    key=company_secret+"&"+client_secret

    #joins the param list into a single string
    paramList = sorted(paramList,key=lambda s: s.lower())
    params = '&'.join(paramList)

    #removes all empty items in the parameter list
    for item in paramList:
        if item.split("=")[1] == "" or item.split("=")[1] == None:
            paramList.remove(item)

    #joins the base string together, then urlencodes the strings and hashes it
    base_string = quote_plus(http_method)+"&"+quote_plus(url)+"&"+quote_plus(params)
    signature = hmac.new(key,base_string,hashlib.sha1).digest().encode("base64").rstrip('\n')
    return quote_plus(signature)