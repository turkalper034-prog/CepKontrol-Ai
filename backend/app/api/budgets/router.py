"""
Bütçeler API endpoint'leri.
"""

from fastapi import APIRouter, HTTPException
from typing import List
from datetime import date
from ...database import get_db_connection
from ...models import BudgetResponse, BudgetCreate, BudgetUpdate

router = APIRouter(prefix="/api/budgets", tags=["Bütçeler"])


def calculate_budget_spending(conn, budget_id: int) -> dict:
    """
    Bir bütçe için harcama miktarını hesaplar.
    """
    cursor = conn.cursor()

    # Bütçe bilgilerini al
    cursor.execute(
        """
        SELECT b.*, c.name as category_name, c.type
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        WHERE b.id = ?
        """,
        (budget_id,)
    )
    budget = cursor.fetchone()

    if not budget:
        return None

    # İlgili dönemdeki harcamaları hesapla
    cursor.execute(
        """
        SELECT COALESCE(SUM(t.amount), 0) as total
        FROM transactions t
        WHERE t.category_id = ?
        AND t.type = 'expense'
        AND t.transaction_date >= ?
        AND t.transaction_date <= ?
        """,
        (budget['category_id'], budget['start_date'], budget['end_date'])
    )
    spent = cursor.fetchone()['total']

    budget_dict = dict(budget)
    budget_dict['spent_amount'] = spent
    budget_dict['remaining_amount'] = budget['limit_amount'] - spent
    budget_dict['usage_percentage'] = (spent / budget['limit_amount']) * 100 if budget['limit_amount'] > 0 else 0

    return budget_dict


@router.get("", response_model=List[BudgetResponse])
async def get_budgets():
    """
    Tüm bütçeleri listeler.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT b.*, c.name as category_name, c.type
            FROM budgets b
            JOIN categories c ON b.category_id = c.id
            ORDER BY b.created_at DESC
            """
        )
        budgets = cursor.fetchall()

        result = []
        for budget in budgets:
            budget_dict = calculate_budget_spending(conn, budget['id'])
            budget_dict.pop('category_name', None)
            budget_dict.pop('type', None)
            result.append(budget_dict)

        return result


@router.get("/{budget_id}", response_model=BudgetResponse)
async def get_budget(budget_id: int):
    """
    Belirli bir bütçeyi getirir.
    """
    with get_db_connection() as conn:
        budget_dict = calculate_budget_spending(conn, budget_id)

        if not budget_dict:
            raise HTTPException(status_code=404, detail="Bütçe bulunamadı")

        budget_dict.pop('category_name', None)
        budget_dict.pop('type', None)

        return budget_dict


@router.post("", response_model=BudgetResponse, status_code=201)
async def create_budget(budget: BudgetCreate):
    """
    Yeni bütçe oluşturur.
    """
    # Kategori doğrulama
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, type FROM categories WHERE id = ?",
            (budget.category_id,)
        )
        category = cursor.fetchone()

        if not category:
            raise HTTPException(status_code=404, detail="Kategori bulunamadı")

        if category['type'] != 'expense':
            raise HTTPException(status_code=400, detail="Bütçe sadece gider kategorileri için oluşturulabilir")

        cursor.execute(
            """
            INSERT INTO budgets (name, category_id, period, limit_amount, start_date, end_date)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                budget.name,
                budget.category_id,
                budget.period,
                budget.limit_amount,
                budget.start_date,
                budget.end_date
            )
        )
        conn.commit()

        budget_dict = calculate_budget_spending(conn, cursor.lastrowid)
        budget_dict.pop('category_name', None)
        budget_dict.pop('type', None)

        return budget_dict


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(budget_id: int, budget: BudgetUpdate):
    """
    Bir bütçeyi günceller.
    """
    # Bütçe var mı kontrol et
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM budgets WHERE id = ?", (budget_id,))
        existing = cursor.fetchone()

        if not existing:
            raise HTTPException(status_code=404, detail="Bütçe bulunamadı")

        effective_start = budget.start_date or date.fromisoformat(existing['start_date'])
        effective_end = budget.end_date or date.fromisoformat(existing['end_date'])
        if effective_end <= effective_start:
            raise HTTPException(status_code=422, detail="Bitiş tarihi başlangıç tarihinden sonra olmalıdır")

    # Kategori doğrulama
    if budget.category_id is not None:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, type FROM categories WHERE id = ?",
                (budget.category_id,)
            )
            category = cursor.fetchone()

            if not category:
                raise HTTPException(status_code=404, detail="Kategori bulunamadı")

            if category['type'] != 'expense':
                raise HTTPException(status_code=400, detail="Bütçe sadece gider kategorileri için oluşturulabilir")

    # Güncelleme sorgusu
    update_fields = []
    update_values = []

    if budget.name is not None:
        update_fields.append("name = ?")
        update_values.append(budget.name)

    if budget.category_id is not None:
        update_fields.append("category_id = ?")
        update_values.append(budget.category_id)

    if budget.period is not None:
        update_fields.append("period = ?")
        update_values.append(budget.period)

    if budget.limit_amount is not None:
        update_fields.append("limit_amount = ?")
        update_values.append(budget.limit_amount)

    if budget.start_date is not None:
        update_fields.append("start_date = ?")
        update_values.append(budget.start_date)

    if budget.end_date is not None:
        update_fields.append("end_date = ?")
        update_values.append(budget.end_date)

    if not update_fields:
        raise HTTPException(status_code=400, detail="Güncellenecek alan belirtilmedi")

    update_values.append(budget_id)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            f"UPDATE budgets SET {', '.join(update_fields)} WHERE id = ?",
            update_values
        )
        conn.commit()

        budget_dict = calculate_budget_spending(conn, budget_id)
        budget_dict.pop('category_name', None)
        budget_dict.pop('type', None)

        return budget_dict


@router.delete("/{budget_id}", status_code=204)
async def delete_budget(budget_id: int):
    """
    Bir bütçeyi siler.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM budgets WHERE id = ?", (budget_id,))
        existing = cursor.fetchone()

        if not existing:
            raise HTTPException(status_code=404, detail="Bütçe bulunamadı")

        cursor.execute("DELETE FROM budgets WHERE id = ?", (budget_id,))
        conn.commit()
