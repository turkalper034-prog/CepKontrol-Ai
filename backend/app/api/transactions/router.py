"""
İşlemler API endpoint'leri.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import date, datetime
from ...database import get_db_connection
from ...models import TransactionResponse, TransactionCreate, TransactionUpdate

router = APIRouter(prefix="/api/transactions", tags=["İşlemler"])


@router.get("", response_model=List[TransactionResponse])
async def get_transactions(
    type: Optional[str] = Query(None, description="İşlem türü: income veya expense"),
    category_id: Optional[int] = Query(None, description="Kategori ID"),
    start_date: Optional[str] = Query(None, description="Başlangıç tarihi (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Bitiş tarihi (YYYY-MM-DD)"),
    search: Optional[str] = Query(None, description="Arama metni"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    İşlemleri listeler. Filtreleme ve sayfalama destekler.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Temel sorgu
        query = """
            SELECT t.*, c.name as category_name, c.icon, c.color
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE 1=1
        """
        params = []

        # Filtreler
        if type:
            if type not in ['income', 'expense']:
                raise HTTPException(status_code=400, detail="Geçersiz işlem türü")
            query += " AND t.type = ?"
            params.append(type)

        if category_id:
            query += " AND t.category_id = ?"
            params.append(category_id)

        if start_date:
            try:
                datetime.strptime(start_date, "%Y-%m-%d")
                query += " AND t.transaction_date >= ?"
                params.append(start_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Geçersiz başlangıç tarihi formatı")

        if end_date:
            try:
                datetime.strptime(end_date, "%Y-%m-%d")
                query += " AND t.transaction_date <= ?"
                params.append(end_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Geçersiz bitiş tarihi formatı")

        if search:
            query += " AND (t.description LIKE ? OR t.notes LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%"])

        # Sıralama ve sayfalama
        query += " ORDER BY t.transaction_date DESC, t.created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cursor.execute(query, params)
        transactions = cursor.fetchall()

        # Sonuçları formatla
        result = []
        for row in transactions:
            trans_dict = dict(row)
            # category_name, icon, color alanlarını kaldır (geri yanıt için)
            trans_dict.pop('category_name', None)
            trans_dict.pop('icon', None)
            trans_dict.pop('color', None)
            result.append(trans_dict)

        return result


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(transaction_id: int):
    """
    Belirli bir işlemi getirir.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions WHERE id = ?", (transaction_id,))
        transaction = cursor.fetchone()

        if not transaction:
            raise HTTPException(status_code=404, detail="İşlem bulunamadı")

        return dict(transaction)


@router.post("", response_model=TransactionResponse, status_code=201)
async def create_transaction(transaction: TransactionCreate):
    """
    Yeni işlem oluşturur.
    """
    # Kategori doğrulama
    if transaction.category_id:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, type FROM categories WHERE id = ?",
                (transaction.category_id,)
            )
            category = cursor.fetchone()

            if not category:
                raise HTTPException(status_code=404, detail="Kategori bulunamadı")

            # Kategori türü ile işlem türü eşleşmeli
            if category['type'] != transaction.type:
                raise HTTPException(
                    status_code=400,
                    detail=f"Kategori türü ({category['type']}) işlem türü ({transaction.type}) ile eşleşmiyor"
                )

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO transactions (description, amount, type, category_id, transaction_date, notes)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                transaction.description,
                transaction.amount,
                transaction.type,
                transaction.category_id,
                transaction.transaction_date,
                transaction.notes
            )
        )
        conn.commit()

        cursor.execute("SELECT * FROM transactions WHERE id = ?", (cursor.lastrowid,))
        new_transaction = cursor.fetchone()

        return dict(new_transaction)


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(transaction_id: int, transaction: TransactionUpdate):
    """
    Bir işlemi günceller.
    """
    # İşlem var mı kontrol et
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions WHERE id = ?", (transaction_id,))
        existing = cursor.fetchone()

        if not existing:
            raise HTTPException(status_code=404, detail="İşlem bulunamadı")

    # Validate that the resulting transaction type still matches its category.
    category_id = transaction.category_id if transaction.category_id is not None else existing['category_id']
    transaction_type = transaction.type if transaction.type is not None else existing['type']
    if category_id is not None:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, type FROM categories WHERE id = ?",
                (category_id,)
            )
            category = cursor.fetchone()

            if not category:
                raise HTTPException(status_code=404, detail="Kategori bulunamadı")

            if category['type'] != transaction_type:
                raise HTTPException(
                    status_code=400,
                    detail="Kategori türü işlem türü ile eşleşmiyor"
                )

    # Güncelleme sorgusu
    update_fields = []
    update_values = []

    if transaction.description is not None:
        update_fields.append("description = ?")
        update_values.append(transaction.description)

    if transaction.amount is not None:
        update_fields.append("amount = ?")
        update_values.append(transaction.amount)

    if transaction.type is not None:
        update_fields.append("type = ?")
        update_values.append(transaction.type)

    if transaction.category_id is not None:
        update_fields.append("category_id = ?")
        update_values.append(transaction.category_id)

    if transaction.transaction_date is not None:
        update_fields.append("transaction_date = ?")
        update_values.append(transaction.transaction_date)

    if transaction.notes is not None:
        update_fields.append("notes = ?")
        update_values.append(transaction.notes)

    if not update_fields:
        raise HTTPException(status_code=400, detail="Güncellenecek alan belirtilmedi")

    update_values.append(transaction_id)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            f"UPDATE transactions SET {', '.join(update_fields)} WHERE id = ?",
            update_values
        )
        conn.commit()

        cursor.execute("SELECT * FROM transactions WHERE id = ?", (transaction_id,))
        updated_transaction = cursor.fetchone()

        return dict(updated_transaction)


@router.delete("/{transaction_id}", status_code=204)
async def delete_transaction(transaction_id: int):
    """
    Bir işlemi siler.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions WHERE id = ?", (transaction_id,))
        existing = cursor.fetchone()

        if not existing:
            raise HTTPException(status_code=404, detail="İşlem bulunamadı")

        cursor.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
        conn.commit()
