import client from '../lib/client.js';
import supertest from 'supertest';
import app from '../lib/app.js';
import { execSync } from 'child_process';

const request = supertest(app);

describe('API Routes', () => {

  afterAll(async () => {
    return client.end();
  });

  describe('/api/todos', () => {
    let user;
    let user2;

    beforeAll(async () => {
      execSync('npm run recreate-tables');

      const response = await request
        .post('/api/auth/signup')
        .send({
          name: 'Me the User',
          email: 'me@user.com',
          password: 'password'
        });

      expect(response.status).toBe(200);

      user = response.body;

      const response2 = await request
        .post('/api/auth/signup')
        .send({
          name: 'Other User',
          email: 'other@user.com',
          password: 'notpassword'
        });
      
      expect(response2.status).toBe(200);
      
      user2 = response2.body;
      
    });

    // append the token to your requests:
    //  .set('Authorization', user.token);
    
    it('POST to /api/todos get all the users todos', async () => {
      const expected = {
        id: expect.any(Number),
        task: 'walk the cats',
        completed: false,
        shared: false,
        userId: user.id
      };

      const task = {
        task: 'walk the cats',
        completed: false,
        shared: false
      };

      const response = await request.post('/api/todos').set('Authorization', user.token).send(task);
    
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expected);
      
    });

    it('GET /api/me/todos get all todos of current user only', async () => {

      // make two test tasks
      const task1 = {
        task: 'walk the cats',
        completed: false,
        shared: true
      };
      const task2 = {
        task: 'wash the grapefruit',
        completed: true,
        shared: false
      };

      // push 2 tasks from 2 different users
      const response1 = await request
        .post('/api/todos')
        .set('Authorization', user.token)
        .send(task1);
      const response2 = await request
        .post('/api/todos')
        .set('Authorization', user2.token)
        .send(task2);
      
      // test the post responses
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // get list of todos from first user only
      const response = await request
        .get('/api/me/todos')
        .set('Authorization', user2.token);
      
      // test to make sure only from this user
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.not.arrayContaining([response1.body]));
      expect(response.body).toEqual([response2.body]);

    });

  });
});