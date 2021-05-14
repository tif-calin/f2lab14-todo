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

    it('GET /api/todos get all todos that are shared', async () => {

      // make two test tasks
      const task1 = {
        task: 'throw a rock',
        completed: false,
        shared: true
      };
      const task2 = {
        task: 'abolish prison',
        completed: true,
        shared: true
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
      
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // test to make sure both tasks are in the shared GET
      const response = await request.get('/api/todos').set('Authorization', user.token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.arrayContaining([response1.body, response2.body]));

    });

    it('PUT /api/todos/:id/completed completes the task', async () => {
      const task = (await request.get('/api/me/todos').set('Authorization', user.token)).body[0];
      task.completed = !task.completed;

      const response = await request
        .put(`/api/todos/${task.id}/completed`)
        .set('Authorization', user.token)
        .send(task);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(task);
    });

    it('PUT /api/todos/:id/shared completes the task', async () => {
      const task = (await request.get('/api/me/todos').set('Authorization', user.token)).body[0];
      task.shared = !task.shared;

      const response = await request
        .put(`/api/todos/${task.id}/shared`)
        .set('Authorization', user.token)
        .send(task);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(task);
    });

    it('DELETE from /api/todos/:id delete user todo', async () => {
      const response = await request
        .get('/api/me/todos')
        .set('Authorization', user.token);

      const toDelete = response.body[0];

      const response2 = await request
        .delete(`/api/todos/${toDelete.id}`)
        .set('Authorization', user.token);

      expect(response.status).toBe(200);
      expect(response2.body).toEqual(expect.not.arrayContaining([toDelete]));
    });

  });
});