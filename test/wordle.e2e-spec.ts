import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from './../src/app.module';

describe('WordleController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/wordle/check (POST) - valid word', () => {
    return request(app.getHttpServer())
      .post('/wordle/check')
      .send({ word: 'apple' })
      .expect(201)
      .expect('true');
  });

  it('/wordle/check (POST) - invalid word (not in db)', () => {
    return request(app.getHttpServer())
      .post('/wordle/check')
      .send({ word: 'korea' })
      .expect(201)
      .expect('false');
  });

  it('/wordle/check (POST) - bad request (too short)', async () => {
    const response = await request(app.getHttpServer())
      .post('/wordle/check')
      .send({ word: 'hi' })
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining(['단어는 반드시 5글자여야 합니다.']),
    );
  });

  it('/wordle/check (POST) - bad request (too long)', async () => {
    const response = await request(app.getHttpServer())
      .post('/wordle/check')
      .send({ word: 'banana' })
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining(['단어는 반드시 5글자여야 합니다.']),
    );
  });

  it('/wordle/check (POST) - bad request (non-English)', async () => {
    const response = await request(app.getHttpServer())
      .post('/wordle/check')
      .send({ word: '한글테스트' }) // 5 chars
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining(['단어는 영문자로만 구성되어야 합니다.']),
    );
  });
});
