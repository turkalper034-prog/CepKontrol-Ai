"""
SQLite veritabanı bağlantısı ve tablo oluşturma modülü.

Bu modül, SQLite veritabanı ile güvenli ve düzenli bağlantı kurmak için
hazır bir yapı sağlar. Finansal verileri saklamak için gerekli tabloları oluşturur.
"""

import sqlite3
import os
import calendar
from pathlib import Path
from datetime import date
from typing import Optional
from contextlib import contextmanager
from datetime import datetime
from dotenv import load_dotenv


sqlite3.register_adapter(date, date.isoformat)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
_database_url = os.getenv("DATABASE_URL", "cepkontrol.db")
DATABASE_URL = (
    str((Path(__file__).resolve().parent.parent / _database_url).resolve())
    if not os.path.isabs(_database_url) and _database_url != ":memory:"
    else _database_url
)


@contextmanager
def get_db_connection():
    """
    SQLite veritabanı bağlantısı context manager.

    Bu fonksiyon, veritabanı bağlantısını güvenli bir şekilde
    açar ve kapatır. Hata durumunda otomatik olarak bağlantıyı kapatır.

    Kullanım:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM transactions")
            result = cursor.fetchall()
    """
    conn = None
    try:
        conn = sqlite3.connect(DATABASE_URL)
        conn.row_factory = sqlite3.Row  # Sözlük benzeri erişim için
        yield conn
    except sqlite3.Error as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()


def init_database():
    """
    Veritabanını başlatır ve gerekli tabloları oluşturur.

    Tablolar:
    - categories: Kategoriler (gelir/gider)
    - transactions: Finansal işlemler
    - budgets: Bütçeler
    - savings_goals: Tasarruf hedefleri
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Kategoriler tablosu
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
                icon TEXT,
                color TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # İşlemler tablosu
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                amount REAL NOT NULL CHECK(amount > 0),
                type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
                category_id INTEGER,
                transaction_date DATE NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )
        """)

        # Bütçeler tablosu
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS budgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category_id INTEGER NOT NULL,
                period TEXT NOT NULL CHECK(period IN ('monthly', 'custom')),
                limit_amount REAL NOT NULL CHECK(limit_amount > 0),
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )
        """)

        # Tasarruf hedefleri tablosu
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS savings_goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                target_amount REAL NOT NULL CHECK(target_amount > 0),
                current_amount REAL DEFAULT 0 CHECK(current_amount >= 0),
                target_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Add only missing built-in categories; existing/custom entries are preserved.
        default_categories = [
            ("Maaş", "income", "💰", "#10b981"),
            ("Burs", "income", "🎓", "#059669"),
            ("Freelance", "income", "💻", "#047857"),
            ("Ek gelir", "income", "💵", "#065f46"),
            ("Yatırım geliri", "income", "📈", "#064e3b"),
            ("Diğer", "income", "💎", "#0f766e"),
            ("Market", "expense", "🛒", "#ef4444"),
            ("Yemek", "expense", "🍽️", "#dc2626"),
            ("Ulaşım", "expense", "🚗", "#b91c1c"),
            ("Faturalar", "expense", "💡", "#991b1b"),
            ("Kira", "expense", "🏠", "#7f1d1d"),
            ("Sağlık", "expense", "🏥", "#450a0a"),
            ("Eğlence", "expense", "🎮", "#3b82f6"),
            ("Giyim", "expense", "👕", "#2563eb"),
            ("Eğitim", "expense", "📚", "#1d4ed8"),
            ("Diğer", "expense", "📦", "#1e3a8a"),
        ]
        for name, category_type, icon, color in default_categories:
            cursor.execute(
                "SELECT id FROM categories WHERE name = ? COLLATE NOCASE AND type = ?",
                (name, category_type)
            )
            if cursor.fetchone() is None:
                cursor.execute(
                    "INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)",
                    (name, category_type, icon, color)
                )

        if os.getenv("DEMO_MODE", "").lower() == "true":
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS demo_metadata (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
            """)
            cursor.execute(
                "SELECT value FROM demo_metadata WHERE key = ?",
                ("synthetic_seed_version",),
            )
            seed_marker = cursor.fetchone()
            if seed_marker is None:
                cursor.execute("SELECT COUNT(*) FROM transactions")
                transaction_count = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM budgets")
                budget_count = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM savings_goals")
                goal_count = cursor.fetchone()[0]
                if transaction_count or budget_count or goal_count:
                    raise RuntimeError(
                        "DEMO_MODE, mevcut finansal kayıt içeren bir veritabanında başlatılamaz. "
                        "Yalnızca boş demo veritabanı kullanın."
                    )
                seed_demo_data(cursor)
                cursor.execute(
                    "INSERT INTO demo_metadata (key, value) VALUES (?, ?)",
                    ("synthetic_seed_version", "1"),
                )
            elif seed_marker["value"] != "1":
                raise RuntimeError("Demo veritabanının sentetik veri sürümü desteklenmiyor.")

        conn.commit()
        print("Veritabanı başarıyla başlatıldı ve tablolar oluşturuldu.")


def seed_demo_data(cursor):
    """Create fictional portfolio data only in an empty, explicitly enabled demo database."""
    today = date.today()
    month_start = today.replace(day=1)
    month_end = today.replace(day=calendar.monthrange(today.year, today.month)[1])
    cursor.execute("SELECT id, name FROM categories WHERE type = 'income'")
    income_categories = {row["name"]: row["id"] for row in cursor.fetchall()}
    cursor.execute("SELECT id, name FROM categories WHERE type = 'expense'")
    expense_categories = {row["name"]: row["id"] for row in cursor.fetchall()}
    demo_transactions = [
        ("Demo: Aylık maaş", 50000, "income", income_categories["Maaş"]),
        ("Demo: Market alışverişi", 2500, "expense", expense_categories["Market"]),
        ("Demo: Ulaşım kartı", 800, "expense", expense_categories["Ulaşım"]),
        ("Demo: Eğlence harcaması", 600, "expense", expense_categories["Eğlence"]),
    ]
    cursor.executemany(
        """
        INSERT INTO transactions (description, amount, type, category_id, transaction_date)
        VALUES (?, ?, ?, ?, ?)
        """,
        [(*transaction, today) for transaction in demo_transactions],
    )
    cursor.execute(
        """
        INSERT INTO budgets (name, category_id, period, limit_amount, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        ("Demo: Market bütçesi", expense_categories["Market"], "monthly", 8000, month_start, month_end),
    )
    cursor.execute(
        """
        INSERT INTO savings_goals (name, target_amount, current_amount, target_date)
        VALUES (?, ?, ?, ?)
        """,
        ("Demo: Acil durum birikimi", 100000, 25000, today.replace(year=today.year + 1)),
    )


if __name__ == "__main__":
    init_database()
