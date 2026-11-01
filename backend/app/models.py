"""
Pydantic modelleri - API istek ve yanıtları için veri modelleri.
"""

from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Optional, Literal
from datetime import date


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: Literal['income', 'expense']
    icon: Optional[str] = None
    color: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int
    created_at: str
    model_config = ConfigDict(from_attributes=True)


class TransactionBase(BaseModel):
    description: str = Field(..., min_length=1, max_length=200)
    amount: float = Field(..., gt=0)
    type: Literal['income', 'expense']
    category_id: int = Field(..., gt=0)
    transaction_date: date
    notes: Optional[str] = Field(None, max_length=500)

class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    description: Optional[str] = Field(None, min_length=1, max_length=200)
    amount: Optional[float] = Field(None, gt=0)
    type: Optional[Literal['income', 'expense']] = None
    category_id: Optional[int] = None
    transaction_date: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=500)


class TransactionResponse(TransactionBase):
    id: int
    created_at: str
    category_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


class BudgetBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category_id: int = Field(..., gt=0)
    period: Literal['monthly', 'custom']
    limit_amount: float = Field(..., gt=0)
    start_date: date
    end_date: date

    @model_validator(mode='after')
    def validate_end_date(self):
        if self.end_date <= self.start_date:
            raise ValueError('Bitiş tarihi başlangıç tarihinden sonra olmalıdır')
        return self


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category_id: Optional[int] = Field(None, gt=0)
    period: Optional[Literal['monthly', 'custom']] = None
    limit_amount: Optional[float] = Field(None, gt=0)
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class BudgetResponse(BudgetBase):
    id: int
    created_at: str
    spent_amount: float = 0
    remaining_amount: float = 0
    usage_percentage: float = 0

    model_config = ConfigDict(from_attributes=True)


class SavingsGoalBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    target_amount: float = Field(..., gt=0)
    target_date: date
    current_amount: float = Field(default=0, ge=0)

    @model_validator(mode='after')
    def validate_current_amount(self):
        if self.current_amount > self.target_amount:
            raise ValueError('Birikmiş tutar hedef tutarından büyük olamaz')
        return self


class SavingsGoalCreate(SavingsGoalBase):
    pass


class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    target_amount: Optional[float] = Field(None, gt=0)
    target_date: Optional[date] = None
    current_amount: Optional[float] = Field(None, ge=0)


class GoalContribution(BaseModel):
    amount: float = Field(..., gt=0)


class SavingsGoalResponse(SavingsGoalBase):
    id: int
    created_at: str
    progress_percentage: float = 0
    remaining_amount: float = 0

    model_config = ConfigDict(from_attributes=True)


class DashboardSummary(BaseModel):
    total_income: float
    total_expense: float
    net_balance: float
    savings_rate: float
    period: str


class CategorySpending(BaseModel):
    category_name: str
    category_type: str
    total_amount: float
    percentage: float


class MonthlyData(BaseModel):
    month: str
    income: float
    expense: float


class ReportSummary(BaseModel):
    total_income: float
    total_expense: float
    net_difference: float
    category_spending: list[CategorySpending]
    monthly_data: list[MonthlyData]
    top_expense_categories: list[CategorySpending]


class AIRecommendation(BaseModel):
    title: str
    description: str
    category: str
    priority: Literal['high', 'medium', 'low']
    data_source: str
