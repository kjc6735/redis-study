import express, { Express } from 'express';
import timelineRouter from './router/timeline';
import logger from './logger';
import voteRouter from './router/vote';
import path from 'path';

const app: Express = express();

export const init = () => {
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.json());
  app.use((req,res,next) => {
    logger.info(`${req.url} ${JSON.stringify(req.body)}`);
    logger.info(`${req.url} ${JSON.stringify(req.params)}`);
    next();
  })

  app.use("/timeline", timelineRouter);
  app.use("/vote", voteRouter);
};


export default app;