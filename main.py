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
import Twitteroauth
import re
import json
import cgi
import urllib
import Messages
import mechanize
import cookielib
import time
from google.appengine.api import urlfetch
from google.appengine.ext import ndb
from bs4 import BeautifulSoup

#here is where the jinja templates are loaded
template_dir = os.path.join(os.path.dirname(__file__),'templates/layouts')
jinja_env = jinja2.Environment(loader = jinja2.FileSystemLoader(template_dir), autoescape=True) 

#a handler to help export the templates more easily
class Handler(webapp2.RequestHandler):
    def write(self, *a, **kw):
        self.response.out.write(*a,**kw)
    def render_str(self, template,**params):
        t = jinja_env.get_template(template)
        return t.render(params)
    def render(self,template,**kw):
        self.write(self.render_str(template,**kw))

class MainHandler(Handler):
    #called on the main page and returns the layout
    def get(self):
        self.render("layout.html")
    #a post request that passes in the data to initialize the UI on login
    def post(self):
        ancestor = ndb.Key('user_parent','parent')
        content = ndb.gql("SELECT * FROM Users WHERE ANCESTOR IS :1 ",ancestor)
        #sends the "friends list" that consists of every user signed up (only grabs from cache)
        userList = {}
        if content:
            userList = models.filter_temp_cache(content)
        self.write(json.dumps(userList))

class SignUpHandler(Handler):
    #This Endpoint stores the signup data into the database
    def post(self):
        logging.debug("SignUp/Post")
        data = json.loads(self.request.body)
        u_user = data['username']
        u_pass = data['password']
        u_verify = data['verify']
        u_email = data['email']
        new_user = u_user,u_pass,u_verify,u_email
        
        errors = models.create_new_userdata(new_user)
        self.write("successfully added user to database")

class TokenHandler(Handler):
    #This handler handles the tokens that come in and stores the tokens into the database
    def post(self):
        data = json.loads(self.request.body)
        token = data['token']
        username = data['username']
        logging.info(username)

        #checks if the user is in the cache or database
        user_data = models.check_user(username)
        token_data = models.check_token(token)

        #logging.info(user_data.token)
        
        #checks if user exists in database and if token already exists
        if(user_data and user_data.token != token):
            logging.info(user_data.user_id)
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
                self.write("Token exists in database")
            else:
                self.error(404)
                self.write("404 user not found in database")


        #basically it stores the token in the database associating the token with the user
        #puts the token into the cache

class MessageHandler(Handler):
    #gets the messages from the cache and returns them to the user
    def get(self):
        sendUser = self.request.get("sendUser")
        receiveUser = self.request.get("receiveUser")
        conv_id = Messages.rearrangeUsers(sendUser,receiveUser)
        messageList = Messages.getMessages(conv_id)
        self.write(json.dumps(messageList))

    #this function populates the message template to send to firebase
    def populateJSON(self,username="",message="",token=""):
        return self.render_str("sendMessageTemplate.json",username=username,message=message,token=token)

    #this handler handles all messages to be sent
    def post(self):
        data = json.loads(self.request.body)
        sendUser = data['sendUser']
        receiveUser = data['receiveUser']
        message = cgi.escape(data['message'])

        logging.debug(receiveUser)

        user_data = models.check_user(receiveUser)

        #IF user exists
        if user_data:
            #Checks if the user has a token
            logging.debug(user_data.token)
            #Store messages into the database
            Messages.store_user_message(sendUser,receiveUser,message)
            #checks if the user has a token
            if user_data.token:
                payloadData = self.populateJSON(sendUser,message,user_data.token)
                logging.info(payloadData)
                #makes an http request to send data to firebase which then communicates with the client
                try:
                    headers = {'Content-Type': 'application/json','Authorization':'key=AAAAvEKDjyg:APA91bEy5boHue-y4ax-6l0lgvmR1XznmFfAFKADquu3IR_0ipA4z9VIgM2mdhTOIaWG77TrMCgg8vsXiE_dXixnnlEbevBfavA6J7L2jPDVa_zOqSt2y99m76XlSp16jQCOi8BQxAs7'}
                    result = urlfetch.fetch(
                        url='https://fcm.googleapis.com/fcm/send',
                        payload=payloadData,
                        method=urlfetch.POST,
                        headers=headers)
                    self.write("sent:"+result.content)
                except urlfetch.Error:
                    self.error(404)
                    self.write('Caught exception fetching url')
            else:
                #TODO: ADD A MESSAGE TABLE THAT STORES ALL MESSAGES AND PLACE IT IN HERE
                self.write("User is not online")
        else:
            self.error(404)
            self.write("User does not exist")
            #TODO: SEND BACK TO SERVER THAT THE USERNAME DOES NOT EXIST

