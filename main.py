#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
import os
import webapp2
import jinja2
import models
import logging
import utils
import re
import json
import urllib
import Messages
from google.appengine.api import urlfetch

template_dir = os.path.join(os.path.dirname(__file__),'templates/layouts')
jinja_env = jinja2.Environment(loader = jinja2.FileSystemLoader(template_dir), autoescape=True) 

class Handler(webapp2.RequestHandler):
    def write(self, *a, **kw):
        self.response.out.write(*a,**kw)
    def render_str(self, template,**params):
        t = jinja_env.get_template(template)
        return t.render(params)
    def render(self,template,**kw):
        self.write(self.render_str(template,**kw))

class MainHandler(Handler):
    def get(self):
        #FIREBASE AUTHENTICATION NO NEED FOR COOKIES
        cookie = self.request.cookies.get("user_id")
        if cookie:
            self.render("layout.html",loggedIn=utils.verify_secret_hash(cookie),username=cookie.split("|")[0],userList={})
        else:
            self.render("layout.html",loggedIn=False,userList={})
    def post(self):
        #initializes the data
        content = models.user_cache()
        userList = {}
        if content:
            userList = models.filter_temp_cache(content)
        self.write(json.dumps(userList))

class LoginHandler(Handler):
    #def get(self):
        #self.render("layout.html")
    def post(self):
        u_email = self.request.get("email")
        u_pass = self.request.get("password")
        loginSuccess = models.check_creds(u_email,u_pass)
        if loginSuccess:
            u_user = models.get_username(u_email)
            #FIREBASE WILL AUTHENTICATE NO NEED FOR COOKIES
            self.response.headers.add("Set-Cookie","user_id=%s; Path=/" % utils.make_secret_hash(str(u_user)))
            self.redirect("/")
        else:
            self.render("loginpage.html",err_login="Invalid Credentials")

class SignUpHandler(Handler):
    def render_signup(self,u_email="",err_pass="",err_verify="",err_email=""):
        self.render('signuppage.html',u_email=u_email,err_pass=err_pass,
                                    err_verify=err_verify,err_email=err_email)
    #def get(self):
        #self.render("signuppage.html")
    def post(self):
        logging.info("SignUp/Post")
        data = json.loads(self.request.body)
        u_user = data['username']
        u_pass = data['password']
        u_verify = data['verify']
        u_email = data['email']
        new_user = u_user,u_pass,u_verify,u_email
        
        errors = models.create_new_userdata(new_user)
        self.write("success")
        #models.signup_user_check(self,new_user,errors)

class LogOutHandler(Handler):
    def get(self):
        self.response.headers.add("Set-Cookie","user_id=%; Path=/")
        self.redirect('/')

class TokenHandler(Handler):
    def post(self):
        #this posthandler handles the tokens that come in and stores the tokens into the database
        data = json.loads(self.request.body)
        token = data['token']
        username = data['username']
        logging.info(username)
        #checks if the user is in the cache
        user_data = models.check_user(username)
        token_data = models.check_token(token)

        #logging.info(user_data.token)
        
        #checks if user exists in database and if token already exists
        if(user_data and user_data.token != token):
            logging.info(user_data.username)
            logging.info("About to put token in database")
            user_data.token = token
            #checks if another user has the same token then deletes it
            if token_data:
                token_data.token = ""
                token_data.put()
            user_data.put()
            models.user_cache(update=True)
        else:
            #return 404 page not found
            if user_data and user_data.token == token:
                self.write("Token already exists in database")
            else:
                self.write("404 user not found in database")


        #basically it stores the token in the database associating the token with the user
        #puts the token into the cache

#TODO: Handle errors

class MessageHandler(Handler):
    def get(self):
        sendUser = self.request.get("sendUser")
        receiveUser = self.request.get("receiveUser")
        conv_id = Messages.rearrangeUsers(sendUser,receiveUser)
        messageList = Messages.getMessages(conv_id)
        self.write(json.dumps(messageList))

    def populateJSON(self,username="",message="",token=""):
        return self.render_str("sendMessageTemplate.json",username=username,message=message,token=token)
    def post(self):
        data = json.loads(self.request.body)
        sendUser = data['sendUser']
        receiveUser = data['receiveUser']
        message = data['message']

        logging.info(receiveUser)

        user_data = models.check_user(receiveUser)

        #IF user exists
        if user_data:
            #Checks if the user has a token
            logging.info(user_data.token)
            #Store messages into the database
            Messages.store_user_message(sendUser,receiveUser,message)
            if user_data.token:
                payloadData = self.populateJSON(receiveUser,message,user_data.token)
                logging.info(payloadData)
                try:
                    headers = {'Content-Type': 'application/json','Authorization':'key=AAAAvEKDjyg:APA91bEy5boHue-y4ax-6l0lgvmR1XznmFfAFKADquu3IR_0ipA4z9VIgM2mdhTOIaWG77TrMCgg8vsXiE_dXixnnlEbevBfavA6J7L2jPDVa_zOqSt2y99m76XlSp16jQCOi8BQxAs7'}
                    result = urlfetch.fetch(
                        url='https://fcm.googleapis.com/fcm/send',
                        payload=payloadData,
                        method=urlfetch.POST,
                        headers=headers)
                    
                    self.write("sent:"+result.content)
                except urlfetch.Error:
                    self.write('Caught exception fetching url')
            else:
                #TODO: ADD A MESSAGE TABLE THAT STORES ALL MESSAGES AND PLACE IT IN HERE
                self.write("Token does not exist")
        else:
            self.write("User does not exist")
            #TODO: SEND BACK TO SERVER THAT THE USERNAME DOES NOT EXIST


app = webapp2.WSGIApplication([
    ('/', MainHandler),
    (r'/login/?',LoginHandler),
    (r'/signup/?',SignUpHandler),
    (r'/logout/?',LogOutHandler),
    (r'/sendTokenToServer/?',TokenHandler),
    (r'/sendMessageToUser/?',MessageHandler)

    
], debug=True)