from flask import Flask, render_template

app = Flask(__name__)

# Datos simulados
productos = [
    {"nombre": "Laptop", "precio": 850},
    {"nombre": "Mouse", "precio": 25},
    {"nombre": "Teclado", "precio": 45},
    {"nombre": "Monitor", "precio": 200}
]

@app.route('/')
def inicio():
    return render_template("index.html", productos=productos)

if __name__ == '__main__':
    app.run(debug=True)