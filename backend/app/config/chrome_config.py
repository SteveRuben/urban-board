from selenium.webdriver.chrome.options import Options

def get_chrome_options(headless=True):
    options = Options()
    
    if headless:
        options.add_argument('--headless')
    
    # Options de sécurité
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--window-size=1920,1080')
    
    # Permissions média
    prefs = {
        "profile.default_content_setting_values.media_stream_mic": 1,
        "profile.default_content_setting_values.media_stream_camera": 1,
        "profile.default_content_setting_values.notifications": 1
    }
    options.add_experimental_option("prefs", prefs)
    options.add_argument('--use-fake-ui-for-media-stream')
    
    return options