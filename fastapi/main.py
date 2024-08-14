from fastapi import FastAPI, Depends, Form
import aioredis
from aioredis import Redis
from typing import Optional, Union
from fastapi import FastAPI
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, insert, update
import json
from pydantic import BaseModel

from databases import Database
from dotenv import load_dotenv
load_dotenv()

import os


DATABASE_URL = "mysql+pymysql://root:1234@localhost/test_db"

REDIS_URL = os.getenv("REDIS_URL")
database = Database(DATABASE_URL)
metadata = MetaData()

engine = create_engine(DATABASE_URL)

app = FastAPI()

redis_client: Optional[Redis] = None

async def get_redis() -> Redis:
    return redis_client

async def get_database() -> Database:
    return database

tests = Table("tests",metadata,Column("id", Integer, primary_key=True),Column("uuid", String(100),unique=True), Column("content", String(100)))


@app.on_event("startup")
async def startup_event():
    global redis_client
    redis_client = await aioredis.from_url("redis://localhost")
    await database.connect()
    metadata.create_all(engine)
    

@app.on_event("shutdown")
async def shutdown_event():
    await redis_client.close()
    await database.disconnect()



class Data:
    def __init__(self, key, content) -> None:
        self.key = key
        self.content = content
        
    def toJson(self) -> str:
        return json.dumps(self.__dict__)
    


@app.post("/cache/")
async def addKey(key: str = Form(...), value: str = Form(...),db: Database = Depends(get_database), redis: Redis = Depends(get_redis)):
    data = Data(key=key, content=value)
    print(key)
    print(value)
    toJson = data.toJson()
    await redis.set(key, toJson)
    query = insert(tests).values(uuid=key, content=value)
    await db.execute(query)
    return "ok"

class RequestData(BaseModel):
    key: str
    value: str

@app.get("/cache/{key}")
async def getData(key: str, redis: Redis = Depends(get_redis)) -> Union[str, None]:
    value = await redis.get(key)
    if value is not None:
        return value
    queryData = await tests.select().where(tests.c.uuid== key)
    data = Data(key=queryData.uuid, content=queryData.content)
    return data.toJson