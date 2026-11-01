import calendar
from datetime import date

import pytest
from fastapi.testclient import TestClient

from app import database
from app.main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(database, "DATABASE_URL", str(tmp_path / "test.db"))
    with TestClient(app) as test_client:
        yield test_client


def create_transaction(client, category_id, kind, description, amount):
    return client.post(
        "/api/transactions",
        json={
            "description": description,
            "amount": amount,
            "type": kind,
            "category_id": category_id,
            "transaction_date": date.today().isoformat(),
        },
    )


def test_category_seed_is_repeatable_and_keeps_custom_categories(client):
    response = client.get("/api/categories")
    assert response.status_code == 200
    before_count = len(response.json())
    with database.get_db_connection() as conn:
        conn.execute(
            "INSERT INTO categories (name, type) VALUES (?, ?)",
            ("Kullanıcı kategorisi", "expense"),
        )
        conn.commit()
    database.init_database()
    categories = client.get("/api/categories").json()
    assert len(categories) == before_count + 1
    assert sum(c["name"] == "Market" and c["type"] == "expense" for c in categories) == 1
    assert any(c["name"] == "Kullanıcı kategorisi" for c in categories)


def test_transaction_crud_filters_dashboard_and_report(client):
    income_category = next(c["id"] for c in client.get("/api/categories?type=income").json() if c["name"] == "Maaş")
    food_category = next(c["id"] for c in client.get("/api/categories?type=expense").json() if c["name"] == "Yemek")
    income = create_transaction(client, income_category, "income", "Aylık gelir", 1000)
    expense = create_transaction(client, food_category, "expense", "Akşam yemeği", 250)
    assert income.status_code == 201
    assert expense.status_code == 201

    filtered = client.get(
        "/api/transactions",
        params={
            "type": "expense",
            "category_id": food_category,
            "start_date": date.today().isoformat(),
            "end_date": date.today().isoformat(),
            "search": "Ak",
        },
    )
    assert [item["id"] for item in filtered.json()] == [expense.json()["id"]]
    summary = client.get("/api/dashboard/summary?period=month").json()
    assert summary["total_income"] == 1000
    assert summary["total_expense"] == 250
    assert summary["net_balance"] == 750

    report = client.get(
        "/api/reports/summary",
        params={"start_date": date.today().isoformat(), "end_date": date.today().isoformat()},
    ).json()
    assert report["total_income"] == 1000
    assert report["total_expense"] == 250
    assert report["category_spending"][0]["category_name"] == "Yemek"

    updated = client.put(f"/api/transactions/{expense.json()['id']}", json={"amount": 300})
    assert updated.status_code == 200
    assert client.get("/api/dashboard/summary?period=month").json()["total_expense"] == 300
    assert client.delete(f"/api/transactions/{expense.json()['id']}").status_code == 204
    assert client.get("/api/dashboard/summary?period=month").json()["total_expense"] == 0
    assert client.get(f"/api/transactions/{expense.json()['id']}").status_code == 404


def test_transaction_validation_and_missing_category(client):
    payload = {
        "description": "Hatalı tutar",
        "amount": -1,
        "type": "expense",
        "category_id": 1,
        "transaction_date": date.today().isoformat(),
    }
    assert client.post("/api/transactions", json=payload).status_code == 422
    payload["amount"] = 20
    payload["category_id"] = 99999
    assert client.post("/api/transactions", json=payload).status_code == 404
    expense_category = client.get("/api/categories?type=expense").json()[0]["id"]
    payload["category_id"] = expense_category
    payload["type"] = "income"
    assert client.post("/api/transactions", json=payload).status_code == 400
    assert client.get("/api/transactions?start_date=not-a-date").status_code == 400
    assert client.get("/api/reports/summary?start_date=2026-02-01&end_date=2026-01-01").status_code == 400


