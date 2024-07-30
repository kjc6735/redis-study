import express from 'express';
import { voteConnection } from '../db/voteClient';
import { redisClient } from '../db/redisClient';


const voteRouter = express.Router();
voteRouter.post("/",async (req,res) => {
    
   const {candidate, voter} = req.body;
   console.log(candidate, voter)
   const redis = redisClient;
   if(candidate && voter){
        const r = await voteConnection?.execute("insert into votes (candidate, voter) values (?,?)",[candidate, voter]);
        await redis.sAdd(`candidate:${candidate}`, `${voter}`);   
   }
   let cursor = 0;
   let pattern = "candidate:*"
   let candidates: string[] = [];
//    do{
//     const reply = await redis.scan(cursor, {
//         MATCH: pattern,
//     })
//     reply.keys.forEach(data => candidates.push(data));
//     cursor = reply.cursor;
//    }while(cursor!==0);
    const reply = await redis.scan(cursor, {
        MATCH: pattern,
    })
    reply.keys.forEach(data => candidates.push(data));
    cursor = reply.cursor;
   const result = await Promise.all(candidates.map(async data =>  {
       const cnt = await redis.sCard(data);
       return  {candidate: data, cnt }
   }));
   return res.send(result);
});

export default voteRouter;