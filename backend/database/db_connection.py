import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

def save_products(products, table_name):
    """Lagrer en liste med produkter til databasen."""
    db = get_db_connection()
    cursor = db.cursor()

    query = f"""
    INSERT INTO {table_name} (product_id, name, category, price, image_url, product_link)
    VALUES (%s, %s, %s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE
        category = VALUES(category),
        price = VALUES(price),
        image_url = VALUES(image_url),
        product_link = VALUES(product_link);
    """

    cursor.executemany(query, products)
    db.commit()
    cursor.close()
    db.close()
    print(f"[DB] Lagret {len(products)} produkter i {table_name}")
