import express, { Express } from 'express';
import { redisClient } from '../db/redisClient';
import { mysqlConnection } from '../db/mysqlClient';
import { QueryResult } from 'mysql2';
type QueryData = {
    name:string,
    message: string
}

const timelineRouter = express.Router();

timelineRouter.post("/", async (req, res) => {
    const {user ,message, isFirst} = req.body;
    const key = 'timeline';
    const redis = redisClient;
    const mysql = mysqlConnection;
    
    await mysql?.execute("insert into timeline (name, message) values (?,?)", [
            user, message
    ]);
    
    let messages = await redis.lRange(key, 0, 9);
    const result:  string[] = [];
    if(messages.length == 0) {
        await redis.del(key);
        
        const  [row]  = await mysql?.query("SELECT name, message from timeline ORDER BY id DESC LIMIT 10") ?? [];
        const data = row as QueryData[];
        data?.forEach(async d =>{
            const record = d.name + ": " + d.message;
            result.push(record);
            await redis.rPush(key, d.name + ": " + d.message)
        })
    }
    await redis.expire(key, 60);
    return res.send(result);
    
})



export default timelineRouter