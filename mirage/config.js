export default function() {
  /*
    Config (with defaults).

    Note: these only affect routes defined *after* them!
  */

  // // make this `http://localhost:8080`, for example, if your API is on a different server
  // this.urlPrefix = 'http://localhost:5000';
  
  // make this `/api`, for example, if your API is namespaced
  this.namespace = '/api';
  
  // // delay for each request, automatically set to 0 during testing
  // this.timing = 400;

  this.get('/sessions/:id', (schema, request) => {
    // TODO: why can't we do schema.coordinates.first(), like in the
    // docs?
    return schema.db.sessions[0];
  });
}
