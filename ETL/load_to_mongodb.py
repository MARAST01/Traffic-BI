import argparse
import hashlib
from datetime import datetime

import pandas as pd
from pymongo import MongoClient, UpdateOne


def normalize_text(value):
    if pd.isna(value):
        return None
    return str(value).strip().lower()


def safe_bool(value):
    if pd.isna(value):
        return None
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text in ("true", "1", "t", "yes", "y"):
        return True
    if text in ("false", "0", "f", "no", "n"):
        return False
    return None


def extract_intensity(text):
    if text is None:
        return None
    if "light" in text:
        return "light"
    if "heavy" in text:
        return "heavy"
    return "normal"


def unify_terms(text):
    if text is None:
        return None
    text = text.replace("t-storm", "thunderstorm")
    text = text.replace("tstorm", "thunderstorm")
    text = text.replace("showers", "shower")
    text = text.replace("wintry mix", "sleet")
    text = text.replace("ice pellets", "sleet")
    return text


def categorize_weather(text):
    if text is None or text == "":
        return None
    if "snow" in text:
        return "snow"
    if "sleet" in text:
        return "sleet"
    if "rain" in text or "drizzle" in text:
        return "rain"
    if "fog" in text or "mist" in text:
        return "fog"
    if "cloud" in text or "overcast" in text:
        return "cloudy"
    if "clear" in text or "fair" in text:
        return "clear"
    if "hail" in text or "ice" in text:
        return "hail"
    if "dust" in text or "sand" in text or "smoke" in text:
        return "dust/smoke"
    if "tornado" in text or "funnel cloud" in text or "squalls" in text:
        return "extreme"
    if "thunder" in text:
        return "thunderstorm"
    return "other"


def build_key(prefix, values):
    raw = "|".join("" if v is None else str(v) for v in values)
    digest = hashlib.sha1(raw.encode("utf-8")).hexdigest()
    return f"{prefix}_{digest}"


def transform_chunk(df):
    df = df.copy()

    df["City"] = df["City"].map(normalize_text)
    df["Street"] = df["Street"].map(normalize_text)
    df["County"] = df["County"].map(normalize_text)
    df["State"] = df["State"].map(normalize_text)

    weather_clean = df["Weather_Condition"].map(normalize_text)
    is_windy = df["Weather_Condition"].astype("string").str.contains("/ Windy", na=False)
    is_windy = is_windy.where(df["Weather_Condition"].notna(), None)
    weather_clean = weather_clean.str.replace(" / windy", "", regex=False)
    intensity = weather_clean.map(extract_intensity)
    weather_clean = weather_clean.str.replace(r"\blight\b|\bheavy\b", "", regex=True).str.strip()
    weather_clean = weather_clean.map(unify_terms)
    weather_type = weather_clean.map(categorize_weather)

    df["is_windy"] = is_windy
    df["intensity"] = intensity
    df["weather_type"] = weather_type

    df["Temperature"] = (df["Temperature(F)"] - 32) * 5 / 9
    df["Start_Time"] = df["Start_Time"].astype("string").str.split(".").str[0]
    df["Start_Time"] = pd.to_datetime(df["Start_Time"], errors="coerce")
    df = df[df["Start_Time"].notna()]

    df = df[
        (df["Temperature"].between(-50, 60, inclusive="both"))
        & (df["Visibility(mi)"].between(0, 20, inclusive="both"))
        & (df["Humidity(%)"].between(0, 100, inclusive="both"))
    ]
    df = df.rename(
        columns={
            "Visibility(mi)": "visibility_mi",
            "Humidity(%)": "humidity_pct",
            "Start_Lat": "start_lat",
            "Start_Lng": "start_lng",
            "Give_Way": "give_way",
            "No_Exit": "no_exit",
            "Traffic_Calming": "traffic_calming",
            "Traffic_Signal": "traffic_signal",
            "Turning_Loop": "turning_loop",
            "Sunrise_Sunset": "sunrise_sunset",
        }
    )
    return df


