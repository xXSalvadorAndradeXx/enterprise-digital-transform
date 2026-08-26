BEGIN;

-- Catalogo territorial de El Salvador: 14 departamentos y 262 distritos.
-- Compatible con las entidades TypeORM Department y District del proyecto.
-- Se puede ejecutar varias veces sin duplicar registros.

INSERT INTO departments (name, code, "isActive")
VALUES
  ('Ahuachapán', 'AH', TRUE),
  ('Cabañas', 'CA', TRUE),
  ('Chalatenango', 'CH', TRUE),
  ('Cuscatlán', 'CU', TRUE),
  ('La Libertad', 'LL', TRUE),
  ('La Paz', 'LP', TRUE),
  ('La Unión', 'LU', TRUE),
  ('Morazán', 'MO', TRUE),
  ('San Miguel', 'SM', TRUE),
  ('San Salvador', 'SS', TRUE),
  ('San Vicente', 'SV', TRUE),
  ('Santa Ana', 'SA', TRUE),
  ('Sonsonate', 'SO', TRUE),
  ('Usulután', 'US', TRUE)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    "isActive" = TRUE;

WITH district_seed (department_code, name) AS (
  VALUES
    -- Ahuachapán (12)
    ('AH', 'Ahuachapán'),
    ('AH', 'Apaneca'),
    ('AH', 'Atiquizaya'),
    ('AH', 'Concepción de Ataco'),
    ('AH', 'El Refugio'),
    ('AH', 'Guaymango'),
    ('AH', 'Jujutla'),
    ('AH', 'San Francisco Menéndez'),
    ('AH', 'San Lorenzo'),
    ('AH', 'San Pedro Puxtla'),
    ('AH', 'Tacuba'),
    ('AH', 'Turín'),

    -- Cabañas (9)
    ('CA', 'Cinquera'),
    ('CA', 'Dolores'),
    ('CA', 'Guacotecti'),
    ('CA', 'Ilobasco'),
    ('CA', 'Jutiapa'),
    ('CA', 'San Isidro'),
    ('CA', 'Sensuntepeque'),
    ('CA', 'Tejutepeque'),
    ('CA', 'Victoria'),

    -- Chalatenango (33)
    ('CH', 'Agua Caliente'),
    ('CH', 'Arcatao'),
    ('CH', 'Azacualpa'),
    ('CH', 'Chalatenango'),
    ('CH', 'Citalá'),
    ('CH', 'Comalapa'),
    ('CH', 'Concepción Quezaltepeque'),
    ('CH', 'Dulce Nombre de María'),
    ('CH', 'El Carrizal'),
    ('CH', 'El Paraíso'),
    ('CH', 'La Laguna'),
    ('CH', 'La Palma'),
    ('CH', 'La Reina'),
    ('CH', 'Las Vueltas'),
    ('CH', 'Nombre de Jesús'),
    ('CH', 'Nueva Concepción'),
    ('CH', 'Nueva Trinidad'),
    ('CH', 'Ojos de Agua'),
    ('CH', 'Potonico'),
    ('CH', 'San Antonio de la Cruz'),
    ('CH', 'San Antonio Los Ranchos'),
    ('CH', 'San Fernando'),
    ('CH', 'San Francisco Lempa'),
    ('CH', 'San Francisco Morazán'),
    ('CH', 'San Ignacio'),
    ('CH', 'San Isidro Labrador'),
    ('CH', 'San José Cancasque'),
    ('CH', 'San José Las Flores'),
    ('CH', 'San Luis del Carmen'),
    ('CH', 'San Miguel de Mercedes'),
    ('CH', 'San Rafael'),
    ('CH', 'Santa Rita'),
    ('CH', 'Tejutla'),

    -- Cuscatlán (16)
    ('CU', 'Candelaria'),
    ('CU', 'Cojutepeque'),
    ('CU', 'El Carmen'),
    ('CU', 'El Rosario'),
    ('CU', 'Monte San Juan'),
    ('CU', 'Oratorio de Concepción'),
    ('CU', 'San Bartolomé Perulapía'),
    ('CU', 'San Cristóbal'),
    ('CU', 'San José Guayabal'),
    ('CU', 'San Pedro Perulapán'),
    ('CU', 'San Rafael Cedros'),
    ('CU', 'San Ramón'),
    ('CU', 'Santa Cruz Analquito'),
    ('CU', 'Santa Cruz Michapa'),
    ('CU', 'Suchitoto'),
    ('CU', 'Tenancingo'),

    -- La Libertad (22)
    ('LL', 'Antiguo Cuscatlán'),
    ('LL', 'Chiltiupán'),
    ('LL', 'Ciudad Arce'),
    ('LL', 'Colón'),
    ('LL', 'Comasagua'),
    ('LL', 'Huizúcar'),
    ('LL', 'Jayaque'),
    ('LL', 'Jicalapa'),
    ('LL', 'La Libertad'),
    ('LL', 'Nuevo Cuscatlán'),
    ('LL', 'Quezaltepeque'),
    ('LL', 'Sacacoyo'),
    ('LL', 'San José Villanueva'),
    ('LL', 'San Juan Opico'),
    ('LL', 'San Matías'),
    ('LL', 'San Pablo Tacachico'),
    ('LL', 'Santa Tecla'),
    ('LL', 'Talnique'),
    ('LL', 'Tamanique'),
    ('LL', 'Teotepeque'),
    ('LL', 'Tepecoyo'),
    ('LL', 'Zaragoza'),

    -- La Paz (22)
    ('LP', 'Cuyultitán'),
    ('LP', 'El Rosario'),
    ('LP', 'Jerusalén'),
    ('LP', 'Mercedes La Ceiba'),
    ('LP', 'Olocuilta'),
    ('LP', 'Paraíso de Osorio'),
    ('LP', 'San Antonio Masahuat'),
    ('LP', 'San Emigdio'),
    ('LP', 'San Francisco Chinameca'),
    ('LP', 'San Juan Nonualco'),
    ('LP', 'San Juan Talpa'),
    ('LP', 'San Juan Tepezontes'),
    ('LP', 'San Luis La Herradura'),
    ('LP', 'San Luis Talpa'),
    ('LP', 'San Miguel Tepezontes'),
    ('LP', 'San Pedro Masahuat'),
    ('LP', 'San Pedro Nonualco'),
    ('LP', 'San Rafael Obrajuelo'),
    ('LP', 'Santa María Ostuma'),
    ('LP', 'Santiago Nonualco'),
    ('LP', 'Tapalhuaca'),
    ('LP', 'Zacatecoluca'),

    -- La Unión (18)
    ('LU', 'Anamorós'),
    ('LU', 'Bolívar'),
    ('LU', 'Concepción de Oriente'),
    ('LU', 'Conchagua'),
    ('LU', 'El Carmen'),
    ('LU', 'El Sauce'),
    ('LU', 'Intipucá'),
    ('LU', 'La Unión'),
    ('LU', 'Lislique'),
    ('LU', 'Meanguera del Golfo'),
    ('LU', 'Nueva Esparta'),
    ('LU', 'Pasaquina'),
    ('LU', 'Polorós'),
    ('LU', 'San Alejo'),
    ('LU', 'San José'),
    ('LU', 'Santa Rosa de Lima'),
    ('LU', 'Yayantique'),
    ('LU', 'Yucuaiquín'),

    -- Morazán (26)
    ('MO', 'Arambala'),
    ('MO', 'Cacaopera'),
    ('MO', 'Chilanga'),
    ('MO', 'Corinto'),
    ('MO', 'Delicias de Concepción'),
    ('MO', 'El Divisadero'),
    ('MO', 'El Rosario'),
    ('MO', 'Gualococti'),
    ('MO', 'Guatajiagua'),
    ('MO', 'Joateca'),
    ('MO', 'Jocoaitique'),
    ('MO', 'Jocoro'),
    ('MO', 'Lolotiquillo'),
    ('MO', 'Meanguera'),
    ('MO', 'Osicala'),
    ('MO', 'Perquín'),
    ('MO', 'San Carlos'),
    ('MO', 'San Fernando'),
    ('MO', 'San Francisco Gotera'),
    ('MO', 'San Isidro'),
    ('MO', 'San Simón'),
    ('MO', 'Sensembra'),
    ('MO', 'Sociedad'),
    ('MO', 'Torola'),
    ('MO', 'Yamabal'),
    ('MO', 'Yoloaiquín'),

    -- San Miguel (20)
    ('SM', 'Carolina'),
    ('SM', 'Chapeltique'),
    ('SM', 'Chinameca'),
    ('SM', 'Chirilagua'),
    ('SM', 'Ciudad Barrios'),
    ('SM', 'Comacarán'),
    ('SM', 'El Tránsito'),
    ('SM', 'Lolotique'),
    ('SM', 'Moncagua'),
    ('SM', 'Nueva Guadalupe'),
    ('SM', 'Nuevo Edén de San Juan'),
    ('SM', 'Quelepa'),
    ('SM', 'San Antonio del Mosco'),
    ('SM', 'San Gerardo'),
    ('SM', 'San Jorge'),
    ('SM', 'San Luis de la Reina'),
    ('SM', 'San Miguel'),
    ('SM', 'San Rafael Oriente'),
    ('SM', 'Sesori'),
    ('SM', 'Uluazapa'),

    -- San Salvador (19)
    ('SS', 'Aguilares'),
    ('SS', 'Apopa'),
    ('SS', 'Ayutuxtepeque'),
    ('SS', 'Ciudad Delgado'),
    ('SS', 'Cuscatancingo'),
    ('SS', 'El Paisnal'),
    ('SS', 'Guazapa'),
    ('SS', 'Ilopango'),
    ('SS', 'Mejicanos'),
    ('SS', 'Nejapa'),
    ('SS', 'Panchimalco'),
    ('SS', 'Rosario de Mora'),
    ('SS', 'San Marcos'),
    ('SS', 'San Martín'),
    ('SS', 'San Salvador'),
    ('SS', 'Santiago Texacuangos'),
    ('SS', 'Santo Tomás'),
    ('SS', 'Soyapango'),
    ('SS', 'Tonacatepeque'),

    -- San Vicente (13)
    ('SV', 'Apastepeque'),
    ('SV', 'Guadalupe'),
    ('SV', 'San Cayetano Istepeque'),
    ('SV', 'San Esteban Catarina'),
    ('SV', 'San Ildefonso'),
    ('SV', 'San Lorenzo'),
    ('SV', 'San Sebastián'),
    ('SV', 'San Vicente'),
    ('SV', 'Santa Clara'),
    ('SV', 'Santo Domingo'),
    ('SV', 'Tecoluca'),
    ('SV', 'Tepetitán'),
    ('SV', 'Verapaz'),

    -- Santa Ana (13)
    ('SA', 'Candelaria de la Frontera'),
    ('SA', 'Chalchuapa'),
    ('SA', 'Coatepeque'),
    ('SA', 'El Congo'),
    ('SA', 'El Porvenir'),
    ('SA', 'Masahuat'),
    ('SA', 'Metapán'),
    ('SA', 'San Antonio Pajonal'),
    ('SA', 'San Sebastián Salitrillo'),
    ('SA', 'Santa Ana'),
    ('SA', 'Santa Rosa Guachipilín'),
    ('SA', 'Santiago de la Frontera'),
    ('SA', 'Texistepeque'),

    -- Sonsonate (16)
    ('SO', 'Acajutla'),
    ('SO', 'Armenia'),
    ('SO', 'Caluco'),
    ('SO', 'Cuisnahuat'),
    ('SO', 'Izalco'),
    ('SO', 'Juayúa'),
    ('SO', 'Nahuizalco'),
    ('SO', 'Nahulingo'),
    ('SO', 'Salcoatitán'),
    ('SO', 'San Antonio del Monte'),
    ('SO', 'San Julián'),
    ('SO', 'Santa Catarina Masahuat'),
    ('SO', 'Santa Isabel Ishuatán'),
    ('SO', 'Santo Domingo de Guzmán'),
    ('SO', 'Sonsonate'),
    ('SO', 'Sonzacate'),

    -- Usulután (23)
    ('US', 'Alegría'),
    ('US', 'Berlín'),
    ('US', 'California'),
    ('US', 'Concepción Batres'),
    ('US', 'El Triunfo'),
    ('US', 'Ereguayquín'),
    ('US', 'Estanzuelas'),
    ('US', 'Jiquilisco'),
    ('US', 'Jucuapa'),
    ('US', 'Jucuarán'),
    ('US', 'Mercedes Umaña'),
    ('US', 'Nueva Granada'),
    ('US', 'Ozatlán'),
    ('US', 'Puerto El Triunfo'),
    ('US', 'San Agustín'),
    ('US', 'San Buenaventura'),
    ('US', 'San Dionisio'),
    ('US', 'San Francisco Javier'),
    ('US', 'Santa Elena'),
    ('US', 'Santa María'),
    ('US', 'Santiago de María'),
    ('US', 'Tecapán'),
    ('US', 'Usulután')
)
INSERT INTO districts (name, department_id, "isActive")
SELECT seed.name, department.id, TRUE
FROM district_seed AS seed
JOIN departments AS department
  ON department.code = seed.department_code
WHERE NOT EXISTS (
  SELECT 1
  FROM districts AS existing
  WHERE existing.department_id = department.id
    AND LOWER(TRIM(existing.name)) = LOWER(TRIM(seed.name))
);

COMMIT;

-- Verificacion esperada para una base vacia antes de ejecutar el script:
-- departments = 14, districts = 262.
SELECT COUNT(*) AS departments FROM departments;
SELECT COUNT(*) AS districts FROM districts;

SELECT department.name, COUNT(district.id) AS districts
FROM departments AS department
LEFT JOIN districts AS district
  ON district.department_id = department.id
GROUP BY department.id, department.name
ORDER BY department.name;