class TwitterReqHandler(Handler):
    def post(self):
        #gets the user data from the client
        data = json.loads(self.request.body)
        user_id = data['user_id']
        httpMethod = data['httpMethod']
        urlExtension = data['urlExtension']
        params = data['params']
        #sets url params
        reqUrl = "https://api.twitter.com/1.1/" + urlExtension
        callback_url = "localhost:17080/twitter"
        urlFetchDic = {"GET":urlfetch.GET,"POST":urlfetch.POST,"PATCH":urlfetch.PATCH,"PUT":urlfetch.PUT}
        #gets the user data for the oauth headers
        user_data = models.get_by_id(user_id)

        if user_data.twitter_token:
            #attempts to send the request to twitter api
            try:
                #gets the oauth headers for twitter
                headers = Twitteroauth.twitter_headers(httpMethod,
                                                    reqUrl,callback_url,[],
                                                    user_data.twitter_token,user_data.twitter_secret)
                result_request = urlfetch.fetch(
                            url=reqUrl,
                            method=urlFetchDic[httpMethod],
                            payload=params,
                            headers=headers)
            except urlfetch.Error:
                    self.error(404)
                    self.write('Caught exception fetching url')
            #writes the json output to the client
            self.write(result_request.content)
        else:
            self.error(404)
            self.write("Twitter token not found")

