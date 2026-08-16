import re
import uuid
from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:4173"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PUBLIC_ROUTES = {
    "/": '[data-featured-treatments]',
    "/about.html": '[data-about-doctors]',
    "/doctors.html": '[data-doctor-grid]',
    "/treatments.html": '[data-treatment-grid]',
    "/blog.html": '[data-blog-grid]',
    "/testimonials.html": '[data-testimonials-grid]',
    "/contact.html": '[data-contact-form]',
}
ADMIN_ROUTES = [
    "dashboard", "appointments", "doctors", "treatments", "blogs",
    "testimonials", "gallery", "seo", "settings", "analytics",
]

errors = []
failed_requests = []
failed_responses = []
marker = f"QA Browser {uuid.uuid4()}"

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})

    page.on("console", lambda message: errors.append(f"console {message.type}: {message.text}") if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(f"page: {error}"))

    def application_url(url):
        return url.startswith(BASE_URL) or "pqvhwlflwodbpcmpzetk.supabase.co" in url

    page.on("requestfailed", lambda request: failed_requests.append(f"{request.method} {request.url}: {request.failure}") if application_url(request.url) else None)
    page.on("response", lambda response: failed_responses.append(f"{response.status} {response.url}") if response.status >= 400 and application_url(response.url) else None)

    for width in (1440, 375):
        page.set_viewport_size({"width": width, "height": 1000})
        for route, selector in PUBLIC_ROUTES.items():
            page.goto(f"{BASE_URL}{route}", wait_until="networkidle")
            page.locator('body[data-public-initialized="true"]').wait_for()
            page.locator(selector).wait_for(state="attached")
            overflow = page.evaluate("Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)")
            assert overflow == 0, f"{route} overflows by {overflow}px at {width}px"
            if route in ("/", "/treatments.html"):
                assert page.locator(".treatment-card").count() > 0, f"{route} did not render live treatments"
            if width == 1440:
                assert page.title().strip(), f"{route} has no title"
                if route != "/":
                    assert page.locator('link[rel="canonical"]').count() == 1, f"{route} missing canonical metadata"

    page.set_viewport_size({"width": 1440, "height": 1000})
    page.goto(f"{BASE_URL}/contact.html", wait_until="networkidle")
    page.locator('body[data-public-initialized="true"]').wait_for()
    form = page.locator("[data-contact-form]")
    form.locator('[name="patientName"]').fill(marker)
    form.locator('[name="mobile"]').fill("+91 90000 00000")
    form.locator('[name="email"]').fill("qa-browser@example.com")
    form.locator('[name="message"]').fill("Automated browser verification record.")
    form.locator('[name="consent"]').check()
    page.wait_for_timeout(1600)
    form.locator('button[type="submit"]').click()
    page.locator("[data-form-status]").filter(has_text=re.compile("sent to our clinic team", re.I)).wait_for()

    for route in ADMIN_ROUTES:
        page.goto(f"{BASE_URL}/admin/{route}.html")
        page.wait_for_url("**/admin/login.html")
    assert page.locator("[data-admin-login-form]").count() == 1
    browser.close()

assert not errors, "\n".join(errors)
assert not failed_requests, "\n".join(failed_requests)
assert not failed_responses, "\n".join(failed_responses)
print(f"QA_BROWSER_MARKER={marker}")
print(f"PUBLIC_ROUTES_OK={len(PUBLIC_ROUTES)}")
print(f"PROTECTED_ADMIN_ROUTES_OK={len(ADMIN_ROUTES)}")
print("RESPONSIVE_WIDTHS_OK=2")
print("BROWSER_ERRORS=0")
