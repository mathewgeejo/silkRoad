import psycopg2
from flask import Flask, request, jsonify, session, redirect, url_for
from flask_cors import CORS
from authlib.integrations.flask_client import OAuth
from functools import wraps
import os
import secrets
import logging
from datetime import datetime
