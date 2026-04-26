"""
スクリーンショットキャプチャスクリプト
"""
import asyncio
import os
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:5173"
OUT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(OUT_DIR, exist_ok=True)

MOBILE = {"width": 390, "height": 844, "device_scale_factor": 2}

async def shot(page, name: str):
    path = os.path.join(OUT_DIR, f"{name}.png")
    await page.screenshot(path=path, full_page=False)
    print(f"  ✓ {name}.png")
    return path

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(
            viewport={"width": MOBILE["width"], "height": MOBILE["height"]},
            device_scale_factor=MOBILE["device_scale_factor"],
        )
        page = await ctx.new_page()

        # ── スプラッシュをスキップ ──────────────────────────
        await page.goto(BASE_URL)
        await page.wait_for_timeout(3500)

        # スプラッシュが残っていたら待つ
        try:
            await page.wait_for_selector('nav', timeout=8000)
        except:
            pass
        await page.wait_for_timeout(500)

        # ── 1. 勤務早見表（通常） ──────────────────────────
        # まず早見表タブへ
        await page.evaluate("""
            Array.from(document.querySelectorAll('nav button'))
                 .find(b => b.textContent.includes('早見表'))?.click()
        """)
        await page.wait_for_timeout(600)
        await shot(page, "01_shift_normal")

        # ── 2. 院フィルター（草加院選択） ──────────────────
        await page.evaluate("""
            document.querySelector('select').value = '草加院';
            document.querySelector('select').dispatchEvent(new Event('change', {bubbles:true}));
        """)
        await page.wait_for_timeout(400)
        await shot(page, "02_shift_filter")

        # フィルターを戻す
        await page.evaluate("""
            document.querySelector('select').value = '全院';
            document.querySelector('select').dispatchEvent(new Event('change', {bubbles:true}));
        """)
        await page.wait_for_timeout(300)

        # ── 3. 2週表示 ──────────────────────────────────────
        await page.evaluate("""
            Array.from(document.querySelectorAll('button'))
                 .find(b => b.textContent.trim() === '2週')?.click()
        """)
        await page.wait_for_timeout(400)
        await shot(page, "03_shift_2weeks")

        # 1週に戻す
        await page.evaluate("""
            Array.from(document.querySelectorAll('button'))
                 .find(b => b.textContent.trim() === '1週')?.click()
        """)
        await page.wait_for_timeout(300)

        # ── 4. シフト変更ボタン押下（下書きモード入り口） ──
        await page.evaluate("""
            Array.from(document.querySelectorAll('button'))
                 .find(b => b.textContent.includes('シフト変更'))?.click()
        """)
        await page.wait_for_timeout(400)
        await shot(page, "04_draft_mode_enter")

        # ── 5. セルタップ → ピッカーモーダル ──────────────
        await page.evaluate("""
            const cells = document.querySelectorAll('tbody td:not(:first-child)')
            if (cells.length > 1) cells[1].click()
        """)
        await page.wait_for_timeout(400)
        await shot(page, "05_draft_picker")

        # ── 6. 有休を選択してモーダルを閉じる ──────────────
        await page.evaluate("""
            Array.from(document.querySelectorAll('button'))
                 .find(b => b.textContent.trim() === '有休')?.click()
        """)
        await page.wait_for_timeout(400)

        # もう1セル変更してみる（バリエーション）
        await page.evaluate("""
            const cells = document.querySelectorAll('tbody td:not(:first-child)')
            if (cells.length > 8) cells[8].click()
        """)
        await page.wait_for_timeout(300)
        await page.evaluate("""
            Array.from(document.querySelectorAll('button'))
                 .find(b => b.textContent.trim() === '公休')?.click()
        """)
        await page.wait_for_timeout(300)

        await shot(page, "06_draft_cells_changed")

        # ── 7. 変更確定ボタン（送信はしない、スクショのみ）──
        await shot(page, "07_draft_confirm_btn")

        # キャンセルして戻る
        await page.evaluate("""
            Array.from(document.querySelectorAll('button'))
                 .find(b => b.textContent.includes('キャンセル'))?.click()
        """)
        await page.wait_for_timeout(300)

        # ── 8. ダッシュボード ───────────────────────────────
        await page.evaluate("""
            Array.from(document.querySelectorAll('nav button'))
                 .find(b => b.textContent.includes('概要'))?.click()
        """)
        await page.wait_for_timeout(600)
        await shot(page, "08_dashboard")

        # ── 9. ダッシュボード（院フィルター） ──────────────
        await page.evaluate("""
            const btns = Array.from(document.querySelectorAll('button'))
            const loc = btns.find(b => b.textContent.includes('草加院') && !b.className.includes('navy'))
            if (loc) loc.click()
        """)
        await page.wait_for_timeout(400)
        await shot(page, "09_dashboard_filter")

        # ── 10. 従業員一覧 ──────────────────────────────────
        await page.evaluate("""
            Array.from(document.querySelectorAll('nav button'))
                 .find(b => b.textContent.includes('従業員'))?.click()
        """)
        await page.wait_for_timeout(600)
        await shot(page, "10_employee_list")

        # ── 11. 従業員編集モーダル（管理者ログイン後） ─────
        # まず管理者PINモーダルを開く
        await page.evaluate("""
            Array.from(document.querySelectorAll('button'))
                 .find(b => b.textContent.includes('一般'))?.click()
        """)
        await page.wait_for_timeout(400)
        await shot(page, "11_admin_pin_modal")

        # PIN入力（1234を想定）
        try:
            pin_inputs = await page.query_selector_all('input[type="tel"], input[type="number"], input[inputmode="numeric"]')
            if pin_inputs:
                await pin_inputs[0].fill('1234')
                await page.wait_for_timeout(200)
                confirm_btn = await page.query_selector('button:has-text("確認"), button:has-text("ログイン"), button:has-text("認証")')
                if confirm_btn:
                    await confirm_btn.click()
                    await page.wait_for_timeout(600)
        except:
            pass

        # 編集ボタンをクリック
        await page.evaluate("""
            const pencils = document.querySelectorAll('button svg.lucide-pencil')
            if (pencils.length > 0) pencils[0].closest('button').click()
        """)
        await page.wait_for_timeout(500)
        await shot(page, "12_employee_edit_modal")

        # モーダルを閉じる
        await page.keyboard.press('Escape')
        await page.wait_for_timeout(300)

        # ── 13. 変更履歴ドロワー ────────────────────────────
        await page.evaluate("""
            Array.from(document.querySelectorAll('nav button'))
                 .find(b => b.textContent.includes('早見表'))?.click()
        """)
        await page.wait_for_timeout(500)
        await page.evaluate("""
            Array.from(document.querySelectorAll('button'))
                 .find(b => b.querySelector('svg.lucide-clock'))?.click()
        """)
        await page.wait_for_timeout(500)
        await shot(page, "13_history_drawer")

        # ── 14. PC版（デスクトップ） ────────────────────────
        await ctx.close()
        desk_ctx = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            device_scale_factor=2,
        )
        desk_page = await desk_ctx.new_page()
        await desk_page.goto(BASE_URL)
        await desk_page.wait_for_timeout(3500)
        try:
            await desk_page.wait_for_selector('aside', timeout=8000)
        except:
            pass
        await desk_page.wait_for_timeout(500)
        await desk_page.evaluate("""
            Array.from(document.querySelectorAll('aside button'))
                 .find(b => b.textContent.includes('早見表'))?.click()
        """)
        await desk_page.wait_for_timeout(500)
        await desk_page.screenshot(
            path=os.path.join(OUT_DIR, "14_pc_shift.png"), full_page=False
        )
        print("  ✓ 14_pc_shift.png")

        await desk_ctx.close()
        await browser.close()

    print(f"\n完了: {OUT_DIR}")

asyncio.run(main())