def load_data(args):
    client = MongoClient(args.mongo_uri)
    db = client[args.db_name]

    date_dim = db["date_dim"]
    location_dim = db["location_dim"]
    weather_dim = db["weather_dim"]
    infrastructure_dim = db["infrastructure_dim"]
    fact = db["accidents_fact"]

    use_cols = [
        "ID",
        "Severity",
        "Start_Time",
        "Start_Lat",
        "Start_Lng",
        "Street",
        "City",
        "County",
        "State",
        "Zipcode",
        "Temperature(F)",
        "Visibility(mi)",
        "Humidity(%)",
        "Weather_Condition",
        "Amenity",
        "Bump",
        "Crossing",
        "Give_Way",
        "Junction",
        "No_Exit",
        "Railway",
        "Roundabout",
        "Station",
        "Stop",
        "Traffic_Calming",
        "Traffic_Signal",
        "Turning_Loop",
        "Sunrise_Sunset",
    ]

    total_loaded = 0
    chunk_number = 0

    for chunk in pd.read_csv(args.csv_path, usecols=use_cols, chunksize=args.chunk_size):
        chunk_number += 1
        df = transform_chunk(chunk)

        date_ops = []
        location_ops = []
        weather_ops = []
        infra_ops = []
        fact_ops = []

        for row in df.itertuples(index=False):
            start_time = row.Start_Time.to_pydatetime()
            date_key = int(start_time.strftime("%Y%m%d"))

            date_doc = {
                "_id": f"date_{date_key}",
                "date_key": date_key,
                "date": datetime(start_time.year, start_time.month, start_time.day),
                "year": start_time.year,
                "quarter": ((start_time.month - 1) // 3) + 1,
                "month": start_time.month,
                "day": start_time.day,
                "hour": start_time.hour,
                "day_of_week": start_time.weekday(),
                "week_of_year": int(start_time.strftime("%U")),
            }
            date_ops.append(UpdateOne({"_id": date_doc["_id"]}, {"$setOnInsert": date_doc}, upsert=True))

            location_key = build_key(
                "loc",
                [row.City, row.County, row.State, row.Street, row.Zipcode],
            )
            location_doc = {
                "_id": location_key,
                "city": row.City,
                "county": row.County,
                "state": row.State,
                "street": row.Street,
                "zipcode": str(row.Zipcode) if not pd.isna(row.Zipcode) else None,
                "coordinates": {
                    "type": "Point",
                    "coordinates": [
                        float(row.start_lng) if not pd.isna(row.start_lng) else None,
                        float(row.start_lat) if not pd.isna(row.start_lat) else None,
                    ],
                },
            }
            location_ops.append(UpdateOne({"_id": location_key}, {"$setOnInsert": location_doc}, upsert=True))

            weather_key = build_key(
                "wth",
                [
                    row.weather_type,
                    row.intensity,
                    row.is_windy,
                    row.Temperature,
                    row.visibility_mi,
                    row.humidity_pct,
                ],
            )
            weather_doc = {
                "_id": weather_key,
                "weather_type": row.weather_type,
                "intensity": row.intensity,
                "is_windy": safe_bool(row.is_windy),
                "temperature": float(row.Temperature) if not pd.isna(row.Temperature) else None,
                "visibility_mi": float(row.visibility_mi) if not pd.isna(row.visibility_mi) else None,
                "humidity_pct": float(row.humidity_pct) if not pd.isna(row.humidity_pct) else None,
            }
            weather_ops.append(UpdateOne({"_id": weather_key}, {"$setOnInsert": weather_doc}, upsert=True))

            infra_key = build_key(
                "inf",
                [
                    row.Amenity,
                    row.Bump,
                    row.Crossing,
                    row.give_way,
                    row.Junction,
                    row.no_exit,
                    row.Railway,
                    row.Roundabout,
                    row.Station,
                    row.Stop,
                    row.traffic_calming,
                    row.traffic_signal,
                    row.turning_loop,
                    row.sunrise_sunset,
                ],
            )
            infra_doc = {
                "_id": infra_key,
                "amenity": safe_bool(row.Amenity),
                "bump": safe_bool(row.Bump),
                "crossing": safe_bool(row.Crossing),
                "give_way": safe_bool(row.give_way),
                "junction": safe_bool(row.Junction),
                "no_exit": safe_bool(row.no_exit),
                "railway": safe_bool(row.Railway),
                "roundabout": safe_bool(row.Roundabout),
                "station": safe_bool(row.Station),
                "stop": safe_bool(row.Stop),
                "traffic_calming": safe_bool(row.traffic_calming),
                "traffic_signal": safe_bool(row.traffic_signal),
                "turning_loop": safe_bool(row.turning_loop),
                "sunrise_sunset": normalize_text(row.sunrise_sunset),
            }
            infra_ops.append(UpdateOne({"_id": infra_key}, {"$setOnInsert": infra_doc}, upsert=True))

            fact_doc = {
                "accident_id": row.ID,
                "severity": int(row.Severity) if not pd.isna(row.Severity) else None,
                "start_time": start_time,
                "date_key": date_doc["_id"],
                "location_key": location_key,
                "weather_key": weather_key,
                "infrastructure_key": infra_key,
            }
            fact_ops.append(UpdateOne({"accident_id": row.ID}, {"$set": fact_doc}, upsert=True))

        if date_ops:
            date_dim.bulk_write(date_ops, ordered=False)
            location_dim.bulk_write(location_ops, ordered=False)
            weather_dim.bulk_write(weather_ops, ordered=False)
            infrastructure_dim.bulk_write(infra_ops, ordered=False)
            fact.bulk_write(fact_ops, ordered=False)

        total_loaded += len(fact_ops)
        print(f"Chunk {chunk_number} cargado. Filas fact: {len(fact_ops)}. Total acumulado: {total_loaded}")

    print(f"Carga terminada. Total de registros en fact procesados: {total_loaded}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Carga ETL a MongoDB con modelo multidimensional.")
    parser.add_argument("--mongo-uri", default="mongodb://traffic_bi_app:change_this_app_password@localhost:27017/traffic_bi?authSource=traffic_bi")
    parser.add_argument("--db-name", default="traffic_bi")
    parser.add_argument("--csv-path", default="ETL/US_Accidents_March23.csv")
    parser.add_argument("--chunk-size", type=int, default=50000)
    args = parser.parse_args()
    load_data(args)
