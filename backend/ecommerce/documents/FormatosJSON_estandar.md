Estructura para respuestas exitosas (200, 201):

{
  "status": "success",
  "message": "Descripción de la operación ",
  "data": { } 
}

Estructura para errores (400, 401, 404, 500):
{
  "statusCode": 401,
  "message": "Accesso no Autorizado",
  "error": "Descripcion de error"
}


