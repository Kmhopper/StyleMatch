from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from time import sleep
import mysql.connector
import os
from dotenv import load_dotenv

# Sett opp WebDriver
options = Options()
options.add_argument("--headless")
options.add_argument("--disable-gpu")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

# Liste over URL-er for scraping
urls = [
    "https://www.weekday.com/en-no/c/men/basics/",
    "https://www.weekday.com/en-no/c/men/new-arrivals/",
    "https://www.weekday.com/en-no/c/men/",
]

try:
    all_products = []

    for url in urls:
        print(f"Scraper produkter fra: {url}")
        driver.get(url)

        # Skroll gjennom siden for å laste inn alt innhold
        print("Skroller gjennom siden for å laste inn alt innhold...")
        last_height = driver.execute_script("return document.body.scrollHeight")
        while True:
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            sleep(2)
            new_height = driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height
        print("Skroll gjennomført. Starter paginering...")

        # Paginer og hent produkter etter hver side
        while True:
            # Hent produktene på den nåværende siden
            articles = driver.find_elements(By.CSS_SELECTOR, "[data-sku]")
            print(f"Fant {len(articles)} produkter på denne siden.")

            for idx, article in enumerate(articles, start=1):
                try:
                    driver.execute_script("arguments[0].scrollIntoView();", article)
                    sleep(0.5)

                    # Navn
                    product_name_raw = article.find_element(By.XPATH, ".//div[@class='text-10 leading-14 desktop:text-12 desktop:leading-16']").text
                    product_name = product_name_raw.lower()  # Endrer til små bokstaver

                    # ID
                    product_id = article.get_attribute("data-sku") or "Ingen ID"

                    # Kategori
                    try:
                        category = product_name.split()[-1]  # Bruker det siste ordet i navnet som kategori
                        category = category.capitalize().replace("-", "")
                        
                    except IndexError:
                        category = "Unknown"
                    


                    # Pris
                    try:
                        price_element = article.find_element(By.XPATH, ".//span[@data-cy='product-card-price']")
                        raw_price = price_element.text
                    except Exception:
                        price_element = article.find_element(By.XPATH, ".//div[@data-cy='product-card-price']")
                        raw_price = price_element.text

                    price = float(raw_price.replace("NOK", "").replace(",", ".").strip())

                    # Bilde
                    image_url = article.find_element(By.XPATH, ".//div[contains(@class, 'productImageContainer')]//img[1]").get_attribute("src")

                    # Link
                    product_link = article.find_element(By.XPATH, ".//a[@class='relative block no-underline']").get_attribute("href")

                    all_products.append({
                        'product_id': product_id,
                        'name': product_name_raw,
                        'category': category,
                        'price': price,
                        'image_url': image_url,
                        'product_link': product_link
                    })
                    print(f"Produkt #{idx}: {product_name} - Kategori: {category} - Pris: {price}, Bilde: {image_url}")
                except Exception as e:
                    print(f"Feil ved henting av produkt #{idx}: {e}")


            # Sjekk om det finnes en "NEXT"-knapp
            try:
                next_button = driver.find_element(By.XPATH, "//button[contains(@class, 'flex items-center justify-center') and not(contains(@class, 'text-darkGray')) and normalize-space(text())='NEXT']")
                driver.execute_script("arguments[0].click();", next_button)
                print("Klikket på 'NEXT'-knappen.")
                sleep(2)
            except Exception:
                print("Ingen flere 'NEXT'-knapper eller alle er deaktivert. Avslutter paginering.")
                break

    print(f"Totalt antall produkter hentet: {len(all_products)}")

    load_dotenv()  # Leser inn .env-fila

    db = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )
    cursor = db.cursor()

    insert_query = """
    INSERT INTO weekday_products (product_id, name, category, price, image_url, product_link)
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
    print("Dataene er lagret i databasen!")

except Exception as e:
    print(f"Feil under kjøring: {e}")

finally:
    driver.quit()
