"""
Tasarruf hedefleri API endpoint'leri.
"""

from fastapi import APIRouter, HTTPException
from typing import List
from ...database import get_db_connection
from ...models import GoalContribution, SavingsGoalResponse, SavingsGoalCreate, SavingsGoalUpdate

router = APIRouter(prefix="/api/goals", tags=["Tasarruf Hedefleri"])


def calculate_goal_progress(goal: dict) -> dict:
    """
    Bir tasarruf hedefi için ilerleme oranını hesaplar.
    """
    goal_dict = dict(goal)
    goal_dict['progress_percentage'] = (goal_dict['current_amount'] / goal_dict['target_amount']) * 100 if goal_dict['target_amount'] > 0 else 0
    goal_dict['remaining_amount'] = goal_dict['target_amount'] - goal_dict['current_amount']
    return goal_dict


@router.get("", response_model=List[SavingsGoalResponse])
async def get_goals():
    """
    Tüm tasarruf hedeflerini listeler.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM savings_goals ORDER BY created_at DESC")
        goals = cursor.fetchall()

        result = []
        for goal in goals:
            result.append(calculate_goal_progress(dict(goal)))

        return result


@router.get("/{goal_id}", response_model=SavingsGoalResponse)
async def get_goal(goal_id: int):
    """
    Belirli bir tasarruf hedefini getirir.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM savings_goals WHERE id = ?", (goal_id,))
        goal = cursor.fetchone()

        if not goal:
            raise HTTPException(status_code=404, detail="Tasarruf hedefi bulunamadı")

        return calculate_goal_progress(dict(goal))


@router.post("", response_model=SavingsGoalResponse, status_code=201)
async def create_goal(goal: SavingsGoalCreate):
    """
    Yeni tasarruf hedefi oluşturur.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO savings_goals (name, target_amount, current_amount, target_date)
            VALUES (?, ?, ?, ?)
            """,
            (
                goal.name,
                goal.target_amount,
                goal.current_amount,
                goal.target_date
            )
        )
        conn.commit()

        cursor.execute("SELECT * FROM savings_goals WHERE id = ?", (cursor.lastrowid,))
        new_goal = cursor.fetchone()

        return calculate_goal_progress(dict(new_goal))


@router.put("/{goal_id}", response_model=SavingsGoalResponse)
async def update_goal(goal_id: int, goal: SavingsGoalUpdate):
    """
    Bir tasarruf hedefini günceller.
    """
    # Hedef var mı kontrol et
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM savings_goals WHERE id = ?", (goal_id,))
        existing = cursor.fetchone()

        if not existing:
            raise HTTPException(status_code=404, detail="Tasarruf hedefi bulunamadı")

        effective_target = goal.target_amount if goal.target_amount is not None else existing['target_amount']
        effective_current = goal.current_amount if goal.current_amount is not None else existing['current_amount']
        if effective_current > effective_target:
            raise HTTPException(status_code=422, detail="Birikmiş tutar hedef tutarından büyük olamaz")

    # Güncelleme sorgusu
    update_fields = []
    update_values = []

    if goal.name is not None:
        update_fields.append("name = ?")
        update_values.append(goal.name)

    if goal.target_amount is not None:
        update_fields.append("target_amount = ?")
        update_values.append(goal.target_amount)

    if goal.target_date is not None:
        update_fields.append("target_date = ?")
        update_values.append(goal.target_date)

    if goal.current_amount is not None:
        update_fields.append("current_amount = ?")
        update_values.append(goal.current_amount)

    if not update_fields:
        raise HTTPException(status_code=400, detail="Güncellenecek alan belirtilmedi")

    update_values.append(goal_id)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            f"UPDATE savings_goals SET {', '.join(update_fields)} WHERE id = ?",
            update_values
        )
        conn.commit()

        cursor.execute("SELECT * FROM savings_goals WHERE id = ?", (goal_id,))
        updated_goal = cursor.fetchone()

        return calculate_goal_progress(dict(updated_goal))


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(goal_id: int):
    """
    Bir tasarruf hedefini siler.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM savings_goals WHERE id = ?", (goal_id,))
        existing = cursor.fetchone()

        if not existing:
            raise HTTPException(status_code=404, detail="Tasarruf hedefi bulunamadı")

        cursor.execute("DELETE FROM savings_goals WHERE id = ?", (goal_id,))
        conn.commit()


@router.post("/{goal_id}/add", response_model=SavingsGoalResponse)
async def add_to_goal(goal_id: int, contribution: GoalContribution):
    """
    Bir tasarruf hedefine para ekler.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM savings_goals WHERE id = ?", (goal_id,))
        goal = cursor.fetchone()

        if not goal:
            raise HTTPException(status_code=404, detail="Tasarruf hedefi bulunamadı")

        new_amount = goal['current_amount'] + contribution.amount

        if new_amount > goal['target_amount']:
            raise HTTPException(
                status_code=400,
                detail="Eklenen tutar hedef tutarı aşacaktır"
            )

        cursor.execute(
            "UPDATE savings_goals SET current_amount = ? WHERE id = ?",
            (new_amount, goal_id)
        )
        conn.commit()

        cursor.execute("SELECT * FROM savings_goals WHERE id = ?", (goal_id,))
        updated_goal = cursor.fetchone()

        return calculate_goal_progress(dict(updated_goal))
