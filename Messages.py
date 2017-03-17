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

#TODO: implement a cache for the messages to minimize the reads

def store_message(message,user,conv_id):
    logging.info("about to store")
    parent_key = ndb.Key('message_parent','parent')
    message = Messages(parent=parent_key,message=message,usersent=user,conv_id=conv_id)
    message.put()

def getMessages(conv_id):
    parent_key = ndb.Key('message_parent','parent')
    #TODO: add a limit to howmuch you can read
    messages = ndb.gql("SELECT * FROM Messages WHERE ANCESTOR IS :ancestor AND conv_id = :conversation ORDER BY datesent",ancestor=parent_key,conversation=conv_id)
    messages = list(messages)
    messageList = []
    if messages:
        for message in messages:
            messageList.append({"usersent":message.usersent,
                                "message":message.message,
                                "datesent":message.datesent.strftime('%c')})
    return messageList



def rearrangeUsers(user1,user2):
    userList = sorted([user1,user2])
    new_conv_id = userList[0] + "|" +userList[1]
    return new_conv_id

def store_user_message(sendUser,receiveUser,message):
    new_conv_id = rearrangeUsers(sendUser,receiveUser)
    store_message(message,sendUser,new_conv_id)


def id_generator(size=10, chars=string.ascii_uppercase + string.ascii_lowercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))
