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

def make_salt():
    return ''.join(random.choice(string.letters) for x in range(5))

def make_pw_hash(password,salt = ""):
    if salt == "":
        salt = make_salt()
    theHash = hmac.new(salt,password,hashlib.sha256).hexdigest()
    return theHash+"|"+salt

def verify_pw_hash(password,hashedItem):
    salt = hashedItem.split("|")[1]
    if make_pw_hash(password,salt) == hashedItem:
        return True