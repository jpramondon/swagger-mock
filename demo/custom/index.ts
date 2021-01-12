import { Express } from 'express';
import { Hero } from './Hero';


export function customBehaviour(application: Express, datastore: any) {
  console.log('Custom Behaviour.');

  application.get('/api/v1/heroes', (req, res, next) => {
    if (req.query.sort) {
      const sort = req.query.sort;
      datastore.get('api/v1/heroes', (err: Error, resource: any) => {
        const initialData = resource.data.slice(0);
        if (sort === 'asc') {
          res.send(initialData.sort((heroA: Hero, heroB: Hero) => heroA.name > heroB.name ? 1 : -1));
        }
        if (sort === 'desc') {
          res.send(initialData.sort((heroA: Hero, heroB: Hero) => heroA.name > heroB.name ? -1 : 1));
        }
      });
    } else {
        next();
      }
    }
  );
}
