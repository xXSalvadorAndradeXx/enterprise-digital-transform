from flask import render_template
from app import app
import sqlite3


def conectar():
    return sqlite3.connect("database.db")


@app.route("/admin")
def admin():

    db = conectar()
    cursor = db.cursor()

    cursor.execute("SELECT * FROM productos")
    productos = cursor.fetchall()

    cursor.execute("SELECT * FROM pedidos")
    pedidos = cursor.fetchall()

    return render_template("admin.html", productos=productos, pedidos=pedidos)