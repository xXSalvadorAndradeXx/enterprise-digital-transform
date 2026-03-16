from flask import request, redirect, render_template, session
from app import app
import sqlite3


def conectar():
    return sqlite3.connect("database.db")


@app.route("/login", methods=["GET","POST"])
def login():

    if request.method == "POST":

        user = request.form["username"]
        password = request.form["password"]

        db = conectar()
        cursor = db.cursor()

        cursor.execute(
            "SELECT * FROM usuarios WHERE username=? AND password=?",
            (user,password)
        )

        data = cursor.fetchone()

        if data:
            session["usuario"] = user
            return redirect("/productos")

    return render_template("login.html")