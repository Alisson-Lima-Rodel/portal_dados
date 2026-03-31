"""Modelos do banco de dados (tabelas).

Cada classe aqui representa uma TABELA no PostgreSQL.
O SQLAlchemy cria/gerencia as tabelas automaticamente a partir destas classes.

Conceitos SQLAlchemy usados:
  - Base: classe mãe — toda tabela herda dela
  - Mapped[tipo]: define o tipo da coluna (int, str, bool, etc.)
  - mapped_column(): configura a coluna (PK, FK, nullable, unique, etc.)
  - relationship(): define relacionamentos entre tabelas (1:N, N:1, 1:1)
  - ForeignKey("tabela.id"): chave estrangeira — liga esta tabela a outra

Exemplo de leitura:
  class User(Base):
      __tablename__ = "usuarios"          ← Nome da tabela no banco
      id: Mapped[int] = mapped_column(    ← Coluna 'id', tipo inteiro
          Integer, primary_key=True       ← É a chave primária
      )
      grupo_id: Mapped[int | None] = mapped_column(
          ForeignKey("grupos_acesso.id")  ← Referencia a tabela grupos_acesso
      )
      grupo: Mapped[GrupoAcesso] = relationship()  ← Acessa o grupo via user.grupo
"""
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class GrupoAcesso(Base):
    __tablename__ = "grupos_acesso"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    permissoes: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)

    usuarios: Mapped[list["User"]] = relationship(back_populates="grupo")


class User(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(254), unique=True, nullable=False, index=True)
    senha_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    grupo_id: Mapped[int | None] = mapped_column(ForeignKey("grupos_acesso.id"), nullable=True)

    grupo: Mapped[GrupoAcesso | None] = relationship(back_populates="usuarios")
    preferencias: Mapped["PreferenciasUsuario | None"] = relationship(back_populates="usuario", uselist=False)
    dashboards_criados: Mapped[list["Dashboard"]] = relationship(back_populates="criador")
    logs_acesso: Mapped[list["LogAcesso"]] = relationship(back_populates="usuario")


class PreferenciasUsuario(Base):
    __tablename__ = "preferencias_usuario"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), unique=True, nullable=False)
    layout_json: Mapped[dict] = mapped_column(JSON, default=dict)

    usuario: Mapped[User] = relationship(back_populates="preferencias")


class Area(Base):
    __tablename__ = "areas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    icone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    dashboards: Mapped[list["Dashboard"]] = relationship(back_populates="area")


class Dashboard(Base):
    __tablename__ = "dashboards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    taxa_atualizacao_minutos: Mapped[int | None] = mapped_column(Integer, nullable=True)
    area_id: Mapped[int | None] = mapped_column(ForeignKey("areas.id"), nullable=True)
    criado_por: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)

    area: Mapped[Area | None] = relationship(back_populates="dashboards")
    criador: Mapped[User | None] = relationship(back_populates="dashboards_criados")
    widgets: Mapped[list["Widget"]] = relationship(back_populates="dashboard", cascade="all, delete-orphan")
    logs_acesso: Mapped[list["LogAcesso"]] = relationship(back_populates="dashboard")


class Widget(Base):
    __tablename__ = "widgets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    dashboard_id: Mapped[int] = mapped_column(ForeignKey("dashboards.id", ondelete="CASCADE"), nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)  # nativo, powerbi
    query_service_key: Mapped[str | None] = mapped_column(String(200), nullable=True)
    parametros: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    posicao_grid: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    dashboard: Mapped[Dashboard] = relationship(back_populates="widgets")


class Conexao(Base):
    __tablename__ = "conexoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    tipo: Mapped[str] = mapped_column(String(50), nullable=False)  # fabric, oracle, postgres
    host: Mapped[str] = mapped_column(String(300), nullable=False)
    porta: Mapped[int] = mapped_column(Integer, nullable=False)
    database: Mapped[str] = mapped_column(String(200), nullable=False)
    usuario: Mapped[str] = mapped_column(String(200), nullable=False)
    senha_criptografada: Mapped[str] = mapped_column(Text, nullable=False)


class LogAcesso(Base):
    __tablename__ = "logs_acesso"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    ip: Mapped[str] = mapped_column(String(45), nullable=False)
    pagina: Mapped[str] = mapped_column(Text, nullable=False)
    dashboard_id: Mapped[int | None] = mapped_column(ForeignKey("dashboards.id"), nullable=True)
    acao: Mapped[str] = mapped_column(String(30), nullable=False)  # page_view, dashboard_view, login, logout
    origem: Mapped[str | None] = mapped_column(String(20), nullable=True)  # intranet, externo
    aparelho: Mapped[str | None] = mapped_column(String(20), nullable=True)  # desktop, tablet, mobile
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    usuario: Mapped[User | None] = relationship(back_populates="logs_acesso")
    dashboard: Mapped[Dashboard | None] = relationship(back_populates="logs_acesso")
