from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import ElementClickInterceptedException
from time import sleep
import sys
import os

# Legg til backend-mappen i Python-path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from database.db_connection import save_products

# Sett opp WebDriver
options = Options()
# options.add_argument("--headless")  # Midlertidig deaktivert for debugging
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

        # Vent litt ekstra etter siste scroll for å sikre at alt er lastet
        sleep(2)
        print(f"Fant totalt {current_count} produkter på siden.")
        
        # Scroll tilbake til toppen
        driver.execute_script("window.scrollTo(0, 0);")
        sleep(1)

        # Hent produkter fra siden
        articles = driver.find_elements(By.CSS_SELECTOR, "div[data-product-listing-result-id]")

        for idx, article in enumerate(articles):
            try:
                # Scroll produktet inn i viewport for å trigge lazy loading
                driver.execute_script("arguments[0].scrollIntoView({block: 'center', behavior: 'smooth'});", article)
                sleep(2)  # Øk ventetiden ytterligere
                
                # Navn - prøv flere metoder
                product_name = "Ingen navn"
                
                # Metode 1: Hent fra link title (mest pålitelig basert på test)
                try:
                    links = article.find_elements(By.CSS_SELECTOR, "a[title]")
                    for link in links:
                        title = link.get_attribute("title")
                        if title and "Legg" not in title and "ønskeliste" not in title and "handlekurv" not in title and title.strip():
                            product_name = title.strip()
                            break
                except Exception as e:
                    print(f"Produkt {idx}: Kunne ikke hente fra link title: {e}")
                
                # Metode 2: Hvis fortsatt "Ingen navn", prøv h3.title
                if product_name == "Ingen navn":
                    try:
                        product_name_element = article.find_element(By.CSS_SELECTOR, "h3.title")
                        if product_name_element.text.strip():
                            product_name = product_name_element.text.strip()
                    except Exception as e:
                        print(f"Produkt {idx}: Kunne ikke hente fra h3.title: {e}")

                # ID
                product_id = article.get_attribute("data-product-listing-result-id") or "Ingen ID"

                # Kategori
                category = extract_category_from_url(url)

                # Pris - søk i price div
                try:
                    # Først sjekk om det finnes en nedsatt pris
                    sale_price_element = article.find_element(By.CSS_SELECTOR, "div.price ins.price-sale")
                    price_text = sale_price_element.text.strip()
                except:
                    # Hvis ikke, bruk den vanlige prisen
                    try:
                        price_element = article.find_element(By.CSS_SELECTOR, "div.price-regular")
                        price_text = price_element.text.strip()
                    except:
                        price_text = "0"
                        print(f"Kunne ikke finne pris for produkt")
                
                # Rens og konverter pris
                try:
                    # Fjern "kr", komma, mellomrom og andre tegn, beholde bare tall og punktum
                    price_text = price_text.replace("kr", "").replace(",", "").replace("–", "").replace(" ", "").strip()
                    price = float(price_text) if price_text else 0.00
                except ValueError:
                    price = 0.00  # Hvis noe går galt, sett pris til 0
                    print(f"Kunne ikke konvertere pris: {price_text}")


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

    # Forbered data for database (konverter fra dict til tupler)
    product_data = [
        (
            product['product_id'],
            product['name'],
            product['category'],
            product['price'],
            product['image_url'],
            product['product_link']
        )
        for product in all_products
    ]

    # Lagre produkter ved hjelp av db_connection
    save_products(product_data, 'follestad_products')
    print("Dataene er lagret eller oppdatert i databasen!")

except Exception as e:
    print(f"Error: {e}")
finally:
    driver.quit()