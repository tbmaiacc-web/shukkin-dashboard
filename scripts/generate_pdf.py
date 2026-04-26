"""
勤務管理システム 操作マニュアル PDF生成スクリプト
売れるクオリティを目指したプロ仕様レイアウト
"""
import os, math
from PIL import Image, ImageDraw, ImageFilter
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, PageBreak,
)
from reportlab.platypus.flowables import Flowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Circle
from reportlab.graphics import renderPDF
from io import BytesIO

# ─── フォント登録 ───────────────────────────────────────────────────────────
pdfmetrics.registerFont(UnicodeCIDFont('HeiseiKakuGo-W5'))
pdfmetrics.registerFont(UnicodeCIDFont('HeiseiMin-W3'))

FONT_BOLD   = 'HeiseiKakuGo-W5'
FONT_NORMAL = 'HeiseiKakuGo-W5'

# ─── カラーパレット ─────────────────────────────────────────────────────────
NAVY        = colors.HexColor('#1a3a5c')
NAVY_LIGHT  = colors.HexColor('#2d5986')
NAVY_PALE   = colors.HexColor('#e8f0f9')
ACCENT      = colors.HexColor('#f59e0b')   # アンバー（アクセント）
ACCENT_PALE = colors.HexColor('#fef3c7')
GREEN       = colors.HexColor('#059669')
GREEN_PALE  = colors.HexColor('#d1fae5')
RED         = colors.HexColor('#dc2626')
RED_PALE    = colors.HexColor('#fee2e2')
GRAY_900    = colors.HexColor('#111827')
GRAY_700    = colors.HexColor('#374151')
GRAY_500    = colors.HexColor('#6b7280')
GRAY_300    = colors.HexColor('#d1d5db')
GRAY_100    = colors.HexColor('#f3f4f6')
WHITE       = colors.white

W, H = A4  # 210 × 297 mm
MARGIN_L = 18*mm
MARGIN_R = 18*mm
MARGIN_T = 20*mm
MARGIN_B = 20*mm
CONTENT_W = W - MARGIN_L - MARGIN_R

SS_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
OUT_PDF = os.path.join(os.path.dirname(__file__), "TBM_勤務管理システム_操作マニュアル.pdf")

