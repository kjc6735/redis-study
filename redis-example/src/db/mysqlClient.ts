import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let mysqlConnection: mysql.Connection | null = null;

const connectMySQL = async () => {
  if (!mysqlConnection) {
    try {
      mysqlConnection = await mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost',
        port: 3306,
        user: process.env.MYSQL_USER || 'myuser',
        password: process.env.MYSQL_PASSWORD || 'mypassword',
        database: process.env.MYSQL_DATABASE || 'mydatabase'
      });
      console.log('MySQL client connected');
    } catch (error) {
      console.error('MySQL connection error', error);
      // 연결 실패 시 null 반환
      mysqlConnection = null;
    }
  }
  return mysqlConnection;
};

export { connectMySQL, mysqlConnection };
