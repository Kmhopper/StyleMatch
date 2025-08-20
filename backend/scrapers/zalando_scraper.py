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
    "https://www.zalando.no/herreklaer-tshirt-basic/",
    "https://www.zalando.no/herreklaer-tshirts-print/",
    "https://www.zalando.no/herreklaer-overdeler-poloshirts/",
    "https://www.zalando.no/herreklaer-fritdsskjorter/",
    "https://www.zalando.no/herreklaer-finskjorter/",
    "https://www.zalando.no/herreklaer-gensere-hettegensere/",
    "https://www.zalando.no/sweatshirts-herre/",
    "https://www.zalando.no/fleecegensere-herre/",
    "https://www.zalando.no/herreklaer-bukser-chinos/",
    "https://www.zalando.no/herreklaer-buker-stoffbukser/",
    "https://www.zalando.no/herreklaer-jeans-straight-leg/",
    "https://www.zalando.no/herreklaer-jeans-loose-fit/",
    "https://www.zalando.no/herreklaer-dresser-finskjorter/",
    "https://www.zalando.no/herreklaer-dresser-bukser/",
    "https://www.zalando.no/herreklaer-dresser-vester/",
    "https://www.zalando.no/herreklaer-jakker-dressjakker/"
]

# Funksjon for å hente kategori fra URL
def extract_category_from_url(url):
    try:
        if "herreklaer-" in url:
            return url.split("herreklaer-")[1].split("/")[0].replace("-", " ").capitalize()
        elif "sportsklaer-" in url:
            return url.split("sportsklaer-")[1].split("/")[0].replace("-", " ").capitalize()
        elif "sweatshirts-" in url:
            return "Sweatshirts"
        elif "fleecegensere-" in url:
            return "Fleecegensere"
        else:
            return "Unknown"
    except Exception as e:
        print(f"Feil ved henting av kategori fra URL: {url}, Feil: {e}")
        return "Unknown"

try:
    all_products = []

    for url in urls:
        print(f"Scraper produkter fra: {url}")
        driver.get(url)

        #Kategori
        category = extract_category_from_url(url)
        
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

        pagination_active = True

        while pagination_active:
            # Hent produktene på den nåværende siden
            articles = driver.find_elements(By.CSS_SELECTOR, "[data-trckng-component]")
            print(f"Fant {len(articles)} produkter på denne siden.")

            for idx, article in enumerate(articles, start=1):
                try:
                    driver.execute_script("arguments[0].scrollIntoView();", article)
                    sleep(0.5)

                    # Navn
                    product_name_element = article.find_element(By.XPATH, ".//h3[contains(@class, 'voFjEy') and contains(@class, 'lystZ1')]")
                    product_name = product_name_element.text
                    product_name = product_name.upper()

                    # ID
                    product_id = article.get_attribute("data-trckng-component") or "Ingen ID"

                    # Pris
                    try:
                        price_parent = article.find_element(By.XPATH, ".//p[contains(@class, 'voFjEy _2kjxJ6 m3OCL3 HlZ_Tf _0xLoFW u9KIT8 _7ckuOK vSgP6A')]")
                        price_element = price_parent.find_element(By.XPATH, ".//span[last()]")
                        raw_price = price_element.get_attribute("innerText")
                        raw_price = raw_price.replace("\u00a0", "").replace("kr", "").replace(",", ".").strip()
                        price = float(raw_price) if raw_price else 0.0
                    except Exception as e:
                        price = 0.0
                        print(f"Kunne ikke hente prisen: {e}")

                    # Bilde
                    try:
                        image_url = article.find_element(By.XPATH, ".//img").get_attribute("src")
                    except Exception:
                        image_url = "Ingen bilde"

                    # Link
                    try:
                        product_link = article.find_element(By.XPATH, ".//a").get_attribute("href")
                    except Exception:
                        product_link = "Ingen lenke"

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

            # Sjekk om det finnes en "Neste side"-knapp
            try:
                next_button = driver.find_element(By.XPATH, "//a[@data-testid='pagination-next']")
                next_button_class = next_button.get_attribute("class")

                if "AbrXsY" in next_button_class:  # Klassen for deaktivert knapp
                    print("Ingen flere sider. 'Neste side'-knappen er deaktivert.")
                    pagination_active = False
                else:
                    print("Klikker på 'Neste side'-knappen.")
                    driver.execute_script("arguments[0].click();", next_button)
                    sleep(2)

            except Exception as e:
                print(f"Feil ved forsøk på å klikke 'Neste side'-knappen: {e}")
                pagination_active = False

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
    INSERT INTO zalando_products (product_id, name, category, price, image_url, product_link)
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
