import hashlib
import hmac
import string
import random
import re

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

def make_oauth_hash(method,baseUrl,params):
    baseString = method+baseUrl+params

def verify_pw_hash(password,hashedItem):
    salt = hashedItem.split("|")[1]
    if make_pw_hash(password,salt) == hashedItem:
        return True