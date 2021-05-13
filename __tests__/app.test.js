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

      const response =  await request.post('/api/todos').set('Authorization', user.token).send(task);
      
      
    
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expected);
      
    });

  });
});