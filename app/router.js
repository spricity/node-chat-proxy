'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.get('/api/openai', controller.api.openai);
  router.post('/api/openai', controller.api.openai);
};
