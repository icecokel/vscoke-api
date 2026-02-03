/**
 * Wordle 단어 Seed 스크립트
 * 사용법: npx ts-node scripts/seed-words.ts
 */
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// .env 파일 로드
dotenv.config();

// 단어 데이터 로드
const wordsPath = path.join(__dirname, 'data', 'words.json');
const words: string[] = JSON.parse(fs.readFileSync(wordsPath, 'utf-8'));

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'vscoke',
  });

  try {
    await dataSource.initialize();
    console.log('📦 데이터베이스 연결 성공');

    // 기존 단어 개수 확인
    const existingCount = await dataSource.query('SELECT COUNT(*) FROM word');
    console.log(`📊 기존 단어 수: ${existingCount[0].count}`);

    // 중복 방지를 위해 INSERT ... ON CONFLICT DO NOTHING 사용
    let insertedCount = 0;
    for (const word of words) {
      // 5글자 검증
      if (word.length !== 5) {
        console.log(`⚠️  건너뜀 (5글자 아님): ${word}`);
        continue;
      }

      try {
        await dataSource.query(
          'INSERT INTO word (word) VALUES ($1) ON CONFLICT (word) DO NOTHING',
          [word.toLowerCase()],
        );
        insertedCount++;
      } catch (error) {
        console.log(`⚠️  실패: ${word}`, error);
      }
    }

    console.log(`✅ ${insertedCount}개 단어 처리 완료`);

    // 최종 단어 개수 확인
    const finalCount = await dataSource.query('SELECT COUNT(*) FROM word');
    console.log(`📊 최종 단어 수: ${finalCount[0].count}`);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('🔌 데이터베이스 연결 종료');
  }
}

seed();
