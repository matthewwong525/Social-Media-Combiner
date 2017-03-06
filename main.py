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

template_dir = os.path.join(os.path.dirname(__file__),'templates')
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
        cookie = self.request.cookies.get("user_id")
        if cookie:
            self.render("index.html",loggedIn=utils.verify_secret_hash(cookie))
        else:
            self.render("index.html")

class LoginHandler(Handler):
    def get(self):
        self.render("loginpage.html")
    def post(self):
        u_user = self.request.get("username")
        u_pass = self.request.get("password")
        loginSuccess = models.check_creds(u_user,u_pass)
        if loginSuccess:
            self.response.headers.add("Set-Cookie","user_id=%s; Path=/" % utils.make_secret_hash(str(u_user)))
            self.redirect("/")
        else:
            self.render("loginpage.html",err_login="Invalid Credentials")

class SignUpHandler(Handler):
    def render_signup(self,u_user="",u_email="",err_user="",err_pass="",err_verify="",err_email="",err_fname=""):
        self.render('signuppage.html',u_user=u_user,u_email=u_email,
                                    err_user=err_user,err_pass=err_pass,
                                    err_verify=err_verify,err_email=err_email, err_fname=err_fname)
    def get(self):
        self.render("signuppage.html")
    def post(self):
        u_user = self.request.get("username")
        u_pass = self.request.get("password")
        u_verify = self.request.get("verify")
        u_email = self.request.get("email")
        u_fname = self.request.get("fullname")
        new_user = u_user,u_pass,u_verify,u_email,u_fname

        err_user = ""
        err_pass = ""
        err_verify = "" 
        err_email = ""
        err_fname = ""
        errors = err_user,err_pass,err_verify,err_email,err_fname
        
        errors = models.get_user_error_signup(new_user,errors)
        models.signup_user_check(self,new_user,errors)

class LogOutHandler(Handler):
    def get(self):
        self.response.headers.add("Set-Cookie","user_id=%; Path=/")
        self.redirect('/')


app = webapp2.WSGIApplication([
    ('/', MainHandler),
    ('/login',LoginHandler),
    ('/signup',SignUpHandler),
    ('/logout',LogOutHandler)
], debug=True)