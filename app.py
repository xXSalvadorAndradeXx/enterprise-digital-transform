from flask import Flask, render_template
from database import crear_tablas

app = Flask(__name__)
app.secret_key = "clave_secreta"

crear_tablas()




@app.route("/")
def index():
    return render_template("index.html")

@app.route("/inicio")
def inicio():
    return render_template("index.html")


@app.route("/productos")
def productos():
    return render_template("productos.html")

@app.route("/admin")
def admin():
    return render_template("admin.html")

@app.route("/carrito")
def carrito():
    return render_template("carrito.html")

@app.route("/login")
def login():
    return render_template("login.html")



if __name__ == "__main__":
    app.run(debug=True)