"""
Finansal Raporlar API endpoint'leri.
"""

from fastapi import APIRouter, HTTPException, Query
from datetime import date, datetime, timedelta
from ...database import get_db_connection
from ...models import ReportSummary, CategorySpending, MonthlyData

router = APIRouter(prefix="/api/reports", tags=["Raporlar"])


@router.get("/summary", response_model=ReportSummary)
async def get_report_summary(
    start_date: str = Query(..., description="Başlangıç tarihi (YYYY-MM-DD)"),
    end_date: str = Query(..., description="Bitiş tarihi (YYYY-MM-DD)")
):
    """
    Belirli bir dönem için finansal özet raporu oluşturur.
    """
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Geçersiz tarih formatı")

    if start > end:
        raise HTTPException(status_code=400, detail="Başlangıç tarihi bitiş tarihinden önce olmalıdır")

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
            (start, end)
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
            (start, end)
        )
        total_expense = cursor.fetchone()['total']

        # Net fark
        net_difference = total_income - total_expense

        # Kategori bazlı harcama
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
            (start, end)
        )
        category_results = cursor.fetchall()

        total_spending = sum(row['total'] for row in category_results)

        category_spending = []
        for row in category_results:
            if row['total'] > 0:
                percentage = (row['total'] / total_spending * 100) if total_spending > 0 else 0
                category_spending.append(CategorySpending(
                    category_name=row['name'],
                    category_type=row['type'],
                    total_amount=row['total'],
                    percentage=percentage
                ))

        # En yüksek harcama kategorileri (ilk 5)
        top_expense_categories = sorted(category_spending, key=lambda x: x.total_amount, reverse=True)[:5]

        # Aylık veriler
        monthly_data = []
        current_date = start
        while current_date <= end:
            month_start = current_date.replace(day=1)
            period_month_start = max(start, month_start)
            if month_start.month == 12:
                month_end = month_start.replace(year=month_start.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                month_end = month_start.replace(month=month_start.month + 1, day=1) - timedelta(days=1)

            # Dönem dışına çıkarsa düzelt
            if month_end > end:
                month_end = end

            month_names = [
                "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
                "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
            ]
            month_name = f"{month_names[month_start.month - 1]} {month_start.year}"

            # Gelir
            cursor.execute(
                """
                SELECT COALESCE(SUM(amount), 0) as total
                FROM transactions
                WHERE type = 'income'
                AND transaction_date >= ? AND transaction_date <= ?
                """,
                (period_month_start, month_end)
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
                (period_month_start, month_end)
            )
            expense = cursor.fetchone()['total']

            monthly_data.append(MonthlyData(
                month=month_name,
                income=income,
                expense=expense
            ))

            # Sonraki aya geç
            if month_start.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1, day=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1, day=1)


        return ReportSummary(
            total_income=total_income,
            total_expense=total_expense,
            net_difference=net_difference,
            category_spending=category_spending,
            monthly_data=monthly_data,
            top_expense_categories=top_expense_categories
        )
