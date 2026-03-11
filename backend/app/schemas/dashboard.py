from decimal import Decimal
from pydantic import BaseModel


class DashboardSummary(BaseModel):
    receitas_mes: Decimal
    despesas_mes: Decimal
    saldo_mes: Decimal
    por_categoria: list[dict]
    evolucao_mensal: list[dict]
    ultimas_transacoes: list[dict]
