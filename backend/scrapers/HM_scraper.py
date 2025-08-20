from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import mysql.connector
import os
from dotenv import load_dotenv
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import ElementClickInterceptedException
from time import sleep

# Sett opp WebDriver
options = Options()
options.add_argument("--headless")
options.add_argument("--disable-gpu")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

# Naviger til nettsiden
url = "https://www2.hm.com/no_no/herre/produkter/se-alle.html"
driver.get(url)

def extract_category(name):
    try:

        # Gjør teksten til små bokstaver
        name_lower = name.lower()
        # Sjekk om "men_" finnes i navnet
        if "men_" in name:
            # Del opp strengen etter "men_" og ta første delen
            category = name.split("men_")[1].split("_")[0]
            return category.capitalize()  # Gjør første bokstav stor for estetikk
        else:
            return "Unknown"  # Returner "Unknown" hvis "men_" ikke finnes
    except Exception as e:
        print(f"Feil ved behandling av navn {name}: {e}")
        return "Unknown"
    
def format_name(name):
    try:
        # Fjern "men_" hvis det finnes
        name = name.replace("men_", "")
        # Erstatt "_" med mellomrom
        name = name.replace("_", " ")
        # Gjør første bokstav i hvert ord stor

        return name.upper()
    except Exception as e:
        print(f"Feil ved formatering av navn {name}: {e}")
        return name

try:
    # Finn og klikk på "Godta" eller lignende knapp
    cookie_button = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Godta')]"))
    )
    cookie_button.click()
    print("Cookie-banner fjernet.")
except Exception as e:
    print("Ingen cookie-banner funnet:", e)


try:
    products = []

    while True:
        # Scroll gjennom siden for å sikre at alle elementer er lastet
        body = driver.find_element(By.TAG_NAME, 'body')
        for _ in range(10):  # Juster antallet iterasjoner hvis nødvendig
            body.send_keys(Keys.PAGE_DOWN)
            sleep(0.5)  # Vent litt for å sikre at innholdet lastes inn

        # Vent til artiklene er synlige
        WebDriverWait(driver, 10).until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "[data-articlecode]")))

        articles = driver.find_elements(By.CSS_SELECTOR, "[data-articlecode]")

        # Hent data fra artiklene
        for article in articles:
            #Navn
            product_name_raw = article.get_attribute("data-category") or "Ingen navn"
            product_name = format_name(product_name_raw)

            #ID
            product_id = article.get_attribute("data-articlecode") or "Ingen ID"

            # Bruk funksjonen til å trekke ut kategori fra "name"
            category = extract_category(product_name_raw)

            # Finn prisen
            try:
                price_element = article.find_element(By.XPATH, ".//span[@class='aeecde ac3d9e']")
                price = price_element.text.strip().replace("kr.", "").replace(",", ".").replace(" ", "").strip() if price_element else "0.00"
            except:
                price = "0.00"

            # Finn bilde-URL
            image_url = "Ingen bilde"
            try:
                image_element = article.find_element(By.XPATH, ".//li[contains(@class, 'splide__slide is-active is-visible')]//img[@imagetype='PRODUCT_IMAGE']")
                image_url = image_element.get_attribute("src")
            except Exception as e:
                pass

            # Finner lenke til produktet
            product_link = "Ingen lenke"
            try:
                link_element = article.find_element(By.XPATH, ".//a[@aria-hidden='false']")
                product_link = link_element.get_attribute("href")
            except Exception as e:
                print(f"Feil ved henting av lenke for {product_name}: {e}")
           
            print(product_name + ": " + category + ": " + price + ": " + product_link)

            # Legg til produktet i listen
            products.append({
                'product_id': product_id,
                'name': product_name,
                'category': category,
                'price': price,
                'image_url': image_url,
                'product_link': product_link
            })


        # Forsøk å klikke på "Last inn neste side"-knappen
        try:
            next_button = driver.find_element(By.XPATH, "//button[@class='f05bd4 aaa2a2 ab0e07 fba624']")
            driver.execute_script("arguments[0].scrollIntoView();", next_button)  # Scroll til knappen
            sleep(1)  # Vent litt for å sikre at knappen er synlig
            next_button.click()
            print("Trykket next")
            sleep(2)  # Vent til innholdet på neste side lastes
        except ElementClickInterceptedException as e:
            print("Knappen er blokkert av et annet element. Forsøker å fjerne blokkeringen.")
            driver.execute_script("window.scrollBy(0, -100);")
            sleep(1)
            next_button.click()
        except Exception as e:
            print("Ingen flere sider å laste inn eller feil oppstod:", e)
            break

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
    INSERT INTO hm_products (product_id, name, category, price, image_url, product_link)
    VALUES (%s, %s, %s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE
        category = VALUES(category),
        price = VALUES(price),
        image_url = VALUES(image_url),
        product_link = VALUES(product_link);
    """

    for product in products:
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
