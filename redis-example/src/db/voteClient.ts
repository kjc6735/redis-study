
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let voteConnection: mysql.Connection | null = null;

const voteConnect = async () => {
  if (!voteConnection) {
    try {
        voteConnection = await mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost',
        port: 3306,
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || 'rootpassword',
        database: process.env.MYSQL_DATABASE || 'sample'
      });
      console.log('MySQL client connected');
    } catch (error) {
      console.error('MySQL connection error', error);
      // 연결 실패 시 null 반환
      voteConnection = null;
    }
  }
  return voteConnection;
};

export { voteConnect, voteConnection };
