# Demo with Heroes
Simple demo of Swagger Mock

To launch:

``` bash
$ docker-compose up -d
```

This demo illustrates a simple usage of Swagger Mock. Here, the Swagger Mock implemented in the docker-compose file, allows 
to create, delete and find heroes by gender automatically.

All heroes are created in the collection api/v1/heroes, but for sorting the collection is not filled automatically in the datastore.
So we need to create an explicit collection api/v1/heroes to mock the sort operation.

See in data-heroes.json:

``` 
{
    "collection": "/api/v1",
    "name": "/heroes",
    "data": [
      {
        "name": "Cnt-Man",
        "gender": "man",
        "powers": [
          "invisibility"
        ]
      },
      {
        "name": "Ant-Man",
        "gender": "man",
        "powers": [
          "invisibility"
        ]
      },
      {
        "name": "Bnt-Man",
        "gender": "man",
        "powers": [
          "invisibility"
        ]
      }
    ]
  }
```

and in the customized typescript file:

```
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
```