class TwitterLoginHandler(Handler):
    def get(self):
        #retrieves the data that twitter sends to the server after the post request
        oauth_token = self.request.get("oauth_token")
        oauth_verifier = self.request.get("oauth_verifier")
        denied = self.request.get("denied")
        #checks if the request was denied
        if not denied:
            #gets token data stored eariler
            token_data = Twitteroauth.get_token(oauth_token)
            if token_data:
                #makes an oauth 1.0 request to twitter to upgrade the request token to an access token
                try:
                    access_token_url = 'https://api.twitter.com/oauth/access_token'
                    callback_url = "localhost:17080/twitter"
                    #retrieves the oauth 1.0 headers for twitter
                    headers = Twitteroauth.twitter_headers("POST",access_token_url,callback_url,[],oauth_token,token_data.token_secret)
                    #makes the request here
                    payloadData = urllib.urlencode({"oauth_verifier": oauth_verifier})
                    result_access = urlfetch.fetch(
                            url=access_token_url,
                            method=urlfetch.POST,
                            payload=payloadData,
                            headers=headers)

                    #stores the result into the datastore here
                    oauth_token=result_access.content.split("&")[0].split("=")[1]
                    oauth_token_secret=result_access.content.split("&")[1].split("=")[1]
                    twit_id = result_access.content.split("&")[2].split("=")[1]
                    twit_user = result_access.content.split("&")[3].split("=")[1]
                    models.store_twitter_data(oauth_token,oauth_token_secret,token_data.user_id)
                    logging.info(result_access.content+ " store content")
                    #makes a firebase request to notify the client that the log in was successful
                    if result_access.content:
                        headers = {'Content-Type':'application/json'}
                        #TODO: put this into the config file
                        FB_auth_secret = 'bNOkZ3xQHPFZHX0o5hJQyr9BHk2XGJP42M4yvOZL'
                        result_firebase = urlfetch.fetch(
                                url="https://mywebapp-dev.firebaseio.com/user_data/"+token_data.user_id+"/twitter.json?auth="+FB_auth_secret,
                                method=urlfetch.PUT,
                                payload=json.dumps({"twitLoggedIn":"true","twitUserId":twit_id,"twitScreenName":twit_user}),
                                headers=headers)
                except urlfetch.Error:
                    self.error(404)
                    self.write('Caught exception fetching url')
            else:
                self.error(404)
        else:
            self.write('denied')
    def post(self):
        try:
            #gets the user data from the client
            data = json.loads(self.request.body)
            user_id = data['userID']
            #TODO: PUT THE CONSUMER KEYS AND SECRETS INTO A CONFIG FILE
            request_token_url = 'https://api.twitter.com/oauth/request_token'
            #TODO: change this to the actual website
            callback_url = "localhost:8080/twitter"
            #retrieves the oauth 1.0 headers for twitter
            headers = Twitteroauth.twitter_headers("POST",request_token_url,callback_url,[])
            #makes the request here
            result_req_token = urlfetch.fetch(
                        url=request_token_url,
                        method=urlfetch.POST,
                        headers=headers)
            #stores token data and secret for future the redirect when logged in
            token = result_req_token.content.split("&")[0].split("=")[1]
            token_secret = result_req_token.content.split("&")[1].split("=")[1]
            Twitteroauth.store_token(user_id,token,token_secret)
            self.write(token)
        except urlfetch.Error:
            self.error(404)
            self.write('Caught exception fetching url')

#########################################################
#an experimental handler to get a proxy from facebook
#########################################################
class PageHandler(Handler):
    #USES the mechanize library. much better :)
    def get(self):
        # Browser
        br = mechanize.Browser()

        # Cookie Jar
        cj = cookielib.LWPCookieJar()
        br.set_cookiejar(cj)

        # Browser options
        br.set_handle_equiv(True)
        br.set_handle_gzip(True)
        br.set_handle_redirect(True)
        br.set_handle_referer(True)
        br.set_handle_robots(False)

        # Follows refresh 0 but not hangs on refresh > 0
        br.set_handle_refresh(mechanize._http.HTTPRefreshProcessor(), max_time=1)

        # User-Agent (this is cheating, ok?) https://techblog.willshouse.com/2012/01/03/most-common-user-agents/
        br.addheaders = [('User-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36')]
        # Open some site, let's pick a random one, the first that pops in mind:
        r = br.open('http://www.facebook.com/login.php')
        # Select the first (index zero) form
        br.select_form(nr=0)
        # User credentials
        br.form['email'] = 'whatisyouraccount@hotmail.com'
        br.form['pass'] = 'lolimsodumb'
        # Login
        br.submit()
        html = br.response().read()

        # Show the source
        logging.info(html) 
        self.write(html)

#Handler for SSL certificates
class LetsEncryptHandler(Handler):
    def get(self, challenge):
        self.response.headers['Content-Type'] = "text/plain"
        logging.info(challenge)
        self.write(challenge+".Gr9dXZjvfrd-ReOBzl7Ogh5f-OfxSuHA4HGb5t5B9OE")

#The mapping for the URLs
app = webapp2.WSGIApplication([
    ('/', MainHandler),
    ('/.well-known/acme-challenge/(.+)',LetsEncryptHandler),
    (r'/signup/?',SignUpHandler),
    (r'/sendTokenToServer/?',TokenHandler),
    (r'/sendMessageToUser/?',MessageHandler),
    (r'/page/?',PageHandler),
    (r'/twitter/request/?',TwitterReqHandler),
    (r'/twitter/?',TwitterLoginHandler)
], debug=True)