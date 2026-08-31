import { Table, Relationship } from '../../types';

export interface PythonGeneratorOptions {
  useAlembic: boolean;
  usePytest: boolean;
  useTestcontainers: boolean;
}

export const generatePythonFastApiProject = (
  tables: Table[],
  relationships: Relationship[],
  options: PythonGeneratorOptions
): Record<string, string> => {
  const files: Record<string, string> = {};

  // requirements.txt
  files['requirements.txt'] = `fastapi==0.111.0
uvicorn[standard]==0.30.1
pydantic==2.7.4
sqlalchemy==2.0.31
asyncpg==0.29.0
alembic==1.13.1
pytest==8.2.2
pytest-asyncio==0.23.7
httpx==0.27.0
`;

  // main.py
  files['app/main.py'] = `from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db

app = FastAPI(
    title="Python Enterprise API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "framework": "FastAPI"}
`;

  // database.py
  files['app/database.py'] = `from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/appdb")

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
`;

  // Models & Schemas for each Table
  tables.forEach((t) => {
    const fields = (t.fields || [])
      .map((c) => {
        const isNum = c.type === 'INTEGER' || c.type === 'INT' || c.type === 'BIGINT' || c.type === 'DOUBLE' || c.type === 'FLOAT' || c.type === 'DECIMAL';
        const pyType = isNum ? 'int' : c.type === 'BOOLEAN' ? 'bool' : 'str';
        return `    ${c.name}: ${c.isNullable || c.allowNull ? `Optional[${pyType}] = None` : pyType}`;
      })
      .join('\n');

    files[`app/schemas/${t.name.toLowerCase()}.py`] = `from pydantic import BaseModel
from typing import Optional

class ${t.name}Base(BaseModel):
${fields}

class ${t.name}Create(${t.name}Base):
    pass

class ${t.name}Response(${t.name}Base):
    id: int

    class Config:
        from_attributes = True
`;

    // SQLAlchemy Model
    const sqlCols = (t.fields || [])
      .map((c) => {
        const isNum = c.type === 'INTEGER' || c.type === 'INT' || c.type === 'BIGINT' || c.type === 'DOUBLE' || c.type === 'FLOAT' || c.type === 'DECIMAL';
        const colType = isNum ? 'Integer' : c.type === 'BOOLEAN' ? 'Boolean' : 'String';
        return `    ${c.name} = Column(${colType}${c.isPrimaryKey ? ', primary_key=True' : ''}${c.isNullable || c.allowNull ? ', nullable=True' : ', nullable=False'})`;
      })
      .join('\n');

    files[`app/models/${t.name.toLowerCase()}.py`] = `from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base

class ${t.name}Model(Base):
    __tablename__ = "${t.name.toLowerCase()}s"

${sqlCols}
`;
  });

  // Tests
  files['tests/test_api.py'] = `import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
`;

  return files;
};
