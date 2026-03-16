from flask import redirect, session, render_template
from app import app
import sqlite3


def conectar():
    return sqlite3.connect("database.db")


@app.route("/agregar/<id>")
def agregar(id):

    db = conectar()
    cursor = db.cursor()

    cursor.execute(
        "INSERT INTO carrito(usuario,producto_id) VALUES (?,?)",
        (session["usuario"],id)
    )

    db.commit()

    return redirect("/carrito")


@app.route("/carrito")
def carrito():

    db = conectar()
    cursor = db.cursor()

    cursor.execute("""
    SELECT productos.nombre, productos.precio
    FROM carrito
    JOIN productos
    ON carrito.producto_id = productos.id
    WHERE carrito.usuario=?
    """,(session["usuario"],))

    items = cursor.fetchall()

    return render_template("carrito.html", items=items)