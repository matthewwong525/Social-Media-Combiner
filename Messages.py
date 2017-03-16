from google.appengine.ext import ndb
from google.appengine.api import memcache
import re
import logging
import utils
import string, random

class Messages(ndb.Model):
    conv_id = ndb.StringProperty(required = True)
    message = ndb.StringProperty(required = True)
    usersent = ndb.StringProperty(required = True)
    datesent = ndb.DateTimeProperty(auto_now_add=True)

def store_message(message,user,conv_id):
    parent_key = ndb.Key('message_parent','parent')
    message = Message(parent=parent_key,message=message,usersent=user,conv_id=conv_id)
    message.put()



def id_generator(size=10, chars=string.ascii_uppercase + string.ascii_lowercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))
