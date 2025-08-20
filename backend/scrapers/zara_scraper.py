from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import mysql.connector
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from time import sleep
import os
from dotenv import load_dotenv


# Sett opp WebDriver
options = Options()
options.add_argument("--headless")
options.add_argument("--disable-gpu")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

# Naviger til nettsiden
urls = [
    "https://www.zara.com/no/no/mann-salg-l7139.html?v1=2444848",
    "https://www.zara.com/no/no/mann-salg-l7139.html?v1=2444333",
    "https://www.zara.com/no/no/mann-salg-l7139.html?v1=2444334",

]

def extract_category_zara(name):
    try:
        # Liste over mulige kategorier
        categories = [
            "bukse", "frakk", "jakke", "tskjorte", "genser", "skjorte",
            "shorts", "jeans", "chinos", "cardigan", "sweatshirt", "dress",
            "blazer", "vest", "kåpe", "trenchcoat", "overdel", "underdel",
            "badetøy", "treningstøy", "lue", "skjerf", "hansker", "skjortejakke",
            "treningstrøye", "hettegenser", "polo", "tanktop", "kardigan", "pyjamas",
            "pyjamassett", "kompresjonstrøye", "parkas", "kompresjonstights"
        ]

        # Normalisering: håndter spesifikke tilfeller
        name_lower = name.lower().replace("t-skjorte", "tskjorte")

        # Fjern generelle bindestreker for å matche alle kategorier
        name_lower = name_lower.replace("-", "")

        # Søk etter første matchende kategori i navnet
        for category in categories:
            if category in name_lower:
                return category.capitalize()

        # Hvis ingen match, returner "Unknown"
        return "Unknown"
    except Exception as e:
        print(f"Feil ved behandling av navn {name}: {e}")
        return "Unknown"



try:
    all_products = []

    for url in urls:
        print(f"Scraper produkter fra: {url}")
        driver.get(url)

        # Scroll nedover for å laste inn flere produkter (lazy loading)
        last_height = driver.execute_script("return document.body.scrollHeight")
        while True:
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            sleep(2)  # Vent litt for at produktene skal lastes inn

            # Sjekk om vi har nådd bunnen
            new_height = driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height
        # Vent til artiklene er synlige
        WebDriverWait(driver, 10).until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "[data-productid]")))

        articles = driver.find_elements(By.CSS_SELECTOR, "[data-productid]")

        # Hent data

        for idx, article in enumerate(articles, start=1):
            try:
                driver.execute_script("arguments[0].scrollIntoView();", article)
                sleep(1)  # Vent litt for å sikre at alt er lastet

                #Navn
                product_name = article.find_element(By.XPATH, ".//a[@class='product-link _item product-grid-product-info__name link']").text

                #ID
                product_id = article.get_attribute("data-productid") or "Ingen ID"

                #Kategori
                category = extract_category_zara(product_name)

                #Pris
                try:
                    price_element = article.find_element(By.XPATH, ".//span[contains(@class, 'money-amount__main')]")
                    raw_price = price_element.text
                    # Fjern mellomrom og formater prisen
                    price = raw_price.replace("NOK", "").replace(",", ".").replace(" ", "").strip()
                    if not price:
                        price = "0.00"
                    # Valider og konverter prisen til et desimaltall
                    try:
                        price = float(price)
                    except ValueError:
                        price = 0.00
                    #print(f"Pris funnet: {raw_price} - Etter formattering: {price}")
                except Exception as e:
                    price = "0.00"
                    print(f"Feil ved henting av pris: {e}")


                try:
                    image_element = article.find_element(By.XPATH, ".//img[contains(@class, 'media-image__image')]")
                    image_url = image_element.get_attribute("src")
                except Exception as e:
                    image_url = "Ingen bilde"
                    print(f"Feil ved henting av bilde for {product_name}: {e}")

                try:
                    link_element = article.find_element(By.XPATH, ".//a[@class='product-link product-grid-product__link link']")
                    product_link = link_element.get_attribute("href")
                except Exception as e:
                    product_link = "Ingen lenke"
                    print(f"Feil ved henting av lenke for {product_name}: {e}")

                all_products.append({
                    'product_id': product_id,
                    'name': product_name,
                    'category': category,
                    'price': price,
                    'image_url': image_url,
                    'product_link': product_link
                })
                print(f"Produkt #{idx}: {product_name} - Pris: {price}, Bilde: {image_url}, Kategori: {category}")

            except Exception as e:
                print(f"Feil ved henting av produkt #{idx}: {e}")


    driver.quit()

    load_dotenv()  # Leser inn .env-fila

    db = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

    cursor = db.cursor()

    # Sett inn data i tabellen
    insert_query = """
    INSERT INTO zara_products (product_id, name, category, price, image_url, product_link)
    VALUES (%s, %s, %s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE
        category = VALUES(category),
        price = VALUES(price),
        image_url = VALUES(image_url),
        product_link = VALUES(product_link);
    """

    for product in all_products:
        try:
            cursor.execute(insert_query, (
                product['product_id'],
                product['name'],
                product['category'],
                product['price'],
                product['image_url'],
                product['product_link']
            ))
            print(f"Lagrer produkt: {product['name']} med lenke {product['product_link']}")
        except mysql.connector.Error as db_err:
            print(f"Databasefeil for {product['name']}: {db_err}")

    db.commit()
    cursor.close()
    db.close()

    print("Dataene er lagret eller oppdatert i databasen!")

except Exception as e:
    print(f"Error: {e}")
finally:
    driver.quit()
