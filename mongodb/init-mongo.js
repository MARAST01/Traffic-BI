db = db.getSiblingDB("traffic_bi");

db.createUser({
  user: "traffic_bi_app",
  roles: [
    {
      role: "readWrite",
      db: "traffic_bi"
    }
  ]
});

db.createCollection("accidents_fact");
db.createCollection("date_dim");
db.createCollection("location_dim");
db.createCollection("weather_dim");
db.createCollection("infrastructure_dim");
