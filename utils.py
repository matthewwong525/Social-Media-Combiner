import hashlib
import hmac
import string
import random
import re
import time
import logging
from urllib import quote_plus

superSecretVar = "RANDOM STRING OF CHARS YOU SUCK"

def make_secret_hash(hashItem):
    theHash=hmac.new(superSecretVar,hashItem,hashlib.sha256).hexdigest()
    return hashItem + "|" + theHash

def verify_secret_hash(hashedItem):
    inputString = hashedItem.split("|")[0]
    if(make_secret_hash(inputString) == hashedItem):
        return True
    return False

def make_salt(size=10, chars=string.ascii_uppercase + string.ascii_lowercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))

def make_pw_hash(password,salt = ""):
    if salt == "":
        salt = make_salt()
    theHash = hmac.new(salt,password,hashlib.sha256).hexdigest()
    return theHash+"|"+salt


def verify_pw_hash(password,hashedItem):
    salt = hashedItem.split("|")[1]
    if make_pw_hash(password,salt) == hashedItem:
        return True

#returns the headers for a twitter request
def twitter_headers(http_method,url,callback_url,auth_token="",auth_token_secret=""):
    #adds all the oauth parameters to a list
    param_list=[]
    oauth_consumer_key='oauth_consumer_key=ic9xnJgR2vY62zxbTceIP52Hv'
    oauth_signature_method='oauth_signature_method=HMAC-SHA1'
    oauth_timestamp= 'oauth_timestamp='+str(int(time.time()))
    oauth_token='oauth_token='+quote_plus(auth_token)
    oauth_nonce='oauth_nonce='+make_salt()
    oauth_version='oauth_version=1.0'
    oauth_callback='oauth_callback='+ quote_plus(callback_url)
    param_list.extend((oauth_consumer_key,oauth_nonce,oauth_signature_method,oauth_timestamp,oauth_version))

    oauth_signature = 'oauth_signature='+ sign_request(param_list,http_method,url)
    param_list.append(oauth_signature)
    param_list = change_param_list(param_list)

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
def sign_request(paramList,http_method,url):
    company_secret = quote_plus("6mptuvQQDigbyPqisyYZQ56Ta7JogGVTBibXNnZExxVfATVS0D")
    client_secret = quote_plus("")
    key=company_secret+"&"+client_secret

    #joins the param list into a single string
    paramList = sorted(paramList,key=str.lower)
    params = '&'.join(paramList)
    logging.info(params)

    #removes all empty items in the parameter list
    for item in paramList:
        if item.split("=")[1] == "":
            paramList.remove(item)

    #joins the base string together, then urlencodes the strings and hashes it
    base_string = quote_plus(http_method)+"&"+quote_plus(url)+"&"+quote_plus(params)
    logging.info(base_string)
    signature = hmac.new(key,base_string,hashlib.sha1).digest().encode("base64").rstrip('\n')
    return quote_plus(signature)
