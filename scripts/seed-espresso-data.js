const fs = require('fs/promises');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const recipeDir =
  process.env.RECIPE_DIR || path.resolve(__dirname, '../../recipe');
const normalizedPath = path.join(
  recipeDir,
  'data/espresso-normalized-recipes.json',
);
const rawPath = path.join(recipeDir, 'data/espresso-raw-records.json');

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function ensureTables(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS espresso_beans (
      id varchar PRIMARY KEY,
      name varchar NOT NULL,
      roaster varchar NULL,
      payload jsonb NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS espresso_raw_entries (
      id varchar PRIMARY KEY,
      "beanName" varchar NOT NULL,
      source varchar NOT NULL,
      "capturedAt" date NOT NULL,
      text text NOT NULL,
      "normalizedBeanId" varchar NULL,
      "normalizedLogId" varchar NULL,
      "normalizedRoundId" varchar NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now()
    )
  `);
}

async function seedBeans(client, beans) {
  for (const bean of beans) {
    await client.query(
      `
      INSERT INTO espresso_beans (id, name, roaster, payload)
      VALUES ($1, $2, $3, $4::jsonb)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        roaster = EXCLUDED.roaster,
        payload = EXCLUDED.payload,
        "updatedAt" = now()
      `,
      [bean.id, bean.name, bean.roaster || null, JSON.stringify(bean)],
    );
  }
}

async function seedRawEntries(client, entries) {
  for (const entry of entries) {
    await client.query(
      `
      INSERT INTO espresso_raw_entries (
        id,
        "beanName",
        source,
        "capturedAt",
        text,
        "normalizedBeanId",
        "normalizedLogId",
        "normalizedRoundId"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        "beanName" = EXCLUDED."beanName",
        source = EXCLUDED.source,
        "capturedAt" = EXCLUDED."capturedAt",
        text = EXCLUDED.text,
        "normalizedBeanId" = EXCLUDED."normalizedBeanId",
        "normalizedLogId" = EXCLUDED."normalizedLogId",
        "normalizedRoundId" = EXCLUDED."normalizedRoundId",
        "updatedAt" = now()
      `,
      [
        entry.id,
        entry.beanName,
        entry.source,
        entry.capturedAt,
        entry.text,
        entry.normalizedBeanId || null,
        entry.normalizedLogId || null,
        entry.normalizedRoundId || null,
      ],
    );
  }
}

async function main() {
  const normalizedData = await readJson(normalizedPath);
  const rawData = await readJson(rawPath);
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionTimeoutMillis: 5000,
  });

  await client.connect();
  try {
    await ensureTables(client);
    await seedBeans(client, normalizedData.beans || []);
    await seedRawEntries(client, rawData.entries || []);

    const beanCount = await client.query('SELECT COUNT(*) FROM espresso_beans');
    const rawCount = await client.query(
      'SELECT COUNT(*) FROM espresso_raw_entries',
    );

    console.log('Espresso seed completed');
    console.log(`beans=${beanCount.rows[0].count}`);
    console.log(`rawEntries=${rawCount.rows[0].count}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
