"""
Kategoriler API endpoint'leri.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from ...database import get_db_connection
from ...models import CategoryResponse, CategoryCreate

router = APIRouter(prefix="/api/categories", tags=["Kategoriler"])


@router.get("", response_model=List[CategoryResponse])
async def get_categories(type: Optional[str] = None):
    """
    Tüm kategorileri listeler.
    İsteğe bağlı olarak tür (income/expense) filtresi uygulanabilir.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()

        if type:
            if type not in ['income', 'expense']:
                raise HTTPException(status_code=400, detail="Geçersiz kategori türü")
            cursor.execute(
                "SELECT * FROM categories WHERE type = ? ORDER BY name",
                (type,)
            )
        else:
            cursor.execute("SELECT * FROM categories ORDER BY name")

        categories = cursor.fetchall()
        return [dict(row) for row in categories]


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: int):
    """
    Belirli bir kategoriyi getirir.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM categories WHERE id = ?", (category_id,))
        category = cursor.fetchone()

        if not category:
            raise HTTPException(status_code=404, detail="Kategori bulunamadı")

        return dict(category)
