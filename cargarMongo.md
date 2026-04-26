# Cómo ejecutarlo
Ajusta contraseñas en:

mongodb/docker-compose.yml

mongodb/init-mongo.js

URI por defecto en ETL/load_to_mongodb.py

Levanta MongoDB:

docker compose -f mongodb/docker-compose.yml up -d

Crea esquema e índices:

mongosh "mongodb://root_admin:TU_PASSWORD@localhost:27017/admin" mongodb/create_schema_indexes.js

Instala dependencias ETL:

pip install pandas pymongo

Carga histórica:

python ETL/load_to_mongodb.py --csv-path ETL/US_Accidents_March23.csv --chunk-size 50000

o si no tienes contraseña en mongo
python ETL/load_to_mongodb.py --csv-path ETL/US_Accidents_March23.csv --chunk-size 50000 --mongo-uri "mongodb://localhost:27017/traffic_bi"