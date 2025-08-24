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
from selenium.common.exceptions import ElementClickInterceptedException, TimeoutException, StaleElementReferenceException
from time import sleep
import re

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
        name_lower = name.lower()
        if "men_" in name:
            category = name.split("men_")[1].split("_")[0]
            return category.capitalize()
        else:
            return "Unknown"
    except Exception as e:
        print(f"Feil ved behandling av navn {name}: {e}")
        return "Unknown"
    
def format_name(name):
    try:
        name = name.replace("men_", "")
        name = name.replace("_", " ")
        return name.upper()
    except Exception as e:
        print(f"Feil ved formatering av navn {name}: {e}")
        return name

# --- Bildehjelpere (robust og stram) -----------------------------------------

def _pick_biggest_from_srcset(srcset: str):
    """
    Velger URL med høyeste 'w' fra srcset. Hopper over data:image.
    """
    best_url, best_w = None, -1
    for part in srcset.split(","):
        part = part.strip()
        if not part or part.startswith("data:"):
            continue
        tokens = part.split()
        if len(tokens) < 2:
            continue
        url = " ".join(tokens[:-1])
        w = tokens[-1]
        if w.endswith("w"):
            try:
                width = int(w[:-1])
            except ValueError:
                continue
            if width > best_w:
                best_w = width
                best_url = url
    return best_url

def extract_hm_image_url(article, driver, timeout=8) -> str:
    """
    Henter bilde KUN fra H&Ms next/image-container for dette produktkortet.
    Venter til ekte URL (ikke data:image) og plukker høyeste oppløsning fra srcset.
    Returnerer 'Ingen bilde' hvis ikke tilgjengelig.
    """
    image_url = "Ingen bilde"
    # Trigger lazy-loading
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", article)

    img = WebDriverWait(article, timeout).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "div[data-testid='next-image'] img"))
    )

    # Vent til srcset/src er ekte nettadresse (ikke blur-placeholder)
    WebDriverWait(driver, timeout).until(
        lambda d: (
            (img.get_attribute("srcset") and "image.hm.com" in (img.get_attribute("srcset") or ""))
            or (img.get_attribute("src") and img.get_attribute("src").startswith("http"))
        )
    )

    srcset = img.get_attribute("srcset") or ""
    if "image.hm.com" in srcset:
        url = _pick_biggest_from_srcset(srcset)
        if url:
            return url

    # Fallback til samme element sin src/currentSrc (IKKE andre bilder)
    url = driver.execute_script("return arguments[0].currentSrc || arguments[0].src || '';", img) or ""
    if url.startswith("http") and "image.hm.com" in url and not url.startswith("data:"):
        # Tving gjerne høy oppløsning dersom query har imwidth=
        url = re.sub(r"imwidth=\d+", "imwidth=1536", url)
        return url

    return image_url

# ---------------------------------------------------------------------------

try:
    # Finn og klikk på "Godta" eller lignende knapp
    try:
        cookie_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Godta')]"))
        )
        cookie_button.click()
        print("Cookie-banner fjernet.")
    except Exception as e:
        print("Ingen cookie-banner funnet:", e)

    products = []

    while True:
        # Scroll gjennom siden for å sikre at alle elementer er lastet
        body = driver.find_element(By.TAG_NAME, 'body')
        for _ in range(10):
            body.send_keys(Keys.PAGE_DOWN)
            sleep(0.5)

        # Vent til artiklene er synlige
        WebDriverWait(driver, 10).until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, "[data-articlecode]"))
        )

        # Hent ferske elementer og frys ID-ene (unngå stale referanser)
        articles = driver.find_elements(By.CSS_SELECTOR, "[data-articlecode]")
        article_ids = []
        for a in articles:
            try:
                aid = a.get_attribute("data-articlecode")
                if aid:
                    article_ids.append(aid)
            except StaleElementReferenceException:
                continue

        # Hent data per ID – finn artikkelen på nytt hver gang
        for aid in article_ids:
            try:
                article = driver.find_element(By.CSS_SELECTOR, f"[data-articlecode='{aid}']")
            except Exception:
                # Artikkelen kan ha forsvunnet ved reflow – hopp over
                continue

            # Navn
            product_name_raw = article.get_attribute("data-category") or "Ingen navn"
            product_name = format_name(product_name_raw)

            # ID
            product_id = aid

            # Kategori
            category = extract_category(product_name_raw)

            # Pris
            try:
                price_element = article.find_element(By.XPATH, ".//span[@class='d1595b a0daa7']")
                price = price_element.text.strip().replace("kr.", "").replace(",", ".").replace(" ", "").strip() if price_element else "0.00"
            except Exception:
                price = "0.00"

            # Bilde-URL (med liten retry hvis stale midt i ventingen)
            image_url = "Ingen bilde"
            for _ in range(2):
                try:
                    image_url = extract_hm_image_url(article, driver)
                    break
                except StaleElementReferenceException:
                    sleep(0.2)
                    try:
                        article = driver.find_element(By.CSS_SELECTOR, f"[data-articlecode='{aid}']")
                    except Exception:
                        break

            # Produktlenke
            product_link = "Ingen lenke"
            try:
                link_element = article.find_element(By.XPATH, ".//a[@aria-hidden='false']")
                product_link = link_element.get_attribute("href")
            except Exception as e:
                print(f"Feil ved henting av lenke for {product_name}: {e}")
           
            print(product_name + ": " + category + ": " + price + ": " + product_link + " : " + image_url)

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
            # Marker et gammelt element for staleness-wait etter klikk
            old_marker = None
            try:
                old_marker = driver.find_element(By.CSS_SELECTOR, "[data-articlecode]")
            except Exception:
                pass

            next_button = driver.find_element(By.XPATH, "//button[@class='c6078b c077ca eeaa17']")
            driver.execute_script("arguments[0].scrollIntoView();", next_button)
            sleep(1)
            next_button.click()
            print("Trykket next")

            # Vent til forrige innhold er borte og neste er lastet
            if old_marker:
                WebDriverWait(driver, 10).until(EC.staleness_of(old_marker))
            WebDriverWait(driver, 10).until(
                EC.presence_of_all_elements_located((By.CSS_SELECTOR, "[data-articlecode]"))
            )
            sleep(1.5)  # gi litt tid til lazy-loading

        except ElementClickInterceptedException as e:
            print("Knappen er blokkert av et annet element. Forsøker å fjerne blokkeringen.")
            driver.execute_script("window.scrollBy(0, -100);")
            sleep(1)
            try:
                next_button = driver.find_element(By.XPATH, "//button[@class='c6078b c077ca eeaa17']")
                next_button.click()
            except Exception:
                print("Klikk feilet fortsatt.")
                break
        except Exception as e:
            print("Ingen flere sider å laste inn eller feil oppstod:", e)
            break

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
    try:
        driver.quit()
    except Exception:
        pass
