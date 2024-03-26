const { createClient } = require("redis");
const { Client } = require("pg");
const format = require("pg-format");

const testLength = 10000;

console.log(`test data length: ${testLength} ...`);
console.log("===");

(async () => {
  const redisClient = await createClient({ url: "redis://192.168.71.210:6379" })
    .on('error', err => console.log('Redis Client Error', err))
    .connect();

  await redisClient.flushAll();

  console.time('redis-set');
  const setPromises = Array(testLength).fill().map((_, i) => redisClient.set(`key${i}`, `value${i}`));
  await Promise.all(setPromises);
  console.timeEnd('redis-set');

  console.time('redis-get');
  // const getPromises = Array(testLength).fill().map((_, i) => redisClient.get(`key${i}`));
  // const result = await Promise.all(getPromises);
  await redisClient.keys("*");
  // console.log(result[0], result[1], "...", result.at(-1));
  console.timeEnd('redis-get');

  await redisClient.disconnect();

  console.log("---");

  const pgClient = new Client({
    host: '192.168.71.210',
    user: 'user123',
    password: 'pass123',
    database: 'testdb',
  });

  await pgClient.connect();

  await pgClient.query("DROP TABLE IF EXISTS demo_table");
  await pgClient.query(`CREATE TABLE demo_table (
    key VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    PRIMARY KEY (key)
  )`);

  const values = Array(testLength).fill().map((_, i) => [`key${i}`, `value${i}`]);
  // [["key0", "value0"], ["key1", "value1"], ...]

  console.time("pg-insert");
  await pgClient.query(format("INSERT INTO demo_table (key, value) VALUES %L", values));
  console.timeEnd("pg-insert");

  console.time("pg-select");
  await pgClient.query("SELECT * FROM demo_table");
  console.timeEnd("pg-select");

  await pgClient.end()
})();
