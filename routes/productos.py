from flask import render_template
from app import app
import sqlite3


def conectar():
    return sqlite3.connect("database.db")


@app.route("/productos")
def productos():

    db = conectar()
    cursor = db.cursor()

    cursor.execute("SELECT * FROM productos")
    productos = cursor.fetchall()

    return render_template("productos.html", productos=productos)