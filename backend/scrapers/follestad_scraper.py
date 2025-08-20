from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import mysql.connector
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import ElementClickInterceptedException
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
    "https://www.follestad.no/shop/herre/blazer/",
    "https://www.follestad.no/shop/herre/bukser/",
    "https://www.follestad.no/shop/herre/gensere/",
    "https://www.follestad.no/shop/herre/jakker/",
    "https://www.follestad.no/shop/herre/shorts/",
    "https://www.follestad.no/shop/herre/skjorter/",
    "https://www.follestad.no/shop/herre/t-skjorter-pique/"

]


def extract_category_from_url(url):
    try:
        if "herre/" in url:
            return url.split("herre/")[1].split("/")[0].replace("-", "").capitalize()
        else:
            return "Unknown"
    except Exception as e:
        print(f"Feil ved henting av kategori fra URL: {url}, Feil: {e}")
        return "Unknown"

try:
    all_products = []

    for url in urls:
        previous_count = 0
        print(f"Scraper produkter fra: {url}")
        driver.get(url)
        # Finn og klikk på "Godta" eller lignende knapp hvis den finnes
        try:
            cookie_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Godta')]"))
            )
            cookie_button.click()
            print("Cookie-banner fjernet.")
        except Exception as e:
            print("Ingen cookie-banner funnet:", e)

        # Scroll gjennom siden for å sikre at alle produkter lastes inn

        while True:
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            sleep(3)  # Øk forsinkelsen til 3 sekunder for å gi nettsiden tid til å laste inn

            # Hent antall synlige produkter etter skroll
            current_count = len(driver.find_elements(By.CSS_SELECTOR, "div[data-product-listing-result-id]"))

            if current_count == previous_count:  # Hvis antallet synlige produkter ikke øker, avslutt
                print("Alle produkter lastet inn.")
                break

            previous_count = current_count



        # Hent produkter fra siden
        articles = driver.find_elements(By.CSS_SELECTOR, "div[data-product-listing-result-id]")

        for article in articles:
            try:
                # Navn
                product_name_element = article.find_element(By.XPATH, ".//h3[@class='title']")
                product_name = product_name_element.text or "Ingen navn"

                # ID
                product_id = article.get_attribute("data-product-listing-result-id") or "Ingen ID"

                # Kategori
                category = extract_category_from_url(url)

                # Pris
                try:
                    # Først sjekk om det finnes en nedsatt pris
                    sale_price_element = article.find_element(By.XPATH, ".//ins[@class='price-sale font-weight-bold']")
                    price = sale_price_element.text.strip().replace("–", "").replace(",", ".").strip()
                except:
                    # Hvis ikke, bruk den vanlige prisen
                    try:
                        price_element = article.find_element(By.XPATH, ".//div[contains(@class, 'price-regular')]")
                        price = price_element.text.strip().replace("–", "").replace(",", ".").strip()
                    except:
                        price = "0.00"
                try:
                    price = float(price)
                except ValueError:
                    price = 0.00  # Hvis noe går galt, sett pris til 0


                # Bilde-URL
                try:
                    image_element = article.find_element(By.XPATH, ".//img[@class='attachment-medium size-medium']")
                    image_url = image_element.get_attribute("src") or "Ingen bilde"
                except Exception as e:
                    image_url = "Ingen bilde"
                    print(f"Feil ved henting av bilde: {e}")

                # Produktlenke
                try:
                    link_element = article.find_element(By.XPATH, ".//a[@class='title-price-wrapper']")
                    product_link = link_element.get_attribute("href") or "Ingen lenke"
                except Exception as e:
                    product_link = "Ingen lenke"
                    print(f"Feil ved henting av produktlenke: {e}")


                # Legg produktet til listen
                all_products.append({
                    'product_id': product_id,
                    'name': product_name,
                    'category': category,
                    'price': price,
                    'image_url': image_url,
                    'product_link': product_link
                })

                print(f"Produkt: {product_name} - Kategori: {category} - Pris: {price} - Bilde: {image_url} - Lenke: {product_link}")
            
            except Exception as e:
                print(f"Feil ved behandling av produkt: {e}")

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
    INSERT INTO follestad_products (product_id, name, category, price, image_url, product_link)
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
