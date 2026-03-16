import sqlite3

def conectar():
    return sqlite3.connect("database.db")


def crear_tablas():

    db = conectar()
    cursor = db.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS usuarios(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        password TEXT,
        rol TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS productos(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        descripcion TEXT,
        precio REAL,
        stock INTEGER
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS carrito(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT,
        producto_id INTEGER
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pedidos(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT,
        total REAL,
        fecha TEXT
    )
    """)

    db.commit()
    db.close()