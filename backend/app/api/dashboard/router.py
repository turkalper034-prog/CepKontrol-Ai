"""
Dashboard ve API endpoint'leri.
"""

from fastapi import APIRouter, HTTPException, Query
from datetime import date, datetime, timedelta
from ...database import get_db_connection
from ...models import (
    DashboardSummary,
    CategorySpending,
    MonthlyData,
    ReportSummary,
    AIRecommendation
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    period: str = Query("month", description="Dönem: month, quarter, year")
):
    """
    Dashboard özet verilerini hesaplar.
    """
    # Tarih aralığını belirle
    today = date.today()

    if period == "month":
        start_date = today.replace(day=1)
        end_date = today
    elif period == "quarter":
        quarter_start_month = ((today.month - 1) // 3) * 3 + 1
        start_date = today.replace(month=quarter_start_month, day=1)
        end_date = today
    elif period == "year":
        start_date = today.replace(month=1, day=1)
        end_date = today
    else:
        raise HTTPException(status_code=400, detail="Geçersiz dönem")

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Toplam gelir
        cursor.execute(
            """
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE type = 'income'
            AND transaction_date >= ? AND transaction_date <= ?
            """,
            (start_date, end_date)
        )
        total_income = cursor.fetchone()['total']

        # Toplam gider
        cursor.execute(
            """
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE type = 'expense'
            AND transaction_date >= ? AND transaction_date <= ?
            """,
            (start_date, end_date)
        )
        total_expense = cursor.fetchone()['total']

        # Net bakiye
        net_balance = total_income - total_expense

        # Tasarruf oranı
        savings_rate = (net_balance / total_income * 100) if total_income > 0 else 0

        return DashboardSummary(
            total_income=total_income,
            total_expense=total_expense,
            net_balance=net_balance,
            savings_rate=savings_rate,
            period=period
        )


@router.get("/category-spending")
async def get_category_spending(
    period: str = Query("month", description="Dönem: month, quarter, year")
):
    """
    Kategori bazlı harcama dağılımını hesaplar.
    """
    # Tarih aralığını belirle
    today = date.today()

    if period == "month":
        start_date = today.replace(day=1)
        end_date = today
    elif period == "quarter":
        quarter_start_month = ((today.month - 1) // 3) * 3 + 1
        start_date = today.replace(month=quarter_start_month, day=1)
        end_date = today
    elif period == "year":
        start_date = today.replace(month=1, day=1)
        end_date = today
    else:
        raise HTTPException(status_code=400, detail="Geçersiz dönem")

    with get_db_connection() as conn:
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT c.name, c.type, COALESCE(SUM(t.amount), 0) as total
            FROM categories c
            LEFT JOIN transactions t ON c.id = t.category_id
            AND t.type = 'expense'
            AND t.transaction_date >= ? AND t.transaction_date <= ?
            WHERE c.type = 'expense'
            GROUP BY c.id
            ORDER BY total DESC
            """,
            (start_date, end_date)
        )
        results = cursor.fetchall()

        total_spending = sum(row['total'] for row in results)

        category_spending = []
        for row in results:
            if row['total'] > 0:
                percentage = (row['total'] / total_spending * 100) if total_spending > 0 else 0
                category_spending.append(CategorySpending(
                    category_name=row['name'],
                    category_type=row['type'],
                    total_amount=row['total'],
                    percentage=percentage
                ))

        return category_spending


@router.get("/monthly-data")
async def get_monthly_data(
    months: int = Query(6, ge=1, le=12, description="Kaç ayın verisi çekilecek")
):
    """
    Aylık gelir ve gider verilerini hesaplar.
    """
    monthly_data = []

    for i in range(months):
        # i=0 bu ay, i=1 geçen ay, vs.
        month_date = date.today().replace(day=1) - timedelta(days=i * 32)
        month_date = month_date.replace(day=1)

        # Ayın son günü
        if month_date.month == 12:
            end_date = month_date.replace(year=month_date.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_date = month_date.replace(month=month_date.month + 1, day=1) - timedelta(days=1)

        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Türkçe ay ismi
            month_names = [
                "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
                "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
            ]
            month_name = f"{month_names[month_date.month - 1]} {month_date.year}"

            # Gelir
            cursor.execute(
                """
                SELECT COALESCE(SUM(amount), 0) as total
                FROM transactions
                WHERE type = 'income'
                AND transaction_date >= ? AND transaction_date <= ?
                """,
                (month_date, end_date)
            )
            income = cursor.fetchone()['total']

            # Gider
            cursor.execute(
                """
                SELECT COALESCE(SUM(amount), 0) as total
                FROM transactions
                WHERE type = 'expense'
                AND transaction_date >= ? AND transaction_date <= ?
                """,
                (month_date, end_date)
            )
            expense = cursor.fetchone()['total']

            monthly_data.append(MonthlyData(
                month=month_name,
                income=income,
                expense=expense
            ))

    # Ters çevir (en eski en başta)
    monthly_data.reverse()

    return monthly_data


@router.get("/recent-transactions")
async def get_recent_transactions(limit: int = Query(5, ge=1, le=20)):
    """
    Son işlemleri getirir.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT t.*, c.name as category_name, c.icon, c.color
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            ORDER BY t.transaction_date DESC, t.created_at DESC
            LIMIT ?
            """,
            (limit,)
        )
        transactions = cursor.fetchall()

        result = []
        for row in transactions:
            trans_dict = dict(row)
            trans_dict['category_name'] = row['category_name']
            trans_dict['icon'] = row['icon']
            trans_dict['color'] = row['color']
            result.append(trans_dict)

        return result


@router.get("/budget-status")
async def get_budget_status():
    """
    Bütçe kullanım durumlarını getirir.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT b.*, c.name as category_name, c.icon, c.color
            FROM budgets b
            JOIN categories c ON b.category_id = c.id
            ORDER BY b.created_at DESC
            """
        )
        budgets = cursor.fetchall()

        result = []
        for budget in budgets:
            # Harcama hesapla
            cursor2 = conn.cursor()
            cursor2.execute(
                """
                SELECT COALESCE(SUM(t.amount), 0) as total
                FROM transactions t
                WHERE t.category_id = ?
                AND t.type = 'expense'
                AND t.transaction_date >= ? AND t.transaction_date <= ?
                """,
                (budget['category_id'], budget['start_date'], budget['end_date'])
            )
            spent = cursor2.fetchone()['total']

            budget_dict = dict(budget)
            budget_dict['spent_amount'] = spent
            budget_dict['remaining_amount'] = budget['limit_amount'] - spent
            budget_dict['usage_percentage'] = (spent / budget['limit_amount'] * 100) if budget['limit_amount'] > 0 else 0
            budget_dict['category_name'] = budget['category_name']
            budget_dict['icon'] = budget['icon']
            budget_dict['color'] = budget['color']

            result.append(budget_dict)

        return result