def test_report_monthly_totals_obey_partial_date_range(client):
    category_id = client.get("/api/categories?type=expense").json()[0]["id"]
    before_period = client.post(
        "/api/transactions",
        json={
            "description": "Dönem öncesi",
            "amount": 100,
            "type": "expense",
            "category_id": category_id,
            "transaction_date": "2026-06-02",
        },
    )
    assert before_period.status_code == 201
    outside = client.post(
        "/api/transactions",
        json={
            "description": "Seçilen dönemde",
            "amount": 50,
            "type": "expense",
            "category_id": category_id,
            "transaction_date": "2026-06-20",
        },
    )
    assert outside.status_code == 201
    result = client.get(
        "/api/reports/summary",
        params={"start_date": "2026-06-15", "end_date": "2026-06-30"},
    ).json()
    assert result["total_expense"] == 50
    assert result["monthly_data"][0]["expense"] == 50


def test_budget_goal_ai_and_persistence(client):
    expense_category = client.get("/api/categories?type=expense").json()[0]["id"]
    create_transaction(client, expense_category, "expense", "Bütçe gideri", 75)
    budget = client.post(
        "/api/budgets",
        json={
            "name": "Aylık test",
            "category_id": expense_category,
            "period": "monthly",
            "limit_amount": 200,
            "start_date": date.today().replace(day=1).isoformat(),
            "end_date": date.today().replace(
                day=calendar.monthrange(date.today().year, date.today().month)[1]
            ).isoformat(),
        },
    )
    assert budget.status_code == 201
    assert budget.json()["spent_amount"] == 75
    updated_budget = client.put(f"/api/budgets/{budget.json()['id']}", json={"limit_amount": 150})
    assert updated_budget.json()["remaining_amount"] == 75
    extended_end = date(date.today().year + 1, 12, 31).isoformat()
    assert client.put(f"/api/budgets/{budget.json()['id']}", json={"end_date": extended_end}).status_code == 200

    goal = client.post(
        "/api/goals",
        json={"name": "Acil durum", "target_amount": 500, "current_amount": 50, "target_date": date.today().isoformat()},
    )
    assert goal.status_code == 201
    assert client.post(f"/api/goals/{goal.json()['id']}/add", json={"amount": 25}).json()["current_amount"] == 75
    assert client.put(f"/api/goals/{goal.json()['id']}", json={"target_amount": 60}).status_code == 422
    assert client.get("/api/ai/recommendations").status_code == 200

    assert client.delete(f"/api/budgets/{budget.json()['id']}").status_code == 204
    assert client.delete(f"/api/goals/{goal.json()['id']}").status_code == 204
    assert client.get(f"/api/goals/{goal.json()['id']}").status_code == 404


def test_health_and_database_reopen_persistence(client):
    assert client.get("/api/health").json()["durum"] == "sağlıklı"
    category_id = client.get("/api/categories?type=expense").json()[0]["id"]
    created = create_transaction(client, category_id, "expense", "Kalıcı kayıt", 123)
    transaction_id = created.json()["id"]
    with TestClient(app) as reopened:
        saved = reopened.get(f"/api/transactions/{transaction_id}")
        assert saved.status_code == 200
        assert saved.json()["amount"] == 123


def test_public_demo_seeds_synthetic_data_and_rejects_writes(client, monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "true")
    with TestClient(app) as demo_client:
        health = demo_client.get("/api/health")
        assert health.json()["demo_mode"] is True
        summary = demo_client.get("/api/dashboard/summary?period=month").json()
        assert summary["total_income"] == 50000
        assert summary["total_expense"] == 3900
        assert demo_client.get("/api/transactions").json()
        rejected = demo_client.post(
            "/api/transactions",
            json={
                "description": "Demo yazma testi",
                "amount": 10,
                "type": "expense",
                "category_id": 1,
                "transaction_date": date.today().isoformat(),
            },
        )
        assert rejected.status_code == 403
        assert "salt okunurdur" in rejected.json()["detail"]
    with TestClient(app) as restarted_demo:
        assert restarted_demo.get("/api/health").json()["demo_mode"] is True
        transactions = restarted_demo.get("/api/transactions").json()
        assert len(transactions) == 4
        assert restarted_demo.get("/api/dashboard/summary?period=month").json()["total_expense"] == 3900
