import asyncio
from playwright.async_api import async_playwright

BASE = "http://127.0.0.1:5173"
OUT = "/opt/cursor/artifacts/screenshots"

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            executable_path="/usr/local/bin/google-chrome",
            args=["--no-sandbox", "--disable-dev-shm-usage"]
        )

        async def auth_ctx(show_onboarding=False):
            ctx = await browser.new_context(viewport={"width": 1280, "height": 900})
            pg = await ctx.new_page()
            await pg.goto(f"{BASE}/login")
            await pg.wait_for_selector('input[type="email"]', timeout=20000)
            print("Login ready")
            if not show_onboarding:
                await pg.evaluate("localStorage.setItem('pdh_onboarding_complete','done')")
            await pg.fill('input[type="email"]', 'demo@hub.com')
            await pg.fill('input[type="password"]', 'demo1234')
            await pg.click('button[type="submit"]')
            await pg.wait_for_url("**/dashboard", timeout=12000)
            await pg.wait_for_load_state("networkidle")
            await asyncio.sleep(2)
            return ctx, pg

        ctx, pg = await auth_ctx(show_onboarding=True)
        await pg.screenshot(path=f"{OUT}/09_onboarding_step1.png", full_page=True)
        print("onboarding 1")
        await pg.get_by_role("button", name="Get started").click()
        await asyncio.sleep(0.7)
        await pg.screenshot(path=f"{OUT}/10_onboarding_step2.png", full_page=True)
        print("onboarding 2")
        await pg.get_by_role("button", name="Skip for now").click()
        await asyncio.sleep(0.7)
        await pg.screenshot(path=f"{OUT}/11_onboarding_step3.png", full_page=True)
        print("onboarding 3")
        await ctx.close()

        ctx2, pg2 = await auth_ctx()
        await pg2.screenshot(path=f"{OUT}/12_dashboard_goals.png", full_page=True)
        print("dashboard")
        await pg2.goto(f"{BASE}/goals", wait_until="networkidle")
        await asyncio.sleep(1.5)
        await pg2.screenshot(path=f"{OUT}/13_goals.png", full_page=True)
        print("goals")
        await pg2.goto(f"{BASE}/habits", wait_until="networkidle")
        await asyncio.sleep(1.5)
        await pg2.screenshot(path=f"{OUT}/14_habits_streaks.png", full_page=True)
        print("habits")
        await ctx2.close()
        await browser.close()
        print("DONE")

asyncio.run(run())
