import dotenv from 'dotenv';
import { connectRedis } from './db/redisClient';
import { connectMySQL } from './db/mysqlClient';
import timelineRouter from './router/timeline';
import { voteConnect } from './db/voteClient';
import { Server } from 'socket.io';
import app, { init } from './app';
import { createServer } from 'http';
import { Redis } from 'ioredis';

dotenv.config();
const port = process.env.PORT || 3000;
const redis = new Redis();

const streamKey = 'mystream';
const consumerGroup = 'mygroup';
const consumerName = 'consumer1';


redis.xgroup('CREATE', streamKey, consumerGroup, '$', 'MKSTREAM').catch((error) => {
  if (!error.message.includes('BUSYGROUP')) {
    throw error;
  }
});

const startServer = async () => {
  try{
    
    await Promise.all([connectRedis(), connectMySQL(), voteConnect()])

    init();
    const server = createServer(app);
    const io = new Server(server);
    
    io.on('connection', async (socket) => {
      socket.on('chat message', async (msg) => {
        const parse = JSON.parse(msg);
        const messageId = await redis.xadd(streamKey,"*", 'message', parse.input, 'name', parse.name);
        console.log(`Produced message with ID: ${messageId}`);
        // io.emit('chat message', JSON.stringify({ message: parse.input,name:parse.name}));
    });

      const consumeMessages = async () => {
        while (true) {
          const messages: any = await redis.xreadgroup('GROUP', consumerGroup, consumerName, 'COUNT', 10, 'BLOCK', 1, 'STREAMS', streamKey, '>');
          if (messages && messages.length > 0) {
            for (const [stream, entries] of messages) {
              for (const [id, fields] of entries) {
                redis.xack(streamKey, consumerGroup, id).then(() => {
                  io.emit('chat message', JSON.stringify({ message: fields[1],name:fields[3]}));
                }); // 메시지 처리 후 ACK
                // console.log(fields);
      }
            }
          }
        }
      };

      consumeMessages().catch(console.error);
    });

    server.listen(port, () => {
      console.log(`[server]: Server is running at http://localhost:${port}`);
    });
  }catch(e){
      console.log(e);
  }
};

startServer();