# ─── ヘルパー: 電話フレーム付き画像 ────────────────────────────────────────
def make_phone_image(src_path: str, target_w_px: int = 400) -> BytesIO:
    """スクリーンショットをスマートフォンフレームに入れた画像を返す"""
    img = Image.open(src_path).convert("RGBA")
    sw, sh = img.size

    PAD_X, PAD_T, PAD_B = 28, 60, 60
    CORNER = 54
    FRAME_W = sw + PAD_X * 2
    FRAME_H = sh + PAD_T + PAD_B

    frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(frame)

    # 外枠シャドウ
    shadow = Image.new("RGBA", (FRAME_W + 20, FRAME_H + 20), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle([10, 10, FRAME_W + 10, FRAME_H + 10], radius=CORNER + 4,
                         fill=(0, 0, 0, 60))
    shadow = shadow.filter(ImageFilter.GaussianBlur(12))
    merged = Image.new("RGBA", (FRAME_W + 20, FRAME_H + 20), (0, 0, 0, 0))
    merged.paste(shadow, (0, 0))
    merged.paste(frame, (10, 10), frame)
    frame = merged

    draw = ImageDraw.Draw(frame)
    # 本体
    draw.rounded_rectangle([10, 10, FRAME_W + 10, FRAME_H + 10],
                            radius=CORNER + 4, fill=(30, 30, 35, 255))
    draw.rounded_rectangle([14, 14, FRAME_W + 6, FRAME_H + 6],
                            radius=CORNER + 2, fill=(50, 52, 58, 255))
    # 画面ベゼル
    draw.rounded_rectangle([PAD_X + 10, PAD_T + 10, PAD_X + sw + 10, PAD_T + sh + 10],
                            radius=18, fill=(255, 255, 255, 255))
    frame.paste(img, (PAD_X + 10, PAD_T + 10), img)
    # ノッチ
    draw.rounded_rectangle([FRAME_W // 2 - 45 + 10, PAD_T // 2 + 10,
                             FRAME_W // 2 + 45 + 10, PAD_T // 2 + 24 + 10],
                            radius=10, fill=(20, 20, 25, 255))
    # ホームバー
    draw.rounded_rectangle([FRAME_W // 2 - 50 + 10, FRAME_H - 30 + 10,
                             FRAME_W // 2 + 50 + 10, FRAME_H - 22 + 10],
                            radius=4, fill=(80, 82, 90, 255))

    # サイズ縮小
    ratio = target_w_px / frame.width
    new_size = (target_w_px, int(frame.height * ratio))
    frame = frame.resize(new_size, Image.LANCZOS)

    buf = BytesIO()
    frame.save(buf, format="PNG")
    buf.seek(0)
    return buf

def make_desktop_image(src_path: str, target_w_px: int = 900) -> BytesIO:
    """PC画面をブラウザフレームに入れた画像を返す"""
    img = Image.open(src_path).convert("RGBA")
    sw, sh = img.size
    BAR = 52
    CORNER = 14
    FRAME_W = sw + 4
    FRAME_H = sh + BAR + 4

    frame = Image.new("RGBA", (FRAME_W + 20, FRAME_H + 20), (0, 0, 0, 0))
    draw = ImageDraw.Draw(frame)
    # シャドウ
    for i in range(12, 0, -1):
        alpha = int(40 * (1 - i / 12))
        draw.rounded_rectangle([10 - i, 10 - i, FRAME_W + 10 + i, FRAME_H + 10 + i],
                                radius=CORNER + i, fill=(0, 0, 0, alpha))
    # 本体
    draw.rounded_rectangle([10, 10, FRAME_W + 10, FRAME_H + 10],
                            radius=CORNER, fill=(240, 241, 243, 255))
    draw.rounded_rectangle([10, 10, FRAME_W + 10, 10 + BAR],
                            radius=CORNER, fill=(228, 229, 232, 255))
    # タイトルバードット
    for xi, c in enumerate([(255, 95, 87), (255, 189, 46), (40, 201, 64)]):
        draw.ellipse([22 + xi * 22, 28, 34 + xi * 22, 40], fill=c)
    # アドレスバー
    draw.rounded_rectangle([90, 26, FRAME_W - 20, 42],
                            radius=6, fill=(255, 255, 255, 220))
    # スクリーン
    frame.paste(img, (12, BAR + 12), img)
    draw.rounded_rectangle([10, 10, FRAME_W + 10, FRAME_H + 10],
                            radius=CORNER, outline=(200, 201, 204, 255), width=1)

    ratio = target_w_px / frame.width
    new_size = (target_w_px, int(frame.height * ratio))
    frame = frame.resize(new_size, Image.LANCZOS)
    buf = BytesIO()
    frame.save(buf, format="PNG")
    buf.seek(0)
    return buf

# ─── カスタムFlowable ────────────────────────────────────────────────────────
class PhoneImage(Flowable):
    """電話フレーム付きの画像 Flowable"""
    def __init__(self, buf: BytesIO, display_w: float, align='center'):
        super().__init__()
        self.buf = buf
        self.display_w = display_w
        self.align = align
        img = Image.open(buf)
        self.aspect = img.height / img.width
        buf.seek(0)

    def wrap(self, aw, ah):
        self.width = self.display_w
        self.height = self.display_w * self.aspect
        return self.width, self.height

    def draw(self):
        from reportlab.lib.utils import ImageReader
        self.buf.seek(0)
        reader = ImageReader(self.buf)
        x_off = (CONTENT_W - self.display_w) / 2 if self.align == 'center' else 0
        self.canv.drawImage(reader, x_off, 0,
                            width=self.display_w, height=self.height,
                            mask='auto')

class DesktopImage(Flowable):
    def __init__(self, buf: BytesIO, display_w: float):
        super().__init__()
        self.buf = buf
        self.display_w = display_w
        img = Image.open(buf)
        self.aspect = img.height / img.width
        buf.seek(0)

    def wrap(self, aw, ah):
        self.width = self.display_w
        self.height = self.display_w * self.aspect
        return self.width, self.height

    def draw(self):
        from reportlab.lib.utils import ImageReader
        self.buf.seek(0)
        reader = ImageReader(self.buf)
        self.canv.drawImage(reader, 0, 0,
                            width=self.display_w, height=self.height,
                            mask='auto')

class SectionBanner(Flowable):
    """セクション見出しバナー"""
    def __init__(self, number: str, title: str, subtitle: str = '', color=NAVY):
        super().__init__()
        self.number = number
        self.title = title
        self.subtitle = subtitle
        self.color = color

    def wrap(self, aw, ah):
        self.width = aw
        self.height = 28*mm
        return self.width, self.height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        # 背景グラデーション風（濃い→薄い）
        c.setFillColor(self.color)
        c.roundRect(0, 0, w, h, 8, fill=1, stroke=0)
        c.setFillColor(colors.HexColor('#ffffff20'))
        c.roundRect(w * 0.6, 0, w * 0.4, h, 8, fill=1, stroke=0)
        # 左ストライプ
        c.setFillColor(ACCENT)
        c.rect(0, 0, 5, h, fill=1, stroke=0)
        # 番号バッジ
        c.setFillColor(WHITE)
        c.circle(20*mm, h / 2, 7*mm, fill=1, stroke=0)
        c.setFillColor(self.color)
        c.setFont(FONT_BOLD, 14)
        tw = c.stringWidth(self.number, FONT_BOLD, 14)
        c.drawString(20*mm - tw / 2, h / 2 - 5, self.number)
        # タイトル
        c.setFillColor(WHITE)
        c.setFont(FONT_BOLD, 16)
        c.drawString(33*mm, h / 2 + 2, self.title)
        # サブタイトル
        if self.subtitle:
            c.setFont(FONT_NORMAL, 9)
            c.setFillColor(colors.HexColor('#ffffff99'))
            c.drawString(33*mm, h / 2 - 9, self.subtitle)

class StepBox(Flowable):
    """手順ステップボックス"""
    def __init__(self, step: int, title: str, body: str, width: float, color=NAVY):
        super().__init__()
        self.step = step
        self.title = title
        self.body = body
        self._width = width
        self.color = color

    def wrap(self, aw, ah):
        self.width = self._width
        self.height = 22*mm
        return self.width, self.height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        # 背景
        c.setFillColor(GRAY_100)
        c.roundRect(0, 0, w, h, 6, fill=1, stroke=0)
        c.setStrokeColor(GRAY_300)
        c.setLineWidth(0.5)
        c.roundRect(0, 0, w, h, 6, fill=0, stroke=1)
        # ステップ丸バッジ
        c.setFillColor(self.color)
        c.circle(12*mm, h / 2, 5*mm, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont(FONT_BOLD, 11)
        tw = c.stringWidth(str(self.step), FONT_BOLD, 11)
        c.drawString(12*mm - tw / 2, h / 2 - 4, str(self.step))
        # タイトル
        c.setFillColor(GRAY_900)
        c.setFont(FONT_BOLD, 11)
        c.drawString(22*mm, h / 2 + 2, self.title)
        # 本文
        c.setFillColor(GRAY_700)
        c.setFont(FONT_NORMAL, 9)
        c.drawString(22*mm, h / 2 - 8, self.body)

class TipBox(Flowable):
    """ポイント・注意ボックス"""
    def __init__(self, text: str, width: float, kind: str = 'tip'):
        super().__init__()
        self.text = text
        self._width = width
        self.kind = kind  # 'tip' | 'warn' | 'info'

    def wrap(self, aw, ah):
        self.width = self._width
        lines = len(self.text) // 38 + 1
        self.height = (8 + lines * 5) * mm
        return self.width, self.height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        conf = {
            'tip':  (GREEN, GREEN_PALE, '✓ ポイント'),
            'warn': (ACCENT, ACCENT_PALE, '⚠ 注意'),
            'info': (NAVY_LIGHT, NAVY_PALE, '💡 ヒント'),
        }
        border_c, bg_c, label = conf.get(self.kind, conf['info'])
        c.setFillColor(bg_c)
        c.roundRect(0, 0, w, h, 5, fill=1, stroke=0)
        c.setStrokeColor(border_c)
        c.setLineWidth(1.5)
        c.roundRect(0, 0, w, h, 5, fill=0, stroke=1)
        c.setFillColor(border_c)
        c.rect(0, 0, 4, h, fill=1, stroke=0)
        c.setFont(FONT_BOLD, 8)
        c.setFillColor(border_c)
        c.drawString(8*mm, h - 7*mm, label)
        c.setFont(FONT_NORMAL, 9)
        c.setFillColor(GRAY_700)
        # テキスト折り返し
        max_chars = 48
        lines_text = []
        remaining = self.text
        while remaining:
            lines_text.append(remaining[:max_chars])
            remaining = remaining[max_chars:]
        for i, line in enumerate(lines_text):
            c.drawString(8*mm, h - 13*mm - i * 5*mm, line)

class DividerLine(Flowable):
    def __init__(self, width: float):
        super().__init__()
        self._width = width

    def wrap(self, aw, ah):
        return self._width, 1*mm

    def draw(self):
        self.canv.setStrokeColor(GRAY_300)
        self.canv.setLineWidth(0.5)
        self.canv.line(0, 0, self._width, 0)

# ─── スタイル定義 ────────────────────────────────────────────────────────────
def make_styles():
    styles = {}
    styles['h1'] = ParagraphStyle('h1', fontName=FONT_BOLD, fontSize=22,
                                   textColor=NAVY, spaceAfter=4*mm, leading=28)
    styles['h2'] = ParagraphStyle('h2', fontName=FONT_BOLD, fontSize=14,
                                   textColor=NAVY, spaceBefore=3*mm, spaceAfter=2*mm, leading=20)
    styles['h3'] = ParagraphStyle('h3', fontName=FONT_BOLD, fontSize=11,
                                   textColor=GRAY_900, spaceBefore=2*mm, spaceAfter=1*mm, leading=16)
    styles['body'] = ParagraphStyle('body', fontName=FONT_NORMAL, fontSize=10,
                                     textColor=GRAY_700, spaceAfter=2*mm, leading=16)
    styles['small'] = ParagraphStyle('small', fontName=FONT_NORMAL, fontSize=8,
                                      textColor=GRAY_500, spaceAfter=1*mm, leading=12)
    styles['caption'] = ParagraphStyle('caption', fontName=FONT_NORMAL, fontSize=8,
                                        textColor=GRAY_500, spaceAfter=2*mm, leading=12,
                                        alignment=TA_CENTER)
    styles['center'] = ParagraphStyle('center', fontName=FONT_NORMAL, fontSize=10,
                                       textColor=GRAY_700, alignment=TA_CENTER, leading=16)
    styles['bullet'] = ParagraphStyle('bullet', fontName=FONT_NORMAL, fontSize=10,
                                       textColor=GRAY_700, spaceAfter=1*mm, leading=16,
                                       leftIndent=6*mm, bulletIndent=0)
    styles['toc'] = ParagraphStyle('toc', fontName=FONT_NORMAL, fontSize=11,
                                    textColor=GRAY_700, spaceAfter=2*mm, leading=18,
                                    leftIndent=4*mm)
    styles['toc_num'] = ParagraphStyle('toc_num', fontName=FONT_BOLD, fontSize=11,
                                        textColor=NAVY, spaceAfter=2*mm, leading=18)
    return styles

# ─── ページテンプレート（ヘッダー・フッター） ────────────────────────────────
def on_first_page(canvas, doc):
    """表紙専用: 何もしない"""
    pass

def on_later_pages(canvas, doc):
    canvas.saveState()
    # ヘッダー
    canvas.setFillColor(NAVY)
    canvas.rect(0, H - 14*mm, W, 14*mm, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont(FONT_BOLD, 9)
    canvas.drawString(MARGIN_L, H - 9*mm, "Total Body Make｜勤務管理システム 操作マニュアル")
    canvas.setFont(FONT_NORMAL, 8)
    canvas.drawRightString(W - MARGIN_R, H - 9*mm, f"Ver. 2.0  /  2026年4月")

    # フッター
    canvas.setFillColor(GRAY_100)
    canvas.rect(0, 0, W, 10*mm, fill=1, stroke=0)
    canvas.setStrokeColor(GRAY_300)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN_L, 10*mm, W - MARGIN_R, 10*mm)
    canvas.setFillColor(GRAY_500)
    canvas.setFont(FONT_NORMAL, 8)
    canvas.drawCentredString(W / 2, 3.5*mm, f"- {doc.page} -")
    canvas.drawString(MARGIN_L, 3.5*mm, "© 2026 Total Body Make")
    canvas.drawRightString(W - MARGIN_R, 3.5*mm, "社外秘")
    canvas.restoreState()

# ─── 表紙 ────────────────────────────────────────────────────────────────────
def build_cover(canvas, doc):
    canvas.saveState()

    # 背景
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)

    # 右上の装飾円
    canvas.setFillColor(colors.HexColor('#ffffff08'))
    canvas.circle(W - 10*mm, H - 10*mm, 80*mm, fill=1, stroke=0)
    canvas.circle(W - 10*mm, H - 10*mm, 50*mm, fill=1, stroke=0)

    # 左下の装飾円
    canvas.setFillColor(colors.HexColor('#ffffff06'))
    canvas.circle(20*mm, 20*mm, 60*mm, fill=1, stroke=0)

    # アクセントバー（左）
    canvas.setFillColor(ACCENT)
    canvas.rect(0, 0, 8*mm, H, fill=1, stroke=0)

    # 上部ロゴエリア
    canvas.setFillColor(colors.HexColor('#ffffff15'))
    canvas.roundRect(18*mm, H - 60*mm, W - 36*mm, 40*mm, 8, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont(FONT_BOLD, 13)
    canvas.drawString(26*mm, H - 32*mm, "Total Body Make")
    canvas.setFont(FONT_NORMAL, 9)
    canvas.setFillColor(colors.HexColor('#ffffff88'))
    canvas.drawString(26*mm, H - 42*mm, "勤務管理システム")

    # メインタイトル
    canvas.setFillColor(WHITE)
    canvas.setFont(FONT_BOLD, 36)
    canvas.drawString(18*mm, H - 105*mm, "操作マニュアル")
    canvas.setFont(FONT_BOLD, 18)
    canvas.setFillColor(ACCENT)
    canvas.drawString(18*mm, H - 120*mm, "スタッフ向け完全ガイド")

    # 区切り線
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(2)
    canvas.line(18*mm, H - 127*mm, W - 18*mm, H - 127*mm)

    # 機能リスト
    features = [
        "ダッシュボード（出勤状況一覧）",
        "勤務早見表（シフト管理・一括変更）",
        "従業員管理（有給・アニバーサリー休暇）",
        "変更履歴の確認",
        "PC・スマートフォン両対応",
    ]
    canvas.setFont(FONT_NORMAL, 11)
    canvas.setFillColor(WHITE)
    for i, feat in enumerate(features):
        y = H - 140*mm - i * 12*mm
        canvas.setFillColor(ACCENT)
        canvas.circle(23*mm, y + 3*mm, 2*mm, fill=1, stroke=0)
        canvas.setFillColor(WHITE)
        canvas.drawString(27*mm, y, feat)

    # バージョン・日付ボックス
    canvas.setFillColor(colors.HexColor('#ffffff15'))
    canvas.roundRect(18*mm, 35*mm, W - 36*mm, 25*mm, 6, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont(FONT_BOLD, 10)
    canvas.drawString(26*mm, 52*mm, "Ver. 2.0")
    canvas.setFont(FONT_NORMAL, 9)
    canvas.setFillColor(colors.HexColor('#ffffff88'))
    canvas.drawString(26*mm, 43*mm, "2026年4月発行  ／  社外秘")
    canvas.setFont(FONT_NORMAL, 9)
    canvas.drawRightString(W - 26*mm, 48*mm, "shukkin-dashboard.vercel.app")

    canvas.restoreState()

# ─── メイン生成関数 ──────────────────────────────────────────────────────────
def build_pdf():
    styles = make_styles()
    story = []

    def sp(h_mm=4):
        story.append(Spacer(1, h_mm * mm))

    def body(text):
        story.append(Paragraph(text, styles['body']))

    def small(text):
        story.append(Paragraph(text, styles['small']))

    def caption(text):
        story.append(Paragraph(text, styles['caption']))

    def h2(text):
        story.append(Paragraph(text, styles['h2']))

    def h3(text):
        story.append(Paragraph(text, styles['h3']))

    def divider():
        story.append(DividerLine(CONTENT_W))
        sp(2)

    def bullet(items):
        for item in items:
            story.append(Paragraph(f"・ {item}", styles['bullet']))

    def phone(filename, w_mm=70, caption_text=''):
        path = os.path.join(SS_DIR, filename)
        if not os.path.exists(path):
            return
        buf = make_phone_image(path, 800)
        story.append(PhoneImage(buf, w_mm * mm))
        if caption_text:
            story.append(Spacer(1, 1*mm))
            caption(caption_text)

    def two_phones(f1, f2, cap1='', cap2=''):
        """2画面横並び"""
        path1 = os.path.join(SS_DIR, f1)
        path2 = os.path.join(SS_DIR, f2)
        if not os.path.exists(path1) or not os.path.exists(path2):
            return
        buf1 = make_phone_image(path1, 700)
        buf2 = make_phone_image(path2, 700)
        img1 = Image.open(buf1); ar1 = img1.height / img1.width; buf1.seek(0)
        img2 = Image.open(buf2); ar2 = img2.height / img2.width; buf2.seek(0)
        pw = (CONTENT_W - 8*mm) / 2

        class _Img(Flowable):
            def __init__(self, buf, w, ar):
                super().__init__()
                self.buf = buf; self._w = w; self._ar = ar
            def wrap(self, aw, ah): return self._w, self._w * self._ar
            def draw(self):
                from reportlab.lib.utils import ImageReader
                self.buf.seek(0)
                self.canv.drawImage(ImageReader(self.buf), 0, 0,
                                    self._w, self._w * self._ar, mask='auto')

        row = [[_Img(buf1, pw, ar1), _Img(buf2, pw, ar2)]]
        tbl = Table(row, colWidths=[pw, pw])
        tbl.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'CENTER'),
                                  ('VALIGN', (0,0), (-1,-1), 'TOP'),
                                  ('LEFTPADDING', (0,0), (-1,-1), 0),
                                  ('RIGHTPADDING', (0,0), (-1,-1), 8*mm),
                                  ('TOPPADDING', (0,0), (-1,-1), 0),
                                  ('BOTTOMPADDING', (0,0), (-1,-1), 0)]))
        story.append(tbl)
        if cap1 or cap2:
            cap_row = [[Paragraph(cap1, styles['caption']),
                        Paragraph(cap2, styles['caption'])]]
            cap_tbl = Table(cap_row, colWidths=[pw, pw])
            cap_tbl.setStyle(TableStyle([('ALIGN',(0,0),(-1,-1),'CENTER')]))
            story.append(cap_tbl)

    def step(n, title, body_text):
        story.append(StepBox(n, title, body_text, CONTENT_W))
        sp(1.5)

    def tip(text, kind='tip'):
        story.append(TipBox(text, CONTENT_W, kind))
        sp(1.5)

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 表紙（特殊ページ）
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 表紙: 内容はon_first_pageで描画するため、空のPageBreakのみ
    story.append(PageBreak())

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 目次
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph("目　次", styles['h1']))
    story.append(DividerLine(CONTENT_W))
    sp(4)

    toc_items = [
        ("1", "システム概要", "アプリの特徴と画面構成"),
        ("2", "ダッシュボード", "出勤状況の確認・日付・院フィルター"),
        ("3", "勤務早見表（基本）", "シフトの閲覧・期間切り替え・院フィルター"),
        ("4", "シフト変更の手順", "下書きモードを使った効率的なシフト編集"),
        ("5", "従業員管理", "スタッフ情報・有給・アニバーサリー休暇の管理"),
        ("6", "変更履歴の確認", "誰がいつどのシフトを変更したかを追跡"),
        ("7", "PC版の使い方", "デスクトップでの操作方法"),
        ("8", "シフト種類一覧", "全シフト記号の早見表"),
    ]

    for num, title, sub in toc_items:
        tbl = Table(
            [[Paragraph(f"<b>{num}</b>", styles['toc_num']),
              Paragraph(f"<b>{title}</b>　<font color='#6b7280' size='9'>{sub}</font>",
                        styles['toc'])]],
            colWidths=[10*mm, CONTENT_W - 10*mm]
        )
        tbl.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (0,0), (-1,-1), 2*mm),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2*mm),
            ('TOPPADDING', (0,0), (-1,-1), 2*mm),
            ('LINEBELOW', (0,0), (-1,-1), 0.3, GRAY_300),
        ]))
        story.append(tbl)
        sp(0.5)

    story.append(PageBreak())

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 1. システム概要
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    story.append(SectionBanner("1", "システム概要", "アプリの全体像を把握しましょう"))
    sp(5)
    body("本システムはスマートフォン・PCのどちらからでもアクセスできるクラウド型の勤務管理アプリです。"
         "スタッフのシフトをリアルタイムで確認・編集でき、有給休暇やアニバーサリー休暇の残日数も自動で管理されます。")
    sp(3)

    # 3つの主要機能カード
    feature_data = [
        ["📊 ダッシュボード",   "今日の出勤状況を\n一目で把握"],
        ["📅 勤務早見表",       "シフトの閲覧・編集\n週次・院別管理"],
        ["👥 従業員管理",       "スタッフ情報と\n休暇残日数を管理"],
    ]
    card_rows = []
    for icon_title, desc in feature_data:
        card_rows.append(
            Paragraph(f"<b>{icon_title}</b><br/><font size='9' color='#6b7280'>{desc.replace(chr(10), '<br/>')}</font>",
                      ParagraphStyle('card', fontName=FONT_BOLD, fontSize=11,
                                     textColor=GRAY_900, alignment=TA_CENTER, leading=16))
        )
    card_tbl = Table([card_rows], colWidths=[CONTENT_W / 3] * 3)
    card_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), NAVY_PALE),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6*mm),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6*mm),
        ('LEFTPADDING', (0,0), (-1,-1), 3*mm),
        ('RIGHTPADDING', (0,0), (-1,-1), 3*mm),
        ('BOX', (0,0), (-1,-1), 1, GRAY_300),
        ('INNERGRID', (0,0), (-1,-1), 0.5, GRAY_300),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
    ]))
    story.append(card_tbl)
    sp(5)

    divider()
    h2("アクセス方法")
    body("ブラウザのアドレスバーに以下のURLを入力してください。ブックマーク登録を推奨します。")
    url_para = Paragraph(
        "🌐　<b>https://shukkin-dashboard.vercel.app/</b>",
        ParagraphStyle('url', fontName=FONT_BOLD, fontSize=11,
                        textColor=NAVY, backColor=NAVY_PALE,
                        borderPad=4*mm, leading=20,
                        leftIndent=4*mm, rightIndent=4*mm,
                        spaceAfter=3*mm)
    )
    story.append(url_para)
    tip("インターネット接続があれば、スマートフォン・タブレット・PCのどこからでもアクセスできます。"
        "Safari・Chrome・Edge 等の主要ブラウザに対応しています。", kind='info')

    story.append(PageBreak())

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 2. ダッシュボード
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    story.append(SectionBanner("2", "ダッシュボード", "出勤状況の確認と日付・院フィルター"))
    sp(5)
    body("アプリを起動すると最初に表示される画面です。今日の全スタッフの出勤状況をひと目で把握できます。")
    sp(3)
    two_phones("08_dashboard.png", "09_dashboard_filter.png",
               "▲ 全院表示", "▲ 院別フィルター選択時")
    sp(3)

    h3("主な機能")
    bullet([
        "出勤中・休暇・総スタッフ数の集計カードを画面上部に表示",
        "カレンダーアイコンから任意の日付を選択して確認可能",
        "院名ボタンで特定の院のスタッフだけを絞り込み表示",
        "スタッフ名・院名での検索機能",
    ])
    sp(2)
    tip("当日以外の日付も確認できます。カレンダーアイコン（右上）をタップして日付を選択してください。", kind='info')

    story.append(PageBreak())

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 3. 勤務早見表（基本）
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    story.append(SectionBanner("3", "勤務早見表（基本）", "シフトの閲覧・期間切り替え・院フィルター"))
    sp(5)
    body("全スタッフのシフトを週単位のカレンダー形式で表示します。院ごとにグループ分けされており、"
         "公休・有休などの種類が色付きのアイコンで一目でわかります。")
    sp(3)
    two_phones("01_shift_normal.png", "03_shift_2weeks.png",
               "▲ 1週間表示（デフォルト）", "▲ 2週間表示")
    sp(3)

    h3("操作方法")
    bullet([
        "【＜ ＞ボタン】前後の週へ移動。左右スワイプでも移動できます",
        "【今日ボタン】今週の表示に戻ります",
        "【1週 / 2週 切り替え】画面上部のトグルで表示期間を変更",
        "【院フィルター】プルダウンで表示する院を絞り込み",
        "【🔄 更新ボタン】最新データを取得します",
    ])
    sp(2)
    tip("2週表示はシフトを組む際に特に便利です。院別フィルターと組み合わせて使うと効果的です。", kind='info')
    sp(2)

    divider()
    h3("シフトアイコンの見方")
    shift_data = [
        ["アイコン", "シフト種類", "アイコン", "シフト種類"],
        ["出", "出勤（通常）", "公", "公休"],
        ["有", "有給休暇", "アニバ", "アニバーサリー休暇"],
        ["AMアニバ", "AMアニバーサリー", "PMアニバ", "PMアニバーサリー"],
        ["AM公", "AM公休", "PM公", "PM公休"],
        ["育", "育児休暇", "産", "産前産後休暇"],
        ["特休", "特別休暇", "研修", "研修"],
        ["出張", "出張", "バイ", "アルバイト"],
    ]
    col_w = [(CONTENT_W - 4*mm) / 4] * 4
    shift_tbl = Table(shift_data, colWidths=col_w)
    shift_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('FONTNAME', (0,0), (-1,0), FONT_BOLD),
        ('FONTNAME', (0,1), (-1,-1), FONT_NORMAL),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3*mm),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3*mm),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, GRAY_100]),
        ('BOX', (0,0), (-1,-1), 0.5, GRAY_300),
        ('INNERGRID', (0,0), (-1,-1), 0.3, GRAY_300),
        ('BACKGROUND', (0,1), (0,-1), NAVY_PALE),
        ('BACKGROUND', (2,1), (2,-1), NAVY_PALE),
        ('FONTNAME', (0,1), (0,-1), FONT_BOLD),
        ('FONTNAME', (2,1), (2,-1), FONT_BOLD),
        ('TEXTCOLOR', (0,1), (0,-1), NAVY),
        ('TEXTCOLOR', (2,1), (2,-1), NAVY),
    ]))
    story.append(shift_tbl)

    story.append(PageBreak())

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 4. シフト変更の手順（最重要ページ）
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    story.append(SectionBanner("4", "シフト変更の手順", "下書きモードで素早く・まとめて編集"))
    sp(5)
    body("シフト変更は「下書きモード」を使います。複数のシフトをまとめて編集してから一括送信できるため、"
         "待ち時間なく素早く作業できます。")
    sp(3)

    # ステップ
    step(1, "「シフト変更」ボタンをタップ",
         "早見表画面の右上にあるボタンをタップして下書きモードへ切り替えます")
    step(2, "変更したいセルをタップ",
         "シフトを変更したいスタッフ×日付のマスをタップするとピッカーが開きます")
    step(3, "シフト種類を選択",
         "グループ別に並んだボタンから変更後のシフト種類を選んでください")
    step(4, "複数のセルを続けて編集",
         "ステップ2〜3を繰り返し。変更済みのマスはオレンジ色の枠で表示されます")
    step(5, "「変更確定 N件」ボタンをタップ",
         "画面右下に表示されるボタンを押すと全変更が一括送信されます")
    sp(3)

    two_phones("04_draft_mode_enter.png", "05_draft_picker.png",
               "▲ ①下書きモード", "▲ ②シフト種類ピッカー")
    sp(3)
    two_phones("06_draft_cells_changed.png", "07_draft_confirm_btn.png",
               "▲ ③変更済みセル（オレンジ枠）", "▲ ④変更確定ボタン")
    sp(3)

    tip("「キャンセル」ボタンを押すと、変更をすべて破棄して通常表示に戻ります。"
        "ピッカー内の「元に戻す」ボタンでそのセルだけリセットも可能です。", kind='warn')
    sp(2)
    tip("有給・アニバーサリー休暇を設定すると、従業員管理の残日数が自動的に更新されます。", kind='tip')

    story.append(PageBreak())

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 5. 従業員管理
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    story.append(SectionBanner("5", "従業員管理", "スタッフ情報・有給・アニバーサリー休暇"))
    sp(5)
    body("従業員一覧ではスタッフの基本情報と有給・アニバーサリー休暇の残日数を管理します。"
         "編集は管理者モードでのみ行えます。")
    sp(3)
    two_phones("10_employee_list.png", "12_employee_edit_modal.png",
               "▲ 従業員一覧", "▲ 編集モーダル（管理者モード）")
    sp(3)

    h3("管理者モードの使い方")
    step(1, "「一般」ボタンをタップ", "画面右上の鍵マークボタンをタップ")
    step(2, "管理者PINを入力", "4桁のPINを入力して認証します")
    step(3, "編集ボタンをタップ", "スタッフカード右のペンアイコンから編集画面を開きます")
    step(4, "情報を更新して「保存する」", "名前・役職・勤務地・休暇日数を変更できます")
    sp(2)
    tip("管理者モードでのみ付与日数・使用済み日数の手動変更が可能です。"
        "一般ユーザーは残日数の確認のみ行えます。", kind='warn')
    sp(2)

    h3("休暇残日数の自動カウント")
    bullet([
        "有休シフトを設定すると「有給使用済み日数」が自動で +1",
        "アニ休 → +1日、AMアニ休・PMアニ休 → それぞれ +0.5日",
        "残日数が少なくなると赤色で警告表示",
    ])

    story.append(PageBreak())

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 6. 変更履歴
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    story.append(SectionBanner("6", "変更履歴の確認", "シフト変更の記録を追跡"))
    sp(5)
    body("早見表画面の時計アイコンをタップすると、過去のシフト変更記録を確認できます。"
         "いつ・誰の・どのシフトが変更されたかを一覧で把握できます。")
    sp(4)
    phone("13_history_drawer.png", w_mm=65, caption_text="▲ 変更履歴ドロワー")
    sp(4)
    bullet([
        "最新60件の変更記録を新しい順に表示",
        "変更前 → 変更後のシフトが矢印で表示",
        "対象スタッフ名・日付・変更日時を記録",
    ])
    sp(3)
    tip("シフトを誤って変更した場合は履歴を参考に元の状態を確認し、再度シフト変更で修正してください。", kind='info')

    story.append(PageBreak())

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 7. PC版
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    story.append(SectionBanner("7", "PC版の使い方", "デスクトップでの操作"))
    sp(5)
    body("PC（1024px以上の画面）でアクセスすると、左側にナビゲーションサイドバーが表示され、"
         "広い画面を活かしたレイアウトに自動切り替えされます。")
    sp(3)

    pc_path = os.path.join(SS_DIR, "14_pc_shift.png")
    if os.path.exists(pc_path):
        buf = make_desktop_image(pc_path, 1400)
        story.append(DesktopImage(buf, CONTENT_W))
        sp(1)
        caption("▲ PC版 勤務早見表（1280px幅）")
    sp(3)

    bullet([
        "左サイドバーにナビゲーション・ロゴを表示",
        "従業員カードが2〜3列グリッドで広く表示",
        "早見表は画面全体を使った広いテーブル表示",
        "操作方法はスマートフォン版と同じです",
    ])

    story.append(PageBreak())

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 8. シフト種類一覧（巻末）
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    story.append(SectionBanner("8", "シフト種類一覧", "全シフト記号の早見表"))
    sp(5)
    body("システムで使用できるシフト種類の一覧です。ピッカーモーダルに同じ順序で表示されます。")
    sp(3)

    shift_full = [
        ["グループ", "シフト名", "表示記号", "有給消化", "備考"],
        ["出勤・休日", "出勤", "出", "－", "通常出勤（デフォルト）"],
        ["出勤・休日", "公休", "公", "－", "法定休日・週休"],
        ["出勤・休日", "AM公休", "AM公", "－", "午前のみ公休"],
        ["出勤・休日", "PM公休", "PM公", "－", "午後のみ公休"],
        ["各種休暇", "有給休暇", "有", "1日", "有給残日数から自動消化"],
        ["各種休暇", "アニバーサリー休暇", "アニバ", "1日", "アニバ残から自動消化"],
        ["各種休暇", "AMアニバーサリー", "AMアニバ", "0.5日", "午前のみ取得"],
        ["各種休暇", "PMアニバーサリー", "PMアニバ", "0.5日", "午後のみ取得"],
        ["各種休暇", "育児休暇", "育", "－", "育児休業中"],
        ["各種休暇", "産前産後休暇", "産", "－", "産休中"],
        ["各種休暇", "特別休暇", "特休", "－", "慶弔・その他特別"],
        ["その他", "研修", "研修", "－", "社内外研修"],
        ["その他", "出張", "出張", "－", "社外出張"],
        ["その他", "アルバイト", "バイ", "－", "アルバイト勤務"],
    ]

    col_w2 = [28*mm, 38*mm, 22*mm, 20*mm, CONTENT_W - 28*mm - 38*mm - 22*mm - 20*mm]
    full_tbl = Table(shift_full, colWidths=col_w2)
    full_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('FONTNAME', (0,0), (-1,0), FONT_BOLD),
        ('FONTNAME', (0,1), (-1,-1), FONT_NORMAL),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('ALIGN', (0,1), (1,-1), 'LEFT'),
        ('ALIGN', (4,1), (4,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2.5*mm),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5*mm),
        ('LEFTPADDING', (0,0), (-1,-1), 2*mm),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, GRAY_100]),
        ('BOX', (0,0), (-1,-1), 0.5, GRAY_300),
        ('INNERGRID', (0,0), (-1,-1), 0.3, GRAY_300),
        # グループセル結合（簡易版: 色分けのみ）
        ('BACKGROUND', (0,1), (0,4), colors.HexColor('#eff6ff')),
        ('BACKGROUND', (0,5), (0,11), colors.HexColor('#fff7ed')),
        ('BACKGROUND', (0,12), (0,14), GRAY_100),
    ]))
    story.append(full_tbl)
    sp(4)

    # 奥付
    divider()
    sp(3)
    outro = ParagraphStyle('outro', fontName=FONT_NORMAL, fontSize=9,
                           textColor=GRAY_500, alignment=TA_CENTER, leading=16)
    story.append(Paragraph("Total Body Make　勤務管理システム 操作マニュアル　Ver. 2.0", outro))
    story.append(Paragraph("2026年4月発行　／　社外秘　／　無断転載禁止", outro))
    story.append(Paragraph("ご不明な点は管理者までお問い合わせください。", outro))

    # ─── PDF 生成 ────────────────────────────────────────────────────────────
    doc = SimpleDocTemplate(
        OUT_PDF,
        pagesize=A4,
        leftMargin=MARGIN_L,
        rightMargin=MARGIN_R,
        topMargin=MARGIN_T + 14*mm,   # ヘッダー分
        bottomMargin=MARGIN_B + 10*mm, # フッター分
        title="勤務管理システム 操作マニュアル",
        author="Total Body Make",
        subject="スタッフ向け操作手順書",
    )

    def page_handler(canvas, doc):
        if doc.page == 1:
            build_cover(canvas, doc)
        else:
            on_later_pages(canvas, doc)

    doc.build(story, onFirstPage=page_handler, onLaterPages=page_handler)
    print(f"\n✅ PDF生成完了: {OUT_PDF}")
    import os as _os
    size_mb = _os.path.getsize(OUT_PDF) / 1024 / 1024
    print(f"   ファイルサイズ: {size_mb:.1f} MB")

if __name__ == '__main__':
    build_pdf()
