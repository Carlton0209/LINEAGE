from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from lineage_api.config import get_settings


engine = create_engine(get_settings().database_url, pool_pre_ping=True)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
