from flask import redirect, session
from app import app
import sqlite3
from datetime import datetime


def conectar():
    return sqlite3.connect("database.db")


@app.route("/checkout")
def checkout():

    db = conectar()
    cursor = db.cursor()

    cursor.execute("""
    SELECT productos.precio
    FROM carrito
    JOIN productos
    ON carrito.producto_id = productos.id
    WHERE carrito.usuario=?
    """,(session["usuario"],))

    precios = cursor.fetchall()

    total = sum(p[0] for p in precios)

    cursor.execute(
        "INSERT INTO pedidos(usuario,total,fecha) VALUES (?,?,?)",
        (session["usuario"],total,str(datetime.now()))
    )

    cursor.execute(
        "DELETE FROM carrito WHERE usuario=?",
        (session["usuario"],)
    )

    db.commit()

    return redirect("/productos")