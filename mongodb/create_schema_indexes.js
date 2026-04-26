const dbName = "traffic_bi";
const database = db.getSiblingDB(dbName);

database.createCollection("accidents_fact");
database.createCollection("date_dim");
database.createCollection("location_dim");
database.createCollection("weather_dim");
database.createCollection("infrastructure_dim");

database.date_dim.createIndex({ date_key: 1 }, { unique: true, name: "uk_date_key" });

database.location_dim.createIndex(
  { city: 1, county: 1, state: 1, street: 1, zipcode: 1 },
  { unique: true, name: "uk_location_business_key" }
);
database.location_dim.createIndex({ state: 1, city: 1 }, { name: "ix_location_state_city" });
database.location_dim.createIndex({ coordinates: "2dsphere" }, { name: "ix_location_coordinates_2dsphere" });

database.weather_dim.createIndex(
  {
    weather_type: 1,
    intensity: 1,
    is_windy: 1,
    temperature: 1,
    visibility_mi: 1,
    humidity_pct: 1
  },
  { unique: true, name: "uk_weather_business_key" }
);
database.weather_dim.createIndex({ weather_type: 1, intensity: 1 }, { name: "ix_weather_type_intensity" });

database.infrastructure_dim.createIndex(
  {
    amenity: 1,
    bump: 1,
    crossing: 1,
    give_way: 1,
    junction: 1,
    no_exit: 1,
    railway: 1,
    roundabout: 1,
    station: 1,
    stop: 1,
    traffic_calming: 1,
    traffic_signal: 1,
    turning_loop: 1,
    sunrise_sunset: 1
  },
  { unique: true, name: "uk_infrastructure_business_key" }
);

database.accidents_fact.createIndex({ accident_id: 1 }, { unique: true, name: "uk_accident_id" });
database.accidents_fact.createIndex({ date_key: 1 }, { name: "ix_fact_date_key" });
database.accidents_fact.createIndex({ location_key: 1 }, { name: "ix_fact_location_key" });
database.accidents_fact.createIndex({ weather_key: 1 }, { name: "ix_fact_weather_key" });
database.accidents_fact.createIndex({ severity: 1 }, { name: "ix_fact_severity" });
database.accidents_fact.createIndex(
  { date_key: 1, location_key: 1, severity: 1, weather_key: 1 },
  { name: "ix_fact_main_analytics" }
);

print("Colecciones e indices creados en traffic_bi");
