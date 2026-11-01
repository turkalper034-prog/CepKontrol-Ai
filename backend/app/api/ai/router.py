"""
Kural tabanlı Yapay Zekâ Asistanı API endpoint'leri.

Bu gerçek bir AI API entegrasyonu değildir. Veritabanındaki finansal
özetleri kullanarak basit, kural tabanlı Türkçe öneriler üretir.
"""

from fastapi import APIRouter
from typing import List
from datetime import date, datetime, timedelta
from ...database import get_db_connection
from ...models import AIRecommendation

router = APIRouter(prefix="/api/ai", tags=["Yapay Zekâ Asistanı"])


@router.get("/recommendations", response_model=List[AIRecommendation])
async def get_ai_recommendations():
    """
    Veritabanındaki finansal özetleri kullanarak kural tabanlı öneriler üretir.

    Not: Bu gerçek bir üretken yapay zekâ entegrasyonu değildir.
    Öneriler veritabanındaki finansal verilere dayalı kural tabanlı analizlerdir.
    """
    recommendations = []

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Bugün ve geçen ay
        today = date.today()
        this_month_start = today.replace(day=1)
        last_month_start = (this_month_start - timedelta(days=32)).replace(day=1)
        last_month_end = this_month_start - timedelta(days=1)

        # 1. En yüksek harcama kategorisi
        cursor.execute(
            """
            SELECT c.name, COALESCE(SUM(t.amount), 0) as total
            FROM categories c
            LEFT JOIN transactions t ON c.id = t.category_id
            AND t.type = 'expense'
            AND t.transaction_date >= ? AND t.transaction_date <= ?
            WHERE c.type = 'expense'
            GROUP BY c.id
            ORDER BY total DESC
            LIMIT 1
            """,
            (this_month_start, today)
        )
        top_category = cursor.fetchone()

        if top_category and top_category['total'] > 0:
            recommendations.append(AIRecommendation(
                title="En Yüksek Harcama Kategorisi",
                description=f"Bu ay en çok harcama '{top_category['name']}' kategorisinde yapıldı (₺{top_category['total']:.2f}). Bu kategoride harcamalarınızı gözden geçirmeyi düşünebilirsiniz.",
                category="Harcama Analizi",
                priority="high",
                data_source="Bu ayın harcama verileri"
            ))

        # 2. Aylık karşılaştırma
        cursor.execute(
            """
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE type = 'expense'
            AND transaction_date >= ? AND transaction_date <= ?
            """,
            (this_month_start, today)
        )
        this_month_expense = cursor.fetchone()['total']

        cursor.execute(
            """
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE type = 'expense'
            AND transaction_date >= ? AND transaction_date <= ?
            """,
            (last_month_start, last_month_end)
        )
        last_month_expense = cursor.fetchone()['total']

        if this_month_expense > 0 and last_month_expense > 0:
            if this_month_expense > last_month_expense:
                increase_percent = ((this_month_expense - last_month_expense) / last_month_expense) * 100
                recommendations.append(AIRecommendation(
                    title="Artan Harcama Trendi",
                    description=f"Bu ayki harcamalarınız geçen aya göre %{increase_percent:.1f} arttı. Giderlerinizi analiz edip gereksiz harcamaları azaltmayı deneyin.",
                    category="Trend Analizi",
                    priority="medium",
                    data_source="Aylık harcama karşılaştırması"
                ))
            elif this_month_expense < last_month_expense:
                decrease_percent = ((last_month_expense - this_month_expense) / last_month_expense) * 100
                recommendations.append(AIRecommendation(
                    title="İyi İş! Harcamalar Azaldı",
                    description=f"Bu ayki harcamalarınız geçen aya göre %{decrease_percent:.1f} azaldı. Bu tasarruf trendini sürdürmeye devam edin!",
                    category="Trend Analizi",
                    priority="low",
                    data_source="Aylık harcama karşılaştırması"
                ))

        # 3. Bütçe durumu
        cursor.execute(
            """
            SELECT b.id, b.name, b.limit_amount, b.start_date, b.end_date
            FROM budgets b
            WHERE b.end_date >= ?
            ORDER BY b.created_at DESC
            """,
            (today,)
        )
        budgets = cursor.fetchall()

        for budget in budgets:
            cursor.execute(
                """
                SELECT COALESCE(SUM(t.amount), 0) as total
                FROM transactions t
                WHERE t.category_id = (SELECT category_id FROM budgets WHERE id = ?)
                AND t.type = 'expense'
                AND t.transaction_date >= ? AND t.transaction_date <= ?
                """,
                (budget['id'], budget['start_date'], budget['end_date'])
            )
            spent = cursor.fetchone()['total']
            usage_percent = (spent / budget['limit_amount']) * 100 if budget['limit_amount'] > 0 else 0

            if usage_percent > 80:
                recommendations.append(AIRecommendation(
                    title=f"'{budget['name']}' Bütçesi Aşılıyor",
                    description=f"Bütçenizin %{usage_percent:.1f} kullanıldı. Harcamalarınızı kontrol etmeniz gerekebilir.",
                    category="Bütçe Uyarısı",
                    priority="high",
                    data_source="Bütçe kullanım durumu"
                ))

        # 4. Gelir-Gider oranı
        cursor.execute(
            """
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE type = 'income'
            AND transaction_date >= ? AND transaction_date <= ?
            """,
            (this_month_start, today)
        )
        this_month_income = cursor.fetchone()['total']

        if this_month_income > 0:
            savings_rate = ((this_month_income - this_month_expense) / this_month_income) * 100

            if savings_rate < 10:
                recommendations.append(AIRecommendation(
                    title="Düşük Tasarruf Oranı",
                    description=f"Bu ayki tasarruf oranınız %{savings_rate:.1f}. Gelirinizin en az %20'sini tasarruf etmeyi hedefleyin.",
                    category="Tasarruf Önerisi",
                    priority="high",
                    data_source="Gelir-gider oranı"
                ))
            elif savings_rate >= 20:
                recommendations.append(AIRecommendation(
                    title="Harika Tasarruf Oranı",
                    description=f"Bu ayki tasarruf oranınız %{savings_rate:.1f}. Finansal hedeflerinize doğru iyi ilerliyorsunuz!",
                    category="Tasarruf Önerisi",
                    priority="low",
                    data_source="Gelir-gider oranı"
                ))

        # 5. Veri yetersizliği uyarısı
        if not recommendations:
            recommendations.append(AIRecommendation(
                title="Yeterli Veri Yok",
                description="Öneri üretmek için yeterli finansal veri bulunamadı. İşlem ekleyerek finansal analizleriniz başlatabilirsiniz.",
                category="Bilgilendirme",
                priority="low",
                data_source="Veri yok"
            ))

    return recommendations
